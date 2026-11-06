import type { ComponentChildren, JSX } from 'preact';

/** Renders a line of lesson text with **bold** and *italic* support. */
export function Rich({ text }: { text: string }) {
  const parts: ComponentChildren[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    parts.push(token.startsWith('**') ? <strong key={i++}>{token.slice(2, -2)}</strong> : <em key={i++}>{token.slice(1, -1)}</em>);
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}
    </>
  );
}

/** The lesson stage: words on the left, the board on the right. */
export function Stage({ children, board, aside }: { children: ComponentChildren; board?: ComponentChildren; aside?: ComponentChildren }) {
  return (
    <div class={`stage${board ? '' : ' stage-wide'}`}>
      <div class="stage-text">{children}</div>
      {board && (
        <div class="stage-board">
          {board}
          {aside}
        </div>
      )}
    </div>
  );
}

export function Meter({ value, label, size = 'md' }: { value: number; label?: string; size?: 'sm' | 'md' }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div class={`meter meter-${size}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label ?? 'Mastery'}>
      <div class="meter-fill" style={{ width: `${v}%` }} />
      <div class="meter-line" style={{ left: '80%' }} title="80% unlocks the next lesson" />
    </div>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  // A pendulum swinging over a square: steady time, and the board.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" class="logo-mark">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--accent)" />
      <path d="M8 24 H24" stroke="var(--accent-ink)" stroke-width="2.2" stroke-linecap="round" />
      <path d="M16 7 L20.5 21" stroke="var(--accent-ink)" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="16" cy="7" r="2.2" fill="var(--accent-ink)" />
      <circle cx="20" cy="19.6" r="3" fill="var(--accent-ink)" />
    </svg>
  );
}

type IconName = 'check' | 'lock' | 'dot' | 'arrow-right' | 'arrow-left' | 'spark' | 'clock' | 'book' | 'refresh' | 'sun' | 'moon';

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' as const, 'stroke-linejoin': 'round' as const };
  const paths: Record<IconName, JSX.Element> = {
    check: <path d="M4 10.5 L8.2 14.5 L16 6" {...common} />,
    lock: (
      <g {...common}>
        <rect x="4.5" y="9" width="11" height="8" rx="2" />
        <path d="M7 9 V6.5 a3 3 0 0 1 6 0 V9" />
      </g>
    ),
    dot: <circle cx="10" cy="10" r="3.2" fill="currentColor" />,
    'arrow-right': <path d="M4 10 H16 M11 5 L16 10 L11 15" {...common} />,
    'arrow-left': <path d="M16 10 H4 M9 5 L4 10 L9 15" {...common} />,
    spark: <path d="M10 3 V7 M10 13 V17 M3 10 H7 M13 10 H17 M5.5 5.5 L7.5 7.5 M12.5 12.5 L14.5 14.5 M14.5 5.5 L12.5 7.5 M7.5 12.5 L5.5 14.5" {...common} />,
    clock: (
      <g {...common}>
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6 V10 L13 12" />
      </g>
    ),
    book: (
      <g {...common}>
        <path d="M3.5 4.5 H8 a2 2 0 0 1 2 2 V16 a1.6 1.6 0 0 0 -1.6 -1.6 H3.5 Z" />
        <path d="M16.5 4.5 H12 a2 2 0 0 0 -2 2 V16 a1.6 1.6 0 0 1 1.6 -1.6 H16.5 Z" />
      </g>
    ),
    refresh: (
      <g {...common}>
        <path d="M15.5 8 A6 6 0 1 0 16 11.5" />
        <path d="M16 4 V8 H12" />
      </g>
    ),
    sun: (
      <g {...common}>
        <circle cx="10" cy="10" r="3.4" />
        <path d="M10 2.5 V4.2 M10 15.8 V17.5 M2.5 10 H4.2 M15.8 10 H17.5 M4.7 4.7 L5.9 5.9 M14.1 14.1 L15.3 15.3 M15.3 4.7 L14.1 5.9 M5.9 14.1 L4.7 15.3" />
      </g>
    ),
    moon: <path d="M15.5 12.5 A6.5 6.5 0 0 1 7.5 4.5 A6.5 6.5 0 1 0 15.5 12.5 Z" {...common} />,
  };
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" class="icon">
      {paths[name]}
    </svg>
  );
}
