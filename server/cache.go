package main

import (
	"context"
	"sync"
	"time"
)

// ttl de la cache. Los RSS cambian pocas veces por hora, asi que 10 minutos
// es holgado y evita pegarle a los servidores de MARCA en cada visita.
const ttlCache = 10 * time.Minute

type entradaCache struct {
	articulos []Articulo
	aviso     string
	guardado  time.Time
	// enVuelo permite deduplicar peticiones simultaneas: si llegan cinco
	// visitas al mismo tiempo, solo se hace un fetch al feed.
	enVuelo *sync.WaitGroup
}

// cache es segura para uso concurrente.
type cache struct {
	mu       sync.Mutex
	entradas map[int]entradaCache
}

func nuevaCache() *cache {
	return &cache{entradas: make(map[int]entradaCache)}
}

func (c *cache) obtener(ctx context.Context, limit int) ([]Articulo, string) {
	clave := normalizarLimit(limit)

	c.mu.Lock()
	if e, ok := c.entradas[clave]; ok {
		if time.Since(e.guardado) < ttlCache {
			c.mu.Unlock()
			logf("cache HIT para limit=%d (%d articulos)", clave, len(e.articulos))
			return e.articulos, e.aviso
		}
		// Caducada: si ya hay alguien recargando, esperamos a ese fetch.
		if e.enVuelo != nil {
			wg := e.enVuelo
			c.mu.Unlock()
			logf("cache caducada, hay un fetch en curso para limit=%d", clave)
			wg.Wait()
			c.mu.Lock()
			if nuevo, ok := c.entradas[clave]; ok && time.Since(nuevo.guardado) < ttlCache {
				c.mu.Unlock()
				return nuevo.articulos, nuevo.aviso
			}
			c.mu.Unlock()
			return obtenerSinCache(ctx, clave)
		}
	}
	c.mu.Unlock()

	return c.recargar(ctx, clave)
}

// recargar hace el fetch y guarda el resultado.
func (c *cache) recargar(ctx context.Context, clave int) ([]Articulo, string) {
	c.mu.Lock()
	// Doble chequeo: otra goroutine pudo llenar la cache mientras esperabamos.
	if e, ok := c.entradas[clave]; ok && time.Since(e.guardado) < ttlCache {
		c.mu.Unlock()
		return e.articulos, e.aviso
	}
	wg := &sync.WaitGroup{}
	wg.Add(1)
	c.entradas[clave] = entradaCache{enVuelo: wg}
	c.mu.Unlock()

	logf("cache MISS para limit=%d, consultando fuentes", clave)
	articulos, aviso := obtenerSinCache(ctx, clave)

	c.mu.Lock()
	c.entradas[clave] = entradaCache{
		articulos: articulos,
		aviso:     aviso,
		guardado:  time.Now(),
	}
	c.mu.Unlock()
	wg.Done()

	return articulos, aviso
}

// obtenerSinCache consulta las fuentes sin tocar la cache.
func obtenerSinCache(ctx context.Context, limit int) ([]Articulo, string) {
	articulos := combinar(ctx, limit)
	if len(articulos) == 0 {
		logf("ninguna fuente devolvio articulos")
		// Devolvemos 200 con lista vacia y un aviso, nunca un 500: el
		// frontend sabe mostrar "no hay noticias" sin romperse.
		return []Articulo{}, "No hay noticias disponibles en este momento."
	}
	return articulos, ""
}