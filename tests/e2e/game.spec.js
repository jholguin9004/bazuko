import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Cada prueba empieza como una partida nueva y no depende de localStorage.
  await page.addInitScript(() => {
    localStorage.clear();
  });
});

async function startNewGame(page) {
  // La construcción procedural del distrito puede tardar en Chromium con
  // WebGL software. `commit` permite observar el DOM mientras termina.
  await page.goto('/', { waitUntil: 'commit' });

  const creator = page.locator('#creator-modal');
  await expect(creator).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('#cr-name')).toBeVisible();

  await page.locator('#cr-name').fill('Parcero QA');
  // El canvas 3D puede cambiar el layout mientras carga el personaje; el
  // botón sigue siendo visible y esta interacción se hace de forma explícita.
  await page.locator('#creator-done').evaluate((button) => button.click());
  await expect(creator).toBeHidden();
  await expect(page.locator('#game-canvas')).toBeVisible({ timeout: 60_000 });
}

test('flujo básico de una partida', async ({ page }) => {
  await startNewGame(page);

  await expect(page.locator('#clock')).toHaveText(/Día 1 — \d{2}:\d{2}/);
  await expect(page.locator('#controls-help')).toContainText('WASD mover');
  // El primer frame puede llegar con retraso mientras Three.js carga el modelo.
  await expect(page.locator('#player-name')).toHaveText('Parcero QA', { timeout: 15_000 });

  await page.keyboard.press('T');
  await expect(page.locator('#talent-panel')).toHaveClass(/open/);
  await expect(page.locator('#talent-panel')).toContainText('Árbol de Talentos');

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })));
  await expect(page.locator('#talent-panel')).not.toHaveClass(/open/);

  await page.keyboard.press('C');
  await expect(page.locator('#craft-panel')).toHaveClass(/open/);
  await expect(page.locator('#craft-panel')).toContainText('Mesa de Crafteo');
  await page.keyboard.press('C');
  await expect(page.locator('#craft-panel')).not.toHaveClass(/open/);

  await page.keyboard.press('P');
  await expect(page.locator('#creator-modal')).toBeVisible();
  await expect(page.locator('#creator-title')).toHaveText('Crea tu personaje');
  await page.locator('#creator-close').evaluate((button) => button.click());
  await expect(page.locator('#creator-modal')).toBeHidden();

  // Verifica el radar / minimapa urbano
  await expect(page.locator('#minimap-container')).toBeVisible();
  await page.keyboard.press('N');
  await expect(page.locator('#minimap-container')).toHaveClass(/hidden/);
  await page.keyboard.press('N');
  await expect(page.locator('#minimap-container')).not.toHaveClass(/hidden/);

  // Menú de pausa con botón ⏸️
  await page.locator('#pause-toggle').click();
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#menu-title')).toHaveText('Partida en Pausa');
  await page.locator('#menu-close').click();
  await expect(page.locator('#menu')).toBeHidden();

  // Menú de pausa con ESC
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })));
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#menu-title')).toHaveText('Partida en Pausa');
  await page.locator('#menu-close').click();
  await expect(page.locator('#menu')).toBeHidden();
});
