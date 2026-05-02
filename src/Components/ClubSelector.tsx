import { useRef, useState, useEffect } from "react";
import paises from "../data/paises.json";

interface Club {
  nombre: string;
  logo: string;
}

interface ClubSelectorProps {
  pais: string;
  onSelect?: (club: string | null) => void;
}

function ClubSelector({ pais, onSelect }: ClubSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [imagenesCargadas, setImagenesCargadas] = useState<Record<string, boolean>>({});
  const [clubSelected, setClubSelected] = useState<string | null>(null);

  const paisData = paises.find((p) => p.nombre === pais);
  const clubs: Club[] = paisData?.clubs || [];

  useEffect(() => {
    setClubSelected(null);
  }, [pais]);

  useEffect(() => {
    if (clubs.length === 0) return;
    
    clubs.forEach((club) => {
      const img = new Image();
      img.src = `/Images/Teams/${club.logo}`;
      img.onload = () => {
        setImagenesCargadas((prev) => ({ ...prev, [club.nombre]: true }));
      };
      img.onerror = () => {
        setImagenesCargadas((prev) => ({ ...prev, [club.nombre]: false }));
      };
    });
  }, [pais]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isDragging, startX, scrollLeft]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleClubClick = (club: string) => {
    const newClub = club === clubSelected ? null : club;
    setClubSelected(newClub);
    onSelect?.(newClub);
  };

  if (!pais || clubs.length === 0) {
    return null;
  }

  return (
    <div
      className="club-selector"
      ref={scrollRef}
      onMouseDown={handleMouseDown}
    >
      {clubs.map((club) => (
        <div
          key={club.nombre}
          className={`club-item ${clubSelected === club.nombre ? "selected" : ""}`}
          onClick={() => handleClubClick(club.nombre)}
        >
          {imagenesCargadas[club.nombre] ? (
            <img
              src={`/Images/Teams/${club.logo}`}
              alt={club.nombre}
              className="club-logo"
            />
          ) : (
            <span className="club-emoji">⚽</span>
          )}
          <span className="club-nombre">{club.nombre}</span>
        </div>
      ))}
    </div>
  );
}

export default ClubSelector;