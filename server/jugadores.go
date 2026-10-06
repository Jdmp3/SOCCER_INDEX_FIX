package main

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

// Buscador de jugadores.
//
// Los datos viven en data/jugadores.json (generado por
// scripts/generar-jugadores.mjs) y se cargan en memoria al arrancar: con
// ~18.000 registros un barrido lineal tarda microsegundos, no hace falta
// base de datos. La edad se calcula en cada peticion desde "nacimiento" para
// que los datos nunca envejezcan.
const (
	jugadoresPorDefecto = 20
	jugadoresMinimo     = 1
	jugadoresMaximo     = 50
)

// Jugador es lo que devolvemos al cliente. Los campos de busqueda
// pre-normalizados (sin acentos, en minusculas) no se serializan.
type Jugador struct {
	ID         int      `json:"id"`
	Nombre     string   `json:"nombre"`
	Posicion   string   `json:"posicion"`
	Altura     int      `json:"altura"`
	Edad       int      `json:"edad"`
	Pais       string   `json:"pais"`
	Liga       string   `json:"liga"`
	Equipo     string   `json:"equipo"`
	Foto       string   `json:"foto"`
	Nacimiento string   `json:"-"`
	campos     []string // nombre, pais, liga, equipo y posicion normalizados
}

// jugadorArchivo es la forma del JSON en disco (sin la edad calculada).
type jugadorArchivo struct {
	ID         int    `json:"id"`
	Nombre     string `json:"nombre"`
	Posicion   string `json:"posicion"`
	Altura     int    `json:"altura"`
	Nacimiento string `json:"nacimiento"`
	Pais       string `json:"pais"`
	Liga       string `json:"liga"`
	Equipo     string `json:"equipo"`
	Foto       string `json:"foto"`
}

type respuestaJugadores struct {
	Jugadores []Jugador `json:"jugadores"`
	Total     int       `json:"total"`
	Pagina    int       `json:"pagina"`
	PorPagina int       `json:"porPagina"`
	Aviso     string    `json:"aviso,omitempty"`
}

// reemplazosAcentos convierte las tildes y enes en su letra simple para que
// "mesi" encuentre a "Messi" y "nacional" a "Nacional".
var reemplazosAcentos = strings.NewReplacer(
	"á", "a", "à", "a", "â", "a", "ä", "a", "ã", "a",
	"é", "e", "è", "e", "ê", "e", "ë", "e",
	"í", "i", "ì", "i", "î", "i", "ï", "i",
	"ó", "o", "ò", "o", "ô", "o", "ö", "o", "õ", "o",
	"ú", "u", "ù", "u", "û", "u", "ü", "u",
	"ñ", "n", "ç", "c", "ß", "ss",
	"Á", "A", "À", "A", "Â", "A", "Ä", "A", "Ã", "A",
	"É", "E", "È", "E", "Ê", "E", "Ë", "E",
	"Í", "I", "Ì", "I", "Î", "I", "Ï", "I",
	"Ó", "O", "Ò", "O", "Ô", "O", "Ö", "O", "Õ", "O",
	"Ú", "U", "Ù", "U", "Û", "U", "Ü", "U",
	"Ñ", "N", "Ç", "C",
)

// normalizar deja un texto en minusculas y sin acentos.
func normalizar(s string) string {
	return strings.ToLower(reemplazosAcentos.Replace(s))
}

// cargarJugadores lee el JSON de datos. Se prueban varias rutas porque el
// binario puede arrancarse desde la raiz del proyecto o desde server/.
func cargarJugadores() ([]Jugador, error) {
	candidatas := []string{
		filepath.Join("data", "jugadores.json"),
		filepath.Join("server", "data", "jugadores.json"),
	}

	var contenido []byte
	var err error
	for _, ruta := range candidatas {
		contenido, err = os.ReadFile(ruta)
		if err == nil {
			break
		}
	}
	if err != nil {
		return nil, err
	}

	var enDisco []jugadorArchivo
	if err := json.Unmarshal(contenido, &enDisco); err != nil {
		return nil, err
	}

	jugadores := make([]Jugador, 0, len(enDisco))
	for _, j := range enDisco {
		jugadores = append(jugadores, Jugador{
			ID:         j.ID,
			Nombre:     j.Nombre,
			Posicion:   j.Posicion,
			Altura:     j.Altura,
			Pais:       j.Pais,
			Liga:       j.Liga,
			Equipo:     j.Equipo,
			Foto:       j.Foto,
			Nacimiento: j.Nacimiento,
			campos: []string{
				normalizar(j.Nombre),
				normalizar(j.Pais),
				normalizar(j.Liga),
				normalizar(j.Equipo),
				normalizar(j.Posicion),
			},
		})
	}

	// Orden alfabetico estable para que la paginacion sea predecible.
	sort.SliceStable(jugadores, func(a, b int) bool {
		ca, cb := jugadores[a].campos[0], jugadores[b].campos[0]
		if ca == cb {
			return jugadores[a].ID < jugadores[b].ID
		}
		return ca < cb
	})

	return jugadores, nil
}

