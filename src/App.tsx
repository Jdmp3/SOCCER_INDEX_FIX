import "./index.css";
import "./App.css";
import PlayersSection from "./Components/PlayersGrid";
import Navbar from "./Components/Navbar/Navbar";
import TeamsGrid from "./Components/TeamsGrid/TeamsGrid";
import CompetitionsGrid from "./Components/CompetitionsGrid/CompetitionsGrid";
import AsignadorApi from "./Components/AsignadorApi/AsignadorApi";
import Footer from "./Components/Footer/Footer";
import LeyendasChispas from "./Components/LeyendasChispas";
import { useEffect, useRef, useState } from "react";

const buttons = [
  { label: "INICIO", action: "inicio" },
  { label: "JUGADORES ACTUALES", action: "buscador" },
  { label: "EQUIPOS", action: "equipos" },
  { label: "LEYENDAS", action: "leyendas" },
  { label: "COMPETICIONES", action: "competiciones" },
];

function App() {
  const [leyendasVisible, setLeyendasVisible] = useState(false);
  const [leyendasParticulasActivas, setLeyendasParticulasActivas] = useState(false);
  const leyendasRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = leyendasRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setLeyendasVisible(entry.isIntersecting);
        if (!entry.isIntersecting) setLeyendasParticulasActivas(false);
      },
      { threshold: 0.15 },
    );
    observer.observe(section);
    return () => observer.disconnect();
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
        const sectionTop =
          leyendasSection.getBoundingClientRect().top + window.scrollY;
        const navbarHeight =
          document.querySelector(".navbar")?.getBoundingClientRect().height ?? 0;
        const visibleHeight = window.innerHeight - navbarHeight;
        const centeredTop =
          sectionTop - navbarHeight - (visibleHeight - leyendasSection.offsetHeight) / 2;
        window.scrollTo({
          top: centeredTop,
          behavior: "smooth",
        });
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
          <h1>
            <img src="/Images/TitleIndex.png" alt="JDMP3's INDEX" />
          </h1>
          <p className="text-body">
            Index creado por mi para aprender sobre diferentes jugadores,
            equipos, leyendas y competiciones del mundo del Fútbol.
            <br /> En la barra de navegación de arriba podrás desplazarte en la
            página.
          </p>
        </div>
        <AsignadorApi />
        <PlayersSection id="buscador" />
        <TeamsGrid />
        <section
          id="leyendas"
          ref={leyendasRef}
          className={`leyendas-container${leyendasVisible ? " visible" : ""}${leyendasParticulasActivas ? " particulas-activas" : ""}`}
          aria-label="Leyendas"
        >
          <LeyendasChispas />
          <div
            className="leyendas-lineas"
            aria-hidden="true"
            onTransitionEnd={(event) => {
              const terminoSeparacion =
                event.propertyName === "gap" || event.propertyName === "row-gap";
              if (
                event.target === event.currentTarget &&
                terminoSeparacion &&
                leyendasVisible
              ) {
                setLeyendasParticulasActivas(true);
              }
            }}
          >
            <span className="leyendas-linea leyendas-linea-superior" />
            <span className="leyendas-linea leyendas-linea-inferior" />
          </div>
          <p className="leyendas-mensaje" aria-live="polite">
            Trabajo en Progreso :)
          </p>
        </section>
        <CompetitionsGrid />
      </main>
      <Footer />
    </div>
  );
}

export default App;
