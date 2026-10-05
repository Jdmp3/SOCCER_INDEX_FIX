import teamsJson from "../data/teams.json";

export interface Team {
  id: number;
  nombre: string;
  pais: string;
  liga: string;
  fundacion: number;
  descripcion: string;
  logo: string;
}

export interface TeamFilters {
  /** Coincidencia parcial sobre `nombre`, sin distinguir mayúsculas/minúsculas. */
  nombre: string;
  /** "" = todos los países. */
  pais: string;
  /** "" = todas las ligas. */
  liga: string;
  /** null = sin límite inferior. */
  fundacionDesde: number | null;
  /** null = sin límite superior. */
  fundacionHasta: number | null;
}

export interface TeamFacets {
  paises: string[];
  ligas: string[];
  anios: number[];
}

export const EMPTY_TEAM_FILTERS: TeamFilters = {
  nombre: "",
  pais: "",
  liga: "",
  fundacionDesde: null,
  fundacionHasta: null,
};

/** Equipos que se muestran por página en el carrusel. */
export const TEAMS_PAGE_SIZE = 15;

/** Datos locales actuales (temporal, mientras no exista backend). */
const LOCAL_TEAMS: Team[] = teamsJson as Team[];

const collator = new Intl.Collator("es", { sensitivity: "base" });

/**
 * Normaliza para comparar sin acentos ni mayúsculas, de forma que "atleti",
 * "atléti" o "ATLETI" találen "Atlético". Para el backend esto equivale a
 * comparar con collation insensible a acentos.
 */
function normalize(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");
}

/**
 * Traduce los filtros al contrato de query params que consumirá el backend.
 * Los criterios sin valor se omiten, para que el endpoint pueda usar sus defaults.
 *
 * Contrato: GET /api/equipos?nombre=&pais=&liga=&fundacionDesde=&fundacionHasta=
 * Todos los criterios se combinan con AND.
 */
export function toTeamQueryParams(filters: TeamFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.nombre.trim()) params.set("nombre", filters.nombre.trim());
  if (filters.pais) params.set("pais", filters.pais);
  if (filters.liga) params.set("liga", filters.liga);
  if (filters.fundacionDesde !== null) {
    params.set("fundacionDesde", String(filters.fundacionDesde));
  }
  if (filters.fundacionHasta !== null) {
    params.set("fundacionHasta", String(filters.fundacionHasta));
  }
  return params;
}

/**
 * Filtra la lista de equipos en local. Función pura: sin estado de React,
 * reutilizable y testeable de forma aislada.
 *
 * Todos los criterios se combinan con AND. Si `fundacionDesde` es mayor que
 * `fundacionHasta` no hay ningún equipo que cumpla el rango.
 */
export function applyTeamFilters(teams: Team[], filters: TeamFilters): Team[] {
  const busqueda = normalize(filters.nombre.trim());

  return teams.filter((team) => {
    if (busqueda && !normalize(team.nombre).includes(busqueda)) {
      return false;
    }
    if (filters.pais && team.pais !== filters.pais) return false;
    if (filters.liga && team.liga !== filters.liga) return false;
    if (
      filters.fundacionDesde !== null &&
      team.fundacion < filters.fundacionDesde
    ) {
      return false;
    }
    if (
      filters.fundacionHasta !== null &&
      team.fundacion > filters.fundacionHasta
    ) {
      return false;
    }
    return true;
  });
}

/** Valores únicos disponibles para poblar los desplegables de los filtros. */
export function getTeamFacets(teams: Team[]): TeamFacets {
  return {
    paises: [...new Set(teams.map((team) => team.pais))].sort(collator.compare),
    ligas: [...new Set(teams.map((team) => team.liga))].sort(collator.compare),
    anios: [...new Set(teams.map((team) => team.fundacion))].sort((a, b) => a - b),
  };
}

/**
 * Número de páginas del carrusel. Nunca menos de 1, para que la UI siempre
 * tenga una página válida sobre la que moverse.
 */
export function getTotalPages(total: number): number {
  return Math.max(1, Math.ceil(total / TEAMS_PAGE_SIZE));
}

/**
 * Recorta la página pedida (base 0). La última puede ir incompleta: con 20
 * equipos y páginas de 15, la segunda devuelve 5. Una página fuera de rango
 * devuelve lista vacía.
 */
export function paginateTeams(teams: Team[], pagina: number): Team[] {
  const inicio = pagina * TEAMS_PAGE_SIZE;
  if (inicio < 0 || inicio >= teams.length) return [];
  return teams.slice(inicio, inicio + TEAMS_PAGE_SIZE);
}

/** Rango que ocupa la página dentro del listado, para el contador "1-15 de 20". */
export function getPageRange(
  total: number,
  pagina: number,
): { desde: number; hasta: number } {
  if (total === 0) return { desde: 0, hasta: 0 };
  const desde = pagina * TEAMS_PAGE_SIZE + 1;
  return { desde, hasta: Math.min(desde + TEAMS_PAGE_SIZE - 1, total) };
}

/** Palabras que no cuentan para las iniciales: "Inter de Milan" → "IM". */
const CONECTORES = new Set(["de", "del", "la", "el", "los", "las", "of", "y", "the", "&"]);

/**
 * Iniciales para el fallback cuando no hay logo: "Real Madrid" → "RM",
 * "Inter de Milan" → "IM" (ignora "de"), "PSG" → "PS", "Brighton & Hove
 * Albion" → "BH" (ignora "&"). Son las dos primeras palabras con letras.
 */
export function getTeamInitials(nombre: string): string {
  const palabras = nombre.split(/\s+/).filter((p) => /[\p{L}]/u.test(p));
  const utiles = palabras.filter((p) => !CONECTORES.has(p.toLocaleLowerCase("es")));
  const fuente = utiles.length > 0 ? utiles : palabras;
  if (fuente.length === 0) return "?";
  if (fuente.length === 1) return fuente[0].slice(0, 2).toLocaleUpperCase("es");
  return (fuente[0][0] + fuente[1][0]).toLocaleUpperCase("es");
}

/**
 * Punto único de sustitución del backend.
 *
 * Hoy resuelve contra el JSON local aplicando los filtros en el cliente, y el
 * carrusel pagina ese resultado con `paginateTeams`.
 *
 * Cuando exista el endpoint, la paginación pasa al servidor: los params son
 * `pagina` y `porPagina`, y la respuesta debe traer el total aparte para poder
 * calcular las páginas, porque el cliente ya no tendría la lista completa.
 *
 *   Contrato: GET /api/equipos?nombre=&pais=&liga=&fundacionDesde=&fundacionHasta=&pagina=&porPagina=
 *   Respuesta: { equipos: Team[], total: number }
 *
 * Con esa forma, `useTeams` deja de usar `paginateTeams` y `getTotalPages`
 * (el total viene del servidor); el resto de la UI no cambia. La firma de
 * `fetchTeams` sí, así que se ajusta aquí y en el hook, no en los componentes.
 */
export async function fetchTeams(
  filters: TeamFilters,
  signal?: AbortSignal,
): Promise<Team[]> {
  void signal;
  return applyTeamFilters(LOCAL_TEAMS, filters);
}

export function hasActiveFilters(filters: TeamFilters): boolean {
  return (
    filters.nombre.trim() !== "" ||
    filters.pais !== "" ||
    filters.liga !== "" ||
    filters.fundacionDesde !== null ||
    filters.fundacionHasta !== null
  );
}