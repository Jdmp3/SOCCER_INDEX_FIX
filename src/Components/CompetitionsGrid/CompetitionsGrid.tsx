import { useState, type CSSProperties } from "react";
import competitions from "../../data/competitions.json";
import { PUNTOS_FIJOS, type PuntoMapa } from "../../data/mapPoints";
import styles from "./CompetitionsGrid.module.css";

// JSON de competiciones conservado para cuando se reactive la información interna.
void competitions;

interface Winner {
  año: number;
  equipo: string;
}

interface Competition {
  id: number;
  nombre: string;
  color: string;
  colorTexto: string;
  colorBorde: string;
  annoInicio: number;
  ganadores: Winner[];
}

/** Poner en true para volver a mostrar la información interna (ganadores). */
const MOSTRAR_INFO: boolean = false;

function estilosPuntoHijo(
  hijo: PuntoMapa,
  centro: PuntoMapa | undefined,
): CSSProperties {
  const escalaX = 2.5;
  const escalaY = 1.5;
  const ajustesMoviles: Record<string, { x: number; y: number }> = {
    mexico: { x: 0, y: 9 },
    colombia: { x: -6, y: 0 },
    brasil: { x: -6, y: 0 },
    argentina: { x: -10, y: 0 },
    espana: { x: 4, y: 6 },
    italia: { x: 4, y: 6 },
    inglaterra: { x: 4, y: 0 },
  };
  const ajuste = ajustesMoviles[hijo.id] ?? { x: 0, y: 0 };
  const mobileX = centro
    ? Math.min(
        90,
        Math.max(10, centro.x + (hijo.x - centro.x) * escalaX + ajuste.x),
      )
    : hijo.x;
  const mobileY = centro
    ? Math.min(
        84,
        Math.max(10, centro.y + (hijo.y - centro.y) * escalaY + ajuste.y),
      )
    : hijo.y;

  return {
    "--punto-x": `${hijo.x}%`,
    "--punto-y": `${hijo.y}%`,
    "--punto-x-mobile": `${mobileX}%`,
    "--punto-y-mobile": `${mobileY}%`,
  } as CSSProperties;
}

