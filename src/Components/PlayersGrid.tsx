import { useState } from "react";
import type { Jugador } from "../services/jugadores";
import { getIniciales, limpiarNombre } from "../services/jugadores";
import useJugadores from "../hooks/useJugadores";
import styles from "./PlayersGrid.module.css";

interface PlayersSectionProps {
  id?: string;
}

/**
 * Foto del jugador servida por el backend (image_url tal cual la devuelve
 * la API), con fallback a iniciales cuando no hay imagen (o si falla al
 * cargar), igual que los logos de los equipos.
 */
function JugadorFoto({ jugador }: { jugador: Jugador }) {
  const [fallo, setFallo] = useState(false);
  const nombre = limpiarNombre(jugador.player_name);

  if (!jugador.image_url || fallo) {
    return (
      <div className={styles.fotoFallback} aria-hidden="true">
        <span className={styles.fotoFallbackText}>{getIniciales(nombre)}</span>
      </div>
    );
  }

  return (
    <img
      className={styles.foto}
      src={jugador.image_url}
      alt={nombre}
      onError={() => setFallo(true)}
    />
  );
}

function JugadorCard({ jugador }: { jugador: Jugador }) {
  const nombre = limpiarNombre(jugador.player_name);
  return (
    <article className={styles.jugadorCard}>
      <JugadorFoto jugador={jugador} />
      <div className={styles.jugadorInfo}>
        <h3 className={styles.jugadorNombre}>{nombre}</h3>
        <span className={styles.posicion}>{jugador.positions ?? ""}</span>
        <p className={styles.jugadorMeta}>
          {jugador.age ?? "?"} años · {jugador.height_cm ?? "?"} cm ·{" "}
          {jugador.country_name || "País desconocido"}
        </p>
        <p className={styles.jugadorClub}>
          <strong>{jugador.club_name || "Sin equipo"}</strong>
          {jugador.league_name ? <> · {jugador.league_name}</> : null}
        </p>
      </div>
    </article>
  );
}

function PlayersSection({ id }: PlayersSectionProps) {
  const {
    busqueda,
    setBusqueda,
    buscar,
    consulta,
    jugadores,
    total,
    pagina,
    totalPaginas,
    rango,
    cargando,
    error,
    irAPagina,
  } = useJugadores();

  const formato = (n: number) => n.toLocaleString("es-ES");
  const buscando = consulta !== null && cargando && jugadores.length === 0;

  return (
    <div id={id} className={styles.container}>
      <h2 className={styles.titulo}>Buscar Jugadores</h2>

      {/* Caja tipo Google: la búsqueda se dispara al pulsar Intro */}
      <form
        className={styles.searchBox}
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
      >
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
            fill="currentColor"
          />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar jugadores..."
          aria-label="Buscar jugadores"
        />
      </form>

      <p className={styles.descripcion}>
        Escribe un dato de tu jugador a buscar: Nombre, Posicion, Altura, Edad,
        País, Liga y Equipo.
      </p>

      {consulta !== null && (
        <section className={styles.resultados} aria-live="polite">
          {error && !cargando && (
            <p className={styles.estadoError}>{error}</p>
          )}

          {buscando && <p className={styles.estado}>Buscando jugadores…</p>}

          {!cargando && !error && consulta !== null && total === 0 && (
            <p className={styles.estado}>
              No encontramos jugadores para «{consulta}».
            </p>
          )}

          {jugadores.length > 0 && (
            <>
              <p className={styles.contador}>
                {consulta
                  ? `${formato(total)} jugadores para «${consulta}»`
                  : `${formato(total)} jugadores en el índice`}
              </p>
              <div
                className={`${styles.grid} ${cargando ? styles.gridCargando : ""}`}
                aria-busy={cargando}
              >
                {jugadores.map((jugador) => (
                  <JugadorCard key={jugador.id} jugador={jugador} />
                ))}
              </div>
              {totalPaginas > 1 && (
                <nav className={styles.paginacion} aria-label="Paginación de jugadores">
                  <button
                    type="button"
                    className={styles.botonPagina}
                    disabled={pagina <= 1}
                    onClick={() => irAPagina(pagina - 1)}
                  >
                    ‹ Anterior
                  </button>
                  <span className={styles.paginaTexto}>
                    Página {pagina} de {totalPaginas} · {rango.desde}-
                    {rango.hasta} de {formato(total)}
                  </span>
                  <button
                    type="button"
                    className={styles.botonPagina}
                    disabled={pagina >= totalPaginas}
                    onClick={() => irAPagina(pagina + 1)}
                  >
                    Siguiente ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default PlayersSection;
