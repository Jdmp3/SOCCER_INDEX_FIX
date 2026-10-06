package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

// limitPorDefecto son las noticias que se muestran en la seccion. El diseño
// original de la seccion es de a dos, asi que 2 es el valor correcto.
const limitPorDefecto = 2

const (
	limitMinimo = 1
	limitMaximo = 20
)

// Puerto escucha por defecto. En produccion se sobreescribe con PORT.
const puertoPorDefecto = "8080"

func logf(formato string, args ...any) {
	log.Printf("[api] "+formato, args...)
}

// normalizarLimit acota el valor pedido por el cliente.
func normalizarLimit(n int) int {
	if n < limitMinimo {
		return limitPorDefecto
	}
	if n > limitMaximo {
		return limitMaximo
	}
	return n
}

type respuesta struct {
	Articulos []Articulo `json:"articulos"`
	Aviso     string     `json:"aviso"`
}

func main() {
	// Puerto: PORT (produccion / Vercel / Docker) o 8080 (local).
	puerto := os.Getenv("PORT")
	if puerto == "" {
		puerto = puertoPorDefecto
	}

	cache := nuevaCache()
	mux := http.NewServeMux()

	// Buscador de jugadores: datos propios en memoria (ver jugadores.go).
	jugadores, errJugadores := cargarJugadores()
	if errJugadores != nil {
		logf("jugadores no disponibles: %v", errJugadores)
	} else {
		logf("jugadores cargados: %d", len(jugadores))
	}
	mux.HandleFunc("/api/jugadores", rutaJugadores(errJugadores, jugadores))

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		escribirJSON(w, http.StatusOK, map[string]any{
			"ok":   true,
			"info": "Soccer Index API",
		})
	})

	mux.HandleFunc("/api/noticias", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			escribirJSON(w, http.StatusMethodNotAllowed, respuesta{
				Articulos: []Articulo{},
				Aviso:     "Metodo no permitido.",
			})
			return
		}

		limit := limitPorDefecto
		if q := r.URL.Query().Get("limit"); q != "" {
			if n, err := strconv.Atoi(q); err == nil {
				limit = n
			}
		}
		limit = normalizarLimit(limit)

		// Cada peticion tiene su propio timeout para que una fuente lenta no
		// pueda retener la conexion indefinidamente.
		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()

		articulos, aviso := cache.obtener(ctx, limit)
		escribirJSON(w, http.StatusOK, respuesta{Articulos: articulos, Aviso: aviso})
	})

	srv := &http.Server{
		Addr:              ":" + puerto,
		Handler:           conCORS(mux),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      20 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Apagado limpio: en produccion Vercel/Docker mandan SIGTERM y hay que
	// cerrar los listeners o el proceso se queda colgado.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logf("escuchando en http://localhost:%s", puerto)
		logf("prueba: curl localhost:%s/api/noticias", puerto)
		logf("prueba: curl \"localhost:%s/api/jugadores?q=mesi\"", puerto)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("el servidor fallo: %v", err)
		}
	}()

	<-ctx.Done()
	logf("apagando...")
	cierreCtx, cancelCierre := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelCierre()
	if err := srv.Shutdown(cierreCtx); err != nil {
		logf("apagado forzado: %v", err)
	}
	logf("apagado completo")
}

// conCORS permite el acceso desde cualquier origen. En desarrollo el frontend
// corre en el 5173 de Vite, asi que sin esto el navegador lo bloquearia.
// En produccion el frontend se sirve desde el mismo dominio y la cabecera es
// inofensiva.
func conCORS(siguiente http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		siguiente.ServeHTTP(w, r)
	})
}

// escribirJSON responde siempre en JSON con el content-type correcto.
func escribirJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		logf("no se pudo escribir la respuesta: %v", err)
	}
}
