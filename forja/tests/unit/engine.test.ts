import { describe, expect, it } from 'vitest';
import { EXERCISES, MUSCLE_LABEL } from '../../src/data/exercises';
import { DEFAULT_PREFS } from '../../src/db/db';
import { buildSession, nextTemplate, recommendToday } from '../../src/engine/recommend';
import { generatePlan, regenerateTemplate, specsFor, splitWarnings } from '../../src/engine/splits';
import { candidates, pickExercise } from '../../src/engine/selection';
import { prescribe } from '../../src/engine/prescription';
import { d, doSession, profile, state } from './fixtures';

describe('biblioteca de exercícios', () => {
  it('tem pelo menos 60 exercícios com IDs únicos e todas as categorias', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(60);
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const m of Object.keys(MUSCLE_LABEL)) expect(EXERCISES.some((e) => e.primary === m)).toBe(true);
  });
  it('cada exercício tem instruções, erros comuns e alternativas válidas', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const e of EXERCISES) {
      expect(e.instructions.length).toBeGreaterThan(0);
      expect(e.commonMistakes.length).toBeGreaterThan(0);
      for (const a of e.alternatives) expect(ids.has(a)).toBe(true);
    }
  });
});

describe('engine.splits', () => {
  it('Full Body gera A/B/C com 3 dias e A/B com 2 dias', () => {
    expect(specsFor('full_body', 3).map((s) => s.code)).toEqual(['A', 'B', 'C']);
    expect(specsFor('full_body', 2).map((s) => s.code)).toEqual(['A', 'B']);
    const st = state();
    expect(st.templates.map((t) => t.code)).toEqual(['A', 'B', 'C']);
  });
  it('cada Full Body tem membros inferiores, empurrar, puxar e core', () => {
    const st = state();
    for (const t of st.templates) {
      const pats = t.slots.map((s) => s.pattern);
      expect(pats.some((p) => ['agachamento', 'dobradica', 'unilateral_pernas'].includes(p))).toBe(true);
      expect(pats.some((p) => p.startsWith('empurrar'))).toBe(true);
      expect(pats.some((p) => p.startsWith('puxar'))).toBe(true);
      expect(pats.some((p) => p.startsWith('core'))).toBe(true);
    }
  });
  it('geração é determinística para o mesmo perfil', () => {
    const a = state().templates.map((t) => t.slots.map((s) => s.exerciseId));
    const b = state().templates.map((t) => t.slots.map((s) => s.exerciseId));
    expect(a).toEqual(b);
  });
  it('PPL com poucos dias gera aviso para iniciante', () => {
    expect(splitWarnings('ppl', 3, 'iniciante').length).toBe(1);
    expect(splitWarnings('full_body', 3, 'iniciante').length).toBe(0);
  });
  it('Upper/Lower e PPL geram fichas', () => {
    expect(state({}, { split: 'upper_lower', daysPerWeek: 4 }).templates.map((t) => t.code)).toEqual(['UA', 'LA', 'UB', 'LB']);
    expect(state({}, { split: 'ppl', daysPerWeek: 6 }).templates.map((t) => t.code)).toEqual(['PUSH', 'PULL', 'LEGS']);
  });
  it('regenerar cria nova versão com outro id', () => {
    const st = state();
    const t = st.templates[0];
    const r = regenerateTemplate(t, 'full_body', { profile: st.profile, prefs: DEFAULT_PREFS, library: EXERCISES });
    expect(r.id).not.toBe(t.id);
    expect(r.version).toBe(2);
    expect(r.code).toBe('A');
  });
});

