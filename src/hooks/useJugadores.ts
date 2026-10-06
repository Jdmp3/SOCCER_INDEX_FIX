import { useCallback, useEffect, useMemo, useState } from "react";
import type { Jugador, RespuestaJugadores } from "../services/jugadores";
import { JUGADORES_POR_PAGINA, fetchJugadores } from "../services/jugadores";

/** Respuesta junto con la consulta y página que la produjeron. */
interface Resultado {
  consulta: string;
  pagina: number;
  datos: RespuestaJugadores;
}

/**
 * Buscador de jugadores con búsqueda al pulsar Intro (sin debounce, como se
 * pidió) y paginación en el servidor.
 *
 * `consulta === null` significa que todavía no se ha buscado nada: la UI no
 * muestra resultados. Cada cambio de consulta o de página dispara la
 * petición; las anteriores se cancelan con AbortController para que una
 * respuesta lenta no pise a una más nueva.
 *
 * El estado de carga no se guarda en useState (evita setState dentro de un
 * effect): se deriva comparando si lo que tenemos en pantalla corresponde a
 * la consulta y página actuales.
 */
function useJugadores() {
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (consulta === null) return;

    const controller = new AbortController();

    fetchJugadores(consulta, pagina, controller.signal)
      .then((datos) => {
        setResultado({ consulta, pagina, datos });
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Error al buscar jugadores");
      });

    return () => controller.abort();
  }, [consulta, pagina]);

  // Intro en la caja: nueva consulta desde la página 1. Si la consulta y la
  // página no cambian, React no reejecuta el effect y no se repite la petición.
  const buscar = useCallback(() => {
    setError(null);
    setConsulta(busqueda.trim());
    setPagina(1);
  }, [busqueda]);

  const irAPagina = useCallback((destino: number) => {
    setError(null);
    setPagina(Math.max(1, destino));
  }, []);

  // En pantalla solo cuenta lo que corresponde a la consulta actual: así una
  // respuesta vieja nunca se muestra bajo un texto nuevo. Al paginar dentro
  // de la misma consulta se sigue viendo la página anterior (atenuada) hasta
  // que llega la nueva.
  const datosDeLaConsulta =
    resultado !== null && resultado.consulta === consulta;
  const cargando =
    consulta !== null &&
    error === null &&
    (resultado === null ||
      resultado.consulta !== consulta ||
      resultado.pagina !== pagina);

  const jugadores: Jugador[] = datosDeLaConsulta ? resultado.datos.jugadores : [];
  const total = datosDeLaConsulta ? resultado.datos.total : 0;
  const totalPaginas = Math.max(1, Math.ceil(total / JUGADORES_POR_PAGINA));

  const rango = useMemo(() => {
    if (total === 0) return { desde: 0, hasta: 0 };
    const desde = (pagina - 1) * JUGADORES_POR_PAGINA + 1;
    return { desde, hasta: Math.min(desde + JUGADORES_POR_PAGINA - 1, total) };
  }, [pagina, total]);

  return {
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
  };
}

export default useJugadores;
