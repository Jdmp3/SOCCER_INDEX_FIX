import { useEffect, useState } from "react";
import NewsCard from "../NewsCard/NewsCard";

interface Article {
  title: string;
  description: string;
  image: string;
}

function AsignadorApi() {
  const [noticias, setNoticias] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `https://gnews.io/api/v4/search?q=futbol&token=${import.meta.env.VITE_GNEWS_API_FOOTBALL}&lang=es`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.articles?.length > 0) {
          setNoticias(data.articles);
        } else {
          setError("No hay noticias disponibles en este momento.");
        }
      })
      .catch((err) => {
        console.warn("Error fetching news:", err);
        setError("No se pudieron cargar las noticias. Intenta más tarde.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="ErrorUiNews">
        Cargando noticias...
      </div>
    );
  }

  if (error) {
    return <div className="ErrorUiNews">{error}</div>;
  }

  return (
    <div>
      {noticias.map((noticia, index) => (
        <NewsCard
          key={index}
          title={noticia.title}
          description={noticia.description || ""}
          image={noticia.image || ""}
        />
      ))}
    </div>
  );
}

export default AsignadorApi;