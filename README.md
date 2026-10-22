# Vagabundo / Bazuko

Juego de supervivencia urbana en 3D para el navegador, ambientado en un barrio inspirado en el centro de Bogotá, Santa Inés y El Cartucho. Explora las calles, recoge y vende materiales, consigue comida y agua y mejora tu cambuche.

![Vista isométrica del barrio, con calles amplias, andenes y pasos peatonales](docs/images/barrio-isometrico.jpg)

## Características

- Cámaras en tercera persona e isométrica, intercambiables durante la partida.
- Techos y paredes que se ocultan cuando tapan al personaje en vista isométrica, con muros bajos y silueta del jugador.
- Peatones que caminan por los andenes y cruzan las calles.
- Carros y taxis en movimiento y un bus articulado que circula por la troncal y para en la estación.
- Calzadas de 12 metros y andenes de 4 metros.
- Ciudad de 240 × 222 metros: tres veces la superficie inicial, con barrios nuevos al oriente y al sur, dos calles y dos carreras adicionales y dos parques nuevos.
- **Radar y minimapa urbano**: Brújula con puntos de interés cardinales y distancia en metros al cambuche (refugio), recicladora El Progreso, tienda La Esquinita, mesa de crafteo y rincón del dealer.
- **Menú de pausa y ajustes (ESC / botón ⏸️)**: Permite reanudar, controlar volumen maestro con slider deslizable, silenciar (mute), guardar la partida manualmente, revisar estado y consultar la guía de controles.
- **Audio con volumen graduable y persistente**: Guarda automáticamente tu volumen maestro y preferencia de silencio en el navegador.
- **Clima dinámico bogotano**: Ciclo atmosférico entre nublado y llovizna suave sobre el centro de Bogotá con partículas optimizadas de Three.js.
- **Inventario mejorado**: Información de efectos por objeto, validación de condiciones médicas al comer y consumo contextual (bebidas, comidas, curas).
- Creación de personaje, inventario, reciclaje, comercio, talentos y construcción del cambuche.
- Ciclo de día y noche y necesidades de supervivencia con un ritmo relajado. Un día del juego dura una hora real.
- Panel de FPS actuales, mínimos, máximos, promedio y coordenadas X, Y, Z.
- Pantalla de carga con precarga de personajes, texturas y shaders antes de iniciar la partida y la medición de FPS.
- Descarte de sectores fuera de cámara, geometría agrupada, iluminación limitada y resolución adaptable para reducir el trabajo de renderizado.

## Capturas

### Carros, taxis y bus articulado

![Bus articulado rojo en la troncal junto a la estación, con carros y un taxi circulando por las calles](docs/images/carros-y-bus.jpg)

### Cámara en tercera persona

![Personaje en tercera persona frente a un cruce con carros y peatones](docs/images/tercera-persona.jpg)

Las capturas están guardadas dentro del repositorio, en [`docs/images`](docs/images), y se muestran directamente en GitHub mediante enlaces relativos.

## Ejecutar en el navegador

Necesitas Node.js 22.12 o posterior, npm, Git y Git LFS. Los archivos de audio se distribuyen con Git LFS.

```sh
git lfs install
git clone https://github.com/juanagogo/bazuko.git
cd bazuko
git lfs pull
npm ci
npm run dev
```

Abre la dirección que indique Vite en la terminal, normalmente **http://localhost:5173**. Si ese puerto está ocupado, Vite elegirá otro.

En la primera partida se abre el creador de personaje. El juego se sirve con Vite; para ejecutarlo utiliza el servidor de desarrollo en lugar de abrir `index.html` directamente.

En PowerShell, si una política de ejecución impide usar `npm`, ejecuta los mismos comandos con `npm.cmd`.

## Controles

| Tecla o acción | Función |
| --- | --- |
| `W`, `A`, `S`, `D` | Moverse. En tercera persona, el movimiento sigue el rumbo de la cámara. |
| `Shift` | Correr. |
| `V` o botón de cámara | Alternar entre tercera persona e isométrica. |
| Mover el ratón (o arrastrar botón izq/der) o flechas | Girar la cámara libremente en tercera persona (Pointer Lock con clic izquierdo). |
| Rueda del ratón | Ajustar la distancia/zoom de la cámara en tercera persona. |
| `E` | Interactuar con basura, tiendas, cambuche, autos o El Chato (perro callejero). |
| Mantener y soltar `Q` junto a basura | Seleccionar materiales y recogerlos al soltar. |
| `Q` junto al dealer | Abrir su tienda. |
| `B` o `L` | Pedir limosna. |
| `F` | Activar o desactivar el boost, que consume energía y salud. |
| `T` | Abrir talentos. |
| `C` | Abrir fabricación. |
| `P` | Editar el personaje. |
| `M` | Alternar entre el personaje realista y el modelo liviano. |
| `N` | Alternar radar / minimapa urbano de Bogotá. |
| `Esc` o botón ⏸️ | Menú de pausa y configuración / Cerrar paneles activos. |
| Clic en comida o bebida del inventario | Consumir el objeto. |

## Cómo empezar

1. Recorre los andenes y acércate a los objetos para ver las acciones disponibles.
2. Utiliza el radar (`N`) para orientarte hacia la recicladora o tu cambuche.
3. Recoge materiales y véndelos en la recicladora para conseguir dinero.
4. Compra comida y agua y consúmelas desde el inventario.
5. Construye y mejora el cambuche para poder descansar.

