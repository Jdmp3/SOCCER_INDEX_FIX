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

	"github.com/joho/godotenv"
)

const limitPorDefecto = 2

const (
	limitMinimo = 1
	limitMaximo = 20
)

const puertoPorDefecto = "8080"

func logf(formato string, args ...any) {
	log.Printf("[api] "+formato, args...)
}

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
	if err := godotenv.Load(); err != nil {
		logf("no se encontro .env (se usaran variables del entorno): %v", err)
	}

	ctxInicial := context.Background()

	pool, errDB := conectarDB(ctxInicial)
	if errDB != nil {
		log.Fatalf("error de conexion a base de datos: %v", errDB)
	}
	defer pool.Close()

	migrCtx, migrCancel := context.WithTimeout(ctxInicial, 60*time.Second)
	defer migrCancel()
	if errMig := ejecutarMigraciones(migrCtx, pool); errMig != nil {
		log.Fatalf("error al aplicar migraciones: %v", errMig)
	}

	generarMascara()

	puerto := os.Getenv("PORT")
	if puerto == "" {
		puerto = puertoPorDefecto
	}

	cache := nuevaCache()
	mux := http.NewServeMux()

	handlers := &handlersAPI{pool: pool}

	mux.Handle("GET /api/jugadores", handlers.rutaJugadores())
	mux.Handle("GET /api/equipos", handlers.rutaEquipos())
	mux.Handle("GET /api/leyendas", handlers.rutaLeyendas())

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

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		logf("escuchando en http://localhost:%s", puerto)
		logf("prueba: curl localhost:%s/api/noticias", puerto)
		logf("prueba: curl \"localhost:%s/api/jugadores?q=mesi\"", puerto)
		logf("prueba: curl \"localhost:%s/api/equipos?pagina=1&porPagina=20\"", puerto)
		logf("prueba: curl localhost:%s/api/leyendas", puerto)
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

func escribirJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		logf("no se pudo escribir la respuesta: %v", err)
	}
}
