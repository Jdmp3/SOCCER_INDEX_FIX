# React + TypeScript + Vite

Soccer Index by: JDMP3 🍊








🧑‍💼 Return completo de la aplicación: 


```js







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
      </main>
    </div>



```

















































```js

window.scrollTo( top:numero , left:numero , behavior:string)  🇮🇱 👎





```

```js



Las Pansas



```
