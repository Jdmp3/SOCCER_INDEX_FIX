package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// handlersAPI agrupa los handlers GET del API que leen de PostgreSQL.
//
// Los nombres de campo de las respuestas coinciden con las columnas de la
// base de datos (ingles y snake_case). El frontend se adaptara a ellos.
type handlersAPI struct {
	pool *pgxpool.Pool
}

// ---------- Paginacion ----------

const (
	paginaPorDefecto    = 1
	jugadoresPorDefecto = 20
	jugadoresMaximo     = 50
	equiposPorDefecto   = 20
	equiposMaximo       = 100
)

// leerPaginacion interpreta los query params pagina/porPagina y acota los
// valores a rangos validos. Una pagina o tamano invalido cae al default.
func leerPaginacion(r *http.Request, porDefecto, maximo int) (pagina, porPagina int) {
	pagina = paginaPorDefecto
	if p := r.URL.Query().Get("pagina"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n >= paginaPorDefecto {
			pagina = n
		}
	}
	porPagina = porDefecto
	if p := r.URL.Query().Get("porPagina"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n >= 1 {
			porPagina = n
		}
	}
	if porPagina > maximo {
		porPagina = maximo
	}
	return pagina, porPagina
}

// escaparLike neutraliza los comodines de LIKE que pudiera escribir el
// usuario, para que "%" y "_" se traten como texto literal.
func escaparLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}

// errorServidor registra el error y responde 500 en JSON.
func errorServidor(w http.ResponseWriter, err error) {
	logf("error de base de datos: %v", err)
	escribirJSON(w, http.StatusInternalServerError, map[string]any{"error": "error interno del servidor"})
}

// ---------- Jugadores ----------

// Player es un registro de la tabla players (columnas del CSV original).
type Player struct {
	ID          string  `json:"id"`
	PlayerName  string  `json:"player_name"`
	Positions   *string `json:"positions"`
	Age         *int    `json:"age"`
	HeightCm    *int    `json:"height_cm"`
	CountryName *string `json:"country_name"`
	ClubName    *string `json:"club_name"`
	LeagueName  *string `json:"league_name"`
	ImageURL    *string `json:"image_url"`
}

type respuestaJugadores struct {
	Players   []Player `json:"players"`
	Total     int      `json:"total"`
	Pagina    int      `json:"pagina"`
	PorPagina int      `json:"porPagina"`
}

// terminoBusqueda es un token de "q" ya analizado: texto libre o un numero
// que puede representar edad y/o altura.
type terminoBusqueda struct {
	texto         string
	edad          int
	altura        int
	evaluarEdad   bool
	evaluarAltura bool
}

// analizarTermino decide si un token de busqueda es texto libre o un numero
// con significado (rango razonable de edad o de altura en cm).
func analizarTermino(token string) terminoBusqueda {
	t := terminoBusqueda{texto: strings.ToLower(token)}
	normalizado := strings.ReplaceAll(token, ",", ".")
	if n, err := strconv.ParseFloat(normalizado, 64); err == nil {
		if n >= 1 && n < 3 { // en metros: 1.85 -> 185 cm
			t.altura = int(n*100 + 0.5)
			t.evaluarAltura = true
			return t
		}
		if n == float64(int(n)) {
			ent := int(n)
			if ent >= 140 && ent <= 230 { // rango razonable de altura
				t.altura = ent
				t.evaluarAltura = true
			}
			if ent >= 14 && ent <= 50 { // rango razonable de edad
				t.edad = ent
				t.evaluarEdad = true
			}
		}
	}
	return t
}

