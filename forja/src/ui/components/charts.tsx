import { useState } from 'react';

/**
 * Gráficos SVG leves (sem dependências). Série única na cor de destaque,
 * linhas de 2px, barras com pontas arredondadas de 4px e espaçamento de 2px,
 * grade/eixos discretos, toque/hover mostra o valor e há visão em tabela.
 */

export interface Point {
  label: string;
  value: number;
}

const fmt = (n: number, unit = '') => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${unit}`;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function Readout({ p, unit }: { p: Point | null; unit?: string }) {
  return (
    <div className="h-5 text-xs text-muted tabular" aria-live="polite">
      {p ? (
        <>
          <span className="text-ink font-semibold">{fmt(p.value, unit)}</span> · {p.label}
        </>
      ) : (
        'Toque no gráfico para ver os valores'
      )}
    </div>
  );
}

function TableView({ data, unit }: { data: Point[]; unit?: string }) {
  return (
    <table className="w-full text-sm mt-2">
      <tbody>
        {data.map((d, i) => (
          <tr key={i} className="border-t border-line/60">
            <td className="py-1.5 text-muted">{d.label}</td>
            <td className="py-1.5 text-right tabular">{fmt(d.value, unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Frame({ children, data, unit, title }: { children: (sel: number | null, setSel: (i: number | null) => void) => React.ReactNode; data: Point[]; unit?: string; title: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  return (
    <figure aria-label={title}>
      <div className="flex items-center justify-between">
        <Readout p={sel !== null ? data[sel] : null} unit={unit} />
        <button className="text-xs text-muted underline underline-offset-2" onClick={() => setTable((t) => !t)}>
          {table ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      </div>
      {table ? <TableView data={data} unit={unit} /> : children(sel, setSel)}
    </figure>
  );
}

const W = 320;
const H = 150;
const PAD = { l: 44, r: 12, t: 10, b: 22 };

function Axis({ max, unit }: { max: number; unit?: string }) {
  const ticks = [0, max / 2, max];
  return (
    <g>
      {ticks.map((t, i) => {
        const y = PAD.t + (H - PAD.t - PAD.b) * (1 - t / max);
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} style={{ stroke: 'rgb(var(--line))' }} strokeWidth={1} strokeDasharray={i === 0 ? undefined : '2 3'} />
            <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" style={{ fill: 'rgb(var(--muted))' }}>
              {t >= 1000 ? `${fmt(t / 1000)} mil` : fmt(t)}
              {i === 2 && unit && t < 1000 ? unit : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function xLabels(data: Point[], x: (i: number) => number) {
  const every = Math.max(1, Math.ceil(data.length / 6));
  return data.map((d, i) =>
    i % every === 0 || i === data.length - 1 ? (
      <text key={i} x={x(i)} y={H - 6} textAnchor={data.length > 1 && i === data.length - 1 ? 'end' : i === 0 && data.length > 1 ? 'start' : 'middle'} fontSize="9" style={{ fill: 'rgb(var(--muted))' }}>
        {d.label}
      </text>
    ) : null
  );
}

export function LineChart({ data, unit, title }: { data: Point[]; unit?: string; title: string }) {
  if (data.length === 0) return null;
  const max = niceMax(Math.max(...data.map((d) => d.value)) * 1.1);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (data.length === 1 ? iw / 2 : (iw * i) / (data.length - 1));
  const y = (v: number) => PAD.t + ih * (1 - v / max);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');
  return (
    <Frame data={data} unit={unit} title={title}>
      {(sel, setSel) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none" role="img" aria-label={title}
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            let best = 0;
            data.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
            setSel(best);
          }}
          onPointerLeave={() => setSel(null)}>
          <Axis max={max} unit={unit} />
          <path d={path} fill="none" style={{ stroke: 'rgb(var(--accent))' }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {sel !== null && <line x1={x(sel)} x2={x(sel)} y1={PAD.t} y2={H - PAD.b} style={{ stroke: 'rgb(var(--muted))' }} strokeWidth={1} />}
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.value)} r={sel === i ? 5 : 4} style={{ fill: 'rgb(var(--accent))', stroke: 'rgb(var(--surface))' }}  strokeWidth={2} />
          ))}
          {xLabels(data, x)}
        </svg>
      )}
    </Frame>
  );
}

export function BarChart({ data, unit, title }: { data: Point[]; unit?: string; title: string }) {
  if (data.length === 0) return null;
  const max = niceMax(Math.max(...data.map((d) => d.value), 1) * 1.1);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / data.length;
  const bw = Math.max(4, Math.min(28, slot - 2));
  const x = (i: number) => PAD.l + slot * i + slot / 2;
  return (
    <Frame data={data} unit={unit} title={title}>
      {(sel, setSel) => (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={title} onPointerLeave={() => setSel(null)}>
          <Axis max={max} unit={unit} />
          {data.map((d, i) => {
            const h = (ih * d.value) / max;
            const top = PAD.t + ih - h;
            const r = Math.min(4, h / 2, bw / 2);
            return (
              <g key={i} onPointerEnter={() => setSel(i)} onClick={() => setSel(i)}>
                <rect x={x(i) - slot / 2} y={PAD.t} width={slot} height={ih} fill="transparent" />
                {h > 0 && (
                  <path
                    d={`M${x(i) - bw / 2},${PAD.t + ih} V${top + r} Q${x(i) - bw / 2},${top} ${x(i) - bw / 2 + r},${top} H${x(i) + bw / 2 - r} Q${x(i) + bw / 2},${top} ${x(i) + bw / 2},${top + r} V${PAD.t + ih} Z`}
                    style={{ fill: 'rgb(var(--accent))' }}
                    opacity={sel === null || sel === i ? 1 : 0.45}
                  />
                )}
              </g>
            );
          })}
          {xLabels(data, x)}
        </svg>
      )}
    </Frame>
  );
}

/** Barras horizontais (distribuição por grupo muscular). */
export function HBarChart({ data, unit, title }: { data: Point[]; unit?: string; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const [table, setTable] = useState(false);
  return (
    <figure aria-label={title}>
      <div className="flex justify-end">
        <button className="text-xs text-muted underline underline-offset-2" onClick={() => setTable((t) => !t)}>
          {table ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      </div>
      {table ? (
        <TableView data={data} unit={unit} />
      ) : (
        <div className="space-y-2 mt-1">
          {data.map((d) => (
            <div key={d.label} className="grid grid-cols-[96px_1fr_44px] items-center gap-2 text-sm">
              <span className="text-muted truncate">{d.label}</span>
              <div className="h-3 rounded bg-surface2 overflow-hidden">
                <div className="h-full bg-accent rounded" style={{ width: `${(d.value / max) * 100}%` }} />
              </div>
              <span className="text-right tabular">{fmt(d.value)}</span>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}
