import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SceneManager } from '../src/core/Scene.js';

test('applyMentalState no acumula entre cuadros', () => {
  const s = new SceneManager();
  s.setTimeOfDay(12);
  s.applyMentalState(0.5);
  const una = s.scene.background.clone();
  for (let i = 0; i < 60; i++) s.applyMentalState(0.5);
  assert.ok(s.scene.background.equals(una));
  assert.ok(s.scene.fog.color.equals(una));
});
test('desaturación 0 restaura el color base de la hora', () => {
  const s = new SceneManager();
  s.setTimeOfDay(12);
  const base = s.scene.background.clone();
  s.applyMentalState(0.8);
  s.applyMentalState(0);
  assert.ok(s.scene.background.equals(base));
});
test('desaturación 1 da gris del color base', () => {
  const s = new SceneManager();
  s.setTimeOfDay(12);
  const { r, g, b } = s.scene.background;
  s.applyMentalState(1);
  const gris = (r + g + b) / 3;
  for (const c of ['r', 'g', 'b']) assert.ok(Math.abs(s.scene.background[c] - gris) < 1e-9);
});
test('sobrio y sin desaturación previa no toca el fondo de otro sistema', () => {
  const s = new SceneManager();
  s.setTimeOfDay(12);
  s.scene.background.setRGB(0.9, 0.1, 0.2); // otro sistema lo cambió
  s.applyMentalState(0);
  assert.ok(s.scene.background.equals(new THREE.Color(0.9, 0.1, 0.2)));
});
