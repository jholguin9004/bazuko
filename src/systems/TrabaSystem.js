import { PERFILES, TRABA, BAJONES, MAREO, VINETA } from '../data/sustancias.js';
import { DECAY } from '../utils/constants.js';

export const NIVELES = ['leve', 'trabado', 'muyTrabado', 'zonaRoja', 'colapso'];

const indiceNivel = (nivel) => NIVELES.indexOf(nivel);
const acotar = (v, min, max) => Math.min(max, Math.max(min, v));
const esNumero = (v) => typeof v === 'number' && Number.isFinite(v);

/** Nivel de traba según los umbrales (el más alto cuyo umbral se alcanza) */
export function nivelDe(traba, umbrales = TRABA.umbrales) {
  if (traba >= umbrales.colapso) return 'colapso';
  if (traba >= umbrales.zonaRoja) return 'zonaRoja';
  if (traba >= umbrales.muyTrabado) return 'muyTrabado';
  if (traba >= umbrales.trabado) return 'trabado';
  return 'leve';
}

/** Balanceo lento de cámara: giro lateral y alabeo, ambos acotados por su amplitud */
export function calcularMareo(t, intensidad, cfg = MAREO) {
  if (!intensidad) return { lateral: 0, alabeo: 0 };
  return {
    lateral: intensidad * cfg.amplitudLateral * Math.sin(2 * Math.PI * cfg.frecuenciaLateral * t),
    alabeo: intensidad * cfg.amplitudAlabeo * Math.sin(2 * Math.PI * cfg.frecuenciaAlabeo * t + Math.PI / 3)
  };
}

/** Lógica pura de la traba (sin three ni DOM): dosis, subida, decaimiento, efectos y bajón */
export class TrabaSystem {
  constructor(perfiles = PERFILES, cfg = TRABA, bajones = BAJONES) {
    this.perfiles = perfiles;
    this.cfg = cfg;
    this.defBajones = bajones;
    this.traba = 0;
    this.dosis = [];   // { id, pendiente, restante }
    this.bajones = []; // { id, restante }
  }

  get nivel() { return nivelDe(this.traba, this.cfg.umbrales); }

  consumir(id) {
    const p = this.perfiles[id];
    if (!p) return false;
    this.dosis.push({ id, pendiente: p.traba, restante: p.duracion });
    return true;
  }

  update(dt, stats) {
    const { cfg } = this;
    const nivelAntes = this.nivel;

    // 1. Subida: cada dosis libera su traba de forma lineal durante `subida`
    for (const d of this.dosis) {
      const p = this.perfiles[d.id];
      const liberado = Math.min(d.pendiente, p.traba * dt / p.subida);
      d.pendiente -= liberado;
      if (d.pendiente < 1e-9) d.pendiente = 0;
      this.traba += liberado;
    }

    // 2. Tope y colapso (antes del decaimiento)
    this.traba = Math.min(this.traba, cfg.max);
    const colapso = this.traba >= cfg.umbrales.colapso;

    // 3. Decaimiento: base + las dosis ya liberadas por completo
    let decae = cfg.decaimientoBase;
    for (const d of this.dosis) {
      if (d.pendiente === 0) {
        const p = this.perfiles[d.id];
        decae += p.traba / p.duracion;
      }
    }
    this.traba = Math.max(0, this.traba - decae * dt);

    // 4. Efectos sobre las stats según el nivel nuevo
    const nivel = this.nivel;
    const idx = indiceNivel(nivel);
    const perfilDom = this.perfiles[this.dominante()];
    if (idx >= indiceNivel('trabado')) {
      const escala = cfg.escalaNivel[nivel] ?? 1;
      stats.animo += cfg.euforiaAnimoPorSeg * (perfilDom?.pesos.euforia ?? 0) * escala * dt;
      stats.hambre += DECAY.hambre * cfg.frenoNecesidades * dt;
      stats.energia += DECAY.energia * cfg.frenoNecesidades * dt;
    }
    if (idx >= indiceNivel('zonaRoja')) stats.salud -= cfg.saludZonaRojaPorSeg * dt;

    for (const b of this.bajones) {
      const def = this.defBajones[this.perfiles[b.id].bajon];
      const t = Math.min(dt, b.restante);
      stats.animo -= def.animo / def.duracion * t;
      stats.energia -= def.energia / def.duracion * t;
      stats.vicio -= DECAY.vicio * (def.vicioMult - 1) * t;
      b.restante -= dt;
    }
    this.bajones = this.bajones.filter(b => b.restante > 0);

    for (const k of ['animo', 'energia', 'hambre', 'vicio', 'salud']) {
      if (esNumero(stats[k])) stats[k] = acotar(stats[k], 0, 100);
    }

    // 5. Las dosis vencidas pasan a bajón (arranca en el update siguiente)
    const vigentes = [];
    for (const d of this.dosis) {
      d.restante -= dt;
      if (d.restante <= 0) {
        const p = this.perfiles[d.id];
        this.bajones.push({ id: d.id, restante: this.defBajones[p.bajon].duracion });
      } else {
        vigentes.push(d);
      }
    }
    this.dosis = vigentes;

    return { nivel, cambioNivel: nivel !== nivelAntes, colapso };
  }

