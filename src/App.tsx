import "./index.css";
import "./App.css";
import SearchBar from "./Components/SearchBar";
import Navbar from "./Components/Navbar/Navbar";
import TeamsGrid from "./Components/TeamsGrid/TeamsGrid";
import PaisSelector from "./Components/PaisSelector";
import ClubSelector from "./Components/ClubSelector";
import InfoCard from "./Components/InfoCard";
import CompetitionsGrid from "./Components/CompetitionsGrid/CompetitionsGrid";
import AsignadorApi from "./Components/AsignadorApi/AsignadorApi";
import paisesInfo from "./data/paisesInfo.json";
import clubesInfo from "./data/clubesInfo.json";
import { useState } from "react";

const buttons = [
  { label: "INICIO", action: "inicio" },
  { label: "JUGADORES ACTUALES", action: "buscador" },
  { label: "EQUIPOS", action: "equipos" },
  { label: "LEYENDAS", action: "leyendas" },
  { label: "COMPETICIONES", action: "competiciones" },
];

function App() {
  const [mostrarFenix, setMostrarFenix] = useState<boolean>(false);
  const [paisSeleccionado, setPaisSeleccionado] = useState<string>("");
  const [clubSeleccionado, setClubSeleccionado] = useState<string | null>(null);

  const handlePaisSelect = (pais: string) => {
    setPaisSeleccionado(pais);
    setClubSeleccionado(null);
  };

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
      const leyendas = document.getElementById("leyendas");
      if (leyendas) {
        window.scrollTo({ top: leyendas.offsetTop - 380, behavior: "smooth" });
        setTimeout(() => setMostrarFenix(true), 700);
        setTimeout(() => setMostrarFenix(false), 4000);
      }
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
          <h1>JDMP3&apos;s INDEX</h1>
          <p>
            [Index creado personalmente por mi sobre equipos, jugadores,
            competiciones e historias sobre el futbol que me gustan mucho]
          </p>
        </div>
        <AsignadorApi />
        <SearchBar id="buscador" />
        <TeamsGrid />
        <div id="leyendas" className="leyendas-container">
          <img
            src="/Images/fenixLeyenda.png"
            alt="Fénix"
            className={`fenix ${mostrarFenix ? "visible" : ""}`}
          />
          <h2 className="leyendas">LEYENDAS</h2>
          <div className="MiniIndexLeyendas">
            <h3 className="pais-titulo">
              Selecciona un país para buscar sus Leyendas:
            </h3>
            <PaisSelector onSelect={handlePaisSelect} />
            <h3
              className={`pais-titulo ${!paisSeleccionado ? "disabled" : ""}`}
            >
              (Opcional) Selecciona Un Club:
            </h3>
            {paisSeleccionado && (
              <ClubSelector
                key={paisSeleccionado}
                pais={paisSeleccionado}
                onSelect={setClubSeleccionado}
              />
            )}
            {clubSeleccionado && (
              <InfoCard
                titulo={clubSeleccionado}
                descripcion={
                  clubesInfo.find((c) => c.nombre === clubSeleccionado)
                    ?.descripcion || ""
                }
                titulos={
                  clubesInfo.find((c) => c.nombre === clubSeleccionado)
                    ?.titulos || 0
                }
              />
            )}
            {!clubSeleccionado && paisSeleccionado && (
              <InfoCard
                titulo={paisSeleccionado}
                descripcion={
                  paisesInfo.find((p) => p.nombre === paisSeleccionado)
                    ?.descripcion || ""
                }
                titulos={
                  paisesInfo.find((p) => p.nombre === paisSeleccionado)
                    ?.titulos || 0
                }
              />
            )}
            {!clubSeleccionado && !paisSeleccionado && (
              <div className="info-panel" />
            )}
          </div>
        </div>
        <CompetitionsGrid />
      </main>
    </div>
  );
}

export default App;
