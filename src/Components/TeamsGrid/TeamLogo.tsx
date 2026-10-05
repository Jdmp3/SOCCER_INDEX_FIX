import { useState } from "react";
import { getTeamInitials } from "../../services/teams";
import type { Team } from "../../services/teams";
import styles from "./TeamsGrid.module.css";

interface TeamLogoProps {
  team: Team;
}

/**
 * Logo del equipo con fallback a iniciales.
 *
 * Cada tarjeta monta su propia instancia (la `key` es `team.id`), así que al
 * cambiar de página React remonta el componente y el estado de error se reinicia
 * solo: no hace falta useEffect para limpiarlo.
 */
function TeamLogo({ team }: TeamLogoProps) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div className={styles.logoFallback} aria-hidden="true">
        <span className={styles.logoFallbackText}>
          {getTeamInitials(team.nombre)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={`./Images/Teams/${team.logo}`}
      alt={`${team.nombre} logo`}
      className={styles.logo}
      onError={() => setFallo(true)}
    />
  );
}

export default TeamLogo;