// edadEn calcula los cumplidos de una persona en la fecha dada.
func edadEn(nacimiento time.Time, hoy time.Time) int {
	annos := hoy.Year() - nacimiento.Year()
	if hoy.Month() < nacimiento.Month() ||
		(hoy.Month() == nacimiento.Month() && hoy.Day() < nacimiento.Day()) {
		annos--
	}
	return annos
}

// tokenNumerico interpreta un termino como centimetros de altura si es una
// medida tipica ("185", "1,85", "1.85") y como edad si es un entero. Devuelve
// la altura en cm y la edad candidatas, y si toca evaluar alguna de las dos.
func tokenNumerico(token string) (alturaCm int, edad int, evaluarAltura bool, evaluarEdad bool) {
	// Altura: entero de 2 o 3 cifras o metros con decimal ("1,85").
	normalizado := strings.ReplaceAll(token, ",", ".")
	if n, err := strconv.ParseFloat(normalizado, 64); err == nil {
		if n >= 1 && n < 3 { // en metros: 1.85 -> 185 cm
			return int(n*100 + 0.5), 0, true, false
		}
		if n == float64(int(n)) {
			ent := int(n)
			if ent >= 140 && ent <= 230 { // rango razonable de altura
				evaluarAltura = true
			}
			if ent >= 14 && ent <= 50 { // rango razonable de edad
				evaluarEdad = true
			}
			return ent, ent, evaluarAltura, evaluarEdad
		}
	}
	return 0, 0, false, false
}

// coincide responde si la palabra normalizada cumple para un jugador.
func (j Jugador) coincide(token string, hoy time.Time) bool {
	alturaCm, edadCand, evaluarAltura, evaluarEdad := tokenNumerico(token)
	if !evaluarAltura && !evaluarEdad {
		for _, campo := range j.campos {
			if campo != "" && strings.Contains(campo, token) {
				return true
			}
		}
		return false
	}
	if evaluarAltura && j.Altura == alturaCm {
		return true
	}
	if evaluarEdad && j.Nacimiento != "" {
		if nac, err := time.Parse("2006-01-02", j.Nacimiento); err == nil {
			if edadEn(nac, hoy) == edadCand {
				return true
			}
		}
	}
	return false
}

// rutaJugadores monta el manejador de GET /api/jugadores?q=&pagina=&porPagina=
//
// La busqueda es texto libre: cada palabra debe aparecer en algun campo
// (nombre, pais, liga, equipo o posicion) sin importar acentos ni
// mayusculas; si la palabra es un numero, casa con edad o altura.
func rutaJugadores(cargaErr error, jugadores []Jugador) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			escribirJSON(w, http.StatusMethodNotAllowed, respuestaJugadores{
				Jugadores: []Jugador{},
				Aviso:     "Metodo no permitido.",
			})
			return
		}
		if cargaErr != nil {
			escribirJSON(w, http.StatusInternalServerError, respuestaJugadores{
				Jugadores: []Jugador{},
				Aviso:     "No se pudo cargar el fichero de jugadores: " + cargaErr.Error(),
			})
			return
		}

		consulta := normalizar(strings.TrimSpace(r.URL.Query().Get("q")))

		pagina := 1
		if p := r.URL.Query().Get("pagina"); p != "" {
			if n, err := strconv.Atoi(p); err == nil {
				pagina = n
			}
		}
		if pagina < 1 {
			pagina = 1
		}

		porPagina := jugadoresPorDefecto
		if p := r.URL.Query().Get("porPagina"); p != "" {
			if n, err := strconv.Atoi(p); err == nil {
				porPagina = n
			}
		}
		if porPagina < jugadoresMinimo {
			porPagina = jugadoresPorDefecto
		}
		if porPagina > jugadoresMaximo {
			porPagina = jugadoresMaximo
		}

		hoy := time.Now()
		coinciden := make([]Jugador, 0, 64)
		if consulta != "" {
			terminos := strings.Fields(consulta)
			for _, j := range jugadores {
				ok := true
				for _, termino := range terminos {
					if !j.coincide(termino, hoy) {
						ok = false
						break
					}
				}
				if ok {
					coinciden = append(coinciden, j)
				}
			}
		} else {
			// Sin texto: todos, paginados (el listado completo del indice).
			coinciden = jugadores
		}

		total := len(coinciden)
		inicio := (pagina - 1) * porPagina
		if inicio > total {
			inicio = total
		}
		fin := inicio + porPagina
		if fin > total {
			fin = total
		}

		// Solo la pagina pedida: la edad se calcula aqui, sobre 20 fichas.
		paginaDatos := make([]Jugador, 0, fin-inicio)
		for _, j := range coinciden[inicio:fin] {
			if j.Nacimiento != "" {
				if nac, err := time.Parse("2006-01-02", j.Nacimiento); err == nil {
					j.Edad = edadEn(nac, hoy)
				}
			}
			j.campos = nil
			paginaDatos = append(paginaDatos, j)
		}

		escribirJSON(w, http.StatusOK, respuestaJugadores{
			Jugadores: paginaDatos,
			Total:     total,
			Pagina:    pagina,
			PorPagina: porPagina,
		})
	}
}
