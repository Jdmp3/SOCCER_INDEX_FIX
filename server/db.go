package main

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Conexion a PostgreSQL local.
//
// Los datos se leen de variables de entorno (ver .env). El objetivo es que al
// levantar el servidor con `go run .` se conecte a la base de datos local sin
// tener que tocar codigo: solo se cambian las variables del .env.

// conexionConfig son los campos de conexion que pide el usuario.
type conexionConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

// envODefecto devuelve la variable de entorno o un valor por defecto.
func envODefecto(clave, defecto string) string {
	if v := os.Getenv(clave); v != "" {
		return v
	}
	return defecto
}

// leerConexion arma la configuracion a partir de las variables DB_*.
func leerConexion() conexionConfig {
	return conexionConfig{
		Host:     envODefecto("DB_HOST", "localhost"),
		Port:     envODefecto("DB_PORT", "5432"),
		User:     envODefecto("DB_USER", "postgres"),
		Password: envODefecto("DB_PASSWORD", ""),
		Name:     envODefecto("DB_NAME", "postgres"),
		SSLMode:  envODefecto("DB_SSLMODE", "disable"),
	}
}

// DSN construye la cadena de conexion. Se usa net/url para escapar
// correctamente contrasenas con caracteres especiales.
func (c conexionConfig) DSN() string {
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(c.User, c.Password),
		Host:   net.JoinHostPort(c.Host, c.Port),
		Path:   "/" + c.Name,
	}
	q := u.Query()
	if c.SSLMode != "" {
		q.Set("sslmode", c.SSLMode)
	}
	u.RawQuery = q.Encode()
	return u.String()
}

// conectarDB crea el pool de conexiones y comprueba con un Ping que la base de
// datos local responde. Si algo falla devuelve un error claro que incluye el
// host, el puerto y el nombre de la base de datos.
func conectarDB(ctx context.Context) (*pgxpool.Pool, error) {
	cfg := leerConexion()

	poolCfg, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("configuracion de conexion invalida: %w", err)
	}
	poolCfg.MaxConns = 5
	poolCfg.MinConns = 1
	poolCfg.MaxConnIdleTime = 5 * time.Minute
	poolCfg.MaxConnLifetime = time.Hour

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear el pool de conexiones: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf(
			"no se pudo conectar a PostgreSQL en %s:%s (base de datos %q, usuario %q): %w\n"+
				"revisa las variables DB_* de server/.env y que el servidor PostgreSQL este encendido",
			cfg.Host, cfg.Port, cfg.Name, cfg.User, err,
		)
	}

	logf("conectado a PostgreSQL en %s:%s/%s", cfg.Host, cfg.Port, cfg.Name)
	return pool, nil
}
