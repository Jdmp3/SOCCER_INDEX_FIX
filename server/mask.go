package main

// Genera la mascara de tierra/océano del mapamundi (Images/AtlasNeon.jpeg)
// que el frontend usa en la seccion Competiciones para colocar los puntos
// rojos con glow SOBRE la tierra y nunca sobre el mar.
//
// Se ejecuta automaticamente al arrancar el servidor:  go run .
//
// La imagen es un mapamundi de contornos naranjas sobre fondo azul oscuro.
// El contorno se detecta por matiz (HSV), se inunda el océano desde el borde
// y se conserva el interior cerrado con un margen respecto de la costa.

import (
	"image"
	_ "image/jpeg" // registro del decodificador JPEG de la libreria estandar
	"math"
	"os"
	"strconv"
	"strings"
)

const (
	// Rutas relativas a la carpeta server/ (asi se ejecuta con: go run .).
	mascaraImagen = "../public/Images/AtlasNeon.jpeg"
	mascaraSalida = "../src/data/worldMask.ts"

	// Tamano de la mascara: una fila por cada 1/90 de la altura de la imagen.
	mascaraAncho = 120
	mascaraAlto  = 90

	// Umbrales de deteccion del trazo naranja (ajustables si cambia el mapa).
	mascaraMinSaturacion = 0.30
	mascaraMinBrillo     = 0.20
	// Compensa pequeños cortes del trazo por antialiasing/JPEG antes del relleno.
	mascaraCierreTrazo = 3
	// Margen interior Manhattan en píxeles para mantener el punto dentro del borde.
	mascaraMargenInterior = 9
)

// generarMascara escribe src/data/worldMask.ts. Cualquier error solo se
// registra en el log: nunca debe impedir que el servidor arranque.
func generarMascara() {
	f, err := os.Open(mascaraImagen)
	if err != nil {
		logf("mascara del mapa no disponible: %v", err)
		return
	}
	defer f.Close()

	src, _, err := image.Decode(f)
	if err != nil {
		logf("mascara del mapa no decodificable: %v", err)
		return
	}

	b := src.Bounds()
	ancho, alto := b.Dx(), b.Dy()

	// El mapa dibuja los continentes con contornos naranjas; sus interiores
	// tienen el mismo color oscuro que el océano. Se bloquean los trazos y se
	// inunda desde los bordes para distinguir océano conectado de tierra cerrada.
	trazo := make([]bool, ancho*alto)
	for y := 0; y < alto; y++ {
		for x := 0; x < ancho; x++ {
			r, g, bl, _ := src.At(b.Min.X+x, b.Min.Y+y).RGBA()
			trazo[y*ancho+x] = mascaraEsTrazo(float64(r>>8), float64(g>>8), float64(bl>>8))
		}
	}
	trazo = cerrarCortesTrazo(trazo, ancho, alto, mascaraCierreTrazo)
	oceano := make([]bool, ancho*alto)
	cola := make([]int, 0, ancho*alto/2)
	encolar := func(x, y int) {
		i := y*ancho + x
		if !trazo[i] && !oceano[i] {
			oceano[i] = true
			cola = append(cola, i)
		}
	}
	for x := 0; x < ancho; x++ {
		encolar(x, 0)
		encolar(x, alto-1)
	}
	for y := 0; y < alto; y++ {
		encolar(0, y)
		encolar(ancho-1, y)
	}
	for cabeza := 0; cabeza < len(cola); cabeza++ {
		i := cola[cabeza]
		x, y := i%ancho, i/ancho
		if x > 0 {
			encolar(x-1, y)
		}
		if x+1 < ancho {
			encolar(x+1, y)
		}
		if y > 0 {
			encolar(x, y-1)
		}
		if y+1 < alto {
			encolar(x, y+1)
		}
	}

	interior := make([]bool, ancho*alto)
	for i := range interior {
		interior[i] = !trazo[i] && !oceano[i]
	}
	distancia := distanciaAlBordeInterior(interior, ancho, alto)

	filas := make([]string, 0, mascaraAlto)
	tierra := 0

	for gy := 0; gy < mascaraAlto; gy++ {
		var sb strings.Builder
		sb.Grow(mascaraAncho)

		for gx := 0; gx < mascaraAncho; gx++ {
			// Muestrear el centro de cada celda evita que un trazo costero
			// etiquete como tierra una celda cuyo interior sigue siendo océano.
			x := (gx*2 + 1) * ancho / (mascaraAncho * 2)
			y := (gy*2 + 1) * alto / (mascaraAlto * 2)
			if x >= ancho {
				x = ancho - 1
			}
			if y >= alto {
				y = alto - 1
			}
			if interior[y*ancho+x] && distancia[y*ancho+x] >= mascaraMargenInterior {
				sb.WriteByte('1')
				tierra++
			} else {
				sb.WriteByte('0')
			}
		}

		filas = append(filas, sb.String())
	}

	pct := 100 * float64(tierra) / float64(mascaraAncho*mascaraAlto)

	var out strings.Builder
	out.WriteString("// ARCHIVO GENERADO POR server/mask.go — NO EDITAR A MANO\n")
	out.WriteString("// Se regenera solo al arrancar el servidor (go run .)\n")
	out.WriteString("// Cada fila es una fila del mapa (120 columnas): '1' = tierra, '0' = oceano.\n\n")
	out.WriteString("export const MASK_W = " + strconv.Itoa(mascaraAncho) + ";\n")
	out.WriteString("export const MASK_H = " + strconv.Itoa(mascaraAlto) + ";\n")
	out.WriteString("export const WORLD_MASK: string[] = [\n")
	for _, fila := range filas {
		out.WriteString("  \"" + fila + "\",\n")
	}
	out.WriteString("];\n")

	if err := os.WriteFile(mascaraSalida, []byte(out.String()), 0o644); err != nil {
		logf("mascara del mapa no escrita: %v", err)
		return
	}

	if pct < 5 {
		logf("mascara del mapa: poca tierra detectada (%.1f%%), revisa los umbrales de mask.go", pct)
	}
	logf("mascara del mapa actualizada: %dx%d, tierra %.1f%% -> %s", mascaraAncho, mascaraAlto, pct, mascaraSalida)
}

