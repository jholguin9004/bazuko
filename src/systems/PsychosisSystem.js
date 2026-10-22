// src/systems/PsychosisSystem.js
import * as THREE from 'three';

const PARANOIA_WHISPERS = [
  '¿QUIÉN ESTÁ AHÍ?',
  'TE ESTÁN SIGUIENDO',
  'NO MIRES ATRÁS',
  'TODOS TE ESTÁN MIRANDO',
  '¡VIENEN POR TI!',
  'ESTÁN EN LAS PAREDES',
  'NO CONFÍES EN NADIE',
  '¡ESOS CARROS TE VIGILAN!',
  '¡CORRE!'
];

const PARANOIA_MUTTERINGS = [
  '🗣️ "¡¡Dejen de vigilarme, sé quiénes son!!"',
  '🗣️ "¡¡Están en las sombras... nos tienen acorralados!!"',
  '🗣️ "¡¡No me toquen, aléjense de mí!!"',
  '🗣️ "¿Quién anda susurrando mi nombre?"',
  '🗣️ "¡¡Esos peatones son policías encubiertos!!"'
];

export class PsychosisSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {object} player
   * @param {object} stats
   * @param {object} audio
   * @param {object} world
   */
  constructor(scene, player = null, stats = null, audio = null, world = null) {
    this.scene = scene;
    this.player = player;
    this.stats = stats;
    this.audio = audio;
    this.world = world;

    this.shadowPeople = [];
    this.whisperTimer = 5;
    this.heartbeatTimer = 0.8;
    this.spasmTimer = 10;
    this.paranoiaUtteranceTimer = 15;
    this.active = false;

    // Elementos DOM
    this.overlayEl = null;
    this.warningEl = null;
    this.voicesEl = null;
    this._initDOM();
  }

  _initDOM() {
    if (typeof document === 'undefined') return;
    this.overlayEl = document.getElementById('psychosis-overlay');
    this.warningEl = document.getElementById('psychosis-warning');
    this.voicesEl = document.querySelector('.psychosis-voices');
  }

  /**
   * Crea una figura espectral de 'Gente Sombra'
   */
  _createShadowPerson(position) {
    if (!this.scene) return null;
    const group = new THREE.Group();

    // Material espectral negro translúcido
    const mat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      transparent: true,
      opacity: 0.78
    });

    // Cabeza
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 7), mat);
    head.position.y = 1.6;
    group.add(head);

    // Ojos rojizos brillantes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), eyeMat);
    eyeL.position.set(-0.07, 1.62, 0.18);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), eyeMat);
    eyeR.position.set(0.07, 1.62, 0.18);
    group.add(eyeL);
    group.add(eyeR);

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.75, 7), mat);
    torso.position.y = 1.1;
    group.add(torso);

    // Piernas
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 6), mat);
    legL.position.set(-0.1, 0.38, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 6), mat);
    legR.position.set(0.1, 0.38, 0);
    group.add(legL);
    group.add(legR);

    group.position.copy(position);
    this.scene.add(group);

    return {
      group,
      position: group.position,
      lifetime: 18 + Math.random() * 12,
      dissolving: false
    };
  }

  _spawnFloatingWhisper() {
    if (typeof document === 'undefined') return;
    if (!this.voicesEl && !this.overlayEl) return;
    const container = this.voicesEl ?? this.overlayEl;

    const wordEl = document.createElement('div');
    wordEl.className = 'hallucination-word';
    wordEl.textContent = PARANOIA_WHISPERS[Math.floor(Math.random() * PARANOIA_WHISPERS.length)];

    const x = 10 + Math.random() * 75;
    const y = 15 + Math.random() * 65;
    wordEl.style.left = `${x}vw`;
    wordEl.style.top = `${y}vh`;

    container.appendChild(wordEl);
    setTimeout(() => {
      wordEl.remove();
    }, 3400);
  }

  _clearShadowPeople() {
    for (const sp of this.shadowPeople) {
      this.scene?.remove(sp.group);
      sp.group.traverse((o) => {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
      });
    }
    this.shadowPeople = [];
  }

  /**
   * Actualiza el sistema de psicosis y alucinaciones por abstinencia.
   * @param {number} dt
   * @param {object} cameraRig
   */
  update(dt, cameraRig = null) {
    const abstinencia = this.stats?.abstinencia ?? 0;
    const isHigh = abstinencia >= 50;

    if (!isHigh) {
      if (this.active) {
        this.active = false;
        this._clearShadowPeople();
        if (typeof document !== 'undefined') {
          this.overlayEl?.classList.remove('active');
          if (this.warningEl) this.warningEl.style.display = 'none';
          const canvas = document.getElementById('game-canvas');
          if (canvas) canvas.style.filter = '';
        }
        if (cameraRig?.camera) {
          cameraRig.camera.fov = cameraRig.baseFov ?? 55;
          cameraRig.camera.updateProjectionMatrix();
        }
      }
      return;
    }

    this.active = true;
    const severity = Math.min(1, Math.max(0, (abstinencia - 50) / 50)); // 0 a 1

    // 1. Efectos DOM y distorsión cromática visual
    if (typeof document !== 'undefined') {
      if (!this.overlayEl) this._initDOM();
      this.overlayEl?.classList.add('active');
      if (this.warningEl) {
        this.warningEl.style.display = abstinencia >= 80 ? 'block' : 'none';
      }

      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        const time = performance.now();
        const hue = Math.sin(time * 0.003) * 14 * severity;
        const contrast = 100 + 40 * severity;
        const sat = 100 + 45 * severity;
        canvas.style.filter = `contrast(${contrast.toFixed(1)}%) saturate(${sat.toFixed(1)}%) hue-rotate(${hue.toFixed(1)}deg)`;
      }
    }

    // 2. Distorsión de cámara: respiración de FOV y temblor
    if (cameraRig?.camera) {
      const time = performance.now();
      const fovPulse = Math.sin(time * 0.0045) * 3.2 * severity;
      cameraRig.camera.fov = (cameraRig.baseFov ?? 55) + fovPulse;
      if (severity > 0.6) {
        cameraRig.camera.rotation.z += (Math.random() - 0.5) * 0.007 * severity;
      }
      cameraRig.camera.updateProjectionMatrix();
    }

    // 3. Alucinaciones auditivas: latidos cardíacos taquicárdicos y susurros
    this.heartbeatTimer -= dt;
    if (this.heartbeatTimer <= 0) {
      this.audio?.playHeartbeat?.(severity);
      this.heartbeatTimer = 0.95 - 0.42 * severity;
    }

    this.whisperTimer -= dt;
    if (this.whisperTimer <= 0) {
      this.audio?.playPsychosisWhisper?.();
      this._spawnFloatingWhisper();
      this.whisperTimer = 6.5 + Math.random() * 7;
    }

    // 4. Sombras espectrales (Gente Sombra)
    const playerPos = this.player?.position;
    if (playerPos && this.scene) {
      // Generar sombra si hay menos de 3
      if (this.shadowPeople.length < 3 && Math.random() < 0.025) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 14 + Math.random() * 9;
        const spawnX = playerPos.x + Math.cos(angle) * dist;
        const spawnZ = playerPos.z + Math.sin(angle) * dist;
        const spawnY = this.world?.active?.getGroundHeight?.(spawnX, spawnZ) ?? 0;
        const sp = this._createShadowPerson(new THREE.Vector3(spawnX, spawnY, spawnZ));
        if (sp) this.shadowPeople.push(sp);
      }

      // Actualizar sombras existentes
      for (let i = this.shadowPeople.length - 1; i >= 0; i--) {
        const sp = this.shadowPeople[i];
        sp.lifetime -= dt;

        // Mirar hacia el jugador
        sp.group.lookAt(playerPos.x, sp.position.y + 1.6, playerPos.z);

        const distToPlayer = sp.position.distanceTo(playerPos);
        // Si el jugador se acerca demasiado o la sombra expira, se desvanece
        if (distToPlayer < 5.5 || sp.lifetime <= 0) {
          sp.dissolving = true;
        }

        if (sp.dissolving) {
          sp.group.position.y += dt * 0.4;
          let allFaded = true;
          sp.group.traverse((o) => {
            if (o.material?.opacity !== undefined) {
              o.material.opacity = Math.max(0, o.material.opacity - dt * 2.5);
              if (o.material.opacity > 0.02) allFaded = false;
            }
          });
          if (allFaded) {
            this.scene.remove(sp.group);
            sp.group.traverse((o) => {
              o.geometry?.dispose?.();
              o.material?.dispose?.();
            });
            this.shadowPeople.splice(i, 1);
          }
        }
      }
    }

    // 5. Comportamientos extraños del personaje: espasmos motores involuntarios
    this.spasmTimer -= dt;
    if (this.spasmTimer <= 0) {
      this.player?.playAction?.('temblor', 0.55);
      this.audio?.playPsychosisWhisper?.();
      this.spasmTimer = 10 + Math.random() * 8;
    }

    // 6. Delirios verbales involuntarios
    this.paranoiaUtteranceTimer -= dt;
    if (this.paranoiaUtteranceTimer <= 0) {
      const msg = PARANOIA_MUTTERINGS[Math.floor(Math.random() * PARANOIA_MUTTERINGS.length)];
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('toast', { detail: { text: msg, type: 'warn' } }));
      }
      this.paranoiaUtteranceTimer = 16 + Math.random() * 12;
    }
  }

  dispose() {
    this._clearShadowPeople();
    if (typeof document !== 'undefined') {
      this.overlayEl?.classList.remove('active');
      const canvas = document.getElementById('game-canvas');
      if (canvas) canvas.style.filter = '';
    }
  }
}
