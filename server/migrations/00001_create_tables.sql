-- +goose Up
-- Tablas del API Soccer Index. Todo en ingles y snake_case.
-- Nota: gen_random_uuid() es nativo desde PostgreSQL 13. Si usas una version
-- anterior, descomenta la linea de pgcrypto.

-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Jugadores. Columnas identicas al CSV jugadores_fc25_8_campos.csv
-- (player_name, positions, age, height_cm, country_name, club_name,
--  league_name, image_url).
CREATE TABLE IF NOT EXISTS players (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name  TEXT NOT NULL,
    positions    TEXT,
    age          INTEGER,
    height_cm    INTEGER,
    country_name TEXT,
    club_name    TEXT,
    league_name  TEXT,
    image_url    TEXT
);

-- Equipos (origen: src/data/teams.json).
CREATE TABLE IF NOT EXISTS teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    country     TEXT,
    league      TEXT,
    founded     INTEGER,
    description TEXT,
    logo        TEXT
);

-- Leyendas (origen: array "leyendas" en src/App.tsx).
CREATE TABLE IF NOT EXISTS legends (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT NOT NULL,
    title  TEXT NOT NULL,
    year   INTEGER
);

-- +goose Down
DROP TABLE IF EXISTS legends;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS players;
