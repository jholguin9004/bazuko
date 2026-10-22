import * as THREE from 'three';

const _DAY = new THREE.Color(0x9aa5b1);      // nublado bogotano
const _NIGHT = new THREE.Color(0x0b0f18);
const _DUSK = new THREE.Color(0xff9a55);
const _DUSK_SKY = new THREE.Color(0xc07a5a);

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1d); // gris muy oscuro

    // Niebla Noir: oculta el final del mundo
    this.scene.fog = new THREE.Fog(0x1a1a1d, 30, 120);

    // Color base del cielo (sin desaturación); applyMentalState siempre parte de aquí
    this._fondoBase = this.scene.background.clone();

    // Luz ambiental fría (brutalismo)
    this.ambient = new THREE.HemisphereLight(0x556070, 0x0a0a0a, 0.6);
    this.scene.add(this.ambient);

    // Sol / luna (direccional)
    this.sun = new THREE.DirectionalLight(0xffe4b5, 1.0);
    this.sun.position.set(50, 80, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -45;
    this.sun.shadow.camera.right = 45;
    this.sun.shadow.camera.top = 45;
    this.sun.shadow.camera.bottom = -45;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);

    this.sun.target.position.set(0, 0, 0);
    this.scene.add(this.sun.target);
  }

  /**
   * Cielo de Bogotá según la hora (0–24): de día nublado gris azulado, atardecer cálido,
   * de noche azul muy oscuro (las luces de la calle y las ventanas hacen el resto).
   */
  setTimeOfDay(hour) {
    const day = THREE.MathUtils.smoothstep(hour, 5.5, 7.5) * (1 - THREE.MathUtils.smoothstep(hour, 17.5, 19.5));
    const dusk = Math.max(0, 1 - Math.abs(hour - 18.3) / 1.3) + Math.max(0, 1 - Math.abs(hour - 6) / 1);
    this.sun.intensity = 0.1 + day * 2.2;
    this.ambient.intensity = 0.25 + day * 0.9;
    this.scene.environmentIntensity = 0.12 + day * 0.55;
    this.sun.color.set(0xffe8cc).lerp(_DUSK, Math.min(1, dusk) * 0.6);
    this.scene.background.copy(_NIGHT).lerp(_DAY, day).lerp(_DUSK_SKY, Math.min(1, dusk) * 0.35);
    this.scene.fog.color.copy(this.scene.background);
    this._fondoBase.copy(this.scene.background);
    this.scene.fog.near = 35 + day * 25;
    this.scene.fog.far = 110 + day * 60;
  }

  /** El sol (y su caja de sombras) sigue al jugador para sombras nítidas en un mapa grande */
  followTarget(pos) {
    this.sun.target.position.copy(pos);
    this.sun.position.set(pos.x + 30, 60, pos.z + 18);
  }

  /**
   * Ajusta el color de fondo/fog según el ánimo. Parte siempre del color base que dejó
   * setTimeOfDay, así que es idempotente: llamarlo en cada cuadro no acumula desaturación.
   */
  applyMentalState(desaturation) {
    // desaturation: 0 = normal, 1 = gris total
    const bg = this.scene.background;
    const fog = this.scene.fog?.color;
    if (!bg) return;

    bg.copy(this._fondoBase);

    if (desaturation > 0) {
      const { r, g, b } = this._fondoBase;
      const gray = (r + g + b) / 3;
      bg.setRGB(
        r * (1 - desaturation) + gray * desaturation,
        g * (1 - desaturation) + gray * desaturation,
        b * (1 - desaturation) + gray * desaturation
      );
    }

    if (fog) fog.copy(bg);
  }
}
