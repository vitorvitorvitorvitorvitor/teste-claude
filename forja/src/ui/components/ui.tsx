import { useEffect, useState, type ReactNode } from 'react';

/** Design system básico do FORJA. */

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  children,
  onClick,
  variant = 'secondary',
  className,
  disabled,
  type = 'button',
  size = 'md',
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
  'data-testid'?: string;
}) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-accent text-onaccent font-semibold active:brightness-90',
    secondary: 'bg-surface2 text-ink active:bg-line',
    ghost: 'bg-transparent text-ink active:bg-surface2',
    danger: 'bg-danger/15 text-danger active:bg-danger/25'
  };
  const s = { sm: 'h-9 px-3 text-sm rounded-xl', md: 'h-12 px-4 rounded-2xl', lg: 'h-14 px-5 text-lg rounded-2xl' }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx('inline-flex items-center justify-center gap-2 transition select-none disabled:opacity-40', v[variant], s, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cx('bg-surface rounded-3xl p-4 border border-line/60 animate-fadeUp', onClick && 'cursor-pointer active:bg-surface2', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2 px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function Chip({ active, children, onClick, className }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'px-3.5 h-10 rounded-full text-sm border transition whitespace-nowrap',
        active ? 'bg-accent text-onaccent border-accent font-semibold' : 'bg-surface2 border-line text-ink',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={String(o.value)} active={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-1.5 rounded-full bg-surface2 overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto bg-surface rounded-t-3xl sm:rounded-3xl p-5 pb-safe animate-sheet border-t border-line">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        {title && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} aria-label="Fechar" className="h-9 w-9 rounded-full bg-surface2 grid place-items-center">
              <Icon name="x" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <div className="text-muted mb-5">{message}</div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="block mb-4" role="group" aria-label={label}>
      <span className="block text-sm text-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </div>
  );
}

export const inputCls =
  'w-full h-12 px-4 rounded-2xl bg-surface2 border border-line text-ink placeholder:text-muted focus:outline-none focus:border-accent';

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between py-3">
      <span className="text-left">{label}</span>
      <span className={cx('relative h-7 w-12 rounded-full transition', checked ? 'bg-accent' : 'bg-line')}>
        <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="bg-surface2 rounded-2xl p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl font-semibold tabular mt-0.5">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-muted py-10 px-6 text-sm leading-relaxed">{children}</div>;
}

const PATHS: Record<string, string> = {
  today: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  dumbbell: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  user: 'M20 21a8 8 0 1 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  play: 'M7 4.5v15l12-7.5-12-7.5Z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  swap: 'M7 4 3 8l4 4M3 8h14m0 12 4-4-4-4m4 4H7',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  calendar: 'M4 7h16M8 3v4m8-4v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  chevron: 'm9 6 6 6-6 6',
  back: 'm15 6-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  note: 'M5 4h10l4 4v12H5V4Zm10 0v4h4M8 12h8M8 16h5',
  info: 'M12 8h.01M11 12h1v5h1m8-5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  pause: 'M8 5v14m8-14v14',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4m-4 5a8 8 0 0 0 14.9 3M20 20v-4h-4',
  trash: 'M4 7h16m-10 4v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h13',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M5 20h14',
  upload: 'M12 20V9m0 0 4 4m-4-4-4 4M5 4h14',
  shield: 'M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z',
  walk: 'M13 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-3 17 2-6 3 3v3m-5-9 1-4 4 2 2 3m-7-1-2 3'
};

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }: { name: keyof typeof PATHS | string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  placeholder,
  label,
  className,
  decimals = false
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  placeholder?: string;
  label: string;
  className?: string;
  decimals?: boolean;
}) {
  const fmt = (v: number | null) => (v === null || Number.isNaN(v) ? '' : String(v).replace('.', ','));
  const [text, setText] = useState(fmt(value));
  useEffect(() => {
    const parsed = text === '' ? null : Number(text.replace(',', '.'));
    if (parsed !== value) setText(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      aria-label={label}
      inputMode={decimals ? 'decimal' : 'numeric'}
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        let raw = e.target.value.replace('.', ',').replace(/[^0-9,]/g, '');
        if (!decimals) raw = raw.replace(/,/g, '');
        const parts = raw.split(',');
        if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
        setText(raw);
        if (raw === '') return onChange(null);
        const n = Number(raw.replace(',', '.'));
        if (!Number.isNaN(n) && !raw.endsWith(',')) onChange(Math.max(min, n));
      }}
      onBlur={() => setText(fmt(value))}
      className={cx('h-11 w-full rounded-xl bg-surface2 border border-line text-center tabular focus:outline-none focus:border-accent', className)}
    />
  );
}
