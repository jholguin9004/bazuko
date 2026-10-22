import * as THREE from 'three';

const _NIGHT = new THREE.Color(0x0c131d);     // Noche azul oscuro fría
const _DAWN = new THREE.Color(0x5a6d80);      // Amanecer andino gris azulado nítido
const _DAY = new THREE.Color(0x8898a7);       // Día bogotano nublado con luz natural
const _DUSK_SKY = new THREE.Color(0x8b5545);  // Cielo del atardecer

const _SUN_DAY = new THREE.Color(0xfff2e0);
const _SUN_DAWN = new THREE.Color(0xffd9b3);
const _SUN_DUSK = new THREE.Color(0xff8c4a);
const _SUN_NIGHT = new THREE.Color(0x506580);

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a222d);

    // Niebla atmosférica con mayor alcance para dar profundidad urbana
    this.scene.fog = new THREE.Fog(0x1a222d, 50, 180);

    // Luz ambiental: cielo azul-gris suave + rebote cálido del suelo/asfalto
    this.ambient = new THREE.HemisphereLight(0x768ba2, 0x221e1a, 0.7);
    this.scene.add(this.ambient);

    // Sol / luna (direccional) con sombra nítida y normalBias anti-acné
    this.sun = new THREE.DirectionalLight(0xffedd8, 1.2);
    this.sun.position.set(50, 80, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.camera.left = -45;
    this.sun.shadow.camera.right = 45;
    this.sun.shadow.camera.top = 45;
    this.sun.shadow.camera.bottom = -45;
    this.sun.shadow.bias = -0.0002;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun);

    this.sun.target.position.set(0, 0, 0);
    this.scene.add(this.sun.target);
  }

  /**
   * Cielo de Bogotá según la hora (0–24):
   * - Noche: azul pizarra oscuro con luz lunar
   * - Amanecer (5:30-7:30): bruma matutina andina fresca y luz dorada suave
   * - Día (8:00-17:00): cielo nublado bogotano con luz clara
   * - Atardecer (17:30-19:00): tonos cálidos ocres y ámbar
   */
  setTimeOfDay(hour) {
    const day = THREE.MathUtils.smoothstep(hour, 6.5, 8.5) * (1 - THREE.MathUtils.smoothstep(hour, 17.0, 19.0));
    const dawn = Math.max(0, 1 - Math.abs(hour - 6.2) / 1.3);
    const dusk = Math.max(0, 1 - Math.abs(hour - 18.2) / 1.2);

    this.sun.intensity = 0.2 + day * 1.8 + dawn * 0.8 + dusk * 0.9;
    this.ambient.intensity = 0.35 + day * 0.75 + dawn * 0.25;
    this.scene.environmentIntensity = 0.18 + day * 0.55;

    if (dusk > 0.1) {
      this.sun.color.copy(_SUN_DAY).lerp(_SUN_DUSK, dusk);
    } else if (dawn > 0.1) {
      this.sun.color.copy(_SUN_DAY).lerp(_SUN_DAWN, dawn);
    } else if (day > 0.1) {
      this.sun.color.copy(_SUN_DAY);
    } else {
      this.sun.color.copy(_SUN_NIGHT);
    }

    const sky = new THREE.Color().copy(_NIGHT);
    if (dawn > 0.01) sky.lerp(_DAWN, dawn * 0.85);
    if (day > 0.01) sky.lerp(_DAY, day);
    if (dusk > 0.01) sky.lerp(_DUSK_SKY, dusk * 0.65);

    this.scene.background.copy(sky);
    if (this.scene.fog) {
      this.scene.fog.color.copy(sky);
      this.scene.fog.near = 45 + day * 30;
      this.scene.fog.far = 150 + day * 80;
    }
  }

  setQuality(level = 'alta') {
    if (level === 'baja') {
      this.sun.castShadow = false;
      if (this.scene.fog) {
        this.scene.fog.near = 40;
        this.scene.fog.far = 130;
      }
    } else if (level === 'media') {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(1024, 1024);
      if (this.scene.fog) {
        this.scene.fog.near = 45;
        this.scene.fog.far = 160;
      }
    } else {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048);
    }
  }

  /** El sol (y su caja de sombras) sigue al jugador para sombras nítidas en un mapa grande */
  followTarget(pos) {
    this.sun.target.position.copy(pos);
    this.sun.position.set(pos.x + 30, 60, pos.z + 18);
  }

  /** Ajusta el color de fondo/fog según ánimo */
  applyMentalState(desaturation) {
    if (desaturation <= 0) return;
    const bg = this.scene.background;
    const fog = this.scene.fog?.color;
    if (!bg) return;

    const r = bg.r, g = bg.g, b = bg.b;
    const gray = (r + g + b) / 3;

    bg.setRGB(
      r * (1 - desaturation) + gray * desaturation,
      g * (1 - desaturation) + gray * desaturation,
      b * (1 - desaturation) + gray * desaturation
    );

    if (fog) fog.copy(bg);
  }
}
