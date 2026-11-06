import type { Color, PieceType } from './position';

// Tempo's own piece set, drawn on a 45 x 45 grid.
// Shapes are deliberately simple and geometric so they stay crisp at any size.

interface Props {
  type: PieceType;
  color: Color;
}

const BASE = <rect x="11" y="34" width="23" height="5" rx="2" />;

function shapes(type: PieceType, detail: string) {
  switch (type) {
    case 'p':
      return (
        <>
          {BASE}
          <path d="M15.5 34 C16.5 28 19 23.5 22.5 22.5 C26 23.5 28.5 28 29.5 34 Z" />
          <ellipse cx="22.5" cy="22" rx="6" ry="2" />
          <circle cx="22.5" cy="14.5" r="5.5" />
        </>
      );
    case 'r':
      return (
        <>
          {BASE}
          <path d="M14.5 34 L16 18 H29 L30.5 34 Z" />
          <path d="M13 18 V10 H17 V13 H20.5 V10 H24.5 V13 H28 V10 H32 V18 Z" />
          <path d="M16.5 22 H28.5" stroke={detail} fill="none" />
        </>
      );
    case 'b':
      return (
        <>
          {BASE}
          <path d="M15.5 34 C16 28.5 18.5 25 22.5 24.5 C26.5 25 29 28.5 29.5 34 Z" />
          <path d="M22.5 7.5 C27.5 11 30 15.5 28.7 19.5 C27.7 22.5 25.2 24.5 22.5 24.5 C19.8 24.5 17.3 22.5 16.3 19.5 C15 15.5 17.5 11 22.5 7.5 Z" />
          <circle cx="22.5" cy="5.6" r="2" />
          <path d="M25 12 L20.5 17.5" stroke={detail} fill="none" />
        </>
      );
    case 'n':
      return (
        <>
          {BASE}
          <path d="M15.5 34 C15 28.5 17.5 24.5 21 21.5 C18.2 22 14.8 23.4 12.8 25 C11.2 24 10.6 21.8 11.6 19.8 C13.6 16 17 12.2 20.2 9.6 L19.7 6 L23.2 8.6 C28.2 9.2 32.2 13.6 33.1 20 C33.8 25.4 32.1 30 31.2 34 Z" />
          <circle cx="21.2" cy="13.6" r="1.3" fill={detail} stroke="none" />
          <path d="M24.6 10.4 C28.4 13.2 30.2 18 30 24" stroke={detail} fill="none" />
        </>
      );
    case 'q':
      return (
        <>
          {BASE}
          <path d="M13.5 34 L10.5 14.5 L16.5 22 L16.5 10.5 L20.8 20.8 L22.5 8.5 L24.2 20.8 L28.5 10.5 L28.5 22 L34.5 14.5 L31.5 34 Z" />
          <circle cx="10.5" cy="13" r="2.1" />
          <circle cx="16.5" cy="9" r="2.1" />
          <circle cx="22.5" cy="7" r="2.1" />
          <circle cx="28.5" cy="9" r="2.1" />
          <circle cx="34.5" cy="13" r="2.1" />
          <path d="M14.5 29.5 H30.5" stroke={detail} fill="none" />
        </>
      );
    case 'k':
      return (
        <>
          {BASE}
          <path d="M14.2 34 C13 28 10.8 23.5 12.6 20 C14.6 16.4 19 17.6 22.5 22 C26 17.6 30.4 16.4 32.4 20 C34.2 23.5 32 28 30.8 34 Z" />
          <path d="M19.6 21.5 C20 18 21 16 22.5 15 C24 16 25 18 25.4 21.5" />
          <path d="M21.4 5 H23.6 V8 H26.5 V10.2 H23.6 V14.5 H21.4 V10.2 H18.5 V8 H21.4 Z" />
          <path d="M15 29.5 H30" stroke={detail} fill="none" />
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
