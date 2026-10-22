// src/ui/Minimap.js
// Radar y minimapa urbano para Bogotá (240x222m)

export class Minimap {
  constructor() {
    this.visible = true;
    try {
      const v = typeof localStorage !== 'undefined' ? localStorage.getItem('bazuko.minimap_visible') : null;
      if (v !== null) this.visible = v === 'true';
    } catch { /* sin almacenamiento */ }

    this.container = document.getElementById('minimap-container');
    if (!this.container && typeof document !== 'undefined') {
      this._createDOM();
    }

    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.infoEl = document.getElementById('minimap-info');

    this.radarRadius = 54; // radio del radar en píxeles
    this.radarRange = 85;  // metros representados en el radio

    this._lastUpdate = 0;
    this._cachedNearest = '';

    // game.js maneja la tecla KeyN de forma centralizada
  }

  _createDOM() {
    const div = document.createElement('div');
    div.id = 'minimap-container';
    div.className = this.visible ? '' : 'hidden';
    div.innerHTML = `
      <div class="minimap-header">
        <span class="minimap-title">🧭 Radar Bogotá</span>
        <button type="button" class="minimap-toggle-btn" id="minimap-toggle-btn" title="Alternar minimapa (N)">N</button>
      </div>
      <canvas id="minimap-canvas" width="130" height="130" aria-label="Minimapa y radar"></canvas>
      <div id="minimap-info" class="minimap-info">Cargando puntos…</div>
    `;
    document.body.appendChild(div);
    this.container = div;

    document.getElementById('minimap-toggle-btn')?.addEventListener('click', () => {
      this.toggle();
    });
  }

  toggle() {
    this.visible = !this.visible;
    const el = this.container || document.getElementById('minimap-container');
    if (el) {
      el.classList.toggle('hidden', !this.visible);
    }
    try {
      localStorage?.setItem('bazuko.minimap_visible', String(this.visible));
    } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { text: this.visible ? '🧭 Radar visible (N)' : '🧭 Radar oculto (N)', type: 'info' }
    }));
    return this.visible;
  }

  /**
   * Actualiza el radar
   * @param {Object} playerPos Vector { x, z }
   * @param {number} playerYaw Ángulo de rotación del personaje o cámara
   * @param {Array} pois Lista de { name, icon, x, z, color }
   * @param {number} now Timestamp de performance.now()
   */
/**
   * Actualiza el radar
   * @param {Object} playerPos Vector { x, z }
   * @param {number} cameraYaw Ángulo yaw de la cámara (arriba en radar = al frente en pantalla)
   * @param {Array} pois Lista de { name, icon, x, z, color }
   * @param {number} now Timestamp de performance.now()
   */
  update(playerPos, cameraYaw = 0, pois = [], now = performance.now()) {
    if (!this.visible || !this.ctx || !this.canvas || !playerPos) return;

    // Actualizar a ~20 FPS para eficiencia
    if (now - this._lastUpdate < 50) return;
    this._lastUpdate = now;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = this.radarRadius;

    ctx.clearRect(0, 0, w, h);

    // Fondo del radar
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 15, 20, 0.9)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#3d564d';
    ctx.stroke();

    // Círculos concéntricos de distancia (25m y 50m)
    ctx.strokeStyle = 'rgba(65, 95, 80, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Ejes de orientación
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.strokeStyle = 'rgba(65, 95, 80, 0.25)';
    ctx.stroke();

    // Letras cardinales que rotan según la vista de la cámara
    // En Three.js, Norte es -Z. En vista de cámara: nForward = cos(yaw), nRight = sin(yaw)
    const angleN = Math.atan2(-Math.cos(cameraYaw), Math.sin(cameraYaw));
    const drawCardinal = (label, offset, color = '#7a9688', isNorth = false) => {
      const a = angleN + offset;
      const lx = cx + Math.cos(a) * (r - 8);
      const ly = cy + Math.sin(a) * (r - 8);
      ctx.fillStyle = isNorth ? '#eed688' : color;
      ctx.font = isNorth ? 'bold 10px monospace' : '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
    };

    drawCardinal('N', 0, '#eed688', true);
    drawCardinal('E', Math.PI / 2);
    drawCardinal('S', Math.PI);
    drawCardinal('O', -Math.PI / 2);

    // Puntos de interés (POIs) proyectados en vista de cámara
    let nearestDist = Infinity;
    let nearestPoi = null;
    let nearestForward = 0;
    let nearestRight = 0;

    for (const poi of pois) {
      const dx = poi.x - playerPos.x;
      const dz = poi.z - playerPos.z;
      const dist = Math.hypot(dx, dz);

      // Proyección relativa a la cámara:
      // Forward: distancia hacia donde apunta la cámara
      // Right: distancia hacia la derecha de la pantalla
      const forward = -(dx * Math.sin(cameraYaw) + dz * Math.cos(cameraYaw));
      const right = dx * Math.cos(cameraYaw) - dz * Math.sin(cameraYaw);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPoi = poi;
        nearestForward = forward;
        nearestRight = right;
      }

      // 1 metro en el mundo = (r / radarRange) píxeles en el radar
      const scale = r / this.radarRange;
      let px = cx + right * scale;
      let py = cy - forward * scale;

      const offsetDist = Math.hypot(px - cx, py - cy);
      const isClamped = offsetDist > r - 7;

      if (isClamped) {
        const angle = Math.atan2(py - cy, px - cx);
        px = cx + Math.cos(angle) * (r - 8);
        py = cy + Math.sin(angle) * (r - 8);
      }

      // Dibujar punto de interés
      ctx.beginPath();
      ctx.arc(px, py, isClamped ? 3.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = poi.color || '#ffd166';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Icono / Emoji pequeño si está dentro del radar
      if (!isClamped) {
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(poi.icon, px, py - 9);
      }
    }

    // Jugador (flecha en el centro apuntando siempre hacia ARRIBA = vista de la cámara)
    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fillStyle = '#2ecc71';
    ctx.fill();
    ctx.strokeStyle = '#0e3a1f';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Actualiza la caja de información inferior con distancia y dirección relativa
    if (this.infoEl) {
      if (nearestPoi) {
        let dirHint = '⬆️ Al frente';
        if (nearestForward < -Math.abs(nearestRight) * 0.45) dirHint = '⬇️ Atrás';
        else if (nearestRight > Math.abs(nearestForward) * 0.45) dirHint = '➡️ Derecha';
        else if (nearestRight < -Math.abs(nearestForward) * 0.45) dirHint = '⬅️ Izquierda';
        else if (nearestForward > 0 && nearestRight > 2) dirHint = '↗️ Diagonal der.';
        else if (nearestForward > 0 && nearestRight < -2) dirHint = '↖️ Diagonal izq.';

        this._cachedNearest = `${nearestPoi.icon} ${nearestPoi.name}: ${Math.round(nearestDist)}m (${dirHint})`;
      } else {
        this._cachedNearest = 'Sin puntos cercanos';
      }
      this.infoEl.textContent = this._cachedNearest;
    }
  }
}
