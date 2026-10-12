-- +goose Up
-- Habilita la extension unaccent para busquedas insensibles a acentos y
-- mayusculas (unaccent(lower(columna))). Requiere los contrib de PostgreSQL;
-- en instalaciones locales con usuario superusuario se crea sin problema.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- +goose Down
DROP EXTENSION IF EXISTS unaccent;