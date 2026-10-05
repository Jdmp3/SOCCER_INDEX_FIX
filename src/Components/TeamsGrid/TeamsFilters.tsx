import type { TeamFacets, TeamFilters } from "../../services/teams";
import { getPageRange } from "../../services/teams";
import styles from "./TeamsGrid.module.css";

interface TeamsFiltersProps {
  filtros: TeamFilters;
  facets: TeamFacets;
  hayFiltros: boolean;
  total: number;
  visibles: number;
  pagina: number;
  totalPaginas: number;
  loading: boolean;
  onChange: <K extends keyof TeamFilters>(campo: K, valor: TeamFilters[K]) => void;
  onReset: () => void;
}

/** Convierte el valor del desplegable de años: "" significa "sin límite". */
function parseYear(valor: string): number | null {
  return valor === "" ? null : Number(valor);
}

function TeamsFilters({
  filtros,
  facets,
  hayFiltros,
  total,
  visibles,
  pagina,
  totalPaginas,
  loading,
  onChange,
  onReset,
}: TeamsFiltersProps) {
  const { desde, hasta } = getPageRange(visibles, pagina);
  return (
    <div className={styles.filtersBar}>
      <div className={styles.filtersGrid}>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel} htmlFor="filtro-nombre">
            Nombre
          </label>
          <input
            id="filtro-nombre"
            type="text"
            className={styles.filterInput}
            value={filtros.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>

        <div className={styles.filterItem}>
          <label className={styles.filterLabel} htmlFor="filtro-pais">
            País
          </label>
          <select
            id="filtro-pais"
            className={styles.filterSelect}
            value={filtros.pais}
            onChange={(e) => onChange("pais", e.target.value)}
          >
            <option value="">Todos los países</option>
            {facets.paises.map((pais) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterItem}>
          <label className={styles.filterLabel} htmlFor="filtro-liga">
            Liga
          </label>
          <select
            id="filtro-liga"
            className={styles.filterSelect}
            value={filtros.liga}
            onChange={(e) => onChange("liga", e.target.value)}
          >
            <option value="">Todas las ligas</option>
            {facets.ligas.map((liga) => (
              <option key={liga} value={liga}>
                {liga}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterItem}>
          <span className={styles.filterLabel}>Fecha de fundación</span>
          <div className={styles.rangeGroup}>
            <select
              aria-label="Fundado desde"
              className={styles.filterSelect}
              value={filtros.fundacionDesde ?? ""}
              onChange={(e) => onChange("fundacionDesde", parseYear(e.target.value))}
            >
              <option value="">Desde</option>
              {/* Solo años <= al "Hasta": hace inalcanzable un rango invertido. */}
              {facets.anios.map((anio) => (
                <option
                  key={`desde-${anio}`}
                  value={anio}
                  disabled={
                    filtros.fundacionHasta !== null && anio > filtros.fundacionHasta
                  }
                >
                  {anio}
                </option>
              ))}
            </select>
            <select
              aria-label="Fundado hasta"
              className={styles.filterSelect}
              value={filtros.fundacionHasta ?? ""}
              onChange={(e) => onChange("fundacionHasta", parseYear(e.target.value))}
            >
              <option value="">Hasta</option>
              {/* Espejo del anterior: solo años >= al "Desde". */}
              {facets.anios.map((anio) => (
                <option
                  key={`hasta-${anio}`}
                  value={anio}
                  disabled={
                    filtros.fundacionDesde !== null && anio < filtros.fundacionDesde
                  }
                >
                  {anio}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.filtersFooter}>
        <span className={styles.resultCount}>
          {loading
            ? "Cargando equipos..."
            : `Página ${pagina + 1} de ${totalPaginas} · Mostrando ${desde}-${hasta} de ${
                hayFiltros ? visibles : total
              } equipos${hayFiltros ? " filtrados" : ""}`}
        </span>
        {hayFiltros && (
          <button type="button" className={styles.clearButton} onClick={onReset}>
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}

export default TeamsFilters;