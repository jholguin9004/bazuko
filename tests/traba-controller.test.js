import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as THREE from 'three';
import { Game } from '../src/core/game.js';
import { TrabaController } from '../src/core/TrabaController.js';
import { TrabaSystem } from '../src/systems/TrabaSystem.js';
import { StatsSystem } from '../src/systems/StatsSystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { COLAPSO, MAREO } from '../src/data/sustancias.js';

beforeEach(() => { globalThis.window = new EventTarget(); });

const stub = () => ({ precargar() {}, update() {}, limpiar() {}, fundir() {}, reiniciar() {} });

function fixture() {
  const game = {
    stats: new StatsSystem(),
    inventory: new InventorySystem(),
    clock: { hour: 23, day: 1 },
    menu: { isOpen: false, open(options) { this.options = options; this.isOpen = true; }, close() { this.isOpen = false; } },
    cameraRig: {},
    sceneMgr: { applyMentalState(d) { this.d = d; } },
    world: { active: null },
    player: { position: new THREE.Vector3() },
    input: { keys: {}, endFrame() {} },
    saved: 0,
    reubicado: 0,
    _save() { this.saved++; },
    _reubicarJugador() { this.reubicado++; }
  };
  const c = Object.assign(Object.create(TrabaController.prototype), {
    sistema: new TrabaSystem(), game, overlay: stub(), alucinaciones: stub(), _t: 0
  });
  return { c, game };
}

test('traba 100 con salud abre el colapso una vez y pausa', () => {
  const { c, game } = fixture();
  for (let i = 0; i < 3; i++) c.consumir('bazuco');
  assert.equal(c.update(1), true);
  assert.equal(game.menu.options.dismissible, false);
  assert.equal(game.menu.options.title, 'Colapsaste');
  assert.equal(c.update(1), false); // no reabre
});

test('si la salud ya es 0, gana la muerte normal', () => {
  const { c, game } = fixture(); game.stats.salud = 0;
  for (let i = 0; i < 3; i++) c.consumir('bazuco');
  assert.equal(c.update(1), false); assert.equal(game.menu.isOpen, false);
});

test('despertar aplica el colapso, reubica, guarda y cierra', () => {
  const { c, game } = fixture(); game.stats.dinero = 10000;
  c.sistema.consumir('bazuco'); c._abrirColapso(); c._despertar();
  assert.equal(game.stats.dinero, 6000); assert.equal(game.stats.salud, COLAPSO.salud);
  assert.equal(c.sistema.traba, 0); assert.equal(game.saved, 1); assert.equal(game.reubicado, 1);
  assert.equal(game.menu.isOpen, false); assert.deepEqual(game.clock, { hour: 3, day: 2 });
});

test('el mareo llega a cámara y escena; sobrio todo en cero', () => {
  const { c, game } = fixture(); c.update(0.1);
  assert.equal(game.sceneMgr.d, 0); assert.equal(game.cameraRig.lateral, 0);
  c.sistema.traba = 90; c.sistema.dosis = [{ id: 'pegante', pendiente: 0, restante: 100 }];
  c.update(0.1); assert.equal(game.sceneMgr.d, MAREO.desaturacionMax);
});

const controladorSinDom = () => Object.assign(Object.create(TrabaController.prototype), { sistema: new TrabaSystem() });

test('guardar y cargar la traba; partida antigua carga en 0', () => {
  let data = { player: { pos: [0, 0, 0] }, stats: {}, clock: {}, inventory: {} };
  const serializable = { deserialize() {}, serialize() { return {}; } };
  const crearJuego = (traba) => Object.assign(Object.create(Game.prototype), {
    world: { active: null }, player: { position: new THREE.Vector3() },
    save: { load: () => data, save: state => { data = state; } },
    stats: serializable, clock: serializable, inventory: serializable, talents: serializable, diseases: serializable,
    traba
  });
  const game = crearJuego(controladorSinDom());
  game.traba.sistema.consumir('pegante');
  game._save();
  assert.equal(data.traba.dosis.length, 1);

  const { traba, ...antigua } = data;
  data = antigua;
  const otro = crearJuego(controladorSinDom());
  otro.traba.sistema.traba = 50;
  otro.traba.sistema.consumir('bazuco');
  otro._loadIfSave();
  assert.equal(otro.traba.sistema.traba, 0);
  assert.deepEqual(otro.traba.sistema.dosis, []);
});

test('morir trabado reinicia la traba al reaparecer', () => {
  const game = Object.assign(Object.create(Game.prototype), {
    stats: new StatsSystem(), deathCount: 0, _deathPending: false,
    talents: { getEffect: (key, fallback) => fallback }, clock: { isNight: false },
    player: { position: new THREE.Vector3(40, 0, 26), root: new THREE.Group() },
    world: { active: { reserved: { bed: { x: 89, z: 80 } } } },
    input: { keys: { KeyW: true }, endFrame() {} },
    audio: { updateSteps() {} },
    interaction: { currentTarget: {}, currentTargetType: 'shop' },
    menu: { isOpen: false, open(options) { this.options = options; this.isOpen = true; }, close() { this.isOpen = false; } },
    creator: { isOpen: false },
    diseases: { hasAny: false, cureAll() { this.hasAny = false; } },
    inventory: new InventorySystem(),
    cameraRig: { follow(position) { this.target = position.clone(); } }
  });
  const traba = Object.assign(Object.create(TrabaController.prototype), {
    sistema: new TrabaSystem(), game, overlay: stub(), alucinaciones: stub(), _t: 0
  });
  traba.sistema.traba = 90;
  traba.sistema.consumir('pastilla');
  game.traba = traba;
  game.stats.salud = 0;
  assert.equal(game._handleDeath(), true);
  game._respawn();
  assert.deepEqual(traba.sistema.serialize(), { traba: 0, dosis: [], bajones: [] });
  assert.equal(game.paused, false);
});

test('sobrio deja desvío 0 y mult 1; reiniciar los restablece', () => {
  const { c, game } = fixture();
  game.input.axis = { x: 0, z: -1 };
  c.update(0.1);
  assert.equal(game.player.desvio, 0); assert.equal(game.player.tambaleoMult, 1);
  c.sistema.traba = 90; c.sistema.dosis = [{ id: 'pegante', pendiente: 0, restante: 100 }];
  c.update(2);
  assert.notEqual(game.player.desvio, 0);
  c.reiniciar();
  assert.equal(game.player.desvio, 0); assert.equal(game.player.tambaleoMult, 1);
});
