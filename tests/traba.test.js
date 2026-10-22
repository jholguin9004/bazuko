import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TrabaSystem, nivelDe, calcularMareo } from '../src/systems/TrabaSystem.js';
import { PERFILES, TRABA, BAJONES, MAREO } from '../src/data/sustancias.js';
import { DECAY } from '../src/utils/constants.js';

const stats = () => ({ animo: 50, energia: 50, hambre: 50, vicio: 50, salud: 100 });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test('el bazuco pega de una; la pastilla tarda', () => {
  const a = new TrabaSystem(); a.consumir('bazuco'); a.update(1, stats());
  near(a.traba, 40 - (TRABA.decaimientoBase + 40 / 45) * 1);
  const b = new TrabaSystem(); b.consumir('pastilla'); b.update(1, stats());
  near(b.traba, 35 / 40 - TRABA.decaimientoBase);
});
test('mezclar acumula: pastilla + bazuco es muy trabado; + pegante es zona roja', () => {
  const s = new TrabaSystem(), st = stats();
  s.consumir('pastilla'); for (let i = 0; i < 40; i++) s.update(1, st);
  s.consumir('bazuco'); s.update(1, st);
  assert.equal(s.nivel, 'muyTrabado');
  s.consumir('pegante'); for (let i = 0; i < 5; i++) s.update(1, st);
  assert.equal(s.nivel, 'zonaRoja');
});
test('niveles por umbral', () => {
  assert.deepEqual([0, 29.9, 30, 60, 85, 100].map(t => nivelDe(t)),
    ['leve', 'leve', 'trabado', 'muyTrabado', 'zonaRoja', 'colapso']);
});
test('dominante: la dosis con más aporte reciente', () => {
  const s = new TrabaSystem(), st = stats();
  s.consumir('pastilla'); for (let i = 0; i < 10; i++) s.update(1, st);
  s.consumir('bazuco'); s.update(1, st);
  assert.equal(s.dominante(), 'bazuco');
  const t = new TrabaSystem(); t.consumir('tintico'); t.consumir('pegante');
  for (let i = 0; i < 5; i++) t.update(1, st);
  assert.equal(t.dominante(), 'pegante');
});
test('velocidad: bazuco trabado ×1.25; tintico leve ×1.03; sobrio ×1', () => {
  const s = new TrabaSystem(); s.consumir('bazuco'); s.update(1, stats());
  near(s.getSpeedMultiplier(), 1.25);
  const t = new TrabaSystem(); t.consumir('tintico'); t.update(1, stats()); t.update(1, stats());
  near(t.getSpeedMultiplier(), 1 + 0.25 * 0.4 * 0.3);
  assert.equal(new TrabaSystem().getSpeedMultiplier(), 1);
});
test('mareo: 0 en leve; pegante muy trabado 0.5; zona roja 1', () => {
  const s = new TrabaSystem();
  s.dosis = [{ id: 'pegante', pendiente: 0, restante: 100 }];
  s.traba = 10; assert.equal(s.efectos().mareo, 0);
  s.traba = 70; near(s.efectos().mareo, 0.5);
  s.traba = 90; near(s.efectos().mareo, 1);
});
test('sombras y tesoros solo desde muy trabado', () => {
  const s = new TrabaSystem();
  s.dosis = [{ id: 'bazuco', pendiente: 0, restante: 100 }];
  s.traba = 59;
  assert.equal(s.efectos().sombras, 0); assert.equal(s.efectos().tesorosFalsos, 0);
  s.traba = 60;
  assert.equal(s.efectos().sombras, 1);
  near(s.efectos().tesorosFalsos, PERFILES.bazuco.pesos.tesorosFalsos);
});
test('el bajón llega al terminar la dosis y resta su total', () => {
  const s = new TrabaSystem(), st = stats();
  s.consumir('tintico'); for (let i = 0; i < 60; i++) s.update(1, st);
  assert.equal(s.dosis.length, 0); assert.equal(s.bajones.length, 1);
  const antes = { ...st };
  for (let i = 0; i < BAJONES.leve.duracion; i++) s.update(1, st);
  near(st.animo, antes.animo - BAJONES.leve.animo);
  near(st.energia, antes.energia - BAJONES.leve.energia);
  near(st.vicio, antes.vicio - DECAY.vicio * (BAJONES.leve.vicioMult - 1) * BAJONES.leve.duracion);
  assert.equal(s.bajones.length, 0);
});
test('trabado: euforia sube el ánimo y frena hambre/energía', () => {
  const s = new TrabaSystem(), st = stats();
  s.consumir('bazuco'); s.update(1, st);
  near(st.animo, 50 + TRABA.euforiaAnimoPorSeg * 0.5 * 1 * 1);
  near(st.hambre, 50 + DECAY.hambre * TRABA.frenoNecesidades * 1);
});
test('zona roja quita salud por segundo; colapso a 100 y recorta', () => {
  const s = new TrabaSystem(), st = stats();
  for (let i = 0; i < 3; i++) s.consumir('bazuco');
  const r = s.update(1, st);
  assert.equal(r.colapso, true); assert.ok(s.traba <= TRABA.max);
  near(st.salud, 100 - TRABA.saludZonaRojaPorSeg * 1);
});
test('consumir algo sin perfil no suma traba', () => {
  const s = new TrabaSystem();
  assert.equal(s.consumir('cigarrillo'), false); assert.equal(s.dosis.length, 0);
});
test('cortar convierte dosis en bajones; reiniciar limpia todo', () => {
  const s = new TrabaSystem();
  s.consumir('pegante'); s.consumir('bazuco'); s.update(1, stats());
  s.cortar();
  assert.equal(s.traba, 0); assert.deepEqual(s.dosis, []); assert.equal(s.bajones.length, 2);
  s.reiniciar();
  assert.deepEqual(s.bajones, []); assert.equal(s.traba, 0);
});
test('serializa y carga; partida antigua y datos corruptos', () => {
  const s = new TrabaSystem(); s.consumir('pegante'); s.update(2, stats());
  const copia = new TrabaSystem(); copia.deserialize(JSON.parse(JSON.stringify(s.serialize())));
  assert.deepEqual(copia.serialize(), s.serialize());
  const vieja = new TrabaSystem(); vieja.deserialize(undefined);
  assert.deepEqual(vieja.serialize(), { traba: 0, dosis: [], bajones: [] });
  const rota = new TrabaSystem();
  rota.deserialize({ traba: 250, dosis: [{ id: 'nada', pendiente: 1, restante: 1 }], bajones: [{ id: 'x', restante: NaN }] });
  assert.deepEqual(rota.serialize(), { traba: 100, dosis: [], bajones: [] });
});
test('calcularMareo: cero sin intensidad, acotado por la amplitud', () => {
  assert.deepEqual(calcularMareo(3.7, 0), { lateral: 0, alabeo: 0 });
  for (let t = 0; t < 20; t += 0.1) {
    const m = calcularMareo(t, 1);
    assert.ok(Math.abs(m.lateral) <= MAREO.amplitudLateral + 1e-12);
    assert.ok(Math.abs(m.alabeo) <= MAREO.amplitudAlabeo + 1e-12);
  }
  near(calcularMareo(1 / (4 * MAREO.frecuenciaLateral), 1).lateral, MAREO.amplitudLateral);
});
