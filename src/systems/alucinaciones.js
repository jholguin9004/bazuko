// src/systems/alucinaciones.js
// Decisiones puras de las alucinaciones (sombras que persiguen y tesoros falsos).
// No toca la escena: recibe efectos de la traba y devuelve qué debe pasar.
import { ALUCINACIONES } from '../data/sustancias.js';
import { NIVELES } from './TrabaSystem.js';

const NIVEL_PERSECUCION = NIVELES.indexOf('muyTrabado');

/** ¿Aparece una sombra en este cuadro? */
export function tirarSombra({ efectos, activas, dt, random = Math.random }, cfg = ALUCINACIONES) {
  if (activas >= cfg.maxSombras || !efectos?.sombras) return false;
  return random() < cfg.sombraPorSeg * efectos.sombras * dt;
}

/** ¿Aparece un tesoro falso en este cuadro? */
export function tirarTesoroFalso({ efectos, activos, dt, random = Math.random }, cfg = ALUCINACIONES) {
  if (activos >= cfg.maxTesoros || !efectos?.tesorosFalsos) return false;
  return random() < cfg.tesoroPorSeg * efectos.tesorosFalsos * dt;
}

/** Punto a `distanciaAparicion` metros detrás del jugador (opuesto a `frente`). */
export function puntoDeAparicion(jugador, frente, cfg = ALUCINACIONES) {
  const largo = Math.hypot(frente.x, frente.z) || 1;
  // `+ 0` evita el -0 cuando el frente no tiene componente en ese eje
  return {
    x: jugador.x - (frente.x / largo) * cfg.distanciaAparicion + 0,
    z: jugador.z - (frente.z / largo) * cfg.distanciaAparicion + 0
  };
}

/** Qué hace una sombra activa según su distancia al jugador y el nivel de traba. */
export function decidirSombra({ distancia, nivel }, cfg = ALUCINACIONES) {
  if (distancia <= cfg.radioAlcance) return 'alcanza';
  if (NIVELES.indexOf(nivel) < NIVEL_PERSECUCION || distancia > cfg.distanciaDesvanecer) return 'desvanece';
  return 'persigue';
}

export function elegirTexto(lista, random = Math.random) {
  return lista[Math.min(lista.length - 1, Math.floor(random() * lista.length))];
}
