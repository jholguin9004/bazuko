import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as THREE from 'three';
import { Game } from '../src/core/game.js';
import { Zorra } from '../src/entities/Zorra.js';
import { ZorraController } from '../src/systems/ZorraController.js';
import { ZorraSystem } from '../src/systems/ZorraSystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';

beforeEach(() => { globalThis.window = new EventTarget(); });

function juego({ costal = false } = {}) {
  return Object.assign(Object.create(Game.prototype), {
    talents: { getEffect: (key, fallback) => fallback },
    costal,
    inventory: new InventorySystem(),
    player: { load: 0 },
    zorra: new ZorraSystem()
  });
}

test('la capacidad suma la zorra solo mientras se empuja', () => {
  const game = juego({ costal: true });
  game._actualizarCapacidad();
  assert.equal(game.inventory.maxWeight, 40);
  game.zorra.obtener();
  game._actualizarCapacidad();
  assert.equal(game.inventory.maxWeight, 80);
  game.zorra.soltar([0, 0, 0], 0);
  game._actualizarCapacidad();
  assert.equal(game.inventory.maxWeight, 40);
});

test('el punto para agarrar la zorra es donde estaba el jugador, no el modelo', () => {
  const z = new Zorra(new THREE.Scene(), { crearModelo: () => new THREE.Group() });
  z.colocarDelante(new THREE.Vector3(10, 0, 5), 0);
  assert.deepEqual(z.position.toArray(), [10, 0, 5]);
  assert.ok(Math.abs(z.group.position.z - (5 + 1.9)) < 1e-9);
});

test('al morir empujando se descarta hasta caber sin la zorra y se avisa', () => {
  const game = juego({ costal: false });
  game.zorra.obtener();
  game.inventory.maxWeight = 60;
  game.inventory.items = [{ id: 'chatarra', name: 'Chatarra', weight: 1, value: 900, qty: 50 }];
  let toast = null;
  window.addEventListener('toast', (e) => { toast = e.detail.text; });
  Object.assign(Object.create(ZorraController.prototype), { game }).alMorir();
  assert.equal(game.inventory.totalWeight, 20);
  assert.equal(game.zorra.estado, 'pushing');
  assert.equal(toast, 'Te desmayaste y te desocuparon la zorra');
});

test('al morir con la zorra en el suelo no se descarta nada extra', () => {
  const game = juego({ costal: false });
  game.zorra.obtener(); game.zorra.soltar([1, 0, 1], 0);
  game.inventory.items = [{ id: 'chatarra', name: 'Chatarra', weight: 1, value: 900, qty: 15 }];
  Object.assign(Object.create(ZorraController.prototype), { game }).alMorir();
  assert.equal(game.inventory.totalWeight, 15);
  assert.equal(game.zorra.estado, 'dropped');
});
