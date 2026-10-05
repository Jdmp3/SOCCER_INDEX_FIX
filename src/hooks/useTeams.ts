import { useCallback, useEffect, useMemo, useState } from "react";
import type { Team, TeamFilters } from "../services/teams";
import {
  EMPTY_TEAM_FILTERS,
  fetchTeams,
  getTeamFacets,
  getTotalPages,
  hasActiveFilters,
  paginateTeams,
} from "../services/teams";

/** Retraso del texto de búsqueda antes de disparar la consulta. */
const DEBOUNCE_MS = 300;

/** Listado ya filtrado, junto con los criterios con los que se obtuvo. */
interface Resultado {
  filtros: TeamFilters;
  teams: Team[];
}

/** Identidad estable para "sin resultados", para no invalidar memos en cada render. */
const SIN_RESULTADOS: Team[] = [];

/**
 * Carga los equipos aplicando los filtros y los pagina para el carrusel.
 *
 * `visibleTeams` es el resultado ya filtrado, `equiposPagina` el trozo que
 * toca ver (máx. TEAMS_PAGE_SIZE) y `allTeams` el conjunto completo, que alimenta
 * las opciones de los desplegables y el total del contador: así las opciones
 * nunca se encogen al filtrar.
 *
 * Hoy `fetchTeams` resuelve en local contra el JSON; cuando pase a ser una
 * llamada HTTP solo cambia `src/services/teams.ts`.
 */
function useTeams() {
  const [filtros, setFiltros] = useState<TeamFilters>(EMPTY_TEAM_FILTERS);
  const [nombreDebounced, setNombreDebounced] = useState(EMPTY_TEAM_FILTERS.nombre);
  const [pagina, setPagina] = useState(0);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [resultado, setResultado] = useState<Resultado | null>(null);
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

  // Catálogo completo: solo se pide una vez, alimenta los desplegables y el total.
  useEffect(() => {
    const controller = new AbortController();

    fetchTeams(EMPTY_TEAM_FILTERS, controller.signal)
      .then((teams) => {
        setAllTeams(teams);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Error al cargar los equipos");
      });

    return () => controller.abort();
  }, []);

  // Listado filtrado: se vuelve a pedir cuando cambia cualquier criterio.
  useEffect(() => {
    const controller = new AbortController();

    fetchTeams(filtrosEfectivos, controller.signal)
      .then((teams) => {
        setResultado({ filtros: filtrosEfectivos, teams });
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResultado(null);
        setError(err instanceof Error ? err.message : "Error al filtrar los equipos");
      });

    return () => controller.abort();
  }, [filtrosEfectivos]);

  // El resultado lleva dentro los filtros con los que se calculó, así el estado
  // de carga se deriva comparando referencias en vez de llamar a setState dentro del effect.
  const loading = resultado === null || resultado.filtros !== filtrosEfectivos;
  const visibleTeams = loading ? SIN_RESULTADOS : resultado.teams;

  const facets = useMemo(() => getTeamFacets(allTeams), [allTeams]);
  const hayFiltros = hasActiveFilters(filtros);
  const total = allTeams.length;

  // Paginación del carrusel. `pagina` se recorta al rango válido para que un
  // listado que se encoge no deje la navegación en una página inexistente.
  const totalPaginas = getTotalPages(visibleTeams.length);
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const equiposPagina = useMemo(
    () => paginateTeams(visibleTeams, paginaActual),
    [visibleTeams, paginaActual],
  );

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
    visibles: visibleTeams.length,
    setFiltro,
    irAPagina,
    reset,
  };
}

export default useTeams;