// cerrarCortesTrazo expande ligeramente las líneas naranjas para que pequeños
// huecos de compresión no conecten el interior de los continentes con el mar.
func cerrarCortesTrazo(trazo []bool, ancho, alto, radio int) []bool {
	cerrado := make([]bool, len(trazo))
	for y := 0; y < alto; y++ {
		for x := 0; x < ancho; x++ {
			if !trazo[y*ancho+x] {
				continue
			}
			for dy := -radio; dy <= radio; dy++ {
				for dx := -radio; dx <= radio; dx++ {
					nx, ny := x+dx, y+dy
					if nx >= 0 && nx < ancho && ny >= 0 && ny < alto {
						cerrado[ny*ancho+nx] = true
					}
				}
			}
		}
	}
	return cerrado
}

// distanciaAlBordeInterior calcula en píxeles la distancia Manhattan desde
// cada píxel de tierra al contorno u océano más cercano.
func distanciaAlBordeInterior(interior []bool, ancho, alto int) []int {
	distancia := make([]int, len(interior))
	for i := range distancia {
		distancia[i] = -1
	}
	cola := make([]int, 0, ancho*alto/4)
	for y := 0; y < alto; y++ {
		for x := 0; x < ancho; x++ {
			i := y*ancho + x
			if !interior[i] {
				continue
			}
			if x == 0 || y == 0 || x == ancho-1 || y == alto-1 ||
				!interior[i-1] || !interior[i+1] || !interior[i-ancho] || !interior[i+ancho] {
				distancia[i] = 0
				cola = append(cola, i)
			}
		}
	}
	for cabeza := 0; cabeza < len(cola); cabeza++ {
		i := cola[cabeza]
		x, y := i%ancho, i/ancho
		vecinos := [4]int{i - 1, i + 1, i - ancho, i + ancho}
		for direccion, vecino := range vecinos {
			if (direccion == 0 && x == 0) || (direccion == 1 && x == ancho-1) ||
				(direccion == 2 && y == 0) || (direccion == 3 && y == alto-1) {
				continue
			}
			if interior[vecino] && distancia[vecino] == -1 {
				distancia[vecino] = distancia[i] + 1
				cola = append(cola, vecino)
			}
		}
	}
	return distancia
}

// mascaraEsTrazo detecta los tonos cálidos del contorno naranja.
func mascaraEsTrazo(r, g, b float64) bool {
	h, s, v := rgbAHsv(r, g, b)
	calido := h <= 55 || h >= 330
	return calido && s > mascaraMinSaturacion && v > mascaraMinBrillo
}

// rgbAHsv convierte RGB (0-255) a HSV: h en grados [0,360), s y v en [0,1].
func rgbAHsv(r, g, b float64) (float64, float64, float64) {
	rn, gn, bn := r/255, g/255, b/255
	max := math.Max(rn, math.Max(gn, bn))
	min := math.Min(rn, math.Min(gn, bn))
	d := max - min

	var h float64
	switch {
	case d == 0:
		h = 0
	case max == rn:
		h = 60 * math.Mod((gn-bn)/d, 6)
	case max == gn:
		h = 60 * ((bn-rn)/d + 2)
	default:
		h = 60 * ((rn-gn)/d + 4)
	}
	if h < 0 {
		h += 360
	}

	var s float64
	if max != 0 {
		s = d / max
	}
	return h, s, max
}
