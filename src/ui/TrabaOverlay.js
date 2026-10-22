// src/ui/TrabaOverlay.js
// Capa visual de la traba: barra del HUD, viñeta oscura y fundido a negro del colapso.
// Si no hay documento o faltan los nodos, no hace nada.

import { TRABA } from '../data/sustancias.js';

const NIVELES_CRITICOS = new Set(['zonaRoja', 'colapso']);

export class TrabaOverlay {
  constructor(doc = globalThis.document) {
    this.barra = doc?.querySelector?.('.stat-bar[data-stat="traba"]') ?? null;
    this.relleno = this.barra?.querySelector('.fill') ?? null;
    this.vineta = doc?.getElementById?.('traba-vineta') ?? null;
    this._ancho = null;
    this._opacidad = null;
    this._critico = null;
  }

  update(traba, efectos) {
    const ancho = Math.round(Math.max(0, Math.min(100, (traba || 0) / TRABA.max * 100)));
    if (this.relleno && ancho !== this._ancho) {
      this.relleno.style.width = `${ancho}%`;
      this._ancho = ancho;
    }
    const critico = NIVELES_CRITICOS.has(efectos?.nivel);
    if (this.barra && critico !== this._critico) {
      this.barra.classList.toggle('critical', critico);
      this._critico = critico;
    }
    const opacidad = efectos?.vineta ?? 0;
    if (this.vineta && opacidad !== this._opacidad) {
      this.vineta.style.opacity = String(opacidad);
      this._opacidad = opacidad;
    }
  }

  /** Fundido a negro mientras dura el colapso */
  fundir(activo) {
    this.vineta?.classList.toggle('fundido', !!activo);
  }

  reiniciar() {
    this.fundir(false);
    this.update(0, null);
  }
}