describe('engine.selection', () => {
  const base = { level: 'iniciante' as const, avoid: [], preferred: [], avoidRegions: [], library: EXERCISES };
  it('substitui exercício sem equipamento (casa: só halteres)', () => {
    const ex = pickExercise(['agachamento'], { ...base, equipment: ['peso_corporal', 'halteres'] }, ['leg_press', 'agachamento_goblet']);
    expect(ex?.id).toBe('agachamento_goblet');
  });
  it('limitações excluem exercícios que solicitam a região', () => {
    const list = candidates('dobradica', { ...base, equipment: ['halteres', 'barra', 'anilhas', 'kettlebell'], avoidRegions: ['lombar'] });
    expect(list.every((e) => !e.stressRegions.includes('lombar'))).toBe(true);
  });
  it('exercícios bloqueados não aparecem', () => {
    const list = candidates('empurrar_horizontal', { ...base, equipment: ['peso_corporal', 'maquinas', 'halteres', 'banco'], avoid: ['supino_maquina'] });
    expect(list.map((e) => e.id)).not.toContain('supino_maquina');
  });
  it('iniciante não recebe exercício de dificuldade 3 se houver alternativa', () => {
    const list = candidates('puxar_vertical', { ...base, equipment: ['polia', 'barra_fixa'] });
    expect(list[0].difficulty).toBeLessThan(3);
  });
  it('escolha é determinística', () => {
    const c = { ...base, equipment: ['halteres', 'banco'] as never };
    expect(pickExercise(['empurrar_horizontal'], c)?.id).toBe(pickExercise(['empurrar_horizontal'], c)?.id);
  });
  it('perfil em casa gera Full Body só com equipamentos disponíveis', () => {
    const st = state({}, { location: 'casa', equipment: ['peso_corporal', 'elastico'] });
    for (const t of st.templates)
      for (const s of t.slots) {
        const e = EXERCISES.find((x) => x.id === s.exerciseId)!;
        expect(e.equipment.every((q) => ['peso_corporal', 'elastico'].includes(q))).toBe(true);
      }
  });
});

describe('engine.prescription', () => {
  const sup = EXERCISES.find((e) => e.id === 'supino_maquina')!;
  const lat = EXERCISES.find((e) => e.id === 'elevacao_lateral_halteres')!;
  const plank = EXERCISES.find((e) => e.id === 'prancha')!;
  it('iniciante recebe 2 séries', () => {
    expect(prescribe(sup, 1, { level: 'iniciante', goal: 'hipertrofia', style: 'tradicional' }).sets).toBe(2);
    expect(prescribe(sup, 1, { level: 'intermediario', goal: 'hipertrofia', style: 'tradicional' }).sets).toBe(3);
  });
  it('faixas variam por objetivo e tipo', () => {
    expect(prescribe(sup, 1, { level: 'iniciante', goal: 'hipertrofia', style: 'tradicional' })).toMatchObject({ repMin: 8, repMax: 12 });
    expect(prescribe(lat, 3, { level: 'iniciante', goal: 'hipertrofia', style: 'tradicional' })).toMatchObject({ repMin: 10, repMax: 15 });
    expect(prescribe(sup, 1, { level: 'intermediario', goal: 'forca', style: 'tradicional' })).toMatchObject({ repMin: 5, repMax: 8 });
    expect(prescribe(plank, 2, { level: 'iniciante', goal: 'saude', style: 'tradicional' })).toMatchObject({ repMin: 20, repMax: 40 });
  });
  it('RIR alvo nunca exige falha para iniciantes', () => {
    expect(prescribe(sup, 1, { level: 'iniciante', goal: 'hipertrofia', style: 'tradicional' }).targetRir[0]).toBeGreaterThanOrEqual(2);
  });
  it('descanso maior em compostos', () => {
    const c = { level: 'iniciante' as const, goal: 'hipertrofia' as const, style: 'tradicional' as const };
    expect(prescribe(sup, 1, c).restSec).toBeGreaterThan(prescribe(lat, 3, c).restSec);
  });
  it('sobrescritas das preferências são respeitadas', () => {
    const p = prescribe(sup, 1, { level: 'iniciante', goal: 'hipertrofia', style: 'tradicional', prefs: { repRangeOverride: { min: 6, max: 10 }, restOverride: 90 } });
    expect(p).toMatchObject({ repMin: 6, repMax: 10, restSec: 90 });
  });
});

