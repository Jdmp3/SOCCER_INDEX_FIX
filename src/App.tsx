import "./index.css";
import "./App.css";
import PlayersSection from "./Components/PlayersGrid";
import Navbar from "./Components/Navbar/Navbar";
import TeamsGrid from "./Components/TeamsGrid/TeamsGrid";
import CompetitionsGrid from "./Components/CompetitionsGrid/CompetitionsGrid";
import AsignadorApi from "./Components/AsignadorApi/AsignadorApi";
import LeyendasChispas from "./Components/LeyendasChispas";
import { useEffect, useRef, useState } from "react";

const buttons = [
  { label: "INICIO", action: "inicio" },
  { label: "JUGADORES ACTUALES", action: "buscador" },
  { label: "EQUIPOS", action: "equipos" },
  { label: "LEYENDAS", action: "leyendas" },
  { label: "COMPETICIONES", action: "competiciones" },
];

const leyendas = [
  { num: "01", titulo: "El Milagro de Estambul", anio: "2005" },
  { num: "02", titulo: "La primera Champions del Barça", anio: "1992" },
  { num: "03", titulo: "Leverkusen Finalista de Champions", anio: "2002" },
];

function App() {
  const [fuegoLeyendas, setFuegoLeyendas] = useState(false);
  const fuegoTimer = useRef<number | null>(null);

  // Enciende el efecto y programa su apagado a los 3.2 segundos
  const encenderFuego = () => {
    if (fuegoTimer.current) window.clearTimeout(fuegoTimer.current);
    setFuegoLeyendas(true);
    fuegoTimer.current = window.setTimeout(
      () => setFuegoLeyendas(false),
      3200
    );
  };

  useEffect(() => {
    return () => {
      if (fuegoTimer.current) window.clearTimeout(fuegoTimer.current);
    };
  }, []);

  const handleNavClick = (action: string) => {
    if (action === "inicio") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (action === "buscador") {
      const buscador = document.getElementById("buscador");
      if (buscador) {
        window.scrollTo({ top: buscador.offsetTop - 100, behavior: "smooth" });
      }
    } else if (action === "equipos") {
      const equipos = document.getElementById("equipos");
      if (equipos) {
        window.scrollTo({ top: equipos.offsetTop - 100, behavior: "smooth" });
      }
    } else if (action === "leyendas") {
      const leyendasSection = document.getElementById("leyendas");
      if (leyendasSection) {
        window.scrollTo({
          top: leyendasSection.offsetTop - 180,
          behavior: "smooth",
        });
      }
      encenderFuego();
    } else if (action === "competiciones") {
      const competiciones = document.getElementById("competiciones");
      if (competiciones) {
        window.scrollTo({
          top: competiciones.offsetTop - 100,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div>
      <Navbar buttons={buttons} onNavClick={handleNavClick} />
      <main className="main-content">
        <div className="header-title">
          <h1>
            <img src="/Images/TitleIndex.png" alt="JDMP3's INDEX" />
          </h1>
          <p>
            [Index creado personalmente por mi sobre equipos, jugadores,
            competiciones e historias sobre el futbol que me gustan mucho]
          </p>
        </div>
        <AsignadorApi />
        <PlayersSection id="buscador" />
        <TeamsGrid />
        <div id="leyendas" className="leyendas-container">
          <img
            src="/Images/FenixParaLeyendas.png"
            alt=""
            className={`fenix ${fuegoLeyendas ? "visible" : ""}`}
          />
          <div className={`leyendas-marco${fuegoLeyendas ? " fuego" : ""}`}>
            <LeyendasChispas activo={fuegoLeyendas} />
            <h2 className="leyendas">LEYENDAS</h2>
            <div className="leyendas-grid">
              {leyendas.map((leyenda) => (
                <article
                  key={leyenda.num}
                  className="leyenda-card"
                  tabIndex={0}
                >
                  <span className="leyenda-num">{leyenda.num}</span>
                  <h3 className="leyenda-titulo">{leyenda.titulo}</h3>
                  <span className="leyenda-anio">{leyenda.anio}</span>
                  <span className="leyenda-linea" />
                </article>
              ))}
            </div>
          </div>
        </div>
        <CompetitionsGrid />
      </main>
    </div>
  );
}

export default App;
