import { db, SCHEMA_VERSION } from './db';

/**
 * Backup em JSON. A importação valida estrutura, tipos e integridade
 * referencial ANTES de alterar qualquer dado; se algo falhar, nada muda.
 */

export interface BackupFile {
  app: 'forja';
  schemaVersion: number;
  exportedAt: string;
  data: Record<TableName, unknown[]>;
}

const TABLES = [
  'profile',
  'prefs',
  'plans',
  'templates',
  'sessions',
  'progress',
  'checkins',
  'dayLogs',
  'bodyWeights',
  'customExercises'
] as const;
type TableName = (typeof TABLES)[number];

export async function exportBackup(): Promise<BackupFile> {
  const data = {} as Record<TableName, unknown[]>;
  for (const t of TABLES) data[t] = await db.table(t).toArray();
  return { app: 'forja', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}

type Rec = Record<string, unknown>;
const isObj = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown) => typeof x === 'string';
const isNum = (x: unknown) => typeof x === 'number' && Number.isFinite(x);

export function validateBackup(raw: unknown): { ok: true; file: BackupFile } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isObj(raw)) return { ok: false, errors: ['Arquivo não é um objeto JSON.'] };
  if (raw.app !== 'forja') errors.push('Arquivo não é um backup do FORJA.');
  if (!isNum(raw.schemaVersion)) errors.push('Versão do esquema ausente.');
  else if ((raw.schemaVersion as number) > SCHEMA_VERSION) errors.push('Backup criado por uma versão mais nova do app.');
  if (!isObj(raw.data)) return { ok: false, errors: [...errors, 'Seção "data" ausente.'] };
  const data = raw.data as Rec;
  for (const t of TABLES) {
    if (data[t] === undefined) data[t] = [];
    if (!Array.isArray(data[t])) errors.push(`Tabela ${t} inválida.`);
  }
  if (errors.length) return { ok: false, errors };

  const arr = (t: TableName) => data[t] as unknown[];
  const need = (t: TableName, fields: [string, (x: unknown) => boolean][]) => {
    arr(t).forEach((r, i) => {
      if (!isObj(r)) return errors.push(`${t}[${i}] não é objeto.`);
      for (const [f, ok] of fields) if (!ok(r[f])) errors.push(`${t}[${i}].${f} inválido.`);
    });
  };
  need('profile', [['id', (x) => x === 'me'], ['name', isStr], ['level', isStr], ['split', isStr], ['equipment', Array.isArray], ['daysPerWeek', isNum]]);
  need('prefs', [['id', (x) => x === 'prefs']]);
  need('plans', [['id', isStr], ['split', isStr], ['sequence', Array.isArray], ['createdAt', isStr]]);
  need('templates', [['id', isStr], ['planId', isStr], ['slots', Array.isArray], ['code', isStr], ['name', isStr]]);
  need('sessions', [['id', isStr], ['planId', isStr], ['templateId', isStr], ['status', isStr], ['startedAt', isStr], ['exercises', Array.isArray]]);
  need('progress', [['id', isStr], ['sessionId', isStr], ['exerciseId', isStr]]);
  need('checkins', [['id', isStr], ['date', isStr]]);
  need('dayLogs', [['id', isStr], ['date', isStr], ['type', isStr]]);
  need('bodyWeights', [['id', isStr], ['date', isStr], ['weightKg', isNum]]);
  need('customExercises', [['id', isStr], ['name', isStr], ['pattern', isStr]]);
  if (errors.length) return { ok: false, errors: errors.slice(0, 20) };

  // Integridade referencial
  const planIds = new Set(arr('plans').map((p) => (p as Rec).id));
  const tplIds = new Set(arr('templates').map((p) => (p as Rec).id));
  const sesIds = new Set(arr('sessions').map((p) => (p as Rec).id));
  arr('templates').forEach((t, i) => {
    if (!planIds.has((t as Rec).planId)) errors.push(`templates[${i}] referencia plano inexistente.`);
  });
  arr('plans').forEach((p, i) => {
    for (const id of (p as Rec).sequence as unknown[]) if (!tplIds.has(id)) errors.push(`plans[${i}] referencia ficha inexistente.`);
  });
  arr('sessions').forEach((s, i) => {
    if (!planIds.has((s as Rec).planId)) errors.push(`sessions[${i}] referencia plano inexistente.`);
    if (!tplIds.has((s as Rec).templateId)) errors.push(`sessions[${i}] referencia ficha inexistente.`);
  });
  arr('progress').forEach((p, i) => {
    if (!sesIds.has((p as Rec).sessionId)) errors.push(`progress[${i}] referencia sessão inexistente.`);
  });
  if (errors.length) return { ok: false, errors: errors.slice(0, 20) };
  return { ok: true, file: raw as unknown as BackupFile };
}

export async function importBackup(raw: unknown): Promise<{ ok: true; counts: Record<string, number> } | { ok: false; errors: string[] }> {
  const v = validateBackup(raw);
  if (!v.ok) return v;
  const counts: Record<string, number> = {};
  await db.transaction('rw', db.tables, async () => {
    for (const t of TABLES) {
      const table = db.table(t);
      await table.clear();
      const rows = v.file.data[t] ?? [];
      await table.bulkPut(rows);
      counts[t] = rows.length;
    }
  });
  return { ok: true, counts };
}

export function backupFileName(d = new Date()): string {
  return `forja-backup-${d.toISOString().slice(0, 10)}.json`;
}
