import { useState } from "react";
import competitions from "../../data/competitions.json";
import styles from "./CompetitionsGrid.module.css";

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

function CompetitionsGrid() {
  const [competicionSeleccionada, setCompeticionSeleccionada] = useState<Competition | null>(null);

  const seleccionarCompeticion = (competicion: Competition) => {
    setCompeticionSeleccionada(competicion);
  };

  return (
    <div id="competiciones" className={styles.container}>
      <h2 className={styles.titulo}>COMPETICIONES</h2>
      <div className={styles.grid}>
        {competitions.map((competicion: Competition) => (
          <div
            key={competicion.id}
            className={`${styles.card} ${competicionSeleccionada?.id === competicion.id ? styles.cardSelected : ""}`}
            style={{
              borderColor: competicionSeleccionada?.id === competicion.id ? competicion.colorBorde : undefined,
              backgroundColor: competicionSeleccionada?.id === competicion.id ? competicion.color : undefined,
            }}
            onClick={() => seleccionarCompeticion(competicion)}
          >
            <span
              className={styles.cardTitle}
              style={{
                color: competicionSeleccionada?.id === competicion.id ? competicion.colorTexto : competicion.color,
              }}
            >
              {competicion.nombre}
            </span>
          </div>
        ))}
      </div>

      <div
        className={styles.panel}
        style={{
          backgroundColor: competicionSeleccionada ? competicionSeleccionada.color : "#ffffff",
          borderColor: competicionSeleccionada ? competicionSeleccionada.colorBorde : "#cccccc",
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
    </div>
  );
}

export default CompetitionsGrid;