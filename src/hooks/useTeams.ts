import { useCallback, useEffect, useMemo, useState } from "react";
import type { Team, TeamFacets, TeamFilters } from "../services/teams";
import {
  EMPTY_TEAM_FILTERS,
  fetchTeams,
  getTotalPages,
  hasActiveFilters,
} from "../services/teams";

/** Retraso del texto de búsqueda antes de disparar la consulta. */
const DEBOUNCE_MS = 300;

/** Página ya resuelta por el servidor, junto con los criterios con los que se obtuvo. */
interface Resultado {
  filtros: TeamFilters;
  pagina: number;
  teams: Team[];
  total: number;
}

/** Identidad estable para "sin resultados", para no invalidar memos en cada render. */
const SIN_RESULTADOS: Team[] = [];

/** Facets vacíos hasta que llega la primera respuesta. */
const FACETS_VACIOS: TeamFacets = { paises: [], ligas: [], anios: [] };

/**
 * Carga los equipos desde el backend aplicando los filtros. El servidor hace
 * el filtrado, la paginación y devuelve los facets (valores únicos de la tabla
 * completa), así que aquí solo se orquesta el estado de la UI.
 *
 * `equiposPagina` es el trozo que devuelve el servidor para la página actual
 * (máx. TEAMS_PAGE_SIZE) y `total` el número de equipos que cumplen los
 * filtros: con ambos se calcula la navegación del carrusel.
 */
function useTeams() {
  const [filtros, setFiltros] = useState<TeamFilters>(EMPTY_TEAM_FILTERS);
  const [nombreDebounced, setNombreDebounced] = useState(EMPTY_TEAM_FILTERS.nombre);
  const [pagina, setPagina] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [facets, setFacets] = useState<TeamFacets>(FACETS_VACIOS);
  const [error, setError] = useState<string | null>(null);

  // El texto va con debounce; el resto de criterios se aplican al instante.
  useEffect(() => {
    const timeout = setTimeout(() => setNombreDebounced(filtros.nombre), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [filtros.nombre]);

  // Se conservan sincronizados `filtros` y su versión con debounce. Las
  // dependencias son los valores sueltos, no `filtros`: así teclear no cambia
  // la identidad del objeto y la cuadrícula no parpadea durante el debounce,
  // solo se recarga cuando cambia de verdad algún criterio efectivo.
  const filtrosEfectivos = useMemo<TeamFilters>(
    () => ({
      nombre: nombreDebounced,
      pais: filtros.pais,
      liga: filtros.liga,
      fundacionDesde: filtros.fundacionDesde,
      fundacionHasta: filtros.fundacionHasta,
    }),
    [
      nombreDebounced,
      filtros.pais,
      filtros.liga,
      filtros.fundacionDesde,
      filtros.fundacionHasta,
    ],
  );

  // Página válida: si el listado se encoge, se recorta al último existente para
  // no quedarnos en una página inexistente.
  const total = resultado?.total ?? 0;
  const totalPaginas = getTotalPages(total);
  const paginaActual = Math.min(pagina, totalPaginas - 1);

  // Listado filtrado: se vuelve a pedir cuando cambia cualquier criterio o la página.
  useEffect(() => {
    const controller = new AbortController();

    fetchTeams(filtrosEfectivos, paginaActual, controller.signal)
      .then((datos) => {
        setResultado({
          filtros: filtrosEfectivos,
          pagina: paginaActual,
          teams: datos.teams,
          total: datos.total,
        });
        setFacets(datos.facets);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResultado(null);
        setError(err instanceof Error ? err.message : "Error al cargar los equipos");
      });

    return () => controller.abort();
  }, [filtrosEfectivos, paginaActual]);

  // El resultado lleva dentro los filtros y la página con los que se calculó, así
  // el estado de carga se deriva comparando referencias en vez de llamar a
  // setState dentro del effect.
  const loading =
    resultado === null ||
    resultado.filtros !== filtrosEfectivos ||
    resultado.pagina !== paginaActual;
  const equiposPagina = loading ? SIN_RESULTADOS : resultado.teams;

  const hayFiltros = hasActiveFilters(filtros);

  // Cualquier cambio de criterio vuelve a la primera página. Se hace aquí y no
  // en un effect para no violar react-hooks/set-state-in-effect.
  const setFiltro = useCallback(<K extends keyof TeamFilters>(
    campo: K,
    valor: TeamFilters[K],
  ) => {
    setFiltros((previos) => ({ ...previos, [campo]: valor }));
    setPagina(0);
  }, []);

  const irAPagina = useCallback((destino: number) => {
    setPagina(Math.max(0, destino));
  }, []);

  const reset = useCallback(() => {
    setFiltros(EMPTY_TEAM_FILTERS);
    setNombreDebounced(EMPTY_TEAM_FILTERS.nombre);
    setPagina(0);
  }, []);

  return {
    filtros,
    facets,
    hayFiltros,
    total,
    loading,
    error,
    pagina: paginaActual,
    totalPaginas,
    equiposPagina,
    setFiltro,
    irAPagina,
    reset,
  };
}

export default useTeams;