import { ITEMS, isRecyclable } from '../data/items.js';

/** Roba dinero y material reciclable; devuelve el dinero robado. */
export function robarPertenencias(stats, inventory, { dinero, material }) {
  const perdido = Math.floor(stats.dinero * dinero);
  stats.dinero -= perdido;
  for (const it of [...inventory.items]) {
    if (isRecyclable(ITEMS[it.id] ?? it)) inventory.remove(it.id, Math.ceil(it.qty * material));
  }
  return perdido;
}

/** Suma horas al reloj y da la vuelta de día. */
export function avanzarHoras(clock, horas) {
  clock.hour += horas;
  while (clock.hour >= 24) { clock.hour -= 24; clock.day += 1; }
}
