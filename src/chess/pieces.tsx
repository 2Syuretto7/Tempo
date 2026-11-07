import type { Color, PieceType } from './position';

// Tempo's own piece set, drawn on a 45 x 45 grid.
// Staunton-inspired silhouettes, reduced to clean shapes so they stay crisp at any size.
// Colours come from the design tokens: pure white and black, as on a printed diagram.
// Every piece stands on the same two-tier plinth, which gives the set a shared baseline.

interface Props {
  type: PieceType;
  color: Color;
}

const PLINTH = (
  <>
    <path d="M11 39.5 H34 A1.5 1.5 0 0 0 35.5 38 V36.8 A1.5 1.5 0 0 0 34 35.3 H11 A1.5 1.5 0 0 0 9.5 36.8 V38 A1.5 1.5 0 0 0 11 39.5 Z" />
    <path d="M13 35.3 H32 L31.2 32.6 H13.8 Z" />
  </>
);

function shapes(type: PieceType, detail: string) {
  const line = { fill: 'none', stroke: detail, 'stroke-width': 1.4 };
  switch (type) {
    case 'p':
      return (
        <>
          {PLINTH}
          <path d="M18.6 20 C18.6 25 16.4 29.4 14.6 32.6 H30.4 C28.6 29.4 26.4 25 26.4 20 Z" />
          <path d="M15.8 20.3 C15.8 18.6 29.2 18.6 29.2 20.3 C29.2 21.9 15.8 21.9 15.8 20.3 Z" />
          <circle cx="22.5" cy="13.2" r="5.4" />
        </>
      );
    case 'r':
      return (
        <>
          {PLINTH}
          <path d="M15.6 32.6 L17 19.5 H28 L29.4 32.6 Z" />
          <path d="M14 19.5 H31 L30 16.6 H15 Z" />
          <path d="M14.2 16.6 V9.6 H18.2 V12.4 H20.6 V9.6 H24.4 V12.4 H26.8 V9.6 H30.8 V16.6 Z" />
          <path d="M16.6 28.6 H28.4" {...line} />
        </>
      );
    case 'b':
      return (
        <>
          {PLINTH}
          <path d="M16.4 32.6 C17.6 28.6 19.4 25.6 19.6 22.8 H25.4 C25.6 25.6 27.4 28.6 28.6 32.6 Z" />
          <path d="M16.2 22.8 C16.2 21.2 28.8 21.2 28.8 22.8 C28.8 24.4 16.2 24.4 16.2 22.8 Z" />
          <path d="M22.5 7.6 C17.2 11.2 15.6 15.8 17.6 20.2 C18.2 21.4 26.8 21.4 27.4 20.2 C29.4 15.8 27.8 11.2 22.5 7.6 Z" />
          <circle cx="22.5" cy="5.8" r="2.1" />
          <path d="M25.6 11.6 L21.4 16.4" {...line} />
        </>
      );
    case 'n':
      return (
        <>
          {PLINTH}
          <path d="M13.8 32.6 C13.6 28.6 15.6 25.6 19.6 23.4 C17 24.6 14.6 25.2 12.3 24.6 C10.4 24.1 9.4 22.4 9.8 20.6 C10.3 18.6 12.5 16.4 15 14.2 C16.4 13 17.4 11.2 18.2 9.2 L18.9 5.2 L21.8 8 C27.8 8 32.6 13 33.3 20.5 C33.8 26 32.6 29.6 31.6 32.6 Z" />
          <circle cx="17.4" cy="13.4" r="1.15" fill={detail} stroke="none" />
          <circle cx="12" cy="20.8" r="0.75" fill={detail} stroke="none" />
          <path d="M23.6 10 C28 11.6 30.6 16 30.8 22.4" {...line} />
        </>
      );
    case 'q':
      return (
        <>
          {PLINTH}
          <path d="M14.6 32.6 C13.8 26.4 12.4 20.6 11.2 15.4 L17.2 22.6 L17 12.2 L21.2 21.4 L22.5 10.6 L23.8 21.4 L28 12.2 L27.8 22.6 L33.8 15.4 C32.6 20.6 31.2 26.4 30.4 32.6 Z" />
          <circle cx="11" cy="13.6" r="2" />
          <circle cx="17" cy="10.4" r="2" />
          <circle cx="22.5" cy="8.8" r="2" />
          <circle cx="28" cy="10.4" r="2" />
          <circle cx="34" cy="13.6" r="2" />
          <path d="M15.4 28.4 C20 27.4 25 27.4 29.6 28.4" {...line} />
        </>
      );
    case 'k':
      return (
        <>
          {PLINTH}
          <path d="M15.2 32.6 C15.8 27.4 17.2 22.4 17.6 17.8 H27.4 C27.8 22.4 29.2 27.4 29.8 32.6 Z" />
          <path d="M15.4 17.8 C15.4 16 29.6 16 29.6 17.8 C29.6 19.6 15.4 19.6 15.4 17.8 Z" />
          <path d="M18.2 16.4 C18 12.8 19.8 11.2 22.5 11.2 C25.2 11.2 27 12.8 26.8 16.4 Z" />
          <path d="M21.4 3.6 H23.6 V6.2 H26 V8.4 H23.6 V11.2 H21.4 V8.4 H19 V6.2 H21.4 Z" />
          <path d="M16.4 28.4 C20.4 27.6 24.6 27.6 28.6 28.4" {...line} />
        </>
      );
  }
}

export function PieceGlyph({ type, color }: Props) {
  const fill = color === 'w' ? 'var(--piece-light)' : 'var(--piece-dark)';
  const stroke = color === 'w' ? 'var(--piece-light-edge)' : 'var(--piece-dark-edge)';
  const detail = color === 'w' ? 'var(--piece-light-edge)' : 'var(--piece-dark-detail)';
  return (
    <g fill={fill} stroke={stroke} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
      {shapes(type, detail)}
    </g>
  );
}

/** A standalone piece icon, used in text and menus. */
export function PieceIcon({ type, color, size = 28 }: Props & { size?: number }) {
  return (
    <svg viewBox="0 0 45 45" width={size} height={size} aria-hidden="true" class="piece-icon">
      <PieceGlyph type={type} color={color} />
    </svg>
  );
}
