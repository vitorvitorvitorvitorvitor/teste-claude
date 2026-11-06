import { beforeEach, describe, expect, it } from 'vitest';
import { db, ForjaDB, useDatabase } from '../../src/db/db';
import * as repo from '../../src/db/repo';
import { exportBackup, importBackup, validateBackup } from '../../src/db/backup';
import { buildSession, createSession, recommendToday } from '../../src/engine/recommend';
import { profile } from './fixtures';

let n = 0;
beforeEach(async () => {
  useDatabase(`test-${++n}`);
});

async function startAndLog(now: Date, finish = true) {
  const st = (await repo.engineState(now))!;
  const r = recommendToday(st);
  const built = buildSession(st, r.template!);
  const s = createSession(st, r.template!, built, 'normal', r.reasons, `s_${now.getTime()}`);
  s.exercises[0].sets[0] = { ...s.exercises[0].sets[0], weightKg: 30, reps: 10, rir: 2, done: true };
  await repo.saveSession(s);
  if (!finish) return s;
  for (const e of s.exercises) for (const set of e.sets) Object.assign(set, { done: true, reps: e.repMax, weightKg: e.loadType === 'carga' ? 20 : null });
  return repo.finishSession(s, { sessionRpe: 6 });
}

describe('persistência', () => {
  it('cria perfil e gera plano Full Body', async () => {
    await repo.saveProfile(profile());
    const plan = await repo.getActivePlan();
    expect(plan?.split).toBe('full_body');
    expect(await db.templates.count()).toBe(3);
  });

  it('registro de séries persiste após "fechar e reabrir" (nova conexão)', async () => {
    await repo.saveProfile(profile());
    const s = await startAndLog(new Date(2026, 10, 2, 9), false);
    const name = db.name;
    db.close();
    const reopened = new ForjaDB(name);
    const got = await reopened.sessions.get(s.id);
    expect(got?.status).toBe('em_andamento');
    expect(got?.exercises[0].sets[0]).toMatchObject({ weightKg: 30, reps: 10, done: true });
    reopened.close();
  });

  it('retomada de sessão interrompida', async () => {
    await repo.saveProfile(profile());
    const s = await startAndLog(new Date(2026, 10, 2, 9), false);
    const st = (await repo.engineState(new Date(2026, 10, 2, 10)))!;
    const r = recommendToday(st);
    expect(r.kind).toBe('retomar');
    expect(r.inProgress?.id).toBe(s.id);
  });

  it('encerrar grava registros de progresso e status', async () => {
    await repo.saveProfile(profile());
    const done = await startAndLog(new Date(2026, 10, 2, 9));
    expect(done.status).toBe('concluida');
    expect(await db.progress.where('sessionId').equals(done.id).count()).toBeGreaterThan(0);
  });

  it('alternar divisão não apaga sessões e arquiva o plano anterior', async () => {
    await repo.saveProfile(profile());
    await startAndLog(new Date(2026, 10, 2, 9));
    const before = await db.sessions.count();
    await repo.switchSplit('upper_lower');
    expect(await db.sessions.count()).toBe(before);
    const plans = await db.plans.toArray();
    expect(plans.length).toBe(2);
    expect(plans.filter((p) => p.active).length).toBe(1);
    expect((await repo.getActivePlan())?.split).toBe('upper_lower');
    await repo.switchSplit('full_body');
    expect(await db.sessions.count()).toBe(before);
  });

  it('editar perfil não apaga histórico', async () => {
    await repo.saveProfile(profile());
    await startAndLog(new Date(2026, 10, 2, 9));
    await repo.saveProfile(profile({ sessionMinutes: 30, weightKg: 79 }));
    expect(await db.sessions.count()).toBe(1);
    expect((await repo.getProfile())?.weightKg).toBe(79);
  });

  it('regenerar ficha com histórico preserva versão anterior', async () => {
    await repo.saveProfile(profile());
    const s = await startAndLog(new Date(2026, 10, 2, 9));
    const fresh = await repo.regenerate(s.templateId);
    const old = await db.templates.get(s.templateId);
    expect(old?.archived).toBe(true);
    const plan = await repo.getActivePlan();
    expect(plan?.sequence).toContain(fresh.id);
    expect(plan?.sequence).not.toContain(s.templateId);
    // A sequência continua: próxima ficha após A é B.
    const st = (await repo.engineState(new Date(2026, 10, 4, 9)))!;
    expect(recommendToday(st).template?.code).toBe('B');
  });

  it('backup: exporta, valida, apaga e restaura', async () => {
    await repo.saveProfile(profile());
    await startAndLog(new Date(2026, 10, 2, 9));
    await repo.addBodyWeight(80);
    const file = JSON.parse(JSON.stringify(await exportBackup()));
    expect(validateBackup(file).ok).toBe(true);
    await repo.wipeAll();
    expect(await db.sessions.count()).toBe(0);
    const res = await importBackup(file);
    expect(res.ok).toBe(true);
    expect(await db.sessions.count()).toBe(1);
    expect(await db.bodyWeights.count()).toBe(1);
    expect((await repo.getProfile())?.name).toBe('Teste');
  });

  it('backup inválido é rejeitado sem alterar dados', async () => {
    await repo.saveProfile(profile());
    const bad = JSON.parse(JSON.stringify(await exportBackup()));
    bad.data.sessions.push({ id: 'x', planId: 'nao-existe', templateId: 'y', status: 'concluida', startedAt: '2026', exercises: [] });
    const res = await importBackup(bad);
    expect(res.ok).toBe(false);
    expect(await db.profile.count()).toBe(1);
    expect((await importBackup({ app: 'outro' })).ok).toBe(false);
    expect((await importBackup('lixo')).ok).toBe(false);
  });

  it('apagar todos os dados', async () => {
    await repo.saveProfile(profile());
    await repo.wipeAll();
    expect(await repo.getProfile()).toBeUndefined();
  });

  it('check-in do dia substitui o anterior', async () => {
    await repo.saveProfile(profile());
    const now = new Date(2026, 10, 2, 9);
    await repo.saveCheckIn({ energy: 2, soreness: 2, sleep: 3, pain: 'nenhuma', painRegions: [], redFlags: false }, now);
    await repo.saveCheckIn({ energy: 4, soreness: 1, sleep: 4, pain: 'nenhuma', painRegions: [], redFlags: false }, now);
    expect(await db.checkins.count()).toBe(1);
    const st = (await repo.engineState(now))!;
    expect(st.checkIn?.energy).toBe(4);
  });
});
