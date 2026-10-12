import { getTeamInitials } from "./teams";

/**
 * Buscador de jugadores contra nuestro backend en Go (server/handlers.go).
 *
 * Contrato: GET /api/jugadores?q=&pagina=&porPagina=
 * Respuesta: { players: Jugador[], total, pagina, porPagina }
 *
 * La búsqueda es de texto libre: cada palabra debe aparecer en algún campo
 * (nombre, país, liga, equipo o posición) sin importar acentos ni
 * mayúsculas; si la palabra es un número, casa con edad o altura.
 *
 * `Jugador` es exactamente la forma que devuelve la API (columnas de la
 * tabla `players` con sus nombres en inglés), incluida la `image_url` tal
 * cual viene del backend.
 */
export interface Jugador {
  /** UUID que asigna Postgres. */
  id: string;
  player_name: string;
  positions: string | null;
  age: number | null;
  height_cm: number | null;
  country_name: string | null;
  club_name: string | null;
  league_name: string | null;
  /** URL de la foto tal cual la devuelve la API (CDN de sofifa), null si no hay. */
  image_url: string | null;
}

export interface RespuestaJugadores {
  jugadores: Jugador[];
  total: number;
  pagina: number;
  porPagina: number;
  aviso?: string;
}

/** Forma cruda que devuelve el backend (columnas de la tabla `players`). */
interface RespuestaJugadoresAPI {
  players: Jugador[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Jugadores por página: el backend acota a 50, nosotros pedimos 20. */
export const JUGADORES_POR_PAGINA = 20;

// Mismo patrón que las noticias: en desarrollo Vite hace de proxy hacia el
// 8080 (ver vite.config.ts), en producción VITE_API_URL apunta al backend.
const URL_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/jugadores`
  : "/api/jugadores";

/**
 * Los nombres del dataset pueden traer un " -" colgado ("Rodri -"), así que
 * se limpia al mostrarlos en pantalla.
 */
export function limpiarNombre(nombre: string): string {
  return nombre.replace(/\s*-\s*$/, "").trim();
}

export async function fetchJugadores(
  q: string,
  pagina: number,
  signal?: AbortSignal,
): Promise<RespuestaJugadores> {
  const params = new URLSearchParams({
    q,
    pagina: String(pagina),
    porPagina: String(JUGADORES_POR_PAGINA),
  });

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}?${params}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      "No se pudo conectar con el servidor de jugadores. ¿Está el backend corriendo en el puerto 8080?",
    );
  }

  const datos = (await respuesta.json()) as RespuestaJugadoresAPI & {
    error?: string;
  };
  if (!respuesta.ok) {
    throw new Error(datos.error || `El servidor respondió ${respuesta.status}`);
  }
  return {
    jugadores: datos.players,
    total: datos.total,
    pagina: datos.pagina,
    porPagina: datos.porPagina,
  };
}

/**
 * Iniciales del avatar para los que no tienen foto descargada.
 * Reutiliza el criterio de los logos de equipos: "Lionel Andrés Messi" → "LA".
 */
export function getIniciales(nombre: string): string {
  return getTeamInitials(nombre);
}