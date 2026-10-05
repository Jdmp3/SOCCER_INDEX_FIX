import { useState } from "react";
import styles from "./PlayersGrid.module.css";

interface Jugador {
  id: number;
  nombre: string;
  posicion: string;
  valorMercado: string;
  altura: string;
  edad: number;
  pais: string;
  liga: string;
  equipo: string;
}

interface PlayersSectionProps {
  id?: string;
}

function PlayersSection({ id }: PlayersSectionProps) {
  // Datos temporales (solo para diseño)
  const jugadores: Jugador[] = [
    {
      id: 1,
      nombre: "David de Gea",
      posicion: "Portero",
      valorMercado: "€15M",
      altura: "1.92m",
      edad: 35,
      pais: "España",
      liga: "Serie A",
      equipo: "Fiorentina",
    },
    {
      id: 2,
      nombre: "Moise Kean",
      posicion: "Delantero",
      valorMercado: "€40M",
      altura: "1.83m",
      edad: 26,
      pais: "Italia",
      liga: "Serie A",
      equipo: "Fiorentina",
    },
    {
      id: 3,
      nombre: "Harry Kane",
      posicion: "Delantero",
      valorMercado: "€90M",
      altura: "1.88m",
      edad: 32,
      pais: "Inglaterra",
      liga: "Bundesliga",
      equipo: "Bayern Munich",
    },
  ];

  // El array no se usa todavía: el buscador es un scaffold a la espera de
  // conectar el filtrado. `void` lo referencia en sitio para que no salte
  // noUnusedLocals (tsc) ni no-unused-vars (ESLint). Quitar al filtrar.
  void jugadores;

  // Estados para cada criterio de filtrado (beta - solo escritura)
  const [nombre, setNombre] = useState("");
  const [posicion, setPosicion] = useState("");
  const [valorMercado, setValorMercado] = useState("");
  const [altura, setAltura] = useState("");
  const [edad, setEdad] = useState("");
  const [pais, setPais] = useState("");
  const [liga, setLiga] = useState("");
  const [equipo, setEquipo] = useState("");

  return (
    <div id={id} className={styles.container}>
      <div className={styles.filtersGrid}>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Nombre</label>
          <input
            type="text"
            className={styles.filterInput}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Posición</label>
          <input
            type="text"
            className={styles.filterInput}
            value={posicion}
            onChange={(e) => setPosicion(e.target.value)}
            placeholder="Buscar por posición..."
          />
        </div>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Valor de Mercado</label>
          <input
            type="text"
            className={styles.filterInput}
            value={valorMercado}
            onChange={(e) => setValorMercado(e.target.value)}
            placeholder="Ej. €50M..."
          />
        </div>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Altura</label>
          <input
            type="text"
            className={styles.filterInput}
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            placeholder="Ej. 1.85m..."
          />
        </div>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Edad</label>
          <input
            type="text"
            className={styles.filterInput}
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            placeholder="Buscar por edad..."
          />
        </div>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>País</label>
          <input
            type="text"
            className={styles.filterInput}
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            placeholder="Buscar por país..."
          />
        </div>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Liga</label>
          <input
            type="text"
            className={styles.filterInput}
            value={liga}
            onChange={(e) => setLiga(e.target.value)}
            placeholder="Buscar por liga..."
          />
        </div>
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Equipo</label>
          <input
            type="text"
            className={styles.filterInput}
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
            placeholder="Buscar por equipo..."
          />
        </div>
      </div>
    </div>
  );
}

export default PlayersSection;
