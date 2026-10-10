package main

import (
	"context"
	"embed"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

// Migraciones embebidas en el binario: no hace falta que la carpeta
// migrations/ exista junto al ejecutable en produccion.
//
//go:embed migrations/*.sql
var migracionesFS embed.FS

// loggerGoose adapta los mensajes de goose al log del servidor.
type loggerGoose struct{}

func (loggerGoose) Printf(formato string, args ...any) { logf("goose: "+formato, args...) }
func (loggerGoose) Fatalf(formato string, args ...any) { log.Fatalf("goose: "+formato, args...) }

// ejecutarMigraciones aplica al arranque las migraciones pendientes.
//
// goose guarda el control en la tabla goose_db_version, asi que cada archivo
// .sql se ejecuta una sola vez y en orden (por su prefijo numerico). Ademas usa
// un lock de base de datos, por lo que es seguro aunque varios procesos
// arranquen a la vez. Si prefieres aplicarlas a mano con el servidor apagado:
//
//	goose -dir server/migrations postgres "$DSN" up
func ejecutarMigraciones(ctx context.Context, pool *pgxpool.Pool) error {
	goose.SetBaseFS(migracionesFS)
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("dialecto de migraciones invalido: %w", err)
	}
	goose.SetLogger(loggerGoose{})

	// Reutilizamos el mismo pool para las migraciones.
	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()

	if err := goose.UpContext(ctx, db, "migrations"); err != nil {
		return fmt.Errorf("no se pudieron aplicar las migraciones: %w", err)
	}
	return nil
}
