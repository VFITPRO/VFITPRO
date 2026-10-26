# V52: interfaz centrada en entrenar

La presentación se reorganiza sin migrar datos ni sustituir los módulos existentes.

- Inicio conserva un único acceso principal a la próxima sesión. El calendario recomendado y la lista completa se despliegan juntos.
- Rutinas separa Mis días, Biblioteca y Organizar. Los cinco días siguen disponibles.
- Cada día permite empezar directamente. Adaptación y edición permanecen en «Ajustar o personalizar rutina».
- Ejercicio prioriza imagen y registro; técnica, anatomía, objetivos y sustituciones se despliegan.
- Registro prioriza series y «Guardar y siguiente». Conserva descanso, navegación de ejercicios y una sola barra persistente de sesión. Las herramientas, notas, calentamiento guiado y edición del tiempo siguen disponibles mediante el desplegable. Los calentamientos ya creados y las superseries activas permanecen visibles.
- Progreso separa Resumen, Historial, Análisis y Medidas. Perfil separa Cuenta, Entrenamiento y Mis datos.

`v52-simple.js` clasifica los controles existentes, conservando sus nodos, padres, eventos y claves. No escribe datos de usuario. Las selecciones visuales duran solo la visita. El service worker cambia de caché e incluye ambos recursos nuevos sin recargar una sesión activa.

## Validación

- `node --check overrides/v52-simple.js` y `node --check overrides/sw.js`.
- `VFIT_JSDOM_PATH=/ruta/node_modules/jsdom node scripts/test-v52.cjs`: cinco días, registro y edición de tiempo, biblioteca, cambio/restauración de programa sin perder historial, sincronización simulada y aislamiento entre dos cuentas.
- `VFIT_CHROMIUM_PATH=/ruta/chromium node scripts/test-v52-browser.cjs`: usa Playwright, construye y sirve una copia temporal; comprueba controles reales del Día 5, guardar sesión, pausa, diálogo de finalización y ausencia de desbordamiento horizontal a 320/390/768 px. `VFIT_QA_OUTPUT` permite capturas opcionales.

Las pruebas de cuentas usan Supabase simulado; no modifican cuentas reales. La prueba móvil usa Chromium: no sustituye una comprobación en Safari/iPhone físico. Integrar esta rama en main activa el despliegue existente de GitHub Pages.
