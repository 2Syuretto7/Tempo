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

export function Meter({ value, label, size = 'md', threshold = true }: { value: number; label?: string; size?: 'sm' | 'md'; threshold?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div class={`meter meter-${size}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label ?? 'Mastery'}>
      <div class="meter-fill" style={{ width: `${v}%` }} />
      {threshold && <div class="meter-line" style={{ left: '80%' }} title="80% unlocks the next lesson" />}
    </div>
  );
}

/** A progress ring, for compact progress read-outs. */
export function Ring({ value, size = 44, label }: { value: number; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} class="ring" role="img" aria-label={label ?? `${Math.round(v)}%`}>
      <circle cx="20" cy="20" r={r} class="ring-track" />
      <circle cx="20" cy="20" r={r} class="ring-fill" stroke-dasharray={`${(v / 100) * c} ${c}`} transform="rotate(-90 20 20)" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  // A metronome: steady tempo, one beat at a time.
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" class="logo-mark">
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path d="M9.5 25.5 L13.2 7.5 H18.8 L22.5 25.5 Z" fill="none" stroke="var(--brand-ink)" stroke-width="2" stroke-linejoin="round" />
      <path d="M16 22 L21.6 10" stroke="var(--brand-ink)" stroke-width="2" stroke-linecap="round" />
      <rect x="18.1" y="13.6" width="4.2" height="3" rx="1" transform="rotate(25 20.2 15.1)" fill="var(--brand-ink)" />
      <path d="M11.4 21.5 H20.6" stroke="var(--brand-ink)" stroke-width="2" stroke-linecap="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span class="wordmark">
      <Logo />
      <span class="wordmark-text">Tempo</span>
    </span>
  );
}

export type IconName =
  | 'check'
  | 'lock'
  | 'dot'
  | 'arrow-right'
  | 'arrow-left'
  | 'spark'
  | 'clock'
  | 'book'
  | 'refresh'
  | 'sun'
  | 'moon'
  | 'map'
  | 'gear'
  | 'home'
  | 'pen'
  | 'target'
  | 'layers'
  | 'bulb'
  | 'eye'
  | 'flag'
  | 'link'
  | 'chevron-right'
  | 'download'
  | 'upload'
  | 'trash'
  | 'x';

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round' as const, 'stroke-linejoin': 'round' as const };
  const paths: Record<IconName, JSX.Element> = {
    check: <path d="M4.5 10.5 L8.3 14.2 L15.5 6.2" {...common} />,
    lock: (
      <g {...common}>
        <rect x="4.5" y="9" width="11" height="8" rx="2" />
        <path d="M7 9 V6.5 a3 3 0 0 1 6 0 V9" />
      </g>
    ),
    dot: <circle cx="10" cy="10" r="3.2" fill="currentColor" />,
    'arrow-right': <path d="M4 10 H16 M11 5 L16 10 L11 15" {...common} />,
    'arrow-left': <path d="M16 10 H4 M9 5 L4 10 L9 15" {...common} />,
    'chevron-right': <path d="M8 5 L13 10 L8 15" {...common} />,
    spark: <path d="M10 3 L11.6 8.4 L17 10 L11.6 11.6 L10 17 L8.4 11.6 L3 10 L8.4 8.4 Z" {...common} />,
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
    map: (
      <g {...common}>
        <path d="M3 5.5 L7.5 3.5 L12.5 5.5 L17 3.5 V14.5 L12.5 16.5 L7.5 14.5 L3 16.5 Z" />
        <path d="M7.5 3.5 V14.5 M12.5 5.5 V16.5" />
      </g>
    ),
    gear: (
      <g {...common}>
        <path d="M3.5 6 H9 M13 6 H16.5 M3.5 14 H6 M10 14 H16.5" />
        <circle cx="11" cy="6" r="2" />
        <circle cx="8" cy="14" r="2" />
      </g>
    ),
    home: (
      <g {...common}>
        <path d="M3.5 9 L10 3.5 L16.5 9 V16 a1 1 0 0 1 -1 1 H4.5 a1 1 0 0 1 -1 -1 Z" />
        <path d="M8 17 V12 H12 V17" />
      </g>
    ),
    pen: (
      <g {...common}>
        <path d="M12.5 4.5 L15.5 7.5 L7 16 H4 V13 Z" />
        <path d="M11 6 L14 9" />
      </g>
    ),
    target: (
      <g {...common}>
        <circle cx="10" cy="10" r="7" />
        <circle cx="10" cy="10" r="3.6" />
        <circle cx="10" cy="10" r="0.6" fill="currentColor" />
      </g>
    ),
    layers: (
      <g {...common}>
        <path d="M10 3 L17 7 L10 11 L3 7 Z" />
        <path d="M3 10.5 L10 14.5 L17 10.5" />
        <path d="M3 13.8 L10 17.5 L17 13.8" />
      </g>
    ),
    bulb: (
      <g {...common}>
        <path d="M7 13.5 C5.4 12.3 4.5 10.6 4.5 8.6 A5.5 5.5 0 0 1 15.5 8.6 C15.5 10.6 14.6 12.3 13 13.5 V15 H7 Z" />
        <path d="M7.8 17.5 H12.2" />
      </g>
    ),
    eye: (
      <g {...common}>
        <path d="M2.5 10 C4.8 5.8 15.2 5.8 17.5 10 C15.2 14.2 4.8 14.2 2.5 10 Z" />
        <circle cx="10" cy="10" r="2.3" />
      </g>
    ),
    flag: (
      <g {...common}>
        <path d="M5 17.5 V3" />
        <path d="M5 3.5 H15 L12.5 7.2 L15 11 H5" />
      </g>
    ),
    link: (
      <g {...common}>
        <path d="M8.5 11.5 L11.5 8.5" />
        <path d="M9.5 5.5 L11 4 a3.2 3.2 0 0 1 4.5 4.5 L14 10" />
        <path d="M10.5 14.5 L9 16 a3.2 3.2 0 0 1 -4.5 -4.5 L6 10" />
      </g>
    ),
    download: (
      <g {...common}>
        <path d="M10 3.5 V12.5 M6 8.5 L10 12.5 L14 8.5" />
        <path d="M4 16 H16" />
      </g>
    ),
    upload: (
      <g {...common}>
        <path d="M10 12.5 V3.5 M6 7.5 L10 3.5 L14 7.5" />
        <path d="M4 16 H16" />
      </g>
    ),
    trash: (
      <g {...common}>
        <path d="M4 6 H16 M8 6 V4 H12 V6 M5.5 6 L6.3 16.5 H13.7 L14.5 6" />
      </g>
    ),
    x: <path d="M5 5 L15 15 M15 5 L5 15" {...common} />,
  };
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" class="icon">
      {paths[name]}
    </svg>
  );
}
