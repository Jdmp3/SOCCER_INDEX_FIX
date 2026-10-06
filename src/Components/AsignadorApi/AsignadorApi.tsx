import { useEffect, useState } from "react";
import NewsCard from "../NewsCard/NewsCard";

// Estas son las noticias de nuestra propia API en Go (carpeta server/).
// El backend consulta los RSS de MARCA y BBC, asi que no hace falta ninguna
// clave de API ni archivo .env en el frontend.
const URL_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/noticias`
  : "/api/noticias";

interface Articulo {
  titulo: string;
  descripcion: string;
  imagen: string;
  link: string;
  fuente: string;
  fecha: string;
}

interface Respuesta {
  articulos: Articulo[];
  aviso: string;
}

function AsignadorApi() {
  const [noticias, setNoticias] = useState<Articulo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Controlador para cancelar la peticion si el componente se desmonta antes
    // de que responda el backend.
    const controlador = new AbortController();

    fetch(URL_API, { signal: controlador.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        return res.json();
      })
      .then((data: Respuesta) => {
        const articulos = data.articulos ?? [];
        if (articulos.length > 0) {
          setNoticias(articulos);
        } else {
          // El backend responde 200 con lista vacia y un aviso cuando ninguna
          // fuente tiene noticias; lo mostramos tal cual.
          setError(
            data.aviso || "No hay noticias disponibles en este momento.",
          );
        }
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        console.warn("Error consultando la API de noticias:", err);
        setError(
          "No se pudo conectar con el servidor de noticias. ¿Está el backend (server/) corriendo?",
        );
      })
      .finally(() => setLoading(false));

    return () => controlador.abort();
  }, []);

  if (loading) {
    return (
      <div>
        <NewsCard key="skeleton-1" loading />
        <NewsCard key="skeleton-2" loading />
      </div>
    );
  }

  if (error) {
    return <div className="ErrorUiNews">{error}</div>;
  }

  return (
    <div>
      {noticias.map((noticia) => (
        <NewsCard
          key={noticia.link || noticia.titulo}
          title={noticia.titulo}
          description={noticia.descripcion}
          image={noticia.imagen}
          link={noticia.link}
          fuente={noticia.fuente}
          fecha={noticia.fecha}
        />
      ))}
    </div>
  );
}

export default AsignadorApi;
