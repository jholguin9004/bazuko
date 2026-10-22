import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { Minimap } from '../src/ui/Minimap.js';

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, val) { store.set(key, String(val)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
  globalThis.window = new EventTarget();
  globalThis.document = {
    getElementById(id) {
      if (id === 'minimap-container') return { classList: { toggle() {} } };
      if (id === 'minimap-canvas') return {
        width: 130, height: 130,
        getContext() {
          return {
            clearRect() {}, save() {}, restore() {}, beginPath() {},
            arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
            fillText() {}, translate() {}, rotate() {}, closePath() {}
          };
        }
      };
      if (id === 'minimap-info') return { textContent: '' };
      return null;
    },
    createElement() {
      return { appendChild() {}, classList: { toggle() {} }, innerHTML: '' };
    },
    body: { appendChild() {} }
  };
});

test('Minimap alterna su visibilidad y persiste el estado', () => {
  const map = new Minimap();
  assert.equal(map.visible, true);

  const hidden = map.toggle();
  assert.equal(hidden, false);
  assert.equal(map.visible, false);
  assert.equal(localStorage.getItem('bazuko.minimap_visible'), 'false');

  const shown = map.toggle();
  assert.equal(shown, true);
  assert.equal(map.visible, true);
  assert.equal(localStorage.getItem('bazuko.minimap_visible'), 'true');
});

test('Minimap calcula y muestra el punto de interés más cercano', () => {
  const map = new Minimap();
  const player = { x: 30, z: 80 };
  const pois = [
    { name: 'Cambuche', icon: '⛺', x: 32, z: 88, color: '#ffd166' },
    { name: 'Recicladora', icon: '♻️', x: 88, z: 32, color: '#2ab7ca' }
  ];

  map.update(player, 0, pois, 1000);
  assert.match(map.infoEl.textContent, /Cambuche/);
  assert.match(map.infoEl.textContent, /⛺/);
});
