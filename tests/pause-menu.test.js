import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { openPauseMenu } from '../src/ui/PauseMenu.js';

beforeEach(() => {
  globalThis.window = new EventTarget();
  globalThis.document = {
    createElement(tag) {
      return {
        tag,
        className: '',
        textContent: '',
        children: [],
        attributes: {},
        addEventListener() {},
        setAttribute(k, v) { this.attributes[k] = v; },
        append(...nodes) { this.children.push(...nodes); }
      };
    }
  };
});

test('openPauseMenu abre el menú con controles de audio, estado y opciones rápidas', () => {
  let openedConfig = null;
  const game = {
    _deathPending: false,
    creator: { isOpen: false },
    audio: { volume: 0.7, isMuted: () => false, setVolume() {}, toggleMute() {} },
    stats: { dinero: 5000, level: 2, salud: 85, sed: 70, hambre: 60 },
    clock: { day: 1, hour: 14.5 },
    look: { nombre: 'Tester' },
    menu: {
      open(cfg) { openedConfig = cfg; }
    }
  };

  openPauseMenu(game);
  assert.ok(openedConfig);
  assert.equal(openedConfig.title, 'Partida en Pausa');

  const rendered = openedConfig.render();
  assert.ok(rendered.body);
  assert.ok(rendered.foot);
  assert.equal(rendered.foot.length, 1);
});
