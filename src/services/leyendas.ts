/**
 * Leyendas de la sección LEYENDAS, servidas por nuestro backend en Go
 * (server/handlers.go).
 *
 * Contrato: GET /api/leyendas
 * Respuesta: { legends: [{ id, number, title, year }] }
 */

export interface Leyenda {
  /** UUID que asigna Postgres. */
  id: string;
  num: string;
  titulo: string;
  anio: number;
}

/** Forma cruda que devuelve el backend (columnas de la tabla `legends`). */
interface LeyendaAPI {
  id: string;
  number: string;
  title: string;
  year: number | null;
}

interface RespuestaLeyendasAPI {
  legends: LeyendaAPI[];
}

// Mismo patrón que las noticias: en desarrollo Vite hace de proxy hacia el
// 8080 (ver vite.config.ts), en producción VITE_API_URL apunta al backend.
const URL_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/leyendas`
  : "/api/leyendas";

/** Traduce una fila del backend a la interfaz del frontend. */
function aLeyenda(l: LeyendaAPI): Leyenda {
  return {
    id: l.id,
    num: l.number,
    titulo: l.title,
    anio: l.year ?? 0,
  };
}

export async function fetchLeyendas(signal?: AbortSignal): Promise<Leyenda[]> {
  let respuesta: Response;
  try {
    respuesta = await fetch(URL_API, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error(
      "No se pudo conectar con el servidor de leyendas. ¿Está el backend corriendo en el puerto 8080?",
    );
  }

  const datos = (await respuesta.json()) as RespuestaLeyendasAPI & {
    error?: string;
  };
  if (!respuesta.ok) {
    throw new Error(datos.error || `El servidor respondió ${respuesta.status}`);
  }
  return (datos.legends ?? []).map(aLeyenda);
}