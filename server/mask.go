package main

// Genera la mascara de tierra/océano del mapamundi (Images/AtlasNeon.jpeg)
// que el frontend usa en la seccion Competiciones para colocar los puntos
// rojos con glow SOBRE la tierra y nunca sobre el mar.
//
// Se ejecuta automaticamente al arrancar el servidor:  go run .
//
// La imagen es un mapamundi con fondo azul oscuro (oceano) y continentes en
// tonos ambar/naranja (tierra), asi que se clasifica por matiz (HSV):
// tierra = matiz calido (<= 55º o >= 330º) con saturacion y brillo suficientes.

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

	// Umbrales de clasificacion (ajustables si el mapa cambia de estilo).
	mascaraMinSaturacion = 0.30
	mascaraMinBrillo     = 0.20
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

	filas := make([]string, 0, mascaraAlto)
	tierra := 0

	for gy := 0; gy < mascaraAlto; gy++ {
		y0 := b.Min.Y + gy*alto/mascaraAlto
		y1 := b.Min.Y + (gy+1)*alto/mascaraAlto
		if y1 <= y0 {
			y1 = y0 + 1
		}

		var sb strings.Builder
		sb.Grow(mascaraAncho)

		for gx := 0; gx < mascaraAncho; gx++ {
			x0 := b.Min.X + gx*ancho/mascaraAncho
			x1 := b.Min.X + (gx+1)*ancho/mascaraAncho
			if x1 <= x0 {
				x1 = x0 + 1
			}

			r, g, bl := mascaraPromedio(src, x0, y0, x1, y1)
			if mascaraEsTierra(r, g, bl) {
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

// mascaraPromedio devuelve el color RGB medio (0-255) de un bloque de píxeles.
func mascaraPromedio(img image.Image, x0, y0, x1, y1 int) (float64, float64, float64) {
	paso := 1
	if ancho := x1 - x0; ancho > 8 {
		paso = ancho / 8
	}

	var sr, sg, sb, n float64
	for y := y0; y < y1; y += paso {
		for x := x0; x < x1; x += paso {
			r, g, b, _ := img.At(x, y).RGBA()
			sr += float64(r >> 8)
			sg += float64(g >> 8)
			sb += float64(b >> 8)
			n++
		}
	}
	if n == 0 {
		return 0, 0, 0
	}
	return sr / n, sg / n, sb / n
}

// mascaraEsTierra clasifica un color como tierra (tono calido) u oceano.
func mascaraEsTierra(r, g, b float64) bool {
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
		h = 60*((bn-rn)/d + 2)
	default:
		h = 60*((rn-gn)/d + 4)
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