// rutaJugadores responde GET /api/jugadores?q=&pagina=&porPagina=
//
// La busqueda es texto libre insensible a mayusculas y acentos: cada palabra
// debe aparecer en algun campo (player_name, positions, country_name,
// club_name o league_name); si la palabra es un numero, casa con edad o
// altura. Sin "q" devuelve el listado completo paginado.
func (h *handlersAPI) rutaJugadores() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pagina, porPagina := leerPaginacion(r, jugadoresPorDefecto, jugadoresMaximo)
		ctx := r.Context()

		var condiciones []string
		var args []any
		for _, token := range strings.Fields(r.URL.Query().Get("q")) {
			t := analizarTermino(token)
			if t.evaluarEdad || t.evaluarAltura {
				var partes []string
				if t.evaluarEdad {
					args = append(args, t.edad)
					partes = append(partes, fmt.Sprintf("age = $%d", len(args)))
				}
				if t.evaluarAltura {
					args = append(args, t.altura)
					partes = append(partes, fmt.Sprintf("height_cm = $%d", len(args)))
				}
				condiciones = append(condiciones, "("+strings.Join(partes, " OR ")+")")
				continue
			}
			args = append(args, "%"+escaparLike(t.texto)+"%")
			idx := len(args)
			condiciones = append(condiciones, fmt.Sprintf(
				"(unaccent(lower(player_name)) LIKE unaccent(lower($%d))"+
					" OR unaccent(lower(positions)) LIKE unaccent(lower($%d))"+
					" OR unaccent(lower(country_name)) LIKE unaccent(lower($%d))"+
					" OR unaccent(lower(club_name)) LIKE unaccent(lower($%d))"+
					" OR unaccent(lower(league_name)) LIKE unaccent(lower($%d)))",
				idx, idx, idx, idx, idx))
		}
		where := ""
		if len(condiciones) > 0 {
			where = " WHERE " + strings.Join(condiciones, " AND ")
		}

		var total int
		if err := h.pool.QueryRow(ctx, "SELECT count(*) FROM players"+where, args...).Scan(&total); err != nil {
			errorServidor(w, err)
			return
		}

		inicio := (pagina - 1) * porPagina
		limite, desplazamiento := len(args)+1, len(args)+2
		args = append(args, porPagina, inicio)
		sql := fmt.Sprintf(
			"SELECT id, player_name, positions, age, height_cm, country_name, club_name, league_name, image_url"+
				" FROM players%s ORDER BY player_name ASC, id ASC LIMIT $%d OFFSET $%d",
			where, limite, desplazamiento)
		rows, err := h.pool.Query(ctx, sql, args...)
		if err != nil {
			errorServidor(w, err)
			return
		}
		defer rows.Close()

		jugadores := make([]Player, 0, porPagina)
		for rows.Next() {
			var j Player
			if err := rows.Scan(&j.ID, &j.PlayerName, &j.Positions, &j.Age, &j.HeightCm,
				&j.CountryName, &j.ClubName, &j.LeagueName, &j.ImageURL); err != nil {
				errorServidor(w, err)
				return
			}
			jugadores = append(jugadores, j)
		}
		if rows.Err() != nil {
			errorServidor(w, rows.Err())
			return
		}

		escribirJSON(w, http.StatusOK, respuestaJugadores{
			Players:   jugadores,
			Total:     total,
			Pagina:    pagina,
			PorPagina: porPagina,
		})
	}
}

// ---------- Equipos ----------

// Team es un registro de la tabla teams.
type Team struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Country     *string `json:"country"`
	League      *string `json:"league"`
	Founded     *int    `json:"founded"`
	Description *string `json:"description"`
	Logo        *string `json:"logo"`
}

// TeamFacets son los valores unicos de la tabla completa (ignora filtros)
// para poblar los desplegables de la seccion EQUIPOS.
type TeamFacets struct {
	Paises []string `json:"paises"`
	Ligas  []string `json:"ligas"`
	Anios  []int    `json:"anios"`
}

type respuestaEquipos struct {
	Teams     []Team     `json:"teams"`
	Total     int        `json:"total"`
	Pagina    int        `json:"pagina"`
	PorPagina int        `json:"porPagina"`
	Facets    TeamFacets `json:"facets"`
}

// facetsEquipos consulta los valores unicos de la tabla completa.
func (h *handlersAPI) facetsEquipos(ctx context.Context) (TeamFacets, error) {
	facets := TeamFacets{Paises: []string{}, Ligas: []string{}, Anios: []int{}}

	consultaFacet := func(sql string, destino any) error {
		rows, err := h.pool.Query(ctx, sql)
		if err != nil {
			return err
		}
		defer rows.Close()
		switch d := destino.(type) {
		case *[]string:
			for rows.Next() {
				var v string
				if err := rows.Scan(&v); err != nil {
					return err
				}
				*d = append(*d, v)
			}
		case *[]int:
			for rows.Next() {
				var v int
				if err := rows.Scan(&v); err != nil {
					return err
				}
				*d = append(*d, v)
			}
		}
		return rows.Err()
	}

	if err := consultaFacet(
		"SELECT DISTINCT country FROM teams WHERE country IS NOT NULL AND country <> '' ORDER BY country",
		&facets.Paises); err != nil {
		return facets, err
	}
	if err := consultaFacet(
		"SELECT DISTINCT league FROM teams WHERE league IS NOT NULL AND league <> '' ORDER BY league",
		&facets.Ligas); err != nil {
		return facets, err
	}
	if err := consultaFacet(
		"SELECT DISTINCT founded FROM teams WHERE founded IS NOT NULL ORDER BY founded",
		&facets.Anios); err != nil {
		return facets, err
	}
	return facets, nil
}

