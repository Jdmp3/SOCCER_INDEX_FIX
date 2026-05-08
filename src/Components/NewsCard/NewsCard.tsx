interface NewsCardProps {
  title: string;
  description: string;
  image: string;
}

function NewsCard({ title, description, image }: NewsCardProps) {
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
