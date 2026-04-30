import "./index.css";
import imagenNoticia from "./Components/Images/PartidoHoy.jpeg";
import imagenHaramball from "./Components/Images/HaramballSimeone.jpeg";
import SearchBar from "./Components/SearchBar";
import TeamsGrid from "./Components/TeamsGrid/TeamsGrid";

const buttons = [
  { label: "INICIO", action: "inicio" },
  { label: "JUGADORES ACTUALES", action: "buscador" },
  { label: "EQUIPOS", action: "equipos" },
  { label: "LEYENDAS", action: "leyendas" },
  { label: "COMPETICIONES", action: "competiciones" },
];

function App() {
  const handleNavClick = (action: string) => {
    if (action === "inicio") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (action === "buscador") {
      const buscador = document.getElementById("buscador");
      if (buscador) {
        window.scrollTo({ top: buscador.offsetTop - 80, behavior: "smooth" });
      }
    } else if (action === "equipos") {
      const equipos = document.getElementById("equipos");
      if (equipos) {
        window.scrollTo({ top: equipos.offsetTop - 80, behavior: "smooth" });
      }
    }
  };

  return (
    <div>
      <nav className="navbar">
        {buttons.map((btn, index) => (
          <button
            key={index}
            className="nav-button"
            onClick={() => handleNavClick(btn.action)}
          >
            {btn.label}
          </button>
        ))}
      </nav>
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
              el dia de hoy 28/04/2026 se jugó la semifinal de la UEFA CHAMPIONS
              LEAGUE el partido del FC Bayern Munich vs Paris Saint Germain, dió
              una increible demostración de lo que es el máximo nivel en este
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
            <h2>Mañana Haramball</h2>
            <p>
              Mañana 29/04/2026 se viene el partido de los pechos frios de Atletico De
              Madrid vs Arsenal, un partido de Haramball sin precedentes, se esperan
              máximo 3 tiros a puerta en todo este partido.
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
      </main>
    </div>
  );
}

export default App;