// rutaEquipos responde GET /api/equipos?nombre=&pais=&liga=&fundacionDesde=&fundacionHasta=&pagina=&porPagina=
//
// Un unico endpoint con filtros (combinados con AND) y paginacion. Los
// facets viajan en la misma respuesta, calculados sobre la tabla completa.
func (h *handlersAPI) rutaEquipos() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pagina, porPagina := leerPaginacion(r, equiposPorDefecto, equiposMaximo)
		ctx := r.Context()
		parametros := r.URL.Query()

		var condiciones []string
		var args []any
		if nombre := strings.TrimSpace(parametros.Get("nombre")); nombre != "" {
			args = append(args, "%"+escaparLike(strings.ToLower(nombre))+"%")
			condiciones = append(condiciones, fmt.Sprintf("unaccent(lower(name)) LIKE unaccent(lower($%d))", len(args)))
		}
		if pais := strings.TrimSpace(parametros.Get("pais")); pais != "" {
			args = append(args, pais)
			condiciones = append(condiciones, fmt.Sprintf("country = $%d", len(args)))
		}
		if liga := strings.TrimSpace(parametros.Get("liga")); liga != "" {
			args = append(args, liga)
			condiciones = append(condiciones, fmt.Sprintf("league = $%d", len(args)))
		}
		if desde := parametros.Get("fundacionDesde"); desde != "" {
			if n, err := strconv.Atoi(desde); err == nil {
				args = append(args, n)
				condiciones = append(condiciones, fmt.Sprintf("founded >= $%d", len(args)))
			}
		}
		if hasta := parametros.Get("fundacionHasta"); hasta != "" {
			if n, err := strconv.Atoi(hasta); err == nil {
				args = append(args, n)
				condiciones = append(condiciones, fmt.Sprintf("founded <= $%d", len(args)))
			}
		}
		where := ""
		if len(condiciones) > 0 {
			where = " WHERE " + strings.Join(condiciones, " AND ")
		}

		facets, err := h.facetsEquipos(ctx)
		if err != nil {
			errorServidor(w, err)
			return
		}

		var total int
		if err := h.pool.QueryRow(ctx, "SELECT count(*) FROM teams"+where, args...).Scan(&total); err != nil {
			errorServidor(w, err)
			return
		}

		inicio := (pagina - 1) * porPagina
		limite, desplazamiento := len(args)+1, len(args)+2
		args = append(args, porPagina, inicio)
		sql := fmt.Sprintf(
			"SELECT id, name, country, league, founded, description, logo FROM teams%s"+
				" ORDER BY name ASC, id ASC LIMIT $%d OFFSET $%d",
			where, limite, desplazamiento)
		rows, err := h.pool.Query(ctx, sql, args...)
		if err != nil {
			errorServidor(w, err)
			return
		}
		defer rows.Close()

		equipos := make([]Team, 0, porPagina)
		for rows.Next() {
			var e Team
			if err := rows.Scan(&e.ID, &e.Name, &e.Country, &e.League, &e.Founded,
				&e.Description, &e.Logo); err != nil {
				errorServidor(w, err)
				return
			}
			equipos = append(equipos, e)
		}
		if rows.Err() != nil {
			errorServidor(w, rows.Err())
			return
		}

		escribirJSON(w, http.StatusOK, respuestaEquipos{
			Teams:     equipos,
			Total:     total,
			Pagina:    pagina,
			PorPagina: porPagina,
			Facets:    facets,
		})
	}
}

// ---------- Leyendas ----------

// Legend es un registro de la tabla legends.
type Legend struct {
	ID     string `json:"id"`
	Number string `json:"number"`
	Title  string `json:"title"`
	Year   *int   `json:"year"`
}

type respuestaLeyendas struct {
	Legends []Legend `json:"legends"`
}

// rutaLeyendas responde GET /api/leyendas con la coleccion completa.
func (h *handlersAPI) rutaLeyendas() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := h.pool.Query(r.Context(),
			"SELECT id, number, title, year FROM legends ORDER BY number")
		if err != nil {
			errorServidor(w, err)
			return
		}
		defer rows.Close()

		leyendas := make([]Legend, 0, 8)
		for rows.Next() {
			var l Legend
			if err := rows.Scan(&l.ID, &l.Number, &l.Title, &l.Year); err != nil {
				errorServidor(w, err)
				return
			}
			leyendas = append(leyendas, l)
		}
		if rows.Err() != nil {
			errorServidor(w, rows.Err())
			return
		}

		escribirJSON(w, http.StatusOK, respuestaLeyendas{Legends: leyendas})
	}
}
