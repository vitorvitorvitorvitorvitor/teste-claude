import { expect, test } from '@playwright/test';
import { completeAllSets, finishWorkout, onboard } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-02T09:00:00-03:00') }); // segunda-feira
});

test('fluxo completo: perfil → Full Body A → registro → histórico → dia seguinte → B', async ({ page }) => {
  await onboard(page);
  await expect(page.getByTestId('today-workout-name')).toHaveText('Full Body A');
  await expect(page.getByText('Seu treino está pronto.')).toBeVisible();

  await page.getByTestId('start-workout').click();
  await expect(page.getByTestId('workout-screen')).toBeVisible();
  await completeAllSets(page, '20', '12');
  await expect(page.getByTestId('session-progress')).toHaveText('100%');
  await finishWorkout(page);
  await expect(page.getByText('Treino concluído')).toBeVisible();
  await page.getByTestId('summary-close').click();

  // Hoje: concluído
  await expect(page.getByText('Treino de hoje concluído')).toBeVisible();

  // Histórico
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByTestId('history-list').getByText('Full Body A')).toBeVisible();

  // Persistência após recarregar
  await page.reload();
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByTestId('history-list').getByText('Full Body A')).toBeVisible();

  // Dia seguinte (terça): recuperação sugerida, B pendente
  await page.clock.setSystemTime(new Date('2026-11-03T09:00:00-03:00'));
  await page.reload();
  await page.getByRole('button', { name: 'Hoje' }).click();
  await expect(page.getByText('Hoje é dia de recuperação')).toBeVisible();
  await expect(page.getByRole('button', { name: /Treinar mesmo assim \(Full Body B\)/ })).toBeVisible();

  // Faltou quarta, voltou quinta: B continua pendente
  await page.clock.setSystemTime(new Date('2026-11-05T09:00:00-03:00'));
  await page.reload();
  await expect(page.getByTestId('today-workout-name')).toHaveText('Full Body B');

  // Sugestão de carga com base no histórico aparece ao repetir um exercício? (A só volta depois de C)
  await page.getByTestId('start-workout').click();
  await expect(page.getByTestId('workout-screen')).toBeVisible();
});

test('retomada de sessão interrompida após recarregar', async ({ page }) => {
  await onboard(page);
  await page.getByTestId('start-workout').click();
  const first = page.getByTestId('exercise-0');
  await first.getByRole('textbox', { name: 'Carga série 1' }).fill('25');
  await first.getByRole('textbox', { name: 'Repetições série 1' }).fill('10');
  await first.getByRole('button', { name: 'Concluir série 1' }).click();
  await page.waitForTimeout(600); // salvamento automático (debounce)
  await page.reload();
  await expect(page.getByText('Você tem um treino em andamento.')).toBeVisible();
  await page.getByRole('button', { name: 'RETOMAR TREINO' }).click();
  const f = page.getByTestId('exercise-0');
  await expect(f.getByRole('textbox', { name: 'Carga série 1' })).toHaveValue('25');
  await expect(f.getByRole('button', { name: 'Concluir série 1' })).toHaveAttribute('aria-pressed', 'true');
  // Encerrar antecipadamente → parcial
  await finishWorkout(page);
  await expect(page.getByText('Treino registrado')).toBeVisible();
});

test('treino rápido e opção "Não consegui ir hoje"', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Hoje só tenho 15 minutos' }).click();
  await expect(page.getByText('Rápido', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Não consegui ir hoje' }).click();
  await expect(page.getByText('Tudo bem não ter conseguido hoje. Nada foi perdido.')).toBeVisible();
  await page.getByRole('button', { name: 'Desfazer registro de hoje' }).click();
  await expect(page.getByTestId('today-workout-name')).toHaveText('Full Body A');
});

test('trocar divisão mantém o histórico', async ({ page }) => {
  await onboard(page);
  await page.getByTestId('start-workout').click();
  await completeAllSets(page);
  await finishWorkout(page);
  await page.getByTestId('summary-close').click();
  await page.getByRole('button', { name: 'Treinos' }).click();
  await page.getByRole('button', { name: 'Trocar divisão' }).click();
  await page.getByRole('button', { name: /^Superiores \/ Inferiores/ }).click();
  await page.getByRole('button', { name: 'Mudar divisão' }).click();
  await expect(page.getByText('Superiores A')).toBeVisible();
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByTestId('history-list').getByText('Full Body A')).toBeVisible();
});

test('layout mobile sem rolagem horizontal em todas as abas', async ({ page }) => {
  await onboard(page);
  for (const tab of ['Hoje', 'Treinos', 'Histórico', 'Evolução', 'Perfil']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `aba ${tab}`).toBeLessThanOrEqual(0);
  }
  await page.getByRole('button', { name: 'Hoje', exact: true }).click();
  await page.getByTestId('start-workout').click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('funciona offline após o primeiro carregamento (service worker)', async ({ page, context }) => {
  await onboard(page);
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return !!reg.active;
  });
  // Garante que o SW controla a página
  await page.reload();
  await expect(page.getByTestId('today-workout-name')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('today-workout-name')).toHaveText('Full Body A');
  await page.getByTestId('start-workout').click();
  await expect(page.getByTestId('workout-screen')).toBeVisible();
  await context.setOffline(false);
});

test('demonstração animada, mapa muscular e tutorial do exercício', async ({ page }) => {
  await onboard(page);
  await page.getByTestId('start-workout').click();
  await page.getByRole('button', { name: /^Ver demonstração de/ }).first().click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByTestId('exercise-demo').locator('svg')).toBeVisible();
  await expect(sheet.getByRole('img', { name: 'Mapa muscular' })).toBeVisible();
  await expect(sheet.getByText('Músculos trabalhados')).toBeVisible();
  await expect(sheet.getByText(/^Principal —/)).toBeVisible();
  await expect(sheet.getByText('Como executar')).toBeVisible();
  await expect(sheet.getByRole('link', { name: /Ver vídeos no YouTube/ })).toHaveAttribute('href', /youtube\.com\/results/);
  await sheet.getByRole('button', { name: 'Pausar demonstração' }).click();
  await expect(sheet.getByRole('button', { name: 'Reproduzir demonstração' })).toBeVisible();
});
