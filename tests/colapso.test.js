import assert from 'node:assert/strict';
import { test } from 'node:test';
import { robarPertenencias, avanzarHoras } from '../src/systems/descanso.js';
import { aplicarColapso } from '../src/systems/colapso.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { StatsSystem } from '../src/systems/StatsSystem.js';
import { TrabaSystem } from '../src/systems/TrabaSystem.js';
import { ITEMS } from '../src/data/items.js';
import { COLAPSO } from '../src/data/sustancias.js';
import { Clock } from '../src/core/Clock.js';
import { Game } from '../src/core/game.js';

test('robarPertenencias quita la fracción de dinero y del material reciclable', () => {
  const inv = new InventorySystem();
  inv.add(ITEMS.lata, 3); inv.add(ITEMS.pan, 2); inv.add(ITEMS.tintico, 1);
  const stats = { dinero: 10000 };
  assert.equal(robarPertenencias(stats, inv, { dinero: 0.4, material: 0.5 }), 4000);
  assert.equal(stats.dinero, 6000);
  assert.equal(inv.count('lata'), 1); assert.equal(inv.count('pan'), 2); assert.equal(inv.count('tintico'), 1);
});
test('avanzarHoras da la vuelta al día', () => {
  const c = { hour: 22, day: 1 }; avanzarHoras(c, 4);
  assert.deepEqual(c, { hour: 2, day: 2 });
});
test('colapso: robo, reloj, valores finales y sin perder tipos de objeto', () => {
  const inv = new InventorySystem();
  for (const id of ['lata', 'carton', 'pan', 'agua']) inv.add(ITEMS[id], 4);
  const stats = new StatsSystem(); stats.dinero = 10000;
  const clock = { hour: 23, day: 3 };
  const sistema = new TrabaSystem(); sistema.consumir('bazuco'); sistema.consumir('pegante');
  const r = aplicarColapso({ stats, inventory: inv, clock, sistema, posicion: { x: 1, y: 0, z: 2 } });
  assert.equal(r.robado, 4000); assert.equal(stats.dinero, 6000);
  assert.deepEqual(clock, { hour: 3, day: 4 });
  assert.equal(inv.items.length, 4); assert.equal(inv.count('lata'), 2);
  assert.equal(stats.salud, COLAPSO.salud); assert.equal(stats.animo, COLAPSO.animo);
  assert.equal(sistema.traba, 0); assert.equal(sistema.dosis.length, 0); assert.equal(sistema.bajones.length, 2);
  assert.deepEqual(r.posicion, { x: 1, y: 0, z: 2 });
});
test('colapso fuera del andén va al punto caminable más cercano', () => {
  const navegacion = { isWalkableAt: () => false, nearestPoint: () => ({ x: 12, y: 0, z: 6 }) };
  const r = aplicarColapso({ stats: new StatsSystem(), inventory: new InventorySystem(), clock: { hour: 0, day: 1 },
    sistema: new TrabaSystem(), posicion: { x: 10.3, y: 0, z: 5 }, navegacion });
  assert.deepEqual(r.posicion, { x: 12, y: 0, z: 6 });
});
test('dormir de noche sin paredes sigue robando igual tras la extracción', (t) => {
  globalThis.window = new EventTarget();
  t.mock.method(Math, 'random', () => 0);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const clock = new Clock(); clock.hour = 22;
  const game = Object.assign(Object.create(Game.prototype), {
    isSleeping: false, built: { base: true }, clock, stats: new StatsSystem(), inventory: new InventorySystem(),
    player: { playAction() {} }, _save() { this.saved = (this.saved ?? 0) + 1; }
  });
  game.stats.dinero = 10000; game.inventory.add(ITEMS.lata, 4);
  game.sleep();
  assert.equal(game.stats.dinero, 6000); assert.equal(game.inventory.count('lata'), 2);
  assert.equal(clock.hour, 6); assert.equal(clock.day, 2); assert.equal(game.saved, 1);
});