function CompetitionsGrid() {
  const [competicionSeleccionada, setCompeticionSeleccionada] = useState<Competition | null>(null);

  // Continente desplegado: "europa" | "america" | null (exclusivo).
  const [continenteActivo, setContinenteActivo] = useState<string | null>(null);
  // Ids de logos que no se cargaron todavía (se muestran las iniciales).
  const [logosRotos, setLogosRotos] = useState<string[]>([]);

  const seleccionarCompeticion = (competicion: Competition) => {
    setCompeticionSeleccionada(competicion);
  };
  // Lógica de selección conservada para cuando se reactive la información interna.
  void seleccionarCompeticion;

  const alternarContinente = (id: string) => {
    setContinenteActivo((prev) => (prev === id ? null : id));
  };

  const marcarLogoRoto = (id: string) => {
    setLogosRotos((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  // Hijos del continente abierto (solo uno a la vez).
  const continenteSeleccionado = PUNTOS_FIJOS.find(
    (punto) => punto.id === continenteActivo,
  );
  const hijosVisibles = continenteSeleccionado?.hijos ?? [];

  return (
    <div id="competiciones" className={styles.container}>
      <h2 className={styles.titulo}>COMPETICIONES</h2>

      <div className={styles.mapaWrap}>
        <img
          className={styles.mapa}
          src="/Images/AtlasNeon.jpeg"
          alt="Mapa mundial Atlas Neon"
        />
        <svg
          className={styles.rutas}
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[
            { d: "M -160 0 C 280 180 920 180 1360 0", dur: "28s" },
            { d: "M -160 145 C 280 325 920 325 1360 145", dur: "25s" },
            { d: "M -160 290 C 280 470 920 470 1360 290", dur: "22s" },
            { d: "M -160 435 C 280 615 920 615 1360 435", dur: "19s" },
            { d: "M -160 580 C 280 760 920 760 1360 580", dur: "16s" },
          ].map((ruta, index) => (
            <g key={ruta.d}>
              <path className={styles.rutaBase} d={ruta.d} />
              <path
                className={styles.rutaMovimiento}
                d={ruta.d}
                pathLength="1000"
                style={{ animationDuration: ruta.dur, animationDelay: `${index * -5}s` }}
              />
            </g>
          ))}
          {[
            { d: "M 240 -100 C 40 200 40 600 240 900", dur: "27s", centro: false },
            { d: "M 400 -100 C 310 200 310 600 400 900", dur: "24s", centro: false },
            { d: "M 600 -100 L 600 900", dur: "21s", centro: true },
            { d: "M 800 -100 C 890 200 890 600 800 900", dur: "24s", centro: false },
            { d: "M 960 -100 C 1160 200 1160 600 960 900", dur: "27s", centro: false },
          ].map((linea, index) => (
            <g
              key={linea.d}
              className={linea.centro ? styles.meridianoCentro : undefined}
            >
              <path className={styles.rutaBase} d={linea.d} />
              <path
                className={styles.rutaMovimiento}
                d={linea.d}
                pathLength="1000"
                style={{ animationDuration: linea.dur, animationDelay: `${index * -4}s` }}
              />
            </g>
          ))}
        </svg>

        {/* Puntos fijos: Europa y América siempre; sus países al pulsar. */}
        <div className={styles.fijos}>
          {PUNTOS_FIJOS.map((punto) => (
            <button
              key={punto.id}
              type="button"
              className={`${styles.puntoRaiz} ${continenteActivo === punto.id ? styles.puntoRaizAbierto : ""}`}
              style={{ left: `${punto.x}%`, top: `${punto.y}%` }}
              onClick={() => alternarContinente(punto.id)}
              aria-expanded={continenteActivo === punto.id}
              aria-label={punto.nombre}
              title={punto.nombre}
            >
              <span className={styles.puntoRaizNucleo}>
                {!logosRotos.includes(punto.id) && (
                  <img
                    className={styles.logoRaiz}
                    src={punto.logo}
                    alt=""
                    onError={() => marcarLogoRoto(punto.id)}
                  />
                )}
              </span>
              <span className={styles.puntoRaizEtiqueta}>{punto.nombre}</span>
            </button>
          ))}

          {hijosVisibles.map((hijo, index) => (
            <button
              key={hijo.id}
              type="button"
              className={styles.puntoHijo}
              style={{
                ...estilosPuntoHijo(hijo, continenteSeleccionado),
                animationDelay: `${index * 70}ms`,
              }}
              aria-label={hijo.nombre}
              title={hijo.nombre}
            >
              {logosRotos.includes(hijo.id) ? (
                <span className={styles.logoFallback}>{hijo.iniciales}</span>
              ) : (
                <img
                  className={styles.logo}
                  src={hijo.logo}
                  alt=""
                  onError={() => marcarLogoRoto(hijo.id)}
                />
              )}
              <span className={styles.puntoHijoNombre}>{hijo.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {MOSTRAR_INFO && (
        <div
          className={styles.panel}
          style={{
            backgroundColor: competicionSeleccionada ? competicionSeleccionada.color : "#0a1330",
            borderColor: competicionSeleccionada ? competicionSeleccionada.colorBorde : "rgba(12, 108, 240, 0.7)",
            borderWidth: competicionSeleccionada ? "3px" : "1px",
          }}
        >
          {competicionSeleccionada ? (
            <>
              <h3
                className={styles.panelTitle}
                style={{ color: competicionSeleccionada.colorTexto }}
              >
                {competicionSeleccionada.nombre}
              </h3>
              <ul className={styles.lista} style={{ color: competicionSeleccionada.colorTexto }}>
                {competicionSeleccionada.ganadores.map((winner, index) => (
                  <li key={index} className={styles.listaItem}>
                    {winner.año}: <strong>{winner.equipo}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.panelVacio}>
              Selecciona una competición para ver los ganadores
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CompetitionsGrid;
