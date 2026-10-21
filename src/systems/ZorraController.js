// src/systems/ZorraController.js
// Conecta la zorra del jugador con el juego (soltar/agarrar, sobrepeso y muerte)
// y crea los recicladores con zorra que recorren los andenes.

import * as THREE from 'three';
import { Zorra } from '../entities/Zorra.js';
import { Reciclador } from '../entities/Reciclador.js';
import { ZORRA, RECICLADORES, TEXTOS_ZORRA } from '../data/zorra.js';
import { movimientoJugador, haySobrepeso, objetosADescartar } from './ZorraSystem.js';

const toast = (text, type = 'info') =>
  window.dispatchEvent(new CustomEvent('toast', { detail: { text, type } }));

export class ZorraController {
  constructor(game) {
    this.game = game;
    this.zorraJugador = null;
    this.recicladores = [];
    this._avisoSobrepeso = 0; // s restantes para el próximo aviso
  }

  spawn(district) {
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
    this._spawnRecicladores(district);
  }

  /** Recicladores junto a bolsas repartidas por el mapa; no se guardan con la partida. */
  _spawnRecicladores(district) {
    const navigation = district?.pedestrianNavigation;
    if (!navigation) return;
    const game = this.game;
    this._quitarRecicladores(district);
    const bolsas = game.pickups ?? [];
    const n = bolsas.length;
    if (!n) return;
    const isWalkable = (x, z) => navigation.isWalkableAt(x, z);
    for (let i = 0; i < RECICLADORES.cantidad; i++) {
      const bolsa = bolsas[Math.floor((i + 0.5) * n / RECICLADORES.cantidad)];
      const pos = navigation.nearestPoint(bolsa.position.x, bolsa.position.z);
      if (!pos) continue;
      const r = new Reciclador(game.sceneMgr.scene, pos, {
        navigation, groundHeight: navigation.groundHeight, isWalkable,
        canecas: () => game.pickups,
        jugadorTieneZorra: () => game.zorra.tieneZorra(),
        alRobar: () => {
          if (!game.zorra.obtener()) return;
          game._actualizarCapacidad();
          toast(TEXTOS_ZORRA.robada);
        },
        alForcejear: (rec) => this.alForcejear(rec),
        alCambiarZorra: (vieja, nueva) => {
          if (vieja) game.interaction.unregister(vieja);
          if (nueva) game.interaction.register(nueva);
        }
      });
      this.recicladores.push(r);
      district.npcs.push(r);
      for (const objetivo of r.objetivos()) game.interaction.register(objetivo);
    }
  }

  /** Quita de `district.npcs` (en el sitio: otros sistemas guardan la referencia) y desecha. */
  _quitarRecicladores(district) {
    const anteriores = new Set(this.recicladores);
    const npcs = district?.npcs ?? [];
    for (let i = npcs.length - 1; i >= 0; i--) {
      if (npcs[i] instanceof Reciclador) anteriores.add(...npcs.splice(i, 1));
    }
    for (const r of anteriores) r.dispose();
    this.recicladores = [];
  }

  /** El jugador quiere forcejear con `reciclador`; ya se comprobó `estado.puedeForcejear`. La tarea 10 lo implementa. */
  alForcejear(_reciclador) {}

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
    this._quitarRecicladores(this.game.world?.active);
    this.zorraJugador?.dispose();
    this.zorraJugador = null;
  }
}
