#!/usr/bin/env node
/**
 * Genera server/data/jugadores.json a partir del dataset público de EA FC 25
 * (junio 2025) y descarga las fotos de los jugadores de las ligas principales.
 *
 * Uso:
 *   node scripts/generar-jugadores.mjs             # datos + fotos
 *   node scripts/generar-jugadores.mjs --sin-fotos # solo genera el JSON
 *
 * Detalles:
 * - El CSV se cachea en scripts/datos/players-fc25.csv (se descarga una vez).
 * - Las fotos van a public/Images/Jugadores/<id>.webp. El proceso es
 *   reanudable: un archivo que ya existe no se vuelve a pedir, y si el CDN
 *   falla para un jugador, su foto queda vacía y la UI muestra las iniciales.
 * - Edad NO se guarda: el backend la calcula desde "nacimiento" en cada
 *   petición, para que los datos no envejezcan.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const URL_CSV =
  "https://raw.githubusercontent.com/datasosa/FC25_Player_Analysis/main/player-data-full-2025-june.csv";
const RUTA_CSV = path.join(RAIZ, "scripts/datos/players-fc25.csv");
const RUTA_JSON = path.join(RAIZ, "server/data/jugadores.json");
const CARPETA_FOTOS = path.join(RAIZ, "public/Images/Jugadores");

/** Ligas cuyos jugadores llevan foto descargada (los demás, con iniciales). */
const LIGAS_CON_FOTO = new Set([
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Primeira Liga",
  "Eredivisie",
  "Liga Profesional de Fútbol",
]);

/** Códigos de posición de FIFA → español. */
const POSICIONES_ES = {
  GK: "Portero",
  SW: "Líbero",
  CB: "Defensa central",
  LB: "Lateral izquierdo",
  RB: "Lateral derecho",
  LWB: "Carrilero izquierdo",
  RWB: "Carrilero derecho",
  CDM: "Mediocentro defensivo",
  LDM: "Mediocentro defensivo",
  CM: "Mediocentro",
  CAM: "Mediapunta",
  LM: "Interior izquierdo",
  RM: "Interior derecho",
  LW: "Extremo izquierdo",
  RW: "Extremo derecho",
  CF: "Segundo delantero",
  ST: "Delantero centro",
  LS: "Delantero izquierdo",
  RS: "Delantero derecho",
  LF: "Delantero izquierdo",
  RF: "Delantero derecho",
};

/**
 * Nombres de país en inglés (columna "country_name" y frase "national team")
 * Y demonimios en inglés (frase "is a Spanish footballer") → español.
 *
 * Nota sobre "British": el dataset usa "Scottish", "Welsh" y "Northern Irish"
 * para los demás países del Reino Unido, así que "British" corresponde a los
 * ingleses (Bellingham, Kane, Saka... aparecen todos como "British" y con
 * "England national team" cuando son internacionales).
 */
