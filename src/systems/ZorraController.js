// src/systems/ZorraController.js
// Conecta la zorra del jugador con el juego: soltar/agarrar, sobrepeso y muerte.

import * as THREE from 'three';
import { Zorra } from '../entities/Zorra.js';
import { ZORRA, TEXTOS_ZORRA } from '../data/zorra.js';
import { movimientoJugador, haySobrepeso, objetosADescartar } from './ZorraSystem.js';

const toast = (text, type = 'info') =>
  window.dispatchEvent(new CustomEvent('toast', { detail: { text, type } }));

export class ZorraController {
  constructor(game) {
    this.game = game;
    this.zorraJugador = null;
    this._avisoSobrepeso = 0; // s restantes para el próximo aviso
  }

  spawn() {
    const game = this.game;
    if (!this.zorraJugador) {
      this.zorraJugador = new Zorra(game.sceneMgr.scene, {
        interactable: () => game.zorra.estado === 'dropped',
        prompt: () => TEXTOS_ZORRA.agarrar,
        interactuar: () => {
          if (game.zorra.agarrar()) toast(TEXTOS_ZORRA.agarrada);
        }
      });
      this.zorraJugador.visible = false;
    }
    game.interaction.register(this.zorraJugador);
  }

  update(dt, input) {
    const { game } = this;
    const zorra = game.zorra;
    const vista = this.zorraJugador;

    if (zorra.empujando && input.consumePress(ZORRA.teclas.soltar)) {
      if (zorra.soltar(game.player.position.toArray(), game.player.root.rotation.y)) toast(TEXTOS_ZORRA.soltada);
    }

    if (vista) {
      if (zorra.empujando) {
        vista.colocarDelante(game.player.position, game.player.root.rotation.y);
        vista.visible = true;
      } else if (zorra.estado === 'dropped') {
        vista.colocarDelante(new THREE.Vector3(...zorra.pos), zorra.rot);
        vista.visible = true;
      } else {
        vista.visible = false;
      }
    }

    const sobrepeso = haySobrepeso(game.inventory.totalWeight, game.inventory.maxWeight);
    const { mult, puedeCorrer } = movimientoJugador({ empujando: zorra.empujando, sobrepeso });
    game.player.zorraMult = mult;
    game.player.canRun = puedeCorrer;

    this._avisoSobrepeso = Math.max(0, this._avisoSobrepeso - dt);
    const eje = input.axis;
    if (sobrepeso && (eje.x !== 0 || eje.z !== 0) && this._avisoSobrepeso <= 0) {
      toast(TEXTOS_ZORRA.sobrepeso, 'warn');
      this._avisoSobrepeso = ZORRA.avisoSobrepesoCada;
    }
  }

  /** Al desmayarse empujando, se pierde lo que no cabe sin la zorra. */
  alMorir() {
    const { game } = this;
    if (!game.zorra.empujando) return;
    const quitar = objetosADescartar(game.inventory.items, game._capacidadSinZorra());
    for (const [id, qty] of quitar) game.inventory.remove(id, qty);
    toast(TEXTOS_ZORRA.muerte);
  }

  dispose() {
    this.zorraJugador?.dispose();
    this.zorraJugador = null;
  }
}
