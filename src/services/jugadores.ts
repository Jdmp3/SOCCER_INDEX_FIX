import { getTeamInitials } from "./teams";

/**
 * Buscador de jugadores contra nuestro backend en Go (server/jugadores.go).
 *
 * Contrato: GET /api/jugadores?q=&pagina=&porPagina=
 * Respuesta: { jugadores: Jugador[], total, pagina, porPagina }
 *
 * La búsqueda es de texto libre: cada palabra debe aparecer en algún campo
 * (nombre, país, liga, equipo o posición) sin importar acentos ni
 * mayúsculas; si la palabra es un número, casa con edad o altura. La edad
 * la calcula el servidor desde la fecha de nacimiento, por eso llega ya
 * resuelta en la respuesta.
 */
export interface Jugador {
  id: number;
  nombre: string;
  posicion: string;
  altura: number;
  edad: number;
  pais: string;
  liga: string;
  equipo: string;
  /** Ruta relativa a public/, vacía si el jugador no tiene foto descargada. */
  foto: string;
}

export interface RespuestaJugadores {
  jugadores: Jugador[];
  total: number;
  pagina: number;
  porPagina: number;
  aviso?: string;
}

/** Jugadores por página: el backend acota a 50, nosotros pedimos 20. */
export const JUGADORES_POR_PAGINA = 20;

// Mismo patrón que las noticias: en desarrollo Vite hace de proxy hacia el
// 8080 (ver vite.config.ts), en producción VITE_API_URL apunta al backend.
const URL_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/jugadores`
  : "/api/jugadores";

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

  const datos = (await respuesta.json()) as RespuestaJugadores;
  if (!respuesta.ok || datos.aviso) {
    throw new Error(datos.aviso || `El servidor respondió ${respuesta.status}`);
  }
  return datos;
}

/**
 * Iniciales del avatar para los que no tienen foto descargada.
 * Reutiliza el criterio de los logos de equipos: "Lionel Andrés Messi" → "LA".
 */
export function getIniciales(nombre: string): string {
  return getTeamInitials(nombre);
}
