import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { Tambaleo } from '../src/systems/tambaleo.js';
import { TAMBALEO } from '../src/data/sustancias.js';
import { Player } from '../src/entities/Player.js';

const mov = (nivel = 'trabado', intensidad = 1) => ({ intensidad, nivel, moviendose: true });

test('sin intensidad o sin moverse: desvío 0 y velocidad 1', () => {
  const t = new Tambaleo();
  assert.deepEqual(t.update(0.5, { intensidad: 0, nivel: 'leve', moviendose: true }), { desvio: 0, velocidad: 1 });
  assert.deepEqual(t.update(0.5, { intensidad: 1, nivel: 'zonaRoja', moviendose: false }), { desvio: 0, velocidad: 1 });
});

test('sin tropezones el desvío y la velocidad quedan acotados', () => {
  const t = new Tambaleo();
  for (let i = 0; i < 3000; i++) {
    const r = t.update(0.05, mov('trabado'));
    assert.ok(Math.abs(r.desvio) <= TAMBALEO.desvioMax + 1e-9);
    assert.ok(Math.abs(r.velocidad - 1) <= TAMBALEO.ritmoAmplitud + 1e-9);
  }
});

test('tropieza en muyTrabado, dura la duración y luego vuelve', () => {
  const t = new Tambaleo(TAMBALEO, () => 0); // intervalo mínimo, signo positivo
  const [min] = TAMBALEO.tropezonIntervalo;
  t.update(0.01, mov('muyTrabado', 1));
  let r = t.update(min, mov('muyTrabado', 1));
  assert.equal(r.desvio, TAMBALEO.tropezonAngulo);
  r = t.update(TAMBALEO.tropezonDuracion * 0.5, mov('muyTrabado', 1));
  assert.equal(r.desvio, TAMBALEO.tropezonAngulo);
  r = t.update(TAMBALEO.tropezonDuracion, mov('muyTrabado', 1));
  assert.ok(Math.abs(r.desvio) <= TAMBALEO.desvioMax + 1e-9);
});

test('no tropieza por debajo de tropezonDesde', () => {
  const t = new Tambaleo(TAMBALEO, () => 0);
  for (let i = 0; i < 1000; i++) {
    assert.ok(Math.abs(t.update(0.05, mov('trabado')).desvio) <= TAMBALEO.desvioMax + 1e-9);
  }
});

test('reiniciar vuelve al estado inicial', () => {
  const t = new Tambaleo(TAMBALEO, () => 0);
  const a = t.update(1, mov('muyTrabado'));
  t.update(3, mov('muyTrabado'));
  t.reiniciar();
  assert.deepEqual(t.update(1, mov('muyTrabado')), a);
});

function jugador() {
  const p = Object.create(Player.prototype);
  Object.assign(p, {
    input: { axis: { x: 0, z: -1 }, isRunning: false },
    position: new THREE.Vector3(), radius: 0.4, speedWalk: 2, speedRun: 4, speedMult: 1,
    _direction: new THREE.Vector3(), _forward: new THREE.Vector3(), _right: new THREE.Vector3(),
    _delta: new THREE.Vector3(), _before: new THREE.Vector3(), root: new THREE.Group(),
    character: { update() {} }, time: 0, actionTimer: 0, modelScale: 1
  });
  return p;
}
const camara = (modo) => {
  const c = new THREE.PerspectiveCamera(); c.userData.cameraMode = modo;
  c.lookAt(0, 0, -1); c.updateMatrixWorld(true); return c;
};

for (const modo of ['third-person', 'isometric']) {
  test(`desvío gira el movimiento (${modo})`, () => {
    const base = jugador(); base.update(1, camara(modo));
    const p = jugador(); p.desvio = Math.PI / 2; p.update(1, camara(modo));
    const d = base.position.length();
    assert.ok(Math.abs(p.position.length() - d) < 1e-6);
    // perpendicular al movimiento sin desvío
    assert.ok(Math.abs(p.position.dot(base.position)) < 1e-6);
  });

  test(`tambaleoMult escala la distancia (${modo})`, () => {
    const base = jugador(); base.update(1, camara(modo));
    const p = jugador(); p.tambaleoMult = 0.5; p.update(1, camara(modo));
    assert.ok(Math.abs(p.position.length() - base.position.length() * 0.5) < 1e-6);
  });
}
