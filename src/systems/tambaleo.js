// src/systems/tambaleo.js
// Caminar irregular al estar trabado (lógica pura, sin three ni DOM): desvío de rumbo, ritmo y tropezones.
import { TAMBALEO } from '../data/sustancias.js';
import { NIVELES } from './TrabaSystem.js';

const DOS_PI = 2 * Math.PI;
const QUIETO = { desvio: 0, velocidad: 1 };

export class Tambaleo {
  constructor(cfg = TAMBALEO, random = Math.random) {
    this.cfg = cfg;
    this.random = random;
    this.reiniciar();
  }

  reiniciar() {
    this._t = 0;
    this._espera = null;   // s hasta el próximo tropezón (null = sin sortear)
    this._tropezon = 0;    // s restantes del tropezón en curso
    this._signo = 1;
  }

  /** Devuelve { desvio (rad), velocidad (multiplicador) } para este cuadro */
  update(dt, { intensidad, nivel, moviendose }) {
    if (!intensidad || !moviendose) return { ...QUIETO };
    const c = this.cfg;
    this._t += dt;

    let desvio = intensidad * c.desvioMax * (
      c.mezcla * Math.sin(DOS_PI * c.frecuencia1 * this._t) +
      (1 - c.mezcla) * Math.sin(DOS_PI * c.frecuencia2 * this._t + c.fase2)
    );
    const velocidad = 1 + intensidad * c.ritmoAmplitud * Math.sin(DOS_PI * c.ritmoFrecuencia * this._t);

    if (NIVELES.indexOf(nivel) >= NIVELES.indexOf(c.tropezonDesde)) {
      if (this._tropezon <= 0) {
        this._espera ??= this._sortearEspera();
        this._espera -= dt;
        if (this._espera <= 0) {
          this._tropezon = c.tropezonDuracion;
          this._signo = this.random() < 0.5 ? 1 : -1;
          this._espera = this._sortearEspera();
        }
      } else {
        this._tropezon -= dt;
      }
      if (this._tropezon > 0) desvio = this._signo * c.tropezonAngulo;
    }
    return { desvio, velocidad };
  }

  _sortearEspera() {
    const [min, max] = this.cfg.tropezonIntervalo;
    return min + this.random() * (max - min);
  }
}
