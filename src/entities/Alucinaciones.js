// src/entities/Alucinaciones.js
// Gestor delgado de alucinaciones: hace aparecer sombras detrás del jugador y tesoros falsos
// en bolsas cercanas según los efectos de la traba. Las decisiones viven en systems/alucinaciones.js.
import * as THREE from 'three';
import { ALUCINACIONES, TEXTOS } from '../data/sustancias.js';
import { tirarSombra, tirarTesoroFalso, puntoDeAparicion, decidirSombra, elegirTexto } from '../systems/alucinaciones.js';
import { Sombra } from './Sombra.js';

export class Alucinaciones {
  constructor(scene, cfg = ALUCINACIONES) {
    this.scene = scene;
    this.cfg = cfg;
    this.sombras = [];
    this._precarga = null;
    this._pickups = null;
    this._avisar = null;
    this._ctxSombra = { player: null, frustum: null };
    // un solo manejador para todos los tesoros falsos; usa el `avisar` del último cuadro
    this._alRomperTesoro = () => this._avisar?.(elegirTexto(TEXTOS.tesoroFalso), 'info');
  }

  get activas() {
    let n = 0;
    for (const s of this.sombras) if (s.activa) n++;
    return n;
  }

  /** Crea las sombras ocultas una sola vez. Devuelve una promesa que resuelve cuando están listas. */
  precargar(navigation) {
    if (this._precarga) return this._precarga;
    const isWalkable = (x, z) => navigation.isWalkableAt(x, z);
    for (let i = 0; i < this.cfg.maxSombras; i++) {
      const s = new Sombra(this.scene, new THREE.Vector3(), { navigation, isWalkable }, this.cfg);
      s.root.visible = false;
      s.activa = false;
      this.sombras.push(s);
    }
    this._precarga = Promise.all(this.sombras.map((s) => s.ready));
    return this._precarga;
  }

  /**
   * @param {number} dt
   * @param {{ efectos, jugador: THREE.Vector3, frente: {x:number, z:number}, frustum?: THREE.Frustum,
   *   navigation?: object, pickups?: import('./Pickup.js').Pickup[], stats: { animo:number, salud:number },
   *   avisar: (texto:string, tipo:string) => void }} ctx
   */
  update(dt, { efectos, jugador, frente, frustum, navigation, pickups, stats, avisar }) {
    this._avisar = avisar;
    this._pickups = pickups ?? null;
    if (!efectos || !jugador) return;
    this._actualizarSombras(dt, efectos, jugador, frente, frustum, navigation, stats, avisar);
    if (pickups) this._actualizarTesoros(dt, efectos, jugador, pickups);
  }

  _actualizarSombras(dt, efectos, jugador, frente, frustum, navigation, stats, avisar) {
    const cfg = this.cfg;
    for (const s of this.sombras) {
      if (!s.activa || s.desvaneciendo) continue;
      const distancia = Math.hypot(s.position.x - jugador.x, s.position.z - jugador.z);
      const decision = decidirSombra({ distancia, nivel: efectos.nivel }, cfg);
      if (decision === 'alcanza') {
        if (stats) {
          stats.animo = Math.max(0, stats.animo - cfg.castigoAnimo);
          stats.salud = Math.max(0, stats.salud - cfg.castigoSalud);
        }
        avisar?.(elegirTexto(TEXTOS.sombraAlcanza), 'warn');
        s.desvanecer();
      } else if (decision === 'desvanece') {
        s.desvanecer();
      } else {
        s.objetivo = jugador;
        s.velocidad = s.walkSpeed = efectos.velocidadSombra;
      }
    }

    if (navigation && frente && tirarSombra({ efectos, activas: this.activas, dt }, cfg)) {
      const libre = this.sombras.find((s) => !s.activa && s.character);
      if (libre) {
        const punto = puntoDeAparicion(jugador, frente, cfg);
        const pos = navigation.nearestPoint(punto.x, punto.z);
        if (pos) libre.activar(pos, efectos.velocidadSombra);
      }
    }

    const ctx = this._ctxSombra;
    ctx.player = jugador;
    ctx.frustum = frustum ?? null;
    for (const s of this.sombras) s.update(dt, ctx);
  }

  _actualizarTesoros(dt, efectos, jugador, pickups) {
    let activos = 0;
    for (const p of pickups) {
      if (!p.falsoTesoro) continue;
      if (!efectos.tesorosFalsos) p.setFalsoTesoro(false);
      else activos++;
    }
    if (!tirarTesoroFalso({ efectos, activos, dt }, this.cfg)) return;

    let elegido = null;
    let mejor = this.cfg.radioTesoro;
    for (const p of pickups) {
      // solo bolsas disponibles; no se roba el brillo de un boost real
      if (p.used || p.cooldown > 0 || p.falsoTesoro || p._boostActive) continue;
      const d = Math.hypot(p.position.x - jugador.x, p.position.z - jugador.z);
      if (d <= mejor) { mejor = d; elegido = p; }
    }
    if (!elegido) return;
    elegido.onFalsoTesoro = this._alRomperTesoro;
    elegido.setFalsoTesoro(true);
  }

  /** Apaga todas las alucinaciones al instante (p. ej. al dormir o colapsar). */
  limpiar() {
    for (const s of this.sombras) s.apagar();
    if (this._pickups) for (const p of this._pickups) if (p.falsoTesoro) p.setFalsoTesoro(false);
  }

  dispose() {
    for (const s of this.sombras) s.dispose();
    this.sombras = [];
    this._precarga = null;
  }
}
