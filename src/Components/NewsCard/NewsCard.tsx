interface NewsCardProps {
  loading?: boolean;
  title?: string;
  description?: string;
  image?: string;
}

function NewsCard({ loading, title, description, image }: NewsCardProps) {
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

  return (
    <div className="noticia">
      <div className="noticia-texto">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <img className="noticia-imagen" src={image} alt="Imagen de la noticia" />
    </div>
  );
}

export default NewsCard;
