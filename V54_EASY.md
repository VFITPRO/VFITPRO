# V54: registro fácil

Objetivo: que cualquier persona, de cualquier edad, pueda registrar una sesión sin instrucciones.
Es solo una capa de presentación y ayudas (`v54-easy.js` y `v54-easy.css`): no cambia el formato de los
datos, las claves de almacenamiento ni la sincronización.

## Qué cambia en «Registrar series»

- **Guía de tres pasos** («Así de fácil»): escribir kilos y repeticiones, tocar ✓, pulsar «Guardar y siguiente».
  Se oculta con «Entendido» y puede volver a verse con «Ver la ayuda otra vez».
- **Modo fácil** (activado por defecto): se ven solo Serie, Kilos, Repeticiones y Hecha. RIR, el tipo de serie
  (N/D/F) y la entrada con guiones quedan ocultos, pero siguen ahí con «Mostrar opciones avanzadas».
  Un RIR oculto conserva su valor predeterminado (2); quien lo use para progresión debe activar el modo avanzado.
- **Casillas grandes**: cajas de 54 px y un círculo ✓ de 52 px (antes 22 px), texto a 22 px.
- **«Última vez»**: cada serie muestra lo que se hizo la última vez y un toque lo copia a kilos y repeticiones.
- **Aviso «¿Las hiciste?»**: si se pulsa «Guardar y siguiente» con series que tienen kilos pero no ✓, se pregunta
  antes de seguir. Antes esas series se perdían en silencio. Las series sin kilos (peso corporal) no preguntan.
- Al tocar una casilla numérica se selecciona su contenido, para escribir encima del 0.
- Botones de descanso en una sola fila y textos más claros («Repeticiones», «Hecha»).

Las preferencias (`vfit-easy-mode`, `vfit-easy-guide-hidden`) son solo visuales y viven en el dispositivo.

## Pruebas

```
VFIT_CHROMIUM_PATH=/ruta/chromium node scripts/test-v54-browser.cjs
```

Usa Supabase simulado y comprueba guía, modo fácil, casilla grande, «última vez», aviso de series sin ✓,
opciones avanzadas y ausencia de desbordes a 320/390/768 px. No sustituye una prueba en un iPhone real.
