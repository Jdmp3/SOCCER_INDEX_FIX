import type { CSSProperties } from "react";

interface LeyendasChispasProps {
  activo: boolean;
}

const CHISPAS_POR_COSTADO = 28;

/**
 * Valores deterministas por índice (sin Math.random para que cada render
 * sea idéntico): posición vertical, distancia del vuelo, arco y retardo.
 * Retardos 0 - 2.39 s + duraciones 0.45 - 0.79 s → la última chispa
 * termina ≈ 3.18 s, sincronizada con el apagado del efecto (3.2 s).
 */
function datosChispa(indice: number, lado: string): CSSProperties {
  const variacion = (indice * 37) % 100;
  const top = 6 + ((indice * 61) % 88); // % de la altura del cuadro
  const dx = 120 + variacion; // px hacia afuera
  const dy = -30 + ((indice * 29) % 60); // arco leve
  const retardo = ((indice * 53) % 240) / 100; // 0 - 2.39 s
  const duracion = 0.45 + ((indice * 17) % 35) / 100; // 0.45 - 0.79 s

  return {
    top: `${top}%`,
    animationDelay: `${retardo}s`,
    animationDuration: `${duracion}s`,
    // La derecha viaja en sentido contrario
    ["--dx"]: `${lado === "izq" ? -dx : dx}px`,
    ["--dy"]: `${dy}px`,
  } as CSSProperties;
}

function LeyendasChispas({ activo }: LeyendasChispasProps) {
  return (
    <div className={`chispas${activo ? " activo" : ""}`} aria-hidden="true">
      <div className="chispa-columna chispa-izq">
        {Array.from({ length: CHISPAS_POR_COSTADO }, (_, i) => (
          <span
            key={`izq-${i}`}
            className="chispa"
            style={datosChispa(i, "izq")}
          />
        ))}
      </div>
      <div className="chispa-columna chispa-der">
        {Array.from({ length: CHISPAS_POR_COSTADO }, (_, i) => (
          <span
            key={`der-${i}`}
            className="chispa"
            style={datosChispa(i, "der")}
          />
        ))}
      </div>
    </div>
  );
}

export default LeyendasChispas;