const PAISES_ES = {
  // Nombres de país (columna / "and the X national team")
  England: "Inglaterra",
  Scotland: "Escocia",
  Wales: "Gales",
  "Northern Ireland": "Irlanda del Norte",
  "Republic of Ireland": "Irlanda",
  Ireland: "Irlanda",
  Spain: "España",
  France: "Francia",
  Netherlands: "Países Bajos",
  Germany: "Alemania",
  Italy: "Italia",
  Portugal: "Portugal",
  Croatia: "Croacia",
  Czechia: "República Checa",
  Finland: "Finlandia",
  Denmark: "Dinamarca",
  Norway: "Noruega",
  Poland: "Polonia",
  Sweden: "Suecia",
  Iceland: "Islandia",
  Romania: "Rumanía",
  "United States": "Estados Unidos",
  Ghana: "Ghana",
  "New Zealand": "Nueva Zelanda",
  Ukraine: "Ucrania",
  Morocco: "Marruecos",
  Hungary: "Hungría",
  Mexico: "México",
  Argentina: "Argentina",

  // Demonimios de la descripción
  British: "Inglaterra",
  German: "Alemania",
  Spanish: "España",
  Argentine: "Argentina",
  French: "Francia",
  Brazilian: "Brasil",
  Italian: "Italia",
  Dutch: "Países Bajos",
  Norwegian: "Noruega",
  Swedish: "Suecia",
  Portuguese: "Portugal",
  Polish: "Polonia",
  Danish: "Dinamarca",
  Irish: "Irlanda",
  Belgian: "Bélgica",
  Korean: "Corea del Sur",
  Turkish: "Turquía",
  Romanian: "Rumanía",
  Austrian: "Austria",
  Chinese: "China",
  "Saudi Arabian": "Arabia Saudita",
  Scottish: "Escocia",
  Uruguayan: "Uruguay",
  Swiss: "Suiza",
  Colombian: "Colombia",
  Paraguayan: "Paraguay",
  Indian: "India",
  Croatian: "Croacia",
  Chilean: "Chile",
  Nigerian: "Nigeria",
  Moroccan: "Marruecos",
  Welsh: "Gales",
  Senegalese: "Senegal",
  Ghanaian: "Ghana",
  Ivorian: "Costa de Marfil",
  Ecuadorian: "Ecuador",
  Serbian: "Serbia",
  Venezuelan: "Venezuela",
  Peruvian: "Perú",
  Greek: "Grecia",
  Czech: "República Checa",
  Japanese: "Japón",
  Ukranian: "Ucrania",
  Bolivian: "Bolivia",
  "Northern Irish": "Irlanda del Norte",
  Cameroonian: "Camerún",
  Malian: "Malí",
  Algerian: "Argelia",
  Finnish: "Finlandia",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Icelandic: "Islandia",
  Albanian: "Albania",
  "New Zealand association": "Nueva Zelanda",
  Kosovan: "Kosovo",
  Slovak: "Eslovaquia",
  Slovenian: "Eslovenia",
  Hungarian: "Hungría",
  "Democratic Republic of the Congo": "República Democrática del Congo",
  Mexican: "México",
  Guinean: "Guinea",
  Gambian: "Gambia",
  Jamaican: "Jamaica",
  Tunisian: "Túnez",
  Qatari: "Catar",
  Angolan: "Angola",
  "Cape Verdean": "Cabo Verde",
  "Bissau-Guinean": "Guinea-Bisáu",
  Bulgarian: "Bulgaria",
  Montenegrin: "Montenegro",
  Macedonian: "Macedonia del Norte",
  Burkinabé: "Burkina Faso",
  Israeli: "Israel",
  Surinamese: "Surinam",
  Russian: "Rusia",
  Cypriot: "Chipre",
  Luxembourgian: "Luxemburgo",
  Emirati: "Emiratos Árabes Unidos",
  Comorian: "Comoras",
  "Republic of the Congo": "República del Congo",
  "Costa Rican": "Costa Rica",
  Togolese: "Togo",
  Azerbaijani: "Azerbaiyán",
  Iraqi: "Irak",
  Indonesian: "Indonesia",
  Zimbabwean: "Zimbabue",
  "Sierra Leonean": "Sierra Leona",
  Gabonese: "Gabón",
  Panamanian: "Panamá",
  Beninese: "Benín",
  Kenyan: "Kenia",
  "Curaçao": "Curazao",
  Syrian: "Siria",
  Egyptian: "Egipto",
  Haitian: "Haití",
  Moldovan: "Moldavia",
  "Dominican Republic": "República Dominicana",
  Zambian: "Zambia",
  Armenian: "Armenia",
  Iranian: "Irán",
  Equatoguinean: "Guinea Ecuatorial",
  Honduran: "Honduras",
  Mauritanian: "Mauritania",
  Latvian: "Letonia",
  Grenadian: "Granada",
  Lithuanian: "Lituania",
  "Central African Republic": "República Centroafricana",
  Maltese: "Malta",
  Guyanese: "Guyana",
  Estonian: "Estonia",
  Ugandan: "Uganda",
  Liberian: "Liberia",
  Uzbekistani: "Uzbekistán",
  Burundian: "Burundi",
  Malagasy: "Madagascar",
  Filipino: "Filipinas",
  Tanzanian: "Tanzania",
  "Saint Lucian": "Santa Lucía",
  "Trinidad and Tobago": "Trinidad y Tobago",
  Montserratian: "Montserrat",
  Jordanian: "Jordania",
  Guatemalan: "Guatemala",
  Palestinian: "Palestina",
  Belarusian: "Bielorrusia",
  Kazakhstani: "Kazajistán",
  Mozambican: "Mozambique",
  Libyan: "Libia",
  Cuban: "Cuba",
  Salvadoran: "El Salvador",
  "Saint Kitts and Nevis": "San Cristóbal y Nieves",
  Lebanese: "Líbano",
  Chadian: "Chad",
  "Sri Lankan": "Sri Lanka",
  Fijian: "Fiyi",
  "Antigua and Barbuda": "Antigua y Barbuda",
  Malawian: "Malaui",
  Barbadian: "Barbados",
  Faroese: "Islas Feroe",
  Bangladeshi: "Bangladés",
  Bermudian: "Bermudas",
  Nambian: "Namibia",
  Vanuatuan: "Vanuatu",
  Nigerien: "Níger",
  Andorran: "Andorra",
  Pakistani: "Pakistán",
  Rwandan: "Ruanda",
  Somalian: "Somalia",
  Tajikistani: "Tayikistán",
  "New Caledonian": "Nueva Caledonia",
  "Puerto Rican": "Puerto Rico",
  Sudanese: "Sudán",
};

