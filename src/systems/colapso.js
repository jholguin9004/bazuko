import { COLAPSO } from '../data/sustancias.js';
import { SLEEP } from '../data/cambuche.js';
import { robarPertenencias, avanzarHoras } from './descanso.js';

/**
 * Colapso por sobredosis: pasa el tiempo, te roban, se corta la traba y
 * despiertas débil. Pura: devuelve el dinero robado y la posición final.
 */
export function aplicarColapso({ stats, inventory, clock, sistema, posicion, navegacion }, cfg = COLAPSO) {
  let destino = posicion;
  if (navegacion && !navegacion.isWalkableAt(posicion.x, posicion.z)) {
    destino = navegacion.nearestPoint(posicion.x, posicion.z) ?? posicion;
  }
  avanzarHoras(clock, cfg.horas);
  const robado = robarPertenencias(stats, inventory, { dinero: SLEEP.roboDinero, material: SLEEP.roboMaterial });
  sistema.cortar();
  stats.salud = cfg.salud;
  stats.animo = cfg.animo;
  return { robado, posicion: { x: destino.x, y: destino.y, z: destino.z } };
}
