// Puntos fijos del mapamundi de la sección Competiciones.
//
// x / y son porcentajes sobre la imagen del mapa (0-100), donde:
//   x = 0 es el borde izquierdo,  y = 0 es el borde superior.
// Si un punto te queda descentrado, cambia solo esos dos números.
//
// Logos: public/Images/Countries/<archivo>.png
// Si falta el archivo, se muestran las iniciales del país en su lugar.

export interface PuntoMapa {
  id: string;
  nombre: string;
  x: number;
  y: number;
  /** Ruta del logo dentro de public/ */
  logo: string;
  /** Iniciales mostradas si el logo aún no existe */
  iniciales: string;
  hijos?: PuntoMapa[];
}

export const PUNTOS_FIJOS: PuntoMapa[] = [
  {
    id: "europa",
    nombre: "EUROPA",
    x: 52.5,
    y: 24.5,
    logo: "/Images/Countries/europa.png",
    iniciales: "EU",
    hijos: [
      {
        id: "espana",
        nombre: "España",
        x: 46.5,
        y: 39,
        logo: "/Images/Countries/espana.png",
        iniciales: "ES",
      },
      {
        id: "italia",
        nombre: "Italia",
        x: 52.5,
        y: 38.5,
        logo: "/Images/Countries/italia.png",
        iniciales: "IT",
      },
      {
        id: "inglaterra",
        nombre: "Inglaterra",
        x: 45.5,
        y: 28,
        logo: "/Images/Countries/inglaterra.png",
        iniciales: "EN",
      },
      {
        id: "alemania",
        nombre: "Alemania",
        x: 59.2,
        y: 30.5,
        logo: "/Images/Countries/alemania.png",
        iniciales: "DE",
      },
    ],
  },
  {
    id: "america",
    nombre: "AMÉRICA",
    x: 25,
    y: 36,
    logo: "/Images/Countries/america.png",
    iniciales: "AM",
    hijos: [
      {
        id: "mexico",
        nombre: "México",
        x: 22,
        y: 46.5,
        logo: "/Images/Countries/mexico.png",
        iniciales: "MX",
      },
      {
        id: "brasil",
        nombre: "Brasil",
        x: 35.5,
        y: 58,
        logo: "/Images/Countries/brasil.png",
        iniciales: "BR",
      },
      {
        id: "argentina",
        nombre: "Argentina",
        x: 32,
        y: 69.5,
        logo: "/Images/Countries/argentina.png",
        iniciales: "AR",
      },
      {
        id: "colombia",
        nombre: "Colombia",
        x: 30,
        y: 51.5,
        logo: "/Images/Countries/colombia.png",
        iniciales: "CO",
      },
    ],
  },
];
