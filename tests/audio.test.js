import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { AudioSystem } from '../src/systems/AudioSystem.js';

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, val) { store.set(key, String(val)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
  globalThis.window = new EventTarget();
});

test('AudioSystem inicializa con volumen por defecto y permite modificarlo con persistencia', () => {
  const audio = new AudioSystem();
  assert.equal(audio.volume, 0.7);
  assert.equal(audio.isMuted(), false);

  audio.setVolume(0.4);
  assert.equal(audio.volume, 0.4);
  assert.equal(localStorage.getItem('bazuko.audio_volume'), '0.4');

  // Valores fuera de rango se restringen entre 0 y 1
  audio.setVolume(1.8);
  assert.equal(audio.volume, 1.0);
  audio.setVolume(-0.5);
  assert.equal(audio.volume, 0.0);
});

test('AudioSystem alterna y recuerda el estado de silencio', () => {
  const audio = new AudioSystem();
  assert.equal(audio.isMuted(), false);

  const muted = audio.toggleMute();
  assert.equal(muted, true);
  assert.equal(audio.isMuted(), true);
  assert.equal(localStorage.getItem('bazuko.audio_muted'), 'true');

  const unmuted = audio.toggleMute();
  assert.equal(unmuted, false);
  assert.equal(audio.isMuted(), false);
  assert.equal(localStorage.getItem('bazuko.audio_muted'), 'false');
});

test('AudioSystem carga preferencias existentes de localStorage al inicializarse', () => {
  localStorage.setItem('bazuko.audio_volume', '0.25');
  localStorage.setItem('bazuko.audio_muted', 'true');

  const audio = new AudioSystem();
  assert.equal(audio.volume, 0.25);
  assert.equal(audio.isMuted(), true);
});
