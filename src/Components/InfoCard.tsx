interface InfoCardProps {
  titulo: string;
  descripcion: string;
  titulos: number;
  titulosLabel?: string;
}

function InfoCard({ titulo, descripcion, titulos, titulosLabel = "Títulos" }: InfoCardProps) {
  if (!titulo) return null;

  return (
    <div className="info-panel">
      <h3>{titulo}</h3>
      {descripcion && <p>{descripcion}</p>}
      {titulos > 0 && (
        <p className="titulos">{titulosLabel}: {titulos}</p>
      )}
    </div>
  );
}

export default InfoCard;