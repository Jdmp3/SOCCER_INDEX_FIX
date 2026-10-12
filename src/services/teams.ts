export interface Team {
  /** UUID que asigna Postgres. */
  id: string;
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

export interface RespuestaEquipos {
  teams: Team[];
  total: number;
  facets: TeamFacets;
}

/** Forma cruda que devuelve el backend (columnas de la tabla `teams`). */
interface TeamAPI {
  id: string;
  name: string;
  country: string | null;
  league: string | null;
  founded: number | null;
  description: string | null;
  logo: string | null;
}

interface RespuestaEquiposAPI {
  teams: TeamAPI[];
  total: number;
  pagina: number;
  porPagina: number;
  facets: TeamFacets;
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

// Mismo patrón que las noticias: en desarrollo Vite hace de proxy hacia el
// 8080 (ver vite.config.ts), en producción VITE_API_URL apunta al backend.
const URL_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/equipos`
  : "/api/equipos";

/** Traduce una fila del backend a la interfaz del frontend. */
function aTeam(t: TeamAPI): Team {
  return {
    id: t.id,
    nombre: t.name,
    pais: t.country ?? "",
    liga: t.league ?? "",
    fundacion: t.founded ?? 0,
    descripcion: t.description ?? "",
    logo: t.logo ?? "",
  };
}

/**
 * Traduce los filtros al contrato de query params del backend.
 * Los criterios sin valor se omiten, para que el endpoint pueda usar sus defaults.
 *
 * Contrato: GET /api/equipos?nombre=&pais=&liga=&fundacionDesde=&fundacionHasta=&pagina=&porPagina=
 * Todos los criterios se combinan con AND y la paginación la hace el servidor.
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
 * Petición de equipos al backend. Los filtros, la paginación y los facets
 * viven en el servidor; aquí solo se traducen los parámetros y la respuesta.
 *
 * `pagina` es 0-based (como la UI); el endpoint trabaja 1-based, así que se
 * convierte al enviar (`pagina + 1`).
 */
export async function fetchTeams(
  filters: TeamFilters,
  pagina: number,
  signal?: AbortSignal,
): Promise<RespuestaEquipos> {
  const params = toTeamQueryParams(filters);
  params.set("pagina", String(pagina + 1));
  params.set("porPagina", String(TEAMS_PAGE_SIZE));

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}?${params}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      "No se pudo conectar con el servidor de equipos. ¿Está el backend corriendo en el puerto 8080?",
    );
  }

  const datos = (await respuesta.json()) as RespuestaEquiposAPI & {
    error?: string;
  };
  if (!respuesta.ok) {
    throw new Error(datos.error || `El servidor respondió ${respuesta.status}`);
  }
  return {
    teams: datos.teams.map(aTeam),
    total: datos.total,
    facets: datos.facets,
  };
}

/**
 * Número de páginas del carrusel. Nunca menos de 1, para que la UI siempre
 * tenga una página válida sobre la que moverse.
 */
export function getTotalPages(total: number): number {
  return Math.max(1, Math.ceil(total / TEAMS_PAGE_SIZE));
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

export function hasActiveFilters(filters: TeamFilters): boolean {
  return (
    filters.nombre.trim() !== "" ||
    filters.pais !== "" ||
    filters.liga !== "" ||
    filters.fundacionDesde !== null ||
    filters.fundacionHasta !== null
  );
}