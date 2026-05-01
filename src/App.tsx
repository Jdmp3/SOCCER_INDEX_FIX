import "./index.css";
import imagenNoticia from "./Components/Images/PartidoHoy.jpeg";
import imagenHaramball from "./Components/Images/HaramballSimeone.jpeg";
import SearchBar from "./Components/SearchBar";
import Navbar from "./Components/Navbar/Navbar";
import TeamsGrid from "./Components/TeamsGrid/TeamsGrid";
import PaisSelector from "./Components/PaisSelector";
import ClubSelector from "./Components/ClubSelector";
import CompetitionsGrid from "./Components/CompetitionsGrid/CompetitionsGrid";
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
  const [mostrarFenix, setMostrarFenix] = useState(false);
  const [paisSeleccionado, setPaisSeleccionado] = useState("");
  const [clubSeleccionado, setClubSeleccionado] = useState<string | null>(null);

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
        window.scrollTo({ top: competiciones.offsetTop - 100, behavior: "smooth" });
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
        <div className="noticia">
          <div className="noticia-texto">
            <h2>Máxima Exhibición de Futbol 5-4</h2>
            <p>
              el dia 28/04/2026 se jugó la semifinal de la UEFA CHAMPIONS LEAGUE
              el partido del FC Bayern Munich vs Paris Saint Germain, dió una
              increible demostración de lo que es el máximo nivel en este
              deporte.
            </p>
          </div>
          <img
            className="noticia-imagen"
            src={imagenNoticia}
            alt="Imagen de la noticia"
          />
        </div>
        <div className="noticia">
          <div className="noticia-texto">
            <h2>Empate de Mrd</h2>
            <p>
              Como era de esperarse el partido de Atletico de Madrid vs Arsenal,
              fué extremadamente aburrido, hubo 6 tiros a puerta nomás, 4
              paradas de portero pff y los unicos dos goles del partido fueron
              de penal, un partido completamente para el olvido y la vuelta va a
              ser mucho peor.
            </p>
          </div>
          <img
            className="noticia-imagen"
            src={imagenHaramball}
            alt="Imagen de la noticia"
          />
        </div>
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
            <PaisSelector onSelect={setPaisSeleccionado} />
            <h3 className={`pais-titulo ${!paisSeleccionado ? "disabled" : ""}`}>
              (Opcional) Selecciona Un Club:
            </h3>
            {paisSeleccionado && (
              <ClubSelector pais={paisSeleccionado} onSelect={setClubSeleccionado} />
            )}
            {clubSeleccionado && (
              <div className="info-panel">
                <h3>{clubSeleccionado}</h3>
                <p>{clubesInfo.find((c) => c.nombre === clubSeleccionado)?.descripcion}</p>
                <p>Títulos: {clubesInfo.find((c) => c.nombre === clubSeleccionado)?.titulos}</p>
              </div>
            )}
            {!clubSeleccionado && paisSeleccionado && (
              <div className="info-panel">
                <h3>{paisSeleccionado}</h3>
                <p>{paisesInfo.find((p) => p.nombre === paisSeleccionado)?.descripcion}</p>
                <p>Títulos: {paisesInfo.find((p) => p.nombre === paisSeleccionado)?.titulos}</p>
              </div>
            )}
            {!clubSeleccionado && !paisSeleccionado && (
              <div className="info-panel"></div>
            )}
          </div>
        </div>
        <CompetitionsGrid />
      </main>
    </div>
  );
}

export default App;