  /** Id de la dosis con más peso: traba liberada × fracción de duración restante (null si no hay dosis) */
  dominante() {
    let mejor = null, aporte = -1;
    for (const d of this.dosis) {
      const p = this.perfiles[d.id];
      const puntaje = (p.traba - d.pendiente) * (d.restante / p.duracion);
      if (puntaje > aporte) { aporte = puntaje; mejor = d.id; }
    }
    return mejor;
  }

  efectos() {
    const nivel = this.nivel;
    const dominante = this.dominante();
    const p = dominante ? this.perfiles[dominante] : null;
    const vineta = VINETA.opacidadPorNivel[nivel] ?? VINETA.opacidadPorNivel.zonaRoja;
    if (!p) {
      return { nivel, dominante: null, velocidad: 1, mareo: 0, vineta, sombras: 0, tesorosFalsos: 0, velocidadSombra: 0 };
    }
    const w = p.pesos;
    const alto = indiceNivel(nivel) >= indiceNivel('muyTrabado');
    const mareo = nivel === 'zonaRoja' || nivel === 'colapso'
      ? 1
      : (MAREO.porNivel[nivel] ?? 0) * (MAREO.pisoPeso + (1 - MAREO.pisoPeso) * w.mareo);
    return {
      nivel,
      dominante,
      velocidad: 1 + (this.cfg.velocidadMax - 1) * w.velocidad * (this.cfg.escalaNivel[nivel] ?? 1),
      mareo,
      vineta,
      sombras: alto ? w.sombras : 0,
      tesorosFalsos: alto ? w.tesorosFalsos : 0,
      velocidadSombra: p.velocidadSombra
    };
  }

  getSpeedMultiplier() { return this.efectos().velocidad; }

  /** Corta el efecto: cada dosis activa pasa a bajón de inmediato y la traba queda en 0 */
  cortar() {
    for (const d of this.dosis) {
      this.bajones.push({ id: d.id, restante: this.defBajones[this.perfiles[d.id].bajon].duracion });
    }
    this.dosis = [];
    this.traba = 0;
  }

  reiniciar() {
    this.traba = 0;
    this.dosis = [];
    this.bajones = [];
  }

  serialize() {
    return {
      traba: this.traba,
      dosis: this.dosis.map(d => ({ ...d })),
      bajones: this.bajones.map(b => ({ ...b }))
    };
  }

  deserialize(d) {
    this.reiniciar();
    if (!d || typeof d !== 'object') return;
    if (esNumero(d.traba)) this.traba = acotar(d.traba, 0, this.cfg.max);
    if (Array.isArray(d.dosis)) {
      this.dosis = d.dosis
        .filter(x => x && this.perfiles[x.id] && esNumero(x.pendiente) && esNumero(x.restante))
        .map(x => ({
          id: x.id,
          pendiente: acotar(x.pendiente, 0, this.perfiles[x.id].traba),
          restante: x.restante
        }));
    }
    if (Array.isArray(d.bajones)) {
      this.bajones = d.bajones
        .filter(x => x && this.perfiles[x.id] && esNumero(x.restante) && x.restante > 0)
        .map(x => ({ id: x.id, restante: x.restante }));
    }
  }
}
