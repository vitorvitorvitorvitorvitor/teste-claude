import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { completeAllSets, finishWorkout, onboard } from './helpers';

test('backup: exportar, apagar e importar (desktop)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-02T09:00:00-03:00') });
  await onboard(page);
  await page.getByTestId('start-workout').click();
  await completeAllSets(page);
  await finishWorkout(page);
  await page.getByTestId('summary-close').click();

  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar' }).click();
  const file = await dl;
  const path = await file.path();
  const json = JSON.parse(readFileSync(path, 'utf8'));
  expect(json.app).toBe('forja');
  expect(json.data.sessions.length).toBe(1);

  await page.getByRole('button', { name: 'Apagar todos os dados' }).click();
  await page.getByLabel('Confirmação').fill('APAGAR');
  await page.getByRole('button', { name: 'Apagar definitivamente' }).click();
  await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible();

  // Após apagar, refaz onboarding e importa o backup
  await onboard(page);
  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  await page.getByTestId('import-input').setInputFiles(path);
  await page.getByRole('dialog', { name: 'Importar backup?' }).getByRole('button', { name: 'Importar', exact: true }).click();
  await expect(page.getByText('Backup importado: 1 sessões.')).toBeVisible();
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByTestId('history-list').getByText('Full Body A')).toBeVisible();
});

test('painel de referências científicas lista regras e fontes', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  await page.getByRole('button', { name: /Referências científicas do motor/ }).click();
  await expect(page.getByText('R01-sequencia')).toBeVisible();
  await page.getByRole('button', { name: /Fontes/ }).click();
  await expect(page.getByText(/DOI 10.1249\/MSS.0000000000003897/)).toBeVisible();
});
