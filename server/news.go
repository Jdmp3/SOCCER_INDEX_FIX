package main

import (
	"context"
	"encoding/xml"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Fuente describe un feed RSS del que servimos articulos.
type Fuente struct {
	Nombre string
	URL    string
}

// Fuentes disponibles. MARCA es la principal (espanol, con imagenes en
// media:content) y BBC actua como respaldo si MARCA falla.
var Fuentes = []Fuente{
	{"MARCA", "https://www.marca.com/rss/futbol.xml"},
	{"BBC", "https://feeds.bbci.co.uk/sport/football/rss.xml"},
}

// timeoutPorFuente evita que un feed lento cuelgue la peticion completa.
const timeoutPorFuente = 8 * time.Second

// Articulo es la forma que consume el frontend. Los nombres estan en espanol
// para que coincidan con el resto del proyecto.
type Articulo struct {
	Titulo      string `json:"titulo"`
	Descripcion string `json:"descripcion"`
	Imagen      string `json:"imagen"`
	Link        string `json:"link"`
	Fuente      string `json:"fuente"`
	Fecha       string `json:"fecha"`
}

// ---------- Estructuras XML ----------

type rss struct {
	Channel struct {
		Items []item `xml:"item"`
	} `xml:"channel"`
}

type item struct {
	Title       string
	Link        string
	Description string
	PubDate     string
	Category    string
	// OJO: en el XML estos elementos aparecen como <media:content> y
	// <media:thumbnail>, pero para encoding/xml el prefijo es un namespace, no
	// parte del nombre. El nombre local es "content"/"thumbnail", asi que se
	// emparejan por el nombre local y no hace falta escribir "media>".
	MediaContent []media `xml:"content"`
	MediaThumb   []media `xml:"thumbnail"`
}

type media struct {
	URL  string `xml:"url,attr"`
	Type string `xml:"type,attr"`
}

// ---------- Parseo ----------



func (it *item) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	for {
		tok, err := d.Token()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		switch t := tok.(type) {
		case xml.StartElement:
			local := t.Name.Local
			space := t.Name.Space
			if local == "title" && space == "" {
				var val string
				if err := d.DecodeElement(&val, &t); err != nil {
					return err
				}
				it.Title = val
				continue
			}
			if local == "link" {
				var val string
				if err := d.DecodeElement(&val, &t); err != nil {
					return err
				}
				it.Link = val
				continue
			}
			if local == "description" {
				var val string
				if err := d.DecodeElement(&val, &t); err != nil {
					return err
				}
				it.Description = val
				continue
			}
			if local == "pubDate" {
				var val string
				if err := d.DecodeElement(&val, &t); err != nil {
					return err
				}
				it.PubDate = val
				continue
			}
			if local == "category" {
				var val string
				if err := d.DecodeElement(&val, &t); err != nil {
					return err
				}
				it.Category = val
				continue
			}
			if local == "content" {
				var m media
				if err := d.DecodeElement(&m, &t); err != nil {
					return err
				}
				it.MediaContent = append(it.MediaContent, m)
				continue
			}
			if local == "thumbnail" {
				var m media
				if err := d.DecodeElement(&m, &t); err != nil {
					return err
				}
				it.MediaThumb = append(it.MediaThumb, m)
				continue
			}
			d.Skip()
		case xml.EndElement:
			if t == start.End() {
				return nil
			}
		}
	}
}


// primeraImagen recorre los campos de media buscando la primera URL usable.
//
// Este es el punto mas delicado del backend: MARCA y BBC exponen la imagen en
// campos distintos. MARCA la trae en media:content y deja media:thumbnail con
// url="". BBC la trae en media:thumbnail. Si solo se lee uno de los dos,
// una de las dos fuentes devuelve todas sus noticias sin imagen.
func primeraImagen(it item) string {
	for _, m := range it.MediaContent {
		if esImagen(m) {
			return m.URL
		}
	}
	for _, m := range it.MediaThumb {
		if esImagen(m) {
			return m.URL
		}
	}
	return ""
}

func esImagen(m media) bool {
	if m.URL == "" {
		return false
	}
	// ESPN y otros feeds usan media:thumbnail para tracking con url vacia o
	// sin protocolo; aqui solo nos interesan http/https.
	if !strings.HasPrefix(m.URL, "http://") && !strings.HasPrefix(m.URL, "https://") {
		return false
	}
	if m.Type != "" && !strings.HasPrefix(m.Type, "image/") {
		return false
	}
	return true
}

// limpiar texto: quitamos HTML y entidades para que el frontend lo muestre
// como texto plano sin dangerouslySetInnerHTML.
func limpiar(s string) string {
	s = html.UnescapeString(s)
	// solo sacamos la primera etiqueta completa si realmente es HTML
	// (<p>...</p>). Un atributo suelto como url="https://..." tiene "=" entre
	// el "<" y el ">", y en ese caso no se toca nada.
	if i := strings.Index(s, "<"); i >= 0 {
		if j := strings.Index(s, ">"); j > i && !strings.Contains(s[i:j], "=") {
			if i2 := strings.Index(s[j:], "<"); i2 >= 0 {
				s = s[j+1 : j+i2]
			} else {
				s = s[j+1:]
			}
		}
	}
	return strings.TrimSpace(strings.Join(strings.Fields(s), " "))
}

