

  _____                        _____        __            _                 _____ _____                _____                           _        
 |  __ \                      |_   _|      / _|          | |          /\   |  __ \_   _|              |  __ \                         | |       
 | |__| |__  _ __   ___ _ __    | |  _ __ | |_ ___     __| | ___     /  \  | |__  || |     ___ _ __   | |__| | __ ___  _   _  ___  ___| |_ ___  
 |  ___/ _ \| '_ \ / _ \ '__|   | | | '_ \|  _/ _ \   / _` |/ _ \   / /\ \ |  ___/ | |    / _ \ '_ \  |  ___/ '__/ _ \| | | |/ _ \/ __| __/ _ \ 
 | |  | (_) | | | |  __/ |     _| |_| | | | || (_) | |  _| |  __/  / ____ \| |    _| |_  |  __/ | | | | |   | | | (_) | |_| |  __/ |__| || (_) |
 |_|   \___/|_| |_|\___|_|    |_____|_| |_|_| \___/   \__,_|\___| /_/    \_\_|   |_____|  \___|_| |_| |_|   |_|  \___/ \__, |\___|\___|\__\___/ 
                                                                                                                        __/ |                   
                                                                                                                       |___/                    


**Primero se realiza un fetch para que la pagina y la API devuelva los datos de la noticia**


const [noticias, setNoticias] = useState([]);

useEffect(() => {
  fetch('https://gnews.io/api/v4/top-headlines?token= "  API   " &lang=es')
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setNoticias(data.articles);
    });
}, []);




**Luego se reemplazan los textos por campos de la API **


- noticia.title → corresponde al h2 del proyecto, el titulo de la noticia.
- noticia.description → corresponde a la descripcion de la noticia, la información.
- noticia.image → src de la imagen.




{noticias.map((noticia, index) => (
  <div className="noticia" key={index}>
    <div className="noticia-texto">
      <h2>{noticia.title}</h2>
      <p>{noticia.description}</p>
    </div>

    <img
      className="noticia-imagen"
      src={noticia.image}
      alt={noticia.title}
    />
  </div>
))}




  ____                          _            
 |  _ \                        | |           
 | |_| |_   _ ___  ___ __ _  __| | ___  _ __ 
 |  _ <| | | / __|/ __/ _` |/ _` |/ _ \| '__|
 | |_| | |_| \__ \ |_| |_| | |_| | (_) | |   
 |____/ \__,_|___/\___\__,_|\__,_|\___/|_|   
                                             
                                             




**Es bastante similar, aqui toca tomar una API football**

export const APIFOOTBALL_KEY = "Api Sacada de pagina APIfootball"
export const APIFOOTBALL_BASE_URL = "https://apiv2.apifootball.com"


➡️➡️➡️➡️➡️ Esto se pone en un archivo nuevo ts o json puede ser ⬅️⬅️⬅️⬅️⬅️


**Se modifica la searchbar que ya está puesta en la página**

const [searchTerm, setSearchTerm] = useState("");
const [players, setPlayers] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (searchTerm.length >= 3) {
    setLoading(true);
    fetch(\`\${APIFOOTBALL_BASE_URL}/?action=get_players&player_name=\${searchTerm}&APIkey=\${APIFOOTBALL_KEY}\`)
      .then(res => res.json())
      .then(data => {
        const mappedPlayers = data.map((player: any) => ({
          id: player.player_key,
          nombre: player.player_name,
          posicion: player.player_type,
          equipo: player.team_name,
          nacionalidad: player.player_country,
          edad: player.player_age
        }));
        setPlayers(mappedPlayers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }
}, [searchTerm]);

return (
  <input
    type="text"
    placeholder="Buscar jugador..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  {loading ? (
    <p>Cargando...</p>
  ) : (
    players.map((player) => (
      <li key={player.id}>
        <span>{player.nombre}</span>
        <span>{player.posicion} • {player.equipo}</span>
        <span>{player.nacionalidad} {player.edad} años</span>
      </li>
    ))
  )}
);
