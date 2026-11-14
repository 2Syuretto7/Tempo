/**
 * Tempo's own piece set: flat geometric silhouettes with rounded joins, drawn for
 * the brief's section 6.3. White: solid white with dark detail lines. Black: near-black
 * with a light outline so it reads on both square colours. Drawn in a 100 x 100 box.
 */
type Props = { piece: string; x?: number; y?: number; size?: number; opacity?: number };

const SHAPES: Record<string, { body: React.ReactNode; detail?: React.ReactNode }> = {
  p: {
    body: (
      <>
        <rect x="24" y="78" width="52" height="10" rx="3" />
        <path d="M36 78 C38 66 42 58 44 52 H56 C58 58 62 66 64 78 Z" />
        <rect x="38" y="48" width="24" height="6" rx="3" />
        <circle cx="50" cy="36" r="12" />
      </>
    ),
  },
  r: {
    body: (
      <>
        <rect x="22" y="78" width="56" height="10" rx="3" />
        <path d="M32 78 L35 42 H65 L68 78 Z" />
        <rect x="30" y="36" width="40" height="8" rx="2" />
        <path d="M28 16 H38 V24 H45 V16 H55 V24 H62 V16 H72 V36 H28 Z" />
      </>
    ),
    detail: <path d="M36 60 H64" />,
  },
  b: {
    body: (
      <>
        <rect x="24" y="78" width="52" height="10" rx="3" />
        <path d="M36 78 C37 68 41 62 44 58 H56 C59 62 63 68 64 78 Z" />
        <rect x="38" y="52" width="24" height="6" rx="3" />
        <path d="M50 14 C63 24 66 38 59 52 H41 C34 38 37 24 50 14 Z" />
        <circle cx="50" cy="11" r="4.5" />
      </>
    ),
    detail: <path d="M56 26 L48 38" />,
  },
  n: {
    body: (
      <>
        <rect x="24" y="78" width="52" height="10" rx="3" />
        <path d="M34 78 C34 66 40 58 46 52 L38 54 C31 56 24 52 24 45 C24 40 27 36 31 33 L43 21 L45 12 L51 19 C64 21 74 34 74 52 C74 62 72 70 70 78 Z" />
      </>
    ),
    detail: (
      <>
        <circle cx="42" cy="33" r="2.6" stroke="none" fill="currentColor" />
        <path d="M58 27 C65 35 67 45 66 57" />
      </>
    ),
  },
  q: {
    body: (
      <>
        <rect x="22" y="78" width="56" height="10" rx="3" />
        <path d="M32 78 L24 34 L37 54 L38 28 L46 52 L50 24 L54 52 L62 28 L63 54 L76 34 L68 78 Z" />
        <circle cx="24" cy="30" r="4.5" />
        <circle cx="38" cy="24" r="4.5" />
        <circle cx="50" cy="20" r="4.5" />
        <circle cx="62" cy="24" r="4.5" />
        <circle cx="76" cy="30" r="4.5" />
      </>
    ),
    detail: <path d="M34 68 H66" />,
  },
  k: {
    body: (
      <>
        <rect x="22" y="78" width="56" height="10" rx="3" />
        <path d="M34 78 C30 66 30 54 38 46 H62 C70 54 70 66 66 78 Z" />
        <rect x="40" y="39" width="20" height="8" rx="2" />
        <rect x="46.5" y="10" width="7" height="30" rx="1.5" />
        <rect x="39" y="17" width="22" height="7" rx="1.5" />
      </>
    ),
    detail: <path d="M37 66 H63" />,
  },
};

export function Piece({ piece, x = 0, y = 0, size = 100, opacity = 1 }: Props) {
  const white = piece === piece.toUpperCase();
  const shape = SHAPES[piece.toLowerCase()];
  if (!shape) return null;
  const s = size / 100;
  return (
    <g transform={`translate(${x + 4 * s} ${y + 5 * s}) scale(${0.92 * s})`} opacity={opacity} pointerEvents="none">
      <g fill={white ? "#FFFFFF" : "#0D0D0D"} stroke={white ? "#0D0D0D" : "#C7C7C7"} strokeWidth={white ? 1.5 : 3} strokeLinejoin="round">
        {shape.body}
      </g>
      {shape.detail && (
        <g fill="none" stroke={white ? "#0D0D0D" : "#C7C7C7"} color={white ? "#0D0D0D" : "#C7C7C7"} strokeWidth="3" strokeLinecap="round">
          {shape.detail}
        </g>
      )}
    </g>
  );
}

/** A standalone piece icon, for text and buttons. */
export function PieceIcon({ piece, size = 20 }: { piece: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <Piece piece={piece} />
    </svg>
  );
}