const CABECERAS_FOTO = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  // Con Accept de webp el CDN devuelve webp (~4 KB) en vez de png (~18 KB).
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  Referer: "https://sofifa.com/",
};

/** Parser CSV propio (soporta comillas, comillas dobles escapadas y saltos de línea dentro de campos). */
function parseCSV(texto) {
  const filas = [];
  let fila = [];
  let campo = "";
  let enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      enComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else if (c !== "\r") {
      campo += c;
    }
  }
  if (campo.length || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}

/** El campo "name" del dataset viene con un " -" colgado ("Rodri -"). */
function limpiarNombre(nombre) {
  return nombre.replace(/\s*-\s*$/, "").trim();
}

/** Extrae el país: columna, luego selección nacional, luego demonimio. */
function resolverPais(descripcion, columnaPais, sinTraducir) {
  const intentar = (clave) => {
    if (!clave) return null;
    const traducido = PAISES_ES[clave];
    if (traducido) return traducido;
    sinTraducir.set(clave, (sinTraducir.get(clave) || 0) + 1);
    return null;
  };

  const col = (columnaPais || "").trim();
  if (col && col !== "Friendly International") {
    const t = intentar(col);
    if (t) return t;
  }

  const nacionalidad = descripcion.match(/and the ([A-Za-zÀ-ÿ .'-]+) national team/);
  if (nacionalidad) {
    const t = intentar(nacionalidad[1].trim());
    if (t) return t;
  }

  const demonimio = descripcion.match(/is (?:a|an) ([\wÀ-ÿ' -]+?) footballer/);
  if (demonimio) {
    const t = intentar(demonimio[1].trim());
    if (t) return t;
  }

  return "";
}

async function descargar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    headers: opciones.foto ? CABECERAS_FOTO : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status}`);
  }
  return Buffer.from(await respuesta.arrayBuffer());
}

/**
 * Los jugadores que no están en la última revisión de sofifa dan 404 en
 * "25_120.png"; se prueba la versión anterior (24, 23...) hasta encontrar la
 * foto. Si ninguna existe, el jugador queda con iniciales.
 */
function urlVersionesAnteriores(url) {
  const candidatas = [url];
  const conVersion = url.match(/\/(\d\d)_\d+\.png$/);
  if (conVersion) {
    let actual = Number.parseInt(conVersion[1], 10);
    for (let v = actual - 1; v >= 21; v--) {
      candidatas.push(
        url.replace(/\/\d\d(_\d+\.png)$/, `/${String(v).padStart(2, "0")}$1`),
      );
    }
  }
  return candidatas;
}

/** Descarga la foto probando versiones anteriores; null si no hay ninguna. */
async function descargarFoto(url) {
  for (const candidata of urlVersionesAnteriores(url)) {
    for (let intento = 1; intento <= 2; intento++) {
      try {
        return await descargar(candidata, { foto: true });
      } catch (e) {
        if (String(e).includes("404")) break; // esa versión no existe: siguiente
        await new Promise((r) => setTimeout(r, 300 * intento));
      }
    }
  }
  return null;
}

/** Pool sencillo de trabajadores para no golpear el CDN de golpe. */
async function pool(tareas, trabajadores) {
  let i = 0;
  const resultados = new Array(tareas.length);
  async function trabajador() {
    while (i < tareas.length) {
      const indice = i++;
      resultados[indice] = await tareas[indice]();
    }
  }
  await Promise.all(Array.from({ length: trabajadores }, trabajador));
  return resultados;
}

async function main() {
  const soloDatos = process.argv.includes("--sin-fotos");

  // 1. CSV (descarga y cachea)
  if (!existsSync(RUTA_CSV)) {
    console.log("Descargando dataset FC 25…");
    await mkdir(path.dirname(RUTA_CSV), { recursive: true });
    await writeFile(RUTA_CSV, await descargar(URL_CSV));
  }
  const texto = await readFile(RUTA_CSV, "utf8");

  // 2. Parseo
  const filas = parseCSV(texto);
  const cabecera = filas[0];
  const idx = Object.fromEntries(cabecera.map((c, i) => [c, i]));
  const crudas = filas.slice(1).filter((f) => f.length > 20);

  const sinTraducir = new Map();
  const jugadores = [];
  const vistos = new Set();
  let sinPais = 0;
  let duplicados = 0;

  for (const f of crudas) {
    const id = Number.parseInt(f[idx.player_id], 10);
    const nombre = limpiarNombre(f[idx.name] || "") || limpiarNombre(f[idx.full_name] || "");
    if (!Number.isFinite(id) || !nombre) continue;
    // El CSV trae un puñado de ids repetidos: nos quedamos con la primera fila.
    if (vistos.has(id)) {
      duplicados++;
      continue;
    }
    vistos.add(id);
    const descripcion = f[idx.description] || "";
    const pais = resolverPais(descripcion, f[idx.country_name], sinTraducir);
    if (!pais) sinPais++;

    const codigoPos = (f[idx.positions] || "").split(",")[0].trim().toUpperCase();
    const posicion = POSICIONES_ES[codigoPos] || codigoPos;

    jugadores.push({
      id,
      nombre,
      posicion,
      altura: Number.parseInt(f[idx.height_cm], 10) || 0,
      nacimiento: (f[idx.dob] || "").trim(),
      pais,
      liga: (f[idx.club_league_name] || "").trim(),
      equipo: (f[idx.club_name] || "").trim(),
      urlFoto: (f[idx.image] || "").trim(),
      foto: "",
    });
  }

  // 3. Fotos (solo ligas principales; reanudable)
  await mkdir(CARPETA_FOTOS, { recursive: true });
  if (!soloDatos) {
    const pendientes = jugadores.filter(
      (j) => LIGAS_CON_FOTO.has(j.liga) && j.urlFoto && !existsSync(path.join(CARPETA_FOTOS, `${j.id}.webp`)),
    );
    console.log(
      `Fotos: ${jugadores.filter((j) => LIGAS_CON_FOTO.has(j.liga)).length} jugadores con liga top, ` +
        `${pendientes.length} por descargar…`,
    );
    let hechas = 0;
    let fallidas = 0;
    await pool(
      pendientes.map((j) => async () => {
        const buffer = await descargarFoto(j.urlFoto);
        if (buffer) {
          try {
            await writeFile(path.join(CARPETA_FOTOS, `${j.id}.webp`), buffer);
            hechas++;
          } catch {
            fallidas++;
          }
        } else {
          fallidas++;
        }
        if ((hechas + fallidas) % 250 === 0) {
          console.log(`  ${hechas + fallidas}/${pendientes.length} (fallidas: ${fallidas})`);
        }
      }),
      6,
    );
    console.log(`Fotos descargadas: ${hechas}. Fallidas (irán con iniciales): ${fallidas}.`);
  }

  // 4. Marca en el JSON a los que les tocó foto
  for (const j of jugadores) {
    if (existsSync(path.join(CARPETA_FOTOS, `${j.id}.webp`))) {
      j.foto = `Images/Jugadores/${j.id}.webp`;
    }
    delete j.urlFoto;
  }

  // 5. JSON final
  await mkdir(path.dirname(RUTA_JSON), { recursive: true });
  await writeFile(RUTA_JSON, JSON.stringify(jugadores));

  // 6. Informe
  const conFoto = jugadores.filter((j) => j.foto).length;
  const porLiga = new Map();
  for (const j of jugadores) {
    if (j.foto) porLiga.set(j.liga, (porLiga.get(j.liga) || 0) + 1);
  }
  console.log("\n=== Informe ===");
  console.log(`Jugadores en ${RUTA_JSON}: ${jugadores.length}`);
  console.log(`Filas duplicadas descartadas: ${duplicados}`);
  console.log(`Con foto: ${conFoto} · Sin foto (iniciales): ${jugadores.length - conFoto}`);
  console.log(`Sin país: ${sinPais}`);
  console.log("Fotos por liga:");
  for (const [liga, n] of [...porLiga].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}\t${liga}`);
  }
  if (sinTraducir.size) {
    console.log("Claves de país sin traducir (revisar):");
    for (const [k, n] of [...sinTraducir].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${n}\t${k}`);
    }
  } else {
    console.log("Países: todos traducidos.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
