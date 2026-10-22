import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import * as THREE from 'three';
import { ALUCINACIONES } from '../src/data/sustancias.js';
import { tirarSombra, tirarTesoroFalso, puntoDeAparicion, decidirSombra, elegirTexto } from '../src/systems/alucinaciones.js';
import { Pickup } from '../src/entities/Pickup.js';

// Solo se sustituye la carga de modelos GLB: el personaje es un grupo con una malla.
mock.module('../src/character/RealisticCharacter.js', { namedExports: {
  REALISTIC_SCALE: 1.08,
  createRealisticCharacter: async () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshLambertMaterial({ color: 0xff0000 })));
    return { group, update() {} };
  },
  loadCatalog: async () => ({}), normalizeReal: (_, look) => look,
  optionsFor: () => [{ id: 'test' }]
} });
const { Sombra } = await import('../src/entities/Sombra.js');
const { Alucinaciones } = await import('../src/entities/Alucinaciones.js');

test('sin peso de sombras o con el máximo, no aparecen', () => {
  assert.equal(tirarSombra({ efectos: { sombras: 0 }, activas: 0, dt: 1, random: () => 0 }), false);
  assert.equal(tirarSombra({ efectos: { sombras: 1 }, activas: 3, dt: 1, random: () => 0 }), false);
  assert.equal(tirarSombra({ efectos: { sombras: 1 }, activas: 0, dt: 1, random: () => 0.079 }), true);
  assert.equal(tirarSombra({ efectos: { sombras: 1 }, activas: 0, dt: 1, random: () => 0.081 }), false);
});

test('los tesoros falsos respetan su peso y su máximo', () => {
  assert.equal(tirarTesoroFalso({ efectos: { tesorosFalsos: 0 }, activos: 0, dt: 1, random: () => 0 }), false);
  assert.equal(tirarTesoroFalso({ efectos: { tesorosFalsos: 1 }, activos: 1, dt: 1, random: () => 0 }), false);
  assert.equal(tirarTesoroFalso({ efectos: { tesorosFalsos: 1 }, activos: 0, dt: 1, random: () => 0.049 }), true);
  assert.equal(tirarTesoroFalso({ efectos: { tesorosFalsos: 1 }, activos: 0, dt: 1, random: () => 0.051 }), false);
});

test('aparece detrás del jugador a la distancia configurada', () => {
  assert.deepEqual(puntoDeAparicion({ x: 0, z: 0 }, { x: 0, z: -2 }, ALUCINACIONES), { x: 0, z: 12 });
});

test('decidirSombra: alcanza, persigue o se desvanece', () => {
  assert.equal(decidirSombra({ distancia: 0.5, nivel: 'muyTrabado' }), 'alcanza');
  assert.equal(decidirSombra({ distancia: 5, nivel: 'zonaRoja' }), 'persigue');
  assert.equal(decidirSombra({ distancia: 5, nivel: 'trabado' }), 'desvanece');
  assert.equal(decidirSombra({ distancia: 30, nivel: 'muyTrabado' }), 'desvanece');
});

test('elegirTexto toma un elemento de la lista', () => {
  assert.equal(elegirTexto(['a', 'b', 'c'], () => 0.99), 'c');
  assert.equal(elegirTexto(['a', 'b', 'c'], () => 0), 'a');
});

test('el tesoro falso brilla, está vacío y no consume la bolsa real', () => {
  const p = new Pickup(new THREE.Scene(), new THREE.Vector3());
  let avisos = 0; p.onFalsoTesoro = () => avisos++;
  p.setFalsoTesoro(true);
  p.update(1); assert.ok(p.aura.material.opacity > 0);
  assert.equal(p.harvest(), null); assert.equal(avisos, 1);
  assert.equal(p.used, false); assert.equal(p.falsoTesoro, false);
  assert.ok(p.harvest()?.items.length > 0);
});

test('la sombra persigue sin salirse de lo caminable y es oscura', async () => {
  const s = new Sombra(new THREE.Scene(), new THREE.Vector3(0, 0, 0), { isWalkable: (x) => x <= 5 });
  await s.ready;
  s.activar(new THREE.Vector3(0, 0, 0), 2); s.objetivo = new THREE.Vector3(10, 0, 0);
  s.update(1, {}); assert.ok(Math.abs(s.position.x - 2) < 1e-6);
  for (let i = 0; i < 10; i++) s.update(1, {});
  assert.ok(s.position.x <= 5);
  s.root.traverse(o => { if (o.isMesh) assert.equal(o.material.color.getHex(), 0x000000); });
});

