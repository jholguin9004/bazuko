import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HUD } from '../src/ui/HUD.js';
import { StatsSystem } from '../src/systems/StatsSystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { ITEMS } from '../src/data/items.js';

function element() {
  return {
    writes: 0, html: '',
    set innerHTML(value) { this.html = value; this.writes++; },
    querySelectorAll() { return []; }
  };
}
function fixture() {
  globalThis.window = {};
  return Object.assign(Object.create(HUD.prototype), {
    _htmlCache: new WeakMap(), _panelElapsed: 0.1, bars: {},
    invEl: element(), diseaseEl: element(),
    talentPanel: element(), craftPanel: element(), dealerPanel: element()
  });
}

test('avisa antes de agotar la sed y mantiene visible el daño hasta recuperarse', () => {
  const hud = fixture();
  hud.statusEl = { textContent: '', hidden: true };
  const stats = { sed: 19, hambre: 100, energia: 100, salud: 100 };
  const update = () => hud.update(stats, { hour: 6, day: 1 }, null, null, null, null, null, 0.1);
  update();
  assert.equal(hud.statusEl.hidden, false);
  assert.match(hud.statusEl.textContent, /bebe agua/);
  stats.sed = 0;
  stats.salud = 20;
  update();
  assert.match(hud.statusEl.textContent, /perdiendo salud/);
  assert.match(hud.statusEl.textContent, /Salud crítica/);
  stats.sed = stats.salud = 60;
  update();
  assert.equal(hud.statusEl.hidden, true);
});

test('600 fotogramas no reconstruyen el inventario ni enfermedades sin cambios', () => {
  const hud = fixture();
  const inventory = { items: [{ id: 'pan', name: 'Pan', qty: 1 }], totalWeight: 0.2, maxWeight: 20 };
  for (let i = 0; i < 600; i++) hud.update({}, { hour: 6, day: 1 }, {}, inventory, { hasAny: false }, null, null, 1 / 60);
  assert.equal(hud.invEl.writes, 1);
  assert.equal(hud.diseaseEl.writes, 1);
  inventory.items[0].qty = 2;
  inventory.totalWeight = 0.4;
  hud.update({}, { hour: 6, day: 1 }, {}, inventory, { hasAny: false }, null, null, 0.1);
  assert.equal(hud.invEl.writes, 2);
  assert.match(hud.invEl.html, /x2/);
  assert.match(hud.invEl.html, /0.4\/20/);
  inventory.maxWeight = 30;
  hud._renderInventory(inventory);
  assert.match(hud.invEl.html, /0.4\/30/);
});

test('las enfermedades refrescan el tiempo visible y se eliminan al curarlas', () => {
  const hud = fixture();
  const disease = { hasAny: true, list: [{ emoji: '!', name: 'Prueba', timeLeft: 5.9 }] };
  hud._renderDiseases(disease);
  disease.list[0].timeLeft = 5.1;
  hud._renderDiseases(disease);
  assert.equal(hud.diseaseEl.writes, 1);
  disease.list[0].timeLeft = 4.9;
  hud._renderDiseases(disease);
  assert.equal(hud.diseaseEl.writes, 2);
  assert.match(hud.diseaseEl.html, /5s/);
  hud._renderDiseases({ hasAny: false });
  assert.equal(hud.diseaseEl.html, '');
});

test('paneles estables conservan sus nodos y se refrescan cuando cambia el estado', () => {
  const hud = fixture();
  const talents = { points: 0, has: () => false, canUnlock: () => false };
  const crafting = { getAvailable: () => [{ id: 'test', name: 'Prueba', qty: 1, ingredients: { papel: 2 }, craftable: false }] };
  let quantity = 1;
  const inventory = { count: () => quantity, totalWeight: 0, maxWeight: 20 };
  window.__game = { stats: { dinero: 10 }, inventory, dealer: { getProducts: () => [] } };
  for (let i = 0; i < 20; i++) {
    hud.renderTalents(talents);
    hud.renderCrafting(crafting, inventory, talents);
    hud.renderDealer();
  }
  assert.equal(hud.talentPanel.writes, 1);
  assert.equal(hud.craftPanel.writes, 1);
  assert.equal(hud.dealerPanel.writes, 1);
  talents.points = 1;
  quantity = 2;
  window.__game.stats.dinero = 20;
  hud.renderTalents(talents);
  hud.renderCrafting(crafting, inventory, talents);
  hud.renderDealer();
  assert.equal(hud.talentPanel.writes, 2);
  assert.equal(hud.craftPanel.writes, 2);
  assert.equal(hud.dealerPanel.writes, 2);
});

test('consumir una sustancia delega en la traba; otro consumible no', () => {
  const hud = fixture(); const llamadas = [];
  globalThis.window.__game = { stats: new StatsSystem(), traba: { consumir: id => llamadas.push(id) } };
  hud._toast = () => {};
  const inv = new InventorySystem(); inv.add(ITEMS.bazuco); inv.add(ITEMS.pan);
  hud._useItem('bazuco', inv); hud._useItem('pan', inv);
  assert.deepEqual(llamadas, ['bazuco', 'pan']); // el gancho delega todo; TrabaSystem ignora 'pan'
});
