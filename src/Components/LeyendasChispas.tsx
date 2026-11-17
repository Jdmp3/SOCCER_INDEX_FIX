import type { CSSProperties } from "react";

const PARTICULAS_POR_LADO = 24;

function estiloParticula(indice: number, lado: "superior" | "inferior"): CSSProperties {
  const x = (indice * 47 + 9) % 100;
  const duracion = 1.2 + ((indice * 13) % 18) / 10;
  const retardo = ((indice * 29) % 24) / 10;

  return {
    left: `${x}%`,
    animationDuration: `${duracion}s`,
    animationDelay: `${retardo}s`,
    ["--deriva"]: `${(lado === "superior" ? -1 : 1) * (8 + ((indice * 17) % 20))}px`,
  } as CSSProperties;
}

function LeyendasChispas() {
  return (
    <div className="leyendas-particulas" aria-hidden="true">
      {(["superior", "inferior"] as const).map((lado) => (
        <div className={`leyendas-particulas-${lado}`} key={lado}>
          {Array.from({ length: PARTICULAS_POR_LADO }, (_, indice) => (
            <span
              className="leyendas-particula"
              key={`${lado}-${indice}`}
              style={estiloParticula(indice, lado)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LeyendasChispas;