// fechaISO convierte pubDate RFC1123Z al formato ISO que espera el frontend.
// Si no se puede convertir devuelve la cadena original.
func fechaISO(pub, link string) string {
	for _, layout := range []string{time.RFC1123Z, time.RFC1123, time.RFC822Z, time.RFC822} {
		if t, err := time.Parse(layout, strings.TrimSpace(pub)); err == nil {
			return t.Format(time.RFC3339)
		}
	}
	// Algunos feeds ponen la fecha en la URL (/2026/09/30/).
	if m := regexpFecha.FindStringSubmatch(link); m != nil {
		return fmt.Sprintf("%s-%s-%sT00:00:00Z", m[1], m[2], m[3])
	}
	return ""
}

var regexpFecha = regexp.MustCompile(`/(\d{4})/(\d{2})/(\d{2})/`)

// ---------- Fetch ----------

var cliente = &http.Client{}

// traerFuente descarga y parsea un feed. Devuelve articulos ya normalizados.
// Nunca devuelve error hacia afuera: una fuente que falla simplemente aporta
// cero articulos, y eso permite que el respaldo entre en juego.
func traerFuente(ctx context.Context, f Fuente, max int) []Articulo {
	ctx, cancel := context.WithTimeout(ctx, timeoutPorFuente)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, f.URL, nil)
	if err != nil {
		logf("no se pudo crear la peticion para %s: %v", f.Nombre, err)
		return nil
	}
	req.Header.Set("User-Agent", "SoccerIndex/1.0 (+https://github.com/Jdmp3)")
	req.Header.Set("Accept", "application/rss+xml, application/xml, text/xml, */*")

	resp, err := cliente.Do(req)
	if err != nil {
		logf("fallo al descargar %s: %v", f.Nombre, err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logf("%s respondio con estado %d", f.Nombre, resp.StatusCode)
		return nil
	}

	// Limitamos la lectura para no quedarnos sin memoria con un feed enorme.
	cuerpo, err := io.ReadAll(io.LimitReader(resp.Body, 5<<20))
	if err != nil {
		logf("no se pudo leer el cuerpo de %s: %v", f.Nombre, err)
		return nil
	}

	var doc rss
	if err := xml.Unmarshal(cuerpo, &doc); err != nil {
		logf("el XML de %s no se pudo parsear: %v", f.Nombre, err)
		return nil
	}

	salida := make([]Articulo, 0, max)
	for _, it := range doc.Channel.Items {
		titulo := limpiar(it.Title)
		if titulo == "" {
			continue
		}
		desc := limpiar(it.Description)
		// Si la descripcion es igual al titulo no aporta nada.
		if desc == titulo {
			desc = ""
		}
		salida = append(salida, Articulo{
			Titulo:      titulo,
			Descripcion: desc,
			Imagen:      primeraImagen(it),
			Link:        strings.TrimSpace(it.Link),
			Fuente:      f.Nombre,
			Fecha:       fechaISO(it.PubDate, it.Link),
		})
		if len(salida) >= max {
			break
		}
	}
	logf("%s: %d articulos", f.Nombre, len(salida))
	return salida
}

// combinar consulta todas las fuentes en paralelo, deduplica por URL y
// devuelve hasta limit articulos. maxPorFuente se usa para traer candidatos
// de sobra: con limit=2 pedimos 2 por fuente para que, si una falla, la otra
// pueda cubrir el hueco.
func combinar(ctx context.Context, limit int) []Articulo {
	maxPorFuente := limit
	if maxPorFuente < 2 {
		maxPorFuente = 2
	}

	type resultado struct {
		nombre string
		items  []Articulo
	}
	resultados := make(chan resultado, len(Fuentes))

	var wg sync.WaitGroup
	for _, f := range Fuentes {
		wg.Add(1)
		go func(f Fuente) {
			defer wg.Done()
			resultados <- resultado{f.Nombre, traerFuente(ctx, f, maxPorFuente)}
		}(f)
	}
	wg.Wait()
	close(resultados)

	// El orden de llegada de las goroutines es aleatorio, asi que si solo
	// appendamos segun quien responde primero, BBC (ingles) puede ganarle a
	// MARCA (espanol) aunque la principal sea MARCA. Recorremos las fuentes en
	// el orden declarado para que el desempate sea determinista.
	porFuente := make(map[string][]Articulo, len(Fuentes))
	for r := range resultados {
		porFuente[r.nombre] = r.items
	}

	vistos := make(map[string]bool)
	salida := make([]Articulo, 0, limit)

	for _, f := range Fuentes {
		for _, a := range porFuente[f.Nombre] {
			if len(salida) >= limit {
				break
			}
			clave := claveDedupe(a)
			if clave == "" || vistos[clave] {
				continue
			}
			vistos[clave] = true
			salida = append(salida, a)
		}
	}
	return salida
}

// claveDedupe normaliza el link quitando parametros de tracking para no
// contar dos veces el mismo articulo por differed query string.
func claveDedupe(a Articulo) string {
	ref := a.Link
	if ref == "" {
		return strings.ToLower(a.Titulo)
	}
	u, err := url.Parse(ref)
	if err != nil {
		return ref
	}
	u.RawQuery = ""
	u.Fragment = ""
	return strings.TrimSuffix(u.Path, "/")
}