describe('engine.recommend', () => {
  it('histórico vazio recomenda Full Body A', () => {
    const r = recommendToday(state());
    expect(r.kind).toBe('treino');
    expect(r.template?.code).toBe('A');
  });
  it('segue A → B → C → A', () => {
    const st = state();
    const [A, B, C] = st.templates;
    const s1 = doSession(st, A, d(2));
    expect(nextTemplate(st.plan, st.templates, [s1])?.code).toBe('B');
    const s2 = doSession(st, B, d(4));
    expect(nextTemplate(st.plan, st.templates, [s1, s2])?.code).toBe('C');
    const s3 = doSession(st, C, d(6));
    expect(nextTemplate(st.plan, st.templates, [s1, s2, s3])?.code).toBe('A');
  });
  it('Full Body no dia seguinte sugere descanso', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2, 8));
    const r = recommendToday({ ...st, sessions: [s1], now: d(3, 20) });
    expect(r.kind).toBe('descanso');
    expect(r.canTrainAnyway).toBe(true);
    expect(r.template?.code).toBe('B');
  });
  it('falta na quarta mantém B pendente na quinta', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2)); // segunda
    const wed = recommendToday({ ...st, sessions: [s1], now: d(4) });
    expect(wed.template?.code).toBe('B');
    // quarta: "não consegui ir hoje"
    const logs = [{ id: 'x', date: '2026-11-04', type: 'nao_consegui' as const, createdAt: d(4).toISOString() }];
    const wedAfter = recommendToday({ ...st, sessions: [s1], dayLogs: logs, now: d(4, 20) });
    expect(wedAfter.kind).toBe('descanso');
    const thu = recommendToday({ ...st, sessions: [s1], dayLogs: logs, now: d(5) });
    expect(thu.kind).toBe('treino');
    expect(thu.template?.code).toBe('B');
  });
  it('não usa o dia da semana: mesma história, dias diferentes → mesma ficha', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2));
    const codes = [5, 6, 7, 8, 9].map((day) => recommendToday({ ...st, sessions: [s1], now: d(day) }).template?.code);
    expect(new Set(codes)).toEqual(new Set(['B']));
  });
  it('Upper/Lower permite dias consecutivos', () => {
    const st = state({}, { split: 'upper_lower', daysPerWeek: 4 });
    const s1 = doSession(st, st.templates[0], d(2));
    const r = recommendToday({ ...st, sessions: [s1], now: d(3) });
    expect(r.kind).toBe('treino');
    expect(r.template?.code).toBe('LA');
  });
  it('sessão parcial com menos da metade não avança a sequência', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2), { fraction: 0.3 });
    expect(s1.status).toBe('parcial');
    expect(nextTemplate(st.plan, st.templates, [s1])?.code).toBe('A');
    const s2 = doSession(st, st.templates[0], d(2), { fraction: 0.7 });
    expect(nextTemplate(st.plan, st.templates, [s2])?.code).toBe('B');
  });
  it('dia de descanso registrado é respeitado', () => {
    const st = state();
    const r = recommendToday({ ...st, dayLogs: [{ id: '1', date: '2026-11-02', type: 'descanso', createdAt: d(2).toISOString() }] });
    expect(r.kind).toBe('descanso');
    expect(r.template?.code).toBe('A');
  });
  it('meta semanal atingida sugere descanso opcional', () => {
    const st = state({}, { daysPerWeek: 2 });
    const [A, B] = st.templates;
    const s1 = doSession(st, A, d(2));
    const s2 = doSession(st, B, d(4));
    const r = recommendToday({ ...st, sessions: [s1, s2], now: d(6) });
    expect(r.kind).toBe('descanso');
    expect(r.canTrainAnyway).toBe(true);
  });
  it('dor aguda leva a recuperação; sinais de alerta mandam parar', () => {
    const st = state();
    const ci = { id: 'c', date: '2026-11-02', createdAt: '', energy: 3, soreness: 2, sleep: 3, pain: 'aguda' as const, painRegions: ['joelho' as const], redFlags: false };
    expect(recommendToday({ ...st, checkIn: ci }).kind).toBe('recuperacao_ativa');
    expect(recommendToday({ ...st, checkIn: { ...ci, redFlags: true } }).kind).toBe('pare');
  });
  it('desconforto no joelho substitui exercícios que o solicitam', () => {
    const st = state();
    const built = buildSession(st, st.templates[0], { painRegions: ['joelho'] });
    for (const e of built.exercises) {
      const ex = EXERCISES.find((x) => x.id === e.exerciseId)!;
      expect(ex.stressRegions).not.toContain('joelho');
    }
  });
  it('pausa longa gera modo retorno', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2));
    const r = recommendToday({ ...st, sessions: [s1], now: new Date(2026, 10, 20, 9) });
    expect(r.kind).toBe('treino');
    expect(r.mode).toBe('retorno');
  });
  it('sessão em andamento é oferecida para retomada', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2), { fraction: 0.5 });
    s1.status = 'em_andamento';
    const r = recommendToday({ ...st, sessions: [s1], now: d(2, 11) });
    expect(r.kind).toBe('retomar');
    expect(r.inProgress?.id).toBe(s1.id);
  });
  it('troca de divisão: novo plano começa na primeira ficha, histórico conta para recuperação', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2));
    const prof = profile({ split: 'upper_lower', daysPerWeek: 4 });
    const np = generatePlan('upper_lower', { profile: prof, prefs: DEFAULT_PREFS, library: EXERCISES });
    const r = recommendToday({ ...st, profile: prof, plan: np.plan, templates: np.templates, sessions: [s1], now: d(5) });
    expect(r.template?.code).toBe('UA');
    expect(r.lastSession?.id).toBe(s1.id);
  });
});

