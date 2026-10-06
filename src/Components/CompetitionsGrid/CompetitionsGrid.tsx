import { useMemo, useState } from "react";
import competitions from "../../data/competitions.json";
import { PUNTOS_FIJOS } from "../../data/mapPoints";
import { WORLD_MASK } from "../../data/worldMask";
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

/** Cantidad de puntos rojos sobre el mapa. */
const NUM_PUNTOS = 14;
/** Separación mínima entre puntos, en % del ancho del mapa. */
const SEPARACION_MIN = 7;
/** Intentos máximos de muestreo antes de rendirse. */
const INTENTOS_MAX = 5000;
/** Relación de aspecto del mapa (1200x896) para medir distancias reales. */
const ASPECTO = 896 / 1200;

interface Punto {
  x: number;
  y: number;
  retardo: string;
}

/** ¿Esta coordenada (en %) cae sobre tierra según la máscara del mapa? */
function esTierra(x: number, y: number): boolean {
  const ancho = WORLD_MASK[0]?.length ?? 0;
  if (ancho === 0) return false; // máscara aún no generada
  const gx = Math.floor((x / 100) * ancho);
  const gy = Math.floor((y / 100) * WORLD_MASK.length);
  const fila = WORLD_MASK[gy];
  if (!fila || gx < 0 || gx >= fila.length) return false;
  return fila[gx] === "1";
}

/** Elige posiciones aleatorias SOLO sobre zonas de tierra del mapamundi. */
function generarPuntos(): Punto[] {
  const puntos: Punto[] = [];
  let intentos = 0;

  while (puntos.length < NUM_PUNTOS && intentos < INTENTOS_MAX) {
    intentos++;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    if (!esTierra(x, y)) continue;

    const demasiadoCerca = puntos.some(
      (p) => Math.hypot(p.x - x, (p.y - y) * ASPECTO) < SEPARACION_MIN
    );
    if (demasiadoCerca) continue;

    puntos.push({ x, y, retardo: `${(Math.random() * 2.4).toFixed(2)}s` });
  }

  if (puntos.length === 0) {
    console.warn(
      "[CompetitionsGrid] Máscara vacía o sin tierra. Generarla arrancando el servidor: cd server && go run ."
    );
  }

  return puntos;
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

  // Nuevas posiciones en cada montaje (cada recarga de la página).
  const puntos = useMemo(() => generarPuntos(), []);

  // Hijos del continente abierto (solo uno a la vez).
  const hijosVisibles = PUNTOS_FIJOS.filter((punto) => punto.id === continenteActivo).flatMap(
    (punto) => punto.hijos ?? []
  );

  return (
    <div id="competiciones" className={styles.container}>
      <h2 className={styles.titulo}>COMPETICIONES</h2>

      <div className={styles.mapaWrap}>
        <img
          className={styles.mapa}
          src="/Images/AtlasNeon.jpeg"
          alt="Mapa mundial Atlas Neon"
        />
        <div className={styles.puntos}>
          {puntos.map((punto, index) => (
            <span
              key={index}
              className={styles.punto}
              style={{
                left: `${punto.x}%`,
                top: `${punto.y}%`,
                animationDelay: punto.retardo,
              }}
            />
          ))}
        </div>

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
                left: `${hijo.x}%`,
                top: `${hijo.y}%`,
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
