import { useState } from "react";
import teams from "../../data/teams.json";
import styles from "./TeamsGrid.module.css";

interface Team {
  id: number;
  nombre: string;
  pais: string;
  descripcion: string;
  logo: string;
}

function TeamsGrid() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleTeam = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div id="equipos" className={styles.container}>
      <div className={styles.grid}>
        {teams.map((team: Team) => (
          <div key={team.id} className={styles.card}>
            <div
              className={styles.cardHeader}
              onClick={() => toggleTeam(team.id)}
            >
              <div className={styles.logoContainer}>
                <img
                  src={`./Images/Teams/${team.logo}`}
                  alt={`${team.nombre} logo`}
                  className={styles.logo}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className={styles.teamInfo}>
                <span className={styles.teamName}>{team.nombre}</span>
                <span className={styles.teamCountry}>{team.pais}</span>
              </div>
            </div>
            {expandedId === team.id && (
              <div className={styles.description}>
                <p>{team.descripcion}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamsGrid;