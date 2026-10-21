import { test } from 'node:test';
import assert from 'node:assert/strict';
import { originEffect } from '../src/data/origins.js';
import { ZORRA, FORCEJEO } from '../src/data/zorra.js';

test('el origen reciclador abarata la zorra y da fuerza en el forcejeo', () => {
  assert.equal(originEffect('reciclador', 'zorraDiscount'), 0.75);
  assert.equal(originEffect('reciclador', 'forcejeoBonus'), 1.2);
  assert.equal(originEffect('migrante', 'zorraDiscount'), 1);
  assert.equal(originEffect('reciclador', 'extraLoot', 0), 1);
});

test('la calibración del forcejeo gana con 4 pulsaciones por segundo y no con 3', () => {
  const neta = (p) => FORCEJEO.empuje * p - FORCEJEO.tironNpc;
  assert.ok(neta(3) <= 1e-9);
  assert.ok((1 - FORCEJEO.barraInicial) / neta(4) <= FORCEJEO.duracion);
  assert.equal(ZORRA.bonoPeso, 40);
});
