// tests/poop.test.js
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as THREE from 'three';
import { PoopSystem } from '../src/systems/PoopSystem.js';
import { PoopProjectile } from '../src/entities/PoopProjectile.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { StatsSystem } from '../src/systems/StatsSystem.js';
import { ITEMS } from '../src/data/items.js';

beforeEach(() => {
  globalThis.window = new EventTarget();
});

test('el jugador puede hacer popó presionando la tecla/acción y recibe un mojón en el inventario', () => {
  const scene = new THREE.Scene();
  const inventory = new InventorySystem();
  const stats = new StatsSystem();
  let actionPlayed = null;
  const player = {
    position: new THREE.Vector3(10, 0, 10),
    root: new THREE.Group(),
    playAction(act) { actionPlayed = act; }
  };

  const poopSys = new PoopSystem(scene, null, inventory, stats, { active: { getGroundHeight: () => 0 } });
  
  assert.equal(inventory.count('popo'), 0);
  const ok = poopSys.poop(player);

  assert.equal(ok, true);
  assert.equal(actionPlayed, 'cagar');
  assert.equal(inventory.count('popo'), 1);
  assert.equal(stats.higiene, 97); // baja 3 de higiene
  assert.equal(poopSys.groundPoops.length, 1);

  // Cooldown impide spam instantáneo
  const spamOk = poopSys.poop(player);
  assert.equal(spamOk, false);
});

test('lanzar popó consume un mojón, activa la animación de lanzar y genera el proyectil balístico', () => {
  const scene = new THREE.Scene();
  const inventory = new InventorySystem();
  inventory.add(ITEMS.popo, 2);
  let actionPlayed = null;
  const player = {
    position: new THREE.Vector3(5, 0, 5),
    root: { rotation: { y: 0 } },
    playAction(act) { actionPlayed = act; }
  };

  const poopSys = new PoopSystem(scene, null, inventory, null, { active: { npcs: [], getGroundHeight: () => 0 } });
  
  const ok = poopSys.throwPoop(player, null);
  assert.equal(ok, true);
  assert.equal(actionPlayed, 'lanzar');
  assert.equal(inventory.count('popo'), 1);
  assert.equal(poopSys.activeProjectiles.length, 1);
});

test('el proyectil de popó impacta a un NPC peatón y activa su reacción de pánico y huida', () => {
  const scene = new THREE.Scene();
  let npcHitOrigin = null;
  const mockNpc = {
    position: new THREE.Vector3(5, 0, 9),
    hitByPoop(origin) {
      this.isSplatted = true;
      this.fleeTimer = 8;
      npcHitOrigin = origin;
    }
  };

  const startPos = new THREE.Vector3(5, 1.2, 5);
  const dir = new THREE.Vector3(0, 0, 1); // directo hacia el NPC
  const projectile = new PoopProjectile(scene, startPos, dir, [mockNpc], () => 0);

  // Simular cuadros de avance del proyectil hasta impactar al NPC
  let hitResult = null;
  for (let f = 0; f < 30; f++) {
    const res = projectile.update(1 / 60);
    if (res.hit) {
      hitResult = res;
      break;
    }
  }

  assert.ok(hitResult, 'El proyectil debió registrar un impacto');
  assert.equal(hitResult.type, 'npc');
  assert.equal(hitResult.npc, mockNpc);
  assert.equal(mockNpc.isSplatted, true);
  assert.equal(mockNpc.fleeTimer, 8);
  assert.ok(npcHitOrigin, 'El NPC recibió el origen del proyectil');
});

test('el proyectil de popó impacta contra el suelo si no toca ningún peatón', () => {
  const scene = new THREE.Scene();
  const startPos = new THREE.Vector3(0, 1.2, 0);
  const dir = new THREE.Vector3(1, 0, 0);
  const projectile = new PoopProjectile(scene, startPos, dir, [], () => 0);

  let hitResult = null;
  for (let f = 0; f < 60; f++) {
    const res = projectile.update(1 / 30);
    if (res.hit) {
      hitResult = res;
      break;
    }
  }

  assert.ok(hitResult);
  assert.equal(hitResult.type, 'ground');
});
