import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as THREE from 'three';
import { SceneManager } from '../src/core/Scene.js';

test('SceneManager ajusta sombras y niebla según nivel de calidad gráfica', () => {
  const sceneMgr = new SceneManager();
  assert.equal(sceneMgr.sun.castShadow, true);

  // Calidad baja: apaga sombras para máximo rendimiento en GPU básica
  sceneMgr.setQuality('baja');
  assert.equal(sceneMgr.sun.castShadow, false);
  assert.equal(sceneMgr.scene.fog.near, 40);

  // Calidad media: sombras ligeras
  sceneMgr.setQuality('media');
  assert.equal(sceneMgr.sun.castShadow, true);
  assert.equal(sceneMgr.sun.shadow.mapSize.x, 1024);

  // Calidad alta: sombras nítidas
  sceneMgr.setQuality('alta');
  assert.equal(sceneMgr.sun.castShadow, true);
  assert.equal(sceneMgr.sun.shadow.mapSize.x, 2048);
});
