import { test } from 'node:test';
import assert from 'node:assert/strict';
import { originEffect } from '../src/data/origins.js';
import { ZORRA, FORCEJEO } from '../src/data/zorra.js';
import { ZorraSystem, movimientoJugador, haySobrepeso, precioZorra, ofertaZorra, objetosADescartar } from '../src/systems/ZorraSystem.js';

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

test('empujar suma 40 kg, multiplica la velocidad por 0,7 y quita correr', () => {
  const z = new ZorraSystem();
  assert.equal(z.bonoPeso(), 0);
  assert.equal(z.obtener(), true);
  assert.equal(z.obtener(), false);
  assert.equal(z.bonoPeso(), 40);
  assert.deepEqual(movimientoJugador({ empujando: true }), { mult: 0.7, puedeCorrer: false });
  assert.equal(z.soltar([1, 0, 2], 0.5), true);
  assert.equal(z.bonoPeso(), 0);
  assert.equal(z.tieneZorra(), true);
  assert.deepEqual(movimientoJugador({ empujando: false }), { mult: 1, puedeCorrer: true });
  assert.equal(z.agarrar(), true);
  assert.equal(z.pos, null);
});

test('con sobrepeso o forcejeando el jugador no se mueve', () => {
  assert.equal(haySobrepeso(50, 40), true);
  assert.equal(haySobrepeso(40, 40), false);
  assert.deepEqual(movimientoJugador({ empujando: false, sobrepeso: true }), { mult: 0, puedeCorrer: false });
  assert.equal(movimientoJugador({ empujando: true, forcejeando: true }).mult, 0);
});

test('la compra cuesta 40.000 y 30.000 para el reciclador, y no se compra dos veces', () => {
  assert.equal(precioZorra(null), 40000);
  assert.equal(precioZorra('reciclador'), 30000);
  assert.deepEqual(ofertaZorra({ dinero: 50000, tieneZorra: false, originId: null }), { precio: 40000, disponible: true, motivo: null });
  assert.equal(ofertaZorra({ dinero: 50000, tieneZorra: true, originId: null }).motivo, 'tiene');
  assert.equal(ofertaZorra({ dinero: 35000, tieneZorra: false, originId: null }).motivo, 'dinero');
  assert.equal(ofertaZorra({ dinero: 35000, tieneZorra: false, originId: 'reciclador' }).disponible, true);
});

test('al morir se descarta desde lo más pesado hasta caber sin la zorra', () => {
  const items = [{ id: 'lata', weight: 0.2, qty: 10 }, { id: 'chatarra', weight: 1, qty: 30 }];
  assert.deepEqual(objetosADescartar(items, 20), [['chatarra', 12]]);
  assert.deepEqual(objetosADescartar(items, 100), []);
  assert.equal(items[1].qty, 30);
});

test('el guardado conserva la zorra y las partidas antiguas cargan sin zorra', () => {
  const z = new ZorraSystem();
  z.obtener(); z.soltar([3, 0, 4], 1.2);
  const copia = new ZorraSystem();
  copia.deserialize(JSON.parse(JSON.stringify(z.serialize())));
  assert.deepEqual(copia.serialize(), { state: 'dropped', pos: [3, 0, 4], rot: 1.2 });
  const vieja = new ZorraSystem();
  vieja.deserialize(undefined);
  assert.equal(vieja.estado, 'none');
  const rara = new ZorraSystem();
  rara.deserialize({ state: 'volando' });
  assert.equal(rara.estado, 'none');
  const sinPos = new ZorraSystem();
  sinPos.deserialize({ state: 'dropped', pos: null });
  assert.equal(sinPos.estado, 'pushing');
});
