# React + TypeScript + Vite

Soccer Index by: JDMP3 🍊








🧑‍💼 Return completo de la aplicación: 


```js







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
        <NewsCard
          title="Máxima Exhibición de Futbol 5-4"
          description="el dia 28/04/2026 se jugó la semifinal de la UEFA CHAMPIONS LEAGUE el partido del FC Bayern Munich vs Paris Saint Germain, dió una increible demostración de lo que es el máximo nivel en este deporte."
          image={imagenNoticia}
        />
        <NewsCard
          title="Empate de Mrd"
          description="Como era de esperarse el partido de Atletico de Madrid vs Arsenal, fué extremadamente aburrido, hubo 6 tiros a puerta nomás, 4 paradas de portero pff y los unicos dos goles del partido fueron de penal, un partido completamente para el olvido y la vuelta va a ser mucho peor."
          image={imagenHaramball}
        />
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
            {!clubSeleccionado && !paisSeleccionado && <div className="info-panel" />}
          </div>
        </div>
        <CompetitionsGrid />
      </main>
    </div>


```

















































```js

window.scrollTo( top:numero , left:numero , behavior:string)  🇮🇱 👎





```

```js



Las Pansas



```
