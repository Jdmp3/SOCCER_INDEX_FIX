import { useState, useMemo } from "react";
import players from "../data/players.json";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  id?: string;
}

function SearchBar({ id }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return players;
    const term = searchTerm.toLowerCase();
    return players.filter(
      (player) =>
        player.nombre.toLowerCase().includes(term) ||
        player.equipo.toLowerCase().includes(term) ||
        player.nacionalidad.toLowerCase().includes(term) ||
        player.posicion.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <div id={id} className={styles.container}>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar jugador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={styles.resultsContainer}>
        {filteredPlayers.length === 0 ? (
          <p className={styles.noResults}>No se encontraron jugadores</p>
        ) : (
          <ul className={styles.playerList}>
            {filteredPlayers.map((player) => (
              <li key={player.id} className={styles.playerCard}>
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>{player.nombre}</span>
                  <span className={styles.playerDetails}>
                    {player.posicion} • {player.equipo}
                  </span>
                </div>
                <div className={styles.playerExtra}>
                  <span className={styles.playerNationality}>
                    {player.nacionalidad}
                  </span>
                  <span className={styles.playerAge}>{player.edad} años</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SearchBar;