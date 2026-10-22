import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describirEfecto, PERFILES } from '../src/data/sustancias.js';
import { ITEMS, LOOT_SUBSTANCE, isRecyclable } from '../src/data/items.js';
import { DrugDealer } from '../src/entities/DrugDealer.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';

test('el texto del dealer sale de los datos y conserva el de hoy', () => {
  assert.equal(describirEfecto(ITEMS.tintico), '☕ +20 vicio, +15 ánimo, +20 energía');
  assert.equal(describirEfecto(ITEMS.pegante), '🧴 +40 vicio, +25 ánimo, -3 salud');
  assert.equal(describirEfecto(ITEMS.pastilla), '💊 +60 vicio, +40 ánimo, -5 salud');
  assert.equal(describirEfecto(ITEMS.bazuco), '🔥 +50 vicio, +20 ánimo, -4 salud');
});
test('el dealer vende bazuco y las sustancias que traban tienen perfil', () => {
  const ids = DrugDealer.prototype.getProducts.call({}).map(p => p.id);
  assert.deepEqual(ids, ['tintico', 'pegante', 'pastilla', 'bazuco']);
  for (const id of ids) {
    assert.ok(ITEMS[id].substance);
    if (id !== 'tintico') assert.ok(PERFILES[id]);
  }
  assert.equal(PERFILES.tintico, undefined);
  assert.ok(LOOT_SUBSTANCE.some(e => e.item === 'bazuco'));
  assert.equal(isRecyclable(ITEMS.bazuco), false);
});
test('el bazuco se compra con su precio', () => {
  globalThis.window = new EventTarget();
  const inv = new InventorySystem(), stats = { dinero: 2500 };
  const r = DrugDealer.prototype.buySubstance.call({}, inv, stats, 'bazuco');
  assert.equal(r.cost, 800); assert.equal(stats.dinero, 1700); assert.equal(inv.count('bazuco'), 1);
});