test('al alcanzar castiga, avisa una vez y libera la sombra', async () => {
  const navigation = {
    isWalkableAt: () => true,
    nearestPoint: (x, z) => new THREE.Vector3(x, 0, z)
  };
  const aluc = new Alucinaciones(new THREE.Scene());
  await aluc.precargar(navigation);
  assert.equal(aluc.sombras.length, ALUCINACIONES.maxSombras);
  aluc.sombras[0].activar(new THREE.Vector3(0.5, 0, 0), 1);
  const stats = { animo: 50, salud: 50 };
  const avisos = [];
  const ctx = {
    efectos: { nivel: 'muyTrabado', sombras: 0, tesorosFalsos: 0, velocidadSombra: 1 },
    jugador: new THREE.Vector3(0, 0, 0), frente: new THREE.Vector3(0, 0, -1),
    navigation, pickups: [], stats, avisar: (texto, tipo) => avisos.push({ texto, tipo })
  };
  aluc.update(0.016, ctx);
  assert.equal(stats.animo, 50 - ALUCINACIONES.castigoAnimo);
  assert.equal(stats.salud, 50 - ALUCINACIONES.castigoSalud);
  aluc.update(ALUCINACIONES.desvanecerSeg + 0.1, ctx);
  assert.equal(avisos.length, 1);
  assert.equal(aluc.activas, 0);
  assert.equal(aluc.sombras[0].root.visible, false);
  assert.equal(stats.animo, 50 - ALUCINACIONES.castigoAnimo);
});

test('el tesoro falso aparece en la bolsa cercana y se apaga sin traba', () => {
  const aluc = new Alucinaciones(new THREE.Scene());
  const scene = new THREE.Scene();
  const cerca = new Pickup(scene, new THREE.Vector3(3, 0, 0));
  const lejos = new Pickup(scene, new THREE.Vector3(40, 0, 0));
  const avisos = [];
  const ctx = {
    efectos: { nivel: 'muyTrabado', sombras: 0, tesorosFalsos: 1, velocidadSombra: 1 },
    jugador: new THREE.Vector3(0, 0, 0), frente: new THREE.Vector3(0, 0, -1),
    navigation: { isWalkableAt: () => true, nearestPoint: (x, z) => new THREE.Vector3(x, 0, z) },
    pickups: [lejos, cerca], stats: { animo: 50, salud: 50 }, avisar: (texto, tipo) => avisos.push({ texto, tipo })
  };
  aluc.update(1000, ctx); // probabilidad efectiva 1
  assert.equal(cerca.falsoTesoro, true);
  assert.equal(lejos.falsoTesoro, false);
  assert.equal(cerca.harvest(), null);
  assert.equal(avisos.length, 1);
  cerca.setFalsoTesoro(true);
  aluc.update(0.016, { ...ctx, efectos: { ...ctx.efectos, tesorosFalsos: 0 } });
  assert.equal(cerca.falsoTesoro, false);
});

test('la sombra con groundHeight conserva y = groundHeight(x, z) al caminar', async () => {
  const altura = (x, z) => 0.2 + x * 0.1 + z * 0.05;
  const s = new Sombra(new THREE.Scene(), new THREE.Vector3(), { isWalkable: () => true, groundHeight: altura });
  await s.ready;
  s.activar(new THREE.Vector3(0, 0, 0), 2); s.objetivo = new THREE.Vector3(4, 0, 2);
  s.update(0.5, {});
  assert.ok(s.position.x > 0);
  assert.ok(Math.abs(s.position.y - altura(s.position.x, s.position.z)) < 1e-9);
});

test('precargar pasa groundHeight de la navegación y es idempotente', async () => {
  const navigation = { isWalkableAt: () => true, nearestPoint: (x, z) => new THREE.Vector3(x, 0, z), groundHeight: () => 1.5 };
  const aluc = new Alucinaciones(new THREE.Scene());
  const p = aluc.precargar(navigation);
  assert.equal(aluc.precargar(navigation), p);
  await p;
  assert.equal(aluc.sombras[0].groundHeight(0, 0), 1.5);
  assert.ok(aluc.sombras.every((s) => s.fullChar));
});

test('no aparece una sombra más cerca de distanciaMinAparicion del jugador', async () => {
  const aluc = new Alucinaciones(new THREE.Scene());
  const navegacion = (dx) => ({ isWalkableAt: () => true, nearestPoint: (x, z) => new THREE.Vector3(dx, 0, 0) });
  await aluc.precargar(navegacion(0));
  const ctx = (nav) => ({
    efectos: { nivel: 'muyTrabado', sombras: 1, tesorosFalsos: 0, velocidadSombra: 1 },
    jugador: new THREE.Vector3(0, 0, 0), frente: new THREE.Vector3(0, 0, -1),
    navigation: nav, pickups: [], stats: { animo: 50, salud: 50 }, avisar() {}
  });
  aluc.update(1000, ctx(navegacion(ALUCINACIONES.distanciaMinAparicion - 1)));
  assert.equal(aluc.activas, 0);
  aluc.update(1000, ctx(navegacion(ALUCINACIONES.distanciaMinAparicion + 1)));
  assert.equal(aluc.activas, 1);
});