La partida guarda datos localmente en el navegador al crear o editar el personaje, al dormir y desde el menú de pausa. La preferencia de cámara, volumen y radar también se conservan. Los datos dependen del navegador y de la dirección desde la que juegas; no hay sincronización entre dispositivos.

Si la salud llega a cero, el juego se pausa y muestra una pantalla de recuperación. El regreso al cambuche ocurre al pulsar **Volver al cambuche**.

## Rendimiento

Al abrir el juego aparece una pantalla de carga por etapas. Espera el mapa, los modelos de jugador y NPC (incluidas sus versiones de detalle), sube las texturas a la GPU y precompila los materiales. Prepara también las sombras y la silueta de la vista inicial antes de mostrar la partida. El creador de personaje sigue disponible en la primera partida. Durante la carga no avanzan el reloj ni las necesidades; la medición de FPS comienza desde cero al entrar a jugar. Si falla un recurso imprescindible, aparece **Reintentar**; los sonidos ausentes no bloquean el inicio. Esta preparación aumenta la espera inicial y el uso de memoria al adelantar la carga de los NPC completos.

El panel inferior derecho muestra FPS actuales, mínimo y máximo por fotograma, promedio de la sesión, milisegundos por cuadro y coordenadas del jugador en metros. **Reiniciar medición** inicia una nueva muestra. El promedio se calcula como cuadros / tiempo real; los menús y la pestaña en segundo plano quedan excluidos. El panel se refresca cuatro veces por segundo para evitar escrituras DOM innecesarias.

La ciudad conserva sus dimensiones y población. La iluminación combina dos luces puntuales cercanas con halos decorativos suaves sobre el suelo para faroles y fogones. Hasta 48 halos cercanos comparten una sola llamada de dibujo y no calculan iluminación ni sombras sobre los materiales. Las llamas y lámparas siguen visibles; las luces decorativas lejanas ya no iluminan paredes y personajes en tiempo real.

Los suelos, marcas y edificios se agrupan por sectores de 32 metros. En tercera persona, las paredes, techos y adornos que comparten material se dibujan juntos; al cambiar a isométrica se recuperan las piezas independientes para ocultar las que tapan al jugador. Las transformaciones de inmuebles se calculan una vez. Las pasadas de silueta solo recorren al jugador y las luces, y el tráfico descarta peatones lejanos antes de comprobar el frenado.

El *frustum culling* descarta sectores completos y vehículos fuera del encuadre antes de recorrer sus mallas. Comprueba el volumen completo para conservar objetos parcialmente visibles y funciona en ambas cámaras. Los objetos necesarios para el mapa de sombras siguen disponibles en esa pasada; Three.js descarta sus mallas fuera de la cámara en la pasada de color. El bus y los NPC siguen su recorrido fuera de pantalla. Los halos también se filtran antes de crear las instancias. El panel muestra **Grupos en cámara** y **Descartados**; los grupos conservados únicamente para sombras explican la diferencia entre ambos contadores y el total.

Si los FPS permanecen por debajo de 45 durante tres segundos, la resolución interna baja gradualmente hasta 0.75×. Se recupera después de doce segundos por encima de 57 FPS, hasta el límite del dispositivo (máximo 1.5×). Esto puede suavizar la imagen en equipos lentos; el texto de la interfaz conserva su resolución. El panel también muestra la resolución actual, llamadas de dibujo y triángulos, incluyendo las pasadas de sombras y silueta. Los FPS reales dependen del equipo y deben compararse recorriendo la misma zona y con la misma cámara.

Referencias técnicas: [renderizado y métricas de Three.js](https://threejs.org/docs/pages/WebGLRenderer), [resolución de renderizado](https://threejs.org/manual/pages/responsive.html), [volumen visible de la cámara](https://threejs.org/docs/pages/Frustum.html).

## Compilación y pruebas

Para generar la versión de producción y verla localmente:

```sh
npm run build
npm run preview
```

La compilación se genera en `dist/`. Abre la dirección que muestre el comando de previsualización.

Para ejecutar las pruebas con el runner de Node.js:

```sh
node --experimental-test-module-mocks --test tests/*.test.js
```

Para ejecutar las pruebas E2E con Playwright:

```sh
npm run test:e2e
```

Las 87 pruebas unitarias cubren colisiones, cámaras, visibilidad de edificios, suelos, navegación de peatones, tráfico, bus, supervivencia, migración de partidas guardadas, ampliación de la ciudad, rendimiento, carga inicial, audio, clima dinámico, minimapa y menú de pausa. Las pruebas de arranque verifican que la partida espere modelos, shaders y GPU, que un fallo impida comenzar una partida incompleta y que la espera no contamine las estadísticas de FPS.

## Estructura

```text
src/
  core/        Bucle del juego, renderizado, cámara y entrada
  entities/    Jugador y objetos interactivos
  systems/     Supervivencia, inventario, tráfico, guardado y colisiones
  world/       Distrito, edificios, terreno, navegación y clima
  character/   Modelos y apariencia del personaje
  ui/          Interfaz, minimapa, menú de pausa y creador de personaje
  data/        Objetos, talentos y construcción
public/        Modelos y audio
tests/         Pruebas automatizadas (unitarias y E2E)
docs/images/   Capturas del juego
```

## Tecnologías

JavaScript con módulos ES, Three.js para el mundo 3D, Vite para desarrollo y compilación y Howler para el audio.
