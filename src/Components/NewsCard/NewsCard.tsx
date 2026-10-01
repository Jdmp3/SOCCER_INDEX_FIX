interface NewsCardProps {
  loading?: boolean;
  title?: string;
  description?: string;
  image?: string;
  link?: string;
  fuente?: string;
  fecha?: string;
}

// formatea la fecha ISO que devuelve el backend (ej: 2026-10-01T00:08:59+02:00)
// como "1 oct 2026" sin depender de ninguna libreria.
function formatearFecha(iso: string): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";

  const meses = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

function NewsCard({
  loading,
  title,
  description,
  image,
  link,
  fuente,
  fecha,
}: NewsCardProps) {
  if (loading) {
    return (
      <div className="skeleton-news">
        <div className="skeleton-texto">
          <div className="skeleton-title"></div>
          <div className="skeleton-desc"></div>
        </div>
        <div className="skeleton-img"></div>
      </div>
    );
  }

  // El <a> envuelve toda la tarjeta para que sea clicable, pero sin link la
  // tarjeta se muestra como un div normal para no tener un ancla vacia.
  const contenido = (
    <>
      <div className="noticia-texto">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {(fuente || fecha) && (
          <div className="noticia-meta">
            {fuente && <span className="noticia-fuente">{fuente}</span>}
            {fecha && (
              <span className="noticia-fecha">{formatearFecha(fecha)}</span>
            )}
          </div>
        )}
      </div>
      {image && (
        <img className="noticia-imagen" src={image} alt={title || "Noticia"} />
      )}
    </>
  );

  if (link) {
    return (
      <a
        className="noticia noticia-link"
        href={link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {contenido}
      </a>
    );
  }

  return <div className="noticia">{contenido}</div>;
}

export default NewsCard;
