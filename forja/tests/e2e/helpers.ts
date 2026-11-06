import { expect, type Page } from '@playwright/test';

export async function onboard(page: Page, opts: { split?: 'Full Body' | 'Superiores / Inferiores' } = {}) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByPlaceholder('Como quer ser chamado?').fill('Vitor');
  await page.getByRole('button', { name: 'Continuar' }).click(); // sobre
  await page.getByRole('button', { name: 'Hipertrofia' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click(); // objetivo
  await page.getByRole('button', { name: 'Continuar' }).click(); // local
  await page.getByRole('button', { name: 'Continuar' }).click(); // rotina
  if (opts.split) await page.getByRole('button', { name: new RegExp(opts.split) }).first().click();
  await page.getByRole('button', { name: 'Continuar' }).click(); // divisão
  await page.getByLabel('Li e entendi').check();
  await page.getByRole('button', { name: 'Criar meu plano' }).click();
  await expect(page.getByTestId('today-workout-name')).toBeVisible();
}

/** Preenche e conclui todas as séries do treino aberto. */
export async function completeAllSets(page: Page, weight = '20', reps = '10') {
  await expect(page.getByTestId('exercise-0')).toBeVisible();
  const checks = page.getByRole('button', { name: /^Concluir série/ });
  const n = await checks.count();
  for (let i = 0; i < n; i++) {
    const btn = checks.nth(i);
    const row = btn.locator('xpath=..');
    const load = row.getByRole('textbox', { name: /^Carga série/ });
    if (await load.count()) await load.fill(weight);
    await row.getByRole('textbox', { name: /^Repetições série/ }).fill(reps);
    await btn.click();
    const skip = page.getByRole('button', { name: 'Pular' });
    if (await skip.isVisible()) await skip.click();
  }
}

export async function finishWorkout(page: Page) {
  await page.getByTestId('finish-workout').click();
  await page.getByTestId('confirm-finish').click();
  await expect(page.getByTestId('summary-screen')).toBeVisible();
}