describe('engine.session', () => {
  it('treino rápido mantém essenciais e cabe em ~20 min', () => {
    const st = state();
    const full = buildSession(st, st.templates[0]);
    const quick = buildSession(st, st.templates[0], { mode: 'rapido' });
    expect(quick.exercises.length).toBeLessThan(full.exercises.length);
    expect(quick.estimatedMin).toBeLessThanOrEqual(25);
    const p1 = st.templates[0].slots.filter((s) => s.priority === 1).map((s) => s.exerciseId);
    for (const id of p1) expect(quick.exercises.map((e) => e.exerciseId)).toContain(id);
  });
  it('respeita o tempo disponível', () => {
    const st = state({}, { sessionMinutes: 30 });
    const b = buildSession(st, st.templates[0]);
    expect(b.estimatedMin).toBeLessThanOrEqual(30);
    expect(b.notes.join(' ')).toMatch(/30 min/);
  });
  it('trocas manuais do dia são aplicadas', () => {
    const st = state();
    const slot = st.templates[0].slots[0];
    const b = buildSession(st, st.templates[0], { swaps: { [slot.slotId]: 'leg_press' } });
    expect(b.exercises[0].exerciseId).toBe('leg_press');
    expect(b.exercises[0].swappedFrom).toBe(slot.exerciseId);
  });
  it('equipamento removido do perfil é substituído com explicação', () => {
    const st = state();
    const st2 = { ...st, profile: { ...st.profile, equipment: ['peso_corporal', 'halteres', 'banco'] as never } };
    const b = buildSession(st2, st.templates[0]);
    expect(b.notes.some((n) => n.includes('trocado'))).toBe(true);
    for (const e of b.exercises) {
      const ex = EXERCISES.find((x) => x.id === e.exerciseId)!;
      expect(ex.equipment.every((q) => ['peso_corporal', 'halteres', 'banco'].includes(q))).toBe(true);
    }
  });
  it('dados incompletos (séries sem carga) não quebram a sugestão', () => {
    const st = state();
    const s1 = doSession(st, st.templates[0], d(2), { weight: undefined });
    s1.exercises.forEach((e) => e.sets.forEach((x) => (x.weightKg = null)));
    const b = buildSession({ ...st, sessions: [s1], now: d(4) }, st.templates[0]);
    expect(b.exercises.length).toBeGreaterThan(0);
  });
});
