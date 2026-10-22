import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as THREE from 'three';
import { WeatherSystem } from '../src/world/WeatherSystem.js';

beforeEach(() => {
  globalThis.window = new EventTarget();
});

test('WeatherSystem alterna el clima y actualiza visibilidad de partículas de lluvia', () => {
  const scene = new THREE.Scene();
  const weather = new WeatherSystem(scene);

  assert.equal(weather.weather, 'nublado');
  assert.equal(weather.isRaining, false);
  assert.equal(weather.rainParticles.visible, false);

  weather.setWeather('llovizna', false);
  assert.equal(weather.weather, 'llovizna');
  assert.equal(weather.isRaining, true);
  assert.equal(weather.rainParticles.visible, true);
  assert.ok(weather.rainParticles.material.opacity > 0);

  weather.setWeather('nublado', false);
  assert.equal(weather.weather, 'nublado');
  assert.equal(weather.isRaining, false);
  assert.equal(weather.rainParticles.visible, false);

  weather.dispose();
  assert.equal(scene.children.length, 0);
});

test('WeatherSystem acompaña al jugador y cicla las gotas en update', () => {
  const scene = new THREE.Scene();
  const weather = new WeatherSystem(scene);
  weather.setWeather('llovizna', false);

  const playerPos = new THREE.Vector3(40, 0, 75);
  weather.update(0.1, playerPos);

  assert.equal(weather.rainParticles.position.x, 40);
  assert.equal(weather.rainParticles.position.z, 75);

  weather.dispose();
});
