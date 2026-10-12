import { useState } from "react";
import useTeams from "../../hooks/useTeams";
import type { TeamFilters } from "../../services/teams";
import TeamLogo from "./TeamLogo";
import TeamsFilters from "./TeamsFilters";
import styles from "./TeamsGrid.module.css";

function TeamSkeleton() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonLogo} />
      <div className={`${styles.skeletonLinea} ${styles.skeletonLineaNombre}`} />
      <div className={`${styles.skeletonLinea} ${styles.skeletonLineaPais}`} />
    </div>
  );
}

function TeamsGrid() {
  const {
    filtros,
    facets,
    hayFiltros,
    total,
    loading,
    error,
    pagina,
    totalPaginas,
    equiposPagina,
    setFiltro,
    irAPagina,
    reset,
  } = useTeams();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleTeam = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Una sola regla: cambiar de criterio, de página o limpiar filtros contrae la
  // tarjeta abierta, para no dejar un detalle colgando sobre el nuevo listado.
  function cambiarFiltro<K extends keyof TeamFilters>(
    campo: K,
    valor: TeamFilters[K],
  ) {
    setExpandedId(null);
    setFiltro(campo, valor);
  }

  function cambiarPagina(destino: number) {
    setExpandedId(null);
    irAPagina(destino);
  }

  function limpiarFiltros() {
    setExpandedId(null);
    reset();
  }

  const hayVariasPaginas = !loading && !error && total > 0 && totalPaginas > 1;

  return (
    <div id="equipos" className={styles.container}>
      <h2 className="section-title">EQUIPOS</h2>
      <TeamsFilters
        filtros={filtros}
        facets={facets}
        hayFiltros={hayFiltros}
        total={total}
        pagina={pagina}
        totalPaginas={totalPaginas}
        loading={loading}
        onChange={cambiarFiltro}
        onReset={limpiarFiltros}
      />

      {error ? (
        <p className={styles.emptyState}>{error}</p>
      ) : (
        <>
          <div className={styles.grid} aria-busy={loading}>
            {loading && equiposPagina.length === 0
              ? Array.from({ length: 15 }, (_, i) => (
                  <TeamSkeleton key={`skeleton-${i}`} />
                ))
              : equiposPagina.map((team) => (
              <div key={team.id} className={styles.card}>
                <div
                  className={styles.cardHeader}
                  onClick={() => toggleTeam(team.id)}
                >
                  <div className={styles.logoContainer}>
                    <TeamLogo team={team} />
                  </div>
                  <div className={styles.teamInfo}>
                    <span className={styles.teamName}>{team.nombre}</span>
                    <span className="text-body">{team.pais}</span>
                  </div>
                </div>
                {expandedId === team.id && (
                  <div className={styles.description}>
                    <p className="text-body">{team.descripcion}</p>
                    <p className={`${styles.descriptionMeta} text-body`}>
                      <span>{team.liga}</span>
                      <span className={styles.descriptionMetaDivider}>·</span>
                      <span>
                        Fundado en{" "}
                        <span className="text-metric">{team.fundacion}</span>
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}

            {!loading && equiposPagina.length === 0 && (
              <div className={styles.emptyState}>
                <p>No hay equipos que cumplan con estos filtros.</p>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={limpiarFiltros}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {hayVariasPaginas && (
            <nav className={styles.carouselNav} aria-label="Paginación de equipos">
              <button
                type="button"
                className={styles.carouselButton}
                onClick={() => cambiarPagina(pagina - 1)}
                disabled={pagina === 0}
                aria-label="Ver página anterior"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.carouselButton}
                onClick={() => cambiarPagina(pagina + 1)}
                disabled={pagina >= totalPaginas - 1}
                aria-label="Ver página siguiente"
              >
                →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default TeamsGrid;