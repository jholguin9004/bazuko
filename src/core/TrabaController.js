// src/core/TrabaController.js
// Une la lógica pura de la traba con el juego: cámara, escena, viñeta, alucinaciones y colapso.
import * as THREE from 'three';
import { TrabaSystem, calcularMareo, NIVELES } from '../systems/TrabaSystem.js';
import { aplicarColapso } from '../systems/colapso.js';
import { elegirTexto } from '../systems/alucinaciones.js';
import { Alucinaciones } from '../entities/Alucinaciones.js';
import { TrabaOverlay } from '../ui/TrabaOverlay.js';
import { MAREO, TEXTOS } from '../data/sustancias.js';
import { el, button } from '../ui/dom.js';
import { cop } from '../utils/money.js';

const NIVEL_ALUCINACIONES = NIVELES.indexOf('trabado');

const avisar = (text, type) => {
  window.dispatchEvent(new CustomEvent('toast', { detail: { text, type } }));
};

export class TrabaController {
  constructor(game) {
    this.game = game;
    this.sistema = new TrabaSystem();
    game.stats.trabaSystem = this.sistema;
    this.overlay = new TrabaOverlay();
    this.alucinaciones = new Alucinaciones(game.sceneMgr.scene);
    this._t = 0;
    this._colapsoAbierto = false;
  }

  consumir(id) {
    return this.sistema.consumir(id);
  }

  /** Avanza la traba un cuadro. Devuelve true si se abrió el colapso (el cuadro se detiene). */
  update(dt) {
    const { game } = this;
    const r = this.sistema.update(dt, game.stats);
    if (r.cambioNivel && r.nivel === 'zonaRoja') avisar(elegirTexto(TEXTOS.zonaRoja), 'warn');
    if (r.colapso && game.stats.salud > 0 && !this._colapsoAbierto) {
      this._abrirColapso();
      return true;
    }

    const navigation = game.world?.active?.pedestrianNavigation;
    if (navigation && NIVELES.indexOf(r.nivel) >= NIVEL_ALUCINACIONES) this.alucinaciones.precargar(navigation);

    const efectos = this.sistema.efectos();
    this._t += dt;
    const mareo = calcularMareo(this._t, efectos.mareo);
    game.cameraRig.lateral = mareo.lateral;
    game.cameraRig.alabeo = mareo.alabeo;
    game.sceneMgr.applyMentalState(efectos.mareo * MAREO.desaturacionMax);
    this.overlay.update(this.sistema.traba, efectos);

    const camera = game.cameraRig.camera;
    this.alucinaciones.update(dt, {
      efectos,
      jugador: game.player.position,
      frente: camera ? this._frente(camera) : null,
      frustum: camera ? this._frustum(camera) : null,
      navigation,
      pickups: game.pickups,
      stats: game.stats,
      avisar
    });
    return false;
  }

  /** Corta el efecto (al dormir): la traba pasa a bajón y se apagan las alucinaciones */
  cortar() {
    this.sistema.cortar();
    this.alucinaciones.limpiar();
  }

  reiniciar() {
    this.sistema.reiniciar();
    this.alucinaciones.limpiar();
    this.overlay.reiniciar();
    this._quitarBalanceo();
    this._colapsoAbierto = false;
  }

  serialize() {
    return this.sistema.serialize();
  }

  deserialize(d) {
    this.sistema.deserialize(d);
  }

  _abrirColapso() {
    const { game } = this;
    this._colapsoAbierto = true;
    this.overlay.fundir(true);
    game.input.keys = {};
    game.input.endFrame();
    game.menu.open({
      title: 'Colapsaste',
      sub: elegirTexto(TEXTOS.colapso),
      ic: 'moon',
      dismissible: false,
      render: () => ({
        body: el('p', { text: 'Te robaron mientras estabas tirado. Despiertas donde caíste, con el bajón encima.' }),
        foot: [button('Despertar', { primary: true, onClick: () => this._despertar() })]
      })
    });
  }

  _despertar() {
    const { game } = this;
    const { robado, posicion } = aplicarColapso({
      stats: game.stats,
      inventory: game.inventory,
      clock: game.clock,
      sistema: this.sistema,
      posicion: game.player.position,
      navegacion: game.world?.active?.pedestrianNavigation
    });
    game.player.position.set(posicion.x, posicion.y, posicion.z);
    game._reubicarJugador();
    this.alucinaciones.limpiar();
    this.overlay.reiniciar();
    this._quitarBalanceo();
    game._save();
    game.menu.close();
    avisar(`🚨 Te robaron ${cop(robado)} y material mientras estabas tirado.`, 'death');
    this._colapsoAbierto = false;
  }

  _quitarBalanceo() {
    const rig = this.game?.cameraRig;
    if (!rig) return;
    rig.lateral = 0;
    rig.alabeo = 0;
  }

  /** Dirección de la cámara en el plano XZ */
  _frente(camera) {
    const v = camera.getWorldDirection(this._dir ??= new THREE.Vector3());
    const largo = Math.hypot(v.x, v.z);
    if (!largo) return null;
    const f = this._frenteXZ ??= { x: 0, z: 0 };
    f.x = v.x / largo;
    f.z = v.z / largo;
    return f;
  }

  _frustum(camera) {
    const m = (this._matriz ??= new THREE.Matrix4())
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    return (this._frustumCache ??= new THREE.Frustum()).setFromProjectionMatrix(m);
  }
}
