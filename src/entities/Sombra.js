// src/entities/Sombra.js
// Figura oscura alucinada: reutiliza el personaje, LOD y descarte de `Npc`, pero se dibuja
// como una silueta negra translúcida que persigue un objetivo y se desvanece.
import * as THREE from 'three';
import { Npc } from './Npc.js';
import { ALUCINACIONES } from '../data/sustancias.js';

export class Sombra extends Npc {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Vector3} posicion
   * @param {{ navigation?: object, isWalkable?: (x:number, z:number) => boolean }} opts
   */
  constructor(scene, posicion, { navigation = null, isWalkable } = {}, cfg = ALUCINACIONES) {
    // sin `navigation` en el padre: la sombra no sigue rutas, persigue su objetivo
    super(scene, posicion, { isWalkable, speed: 0 });
    this.cfg = cfg;
    this.navegacion = navigation;
    this.material = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: cfg.opacidadSombra, depthWrite: false
    });
    this.activa = false;
    this.velocidad = 0;
    this.objetivo = null;
    this._desvanecer = 0; // s que faltan para terminar de desvanecerse (0 = no se desvanece)
    this.root.visible = false;
  }

  get desvaneciendo() { return this._desvanecer > 0; }

  _show(char) {
    super._show(char);
    char.group.traverse((o) => { if (o.isMesh) o.material = this.material; });
  }

  activar(pos, velocidad) {
    this.position.copy(pos);
    this.root.position.copy(pos);
    this.velocidad = velocidad;
    this.walkSpeed = velocidad;
    this.objetivo = null;
    this._desvanecer = 0;
    this.material.opacity = this.cfg.opacidadSombra;
    this.activa = true;
    this.root.visible = true;
  }

  desvanecer() {
    if (!this.activa || this.desvaneciendo) return;
    this._desvanecer = this.cfg.desvanecerSeg;
    this.objetivo = null;
  }

  /** Desactiva de inmediato, sin transición. */
  apagar() {
    this.activa = false;
    this._desvanecer = 0;
    this.objetivo = null;
    this.root.visible = false;
  }

  _walk(dt) {
    this.moving = false;
    if (!this.objetivo) return;
    const d = this._direction.copy(this.objetivo).sub(this.position);
    d.y = 0;
    const dist = d.length();
    if (dist < 0.001) return;
    const step = Math.min(dist, this.velocidad * dt);
    const next = this._nextPosition.copy(this.position).addScaledVector(d.normalize(), step);
    if (!this.isWalkable(next.x, next.z)) return;
    next.y = this.groundHeight(next.x, next.z);
    this.position.copy(next);
    this.moving = step > 0;
    this.root.rotation.y = Math.atan2(d.x, d.z);
  }

  update(dt, ctx = {}) {
    if (!this.activa) return;
    if (this.desvaneciendo) {
      this._desvanecer = Math.max(0, this._desvanecer - dt);
      this.material.opacity = this.cfg.opacidadSombra * (this._desvanecer / this.cfg.desvanecerSeg);
      if (this._desvanecer === 0) { this.apagar(); return; }
    }
    super.update(dt, ctx);
  }

  dispose() {
    super.dispose();
    this.material.dispose();
  }
}
