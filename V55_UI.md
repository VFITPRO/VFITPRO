# V55: interfaz moderna

Nueva estructura visual inspirada en apps de entrenamiento actuales, conservando el negro y naranja de VFIT PRO.
Es una capa de presentación (`v55-ui.js`, `v55-ui.css`): no cambia datos, claves ni sincronización.

- **Inicio**: saludo neutro («¡Hola, a entrenar!»), anillo de progreso semanal (sesiones de lunes a domingo frente al
  objetivo semanal, 5 por defecto), tarjeta «Próximo entrenamiento» que abre la sesión y accesos rápidos
  (Rutinas, Biblioteca, Progreso, Perfil). La imagen grande y los contadores salen del inicio; «Plan de hoy y todos
  mis días» sigue disponible plegado.
- **Rutinas**: pestañas en forma de chips y tarjetas con el nombre de la rutina en grande y «Día · duración · nivel».
- **Detalle de rutina**: título con el nombre y sin la imagen grande; los ejercicios muestran series y repeticiones.
- **Ejercicio**: músculos e «Indicaciones» visibles al entrar, sin desplegar nada.
- **Perfil**: tarjeta de cuenta con inicial, nombre y correo.
- Nutrición y la bienvenida con elección de objetivo no se incluyen.

## Pruebas

```
VFIT_CHROMIUM_PATH=/ruta/chromium node scripts/test-v55-browser.cjs
```
Comprueba inicio, accesos rápidos, rutinas, detalle, ejercicio, perfil y ausencia de desbordes a 320/390/768 px
en las seis pantallas. No sustituye una prueba en un iPhone real.
