import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PlayerSilhouette } from './PlayerSilhouette.js';
import { AdaptiveResolution } from './AdaptiveResolution.js';
import { FrustumCulling } from './FrustumCulling.js';
import { paintLoadingFrame } from '../ui/LoadingScreen.js';

export class Renderer {
  constructor(canvas) {
    this.instance = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.resolution = new AdaptiveResolution(window.devicePixelRatio);
    this.instance.setPixelRatio(this.resolution.ratio);
    this.instance.setSize(window.innerWidth, window.innerHeight);
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFShadowMap;

    // Look realista: tone mapping fílmico
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.15;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.silhouette = new PlayerSilhouette();
    this.culling = new FrustumCulling();
    // El contador incluye las tres pasadas, no solo la última del personaje.
    this.instance.info.autoReset = false;

    window.addEventListener('resize', () => this._onResize());
    document.addEventListener('visibilitychange', () => this.resolution.resetWindow());
  }

  setQuality(level = 'alta') {
    this.quality = level;
    try { localStorage.setItem('bazuko.graphics_quality', level); } catch { /* sin almacenamiento */ }
    if (level === 'baja') {
      this.instance.shadowMap.enabled = false;
      this.instance.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
    } else if (level === 'media') {
      this.instance.shadowMap.enabled = true;
      this.instance.shadowMap.type = THREE.PCFShadowMap;
      this.instance.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    } else {
      this.instance.shadowMap.enabled = true;
      this.instance.shadowMap.type = THREE.PCFShadowMap;
      this.instance.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }
  }

  /** Mapa de entorno neutro: da reflejos (charcos, vidrios) y luz rebotada a los materiales PBR */
  createEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.instance);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }

  _onResize() {
    this.instance.setSize(window.innerWidth, window.innerHeight);
  }

  async prepare(scene, camera, extraModels = []) {
    const textures = new Set();
    for (const root of [scene, ...extraModels]) root.traverse(object => {
      for (const material of [object.material].flat().filter(Boolean)) {
        for (const value of Object.values(material)) {
          if (value?.isTexture && !value.isRenderTargetTexture) textures.add(value);
        }
      }
    });
    let uploaded = 0;
    for (const texture of textures) {
      this.instance.initTexture(texture);
      if (++uploaded % 8 === 0) await paintLoadingFrame();
    }
    await this.instance.compileAsync(scene, camera);
    // Referencias temporales: no cambia los padres ni el LOD visible de cada NPC.
    const models = new THREE.Group();
    models.children = extraModels;
    try { await this.instance.compileAsync(models, camera, scene); }
    finally { models.children = []; }
  }

  async waitForGPU() {
    const gl = this.instance.getContext();
    if (gl.isContextLost()) throw new Error('Se perdió el contexto gráfico.');
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) throw new Error('No se pudo comprobar la preparación gráfica.');
    gl.flush();
    const deadline = performance.now() + 30000;
    try {
      while (true) {
        const result = gl.clientWaitSync(fence, 0, 0);
        if (result === gl.ALREADY_SIGNALED || result === gl.CONDITION_SATISFIED) return;
        if (result === gl.WAIT_FAILED || gl.isContextLost() || performance.now() > deadline) {
          throw new Error('No se pudo completar la preparación gráfica.');
        }
        await paintLoadingFrame();
      }
    } finally { gl.deleteSync(fence); }
  }

  render(scene, camera, playerRoot = null, shadowLights = []) {
    this.instance.info.reset();
    this.culling.apply(camera, this.instance.shadowMap.enabled ? shadowLights : []);
    try {
      this.instance.render(scene, camera);
      if (playerRoot) this.silhouette.render(this.instance, scene, camera, playerRoot);
    } finally {
      this.culling.restore();
    }
  }

  adaptResolution(frameMs) {
    if (this.resolution.sample(frameMs)) this.instance.setPixelRatio(this.resolution.ratio);
  }
}
