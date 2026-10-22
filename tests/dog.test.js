import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as THREE from 'three';
import { Dog } from '../src/entities/Dog.js';

beforeEach(() => {
  globalThis.window = new EventTarget();
});

test('Dog inicializa con posición, modelo y estado neutral', () => {
  const scene = new THREE.Scene();
  const dog = new Dog(scene, new THREE.Vector3(10, 0, 20));

  assert.equal(dog.kind, 'dog');
  assert.equal(dog.title, 'El Chato');
  assert.equal(dog.isFriend, false);
  assert.equal(dog.position.x, 10);
  assert.equal(dog.position.z, 20);
  assert.ok(dog.group.children.length > 5, 'El modelo 3D tiene cuerpo, cabeza, patas y cola');
});

test('Dog se hace amigo, reacciona a caricias y sigue al jugador', () => {
  const scene = new THREE.Scene();
  const dog = new Dog(scene, new THREE.Vector3(0, 0, 0));

  dog.pet();
  assert.equal(dog.isFriend, false);

  dog.befriend();
  assert.equal(dog.isFriend, true);

  // Al estar lejos (>2.4m), camina hacia el jugador
  const playerPos = new THREE.Vector3(10, 0, 0);
  dog.update(0.1, playerPos, []);
  assert.ok(dog.position.x > 0, 'El perro se acerca al jugador');
});

test('Dog emite alerta cuando olfatea basura cercana', () => {
  const scene = new THREE.Scene();
  const dog = new Dog(scene, new THREE.Vector3(0, 0, 0));
  dog.befriend();

  let alerted = false;
  const listener = (e) => {
    if (e.detail?.text?.includes('El Chato')) alerted = true;
  };
  globalThis.window.addEventListener('toast', listener);

  dog._barkTimer = 11;
  const pickups = [{ position: new THREE.Vector3(3, 0, 3) }];
  dog.update(0.1, new THREE.Vector3(1, 0, 1), pickups);

  assert.equal(alerted, true, 'El perro avisa cuando hay loot cerca');
  globalThis.window.removeEventListener('toast', listener);
});
