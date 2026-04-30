import { useRef, useState, useEffect } from "react";
import paises from "../data/paises.json";

const flagEmojis: Record<string, string> = {
  España: "🇪🇸",
  Colombia: "🇨🇴",
  Italia: "🇮🇹",
  Inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Alemania: "🇩🇪",
  Francia: "🇫🇷",
  Turquía: "🇹🇷",
  Argentina: "🇦🇷",
  Marruecos: "🇲🇦",
  Brasil: "🇧🇷",
  Paraguay: "🇵🇾",
};

function PaisSelector() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [imagenesCargadas, setImagenesCargadas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    paises.forEach((pais) => {
      const img = new Image();
      img.src = `/Images/Flags/${pais}.png`;
      img.onload = () => {
        setImagenesCargadas((prev) => ({ ...prev, [pais]: true }));
      };
      img.onerror = () => {
        setImagenesCargadas((prev) => ({ ...prev, [pais]: false }));
      };
    });
  }, []);

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

  return (
    <div
      className="pais-selector"
      ref={scrollRef}
      onMouseDown={handleMouseDown}
    >
      {paises.map((pais) => (
        <div key={pais} className="pais-item">
          {imagenesCargadas[pais] ? (
            <img
              src={`/Images/Flags/${pais}.png`}
              alt={pais}
              className="pais-flag"
            />
          ) : (
            <span className="pais-emoji">{flagEmojis[pais]}</span>
          )}
          <span className="pais-nombre">{pais}</span>
        </div>
      ))}
    </div>
  );
}

export default PaisSelector;