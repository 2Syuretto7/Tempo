import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { PieceGlyph } from './pieces';
import {
  FILES,
  applyMove,
  fileIndex,
  legalMoves,
  parseFen,
  rankOf,
  toFen,
  type Position,
  type Square,
} from './position';

export type Mark = 'good' | 'bad' | 'pick' | 'focus';

export interface BoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  arrows?: [Square, Square][];
  highlights?: Square[];
  marks?: Record<Square, Mark>;
  dots?: Square[];
  /** Show the legal moves of the piece on this square; follows it on a free board. */
  focus?: Square;
  lastMove?: [Square, Square];
  /**
   * view: look only. free: move any piece by its rules to test ideas.
   * move: the side to move plays one move, reported through onMove.
   * pick: click squares, reported through onPick.
   */
  mode?: 'view' | 'free' | 'move' | 'pick';
  onMove?: (from: Square, to: Square) => void;
  onIllegal?: (from: Square, to: Square) => void;
  onPick?: (sq: Square) => void;
  label?: string;
}

const S = 100;

export function Board(props: BoardProps) {
  const { orientation = 'white', mode = 'view' } = props;
  const [freePos, setFreePos] = useState<Position>(() => parseFen(props.fen));
  const [selected, setSelected] = useState<Square | null>(null);
  const [freeLast, setFreeLast] = useState<[Square, Square] | undefined>(undefined);
  const [focusSq, setFocusSq] = useState<Square | undefined>(props.focus);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragFrom = useRef<Square | null>(null);

  useEffect(() => {
    setFreePos(parseFen(props.fen));
    setSelected(null);
    setFreeLast(undefined);
    setFocusSq(props.focus);
  }, [props.fen, mode, props.focus]);

  const pos = useMemo(() => (mode === 'free' ? freePos : parseFen(props.fen)), [mode, freePos, props.fen]);

  const canSelect = (sq: Square) => {
    const p = pos.board.get(sq);
    if (!p) return false;
    if (mode === 'free') return true;
    if (mode === 'move') return p.color === pos.turn;
    return false;
  };

  const targets = useMemo(
    () => (selected ? legalMoves(pos, selected) : focusSq && pos.board.has(focusSq) ? legalMoves(pos, focusSq) : []),
    [pos, selected, focusSq],
  );

  const xy = (sq: Square) => {
    const f = fileIndex(sq);
    const r = rankOf(sq);
    return orientation === 'white' ? { x: f * S, y: (8 - r) * S } : { x: (7 - f) * S, y: (r - 1) * S };
  };

  const squareAt = (clientX: number, clientY: number): Square | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    const col = Math.floor(((clientX - box.left) / box.width) * 8);
    const row = Math.floor(((clientY - box.top) / box.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return orientation === 'white' ? FILES[col] + (8 - row) : FILES[7 - col] + (row + 1);
  };

  const tryMove = (from: Square, to: Square) => {
    if (from === to) return;
    const legal = legalMoves(pos, from).includes(to);
    setSelected(null);
    if (!legal) {
      props.onIllegal?.(from, to);
      return;
    }
    if (mode === 'free') {
      setFreePos(applyMove(pos, from, to));
      setFreeLast([from, to]);
      if (from === focusSq) setFocusSq(to);
    } else {
      props.onMove?.(from, to);
    }
  };

  const onSquare = (sq: Square) => {
    if (mode === 'pick') {
      props.onPick?.(sq);
      return;
    }
    if (mode === 'view') return;
    if (selected) {
      if (sq === selected) {
        setSelected(null);
        return;
      }
      if (canSelect(sq) && pos.board.get(sq)?.color === pos.board.get(selected)?.color) {
        setSelected(sq);
        return;
      }
      tryMove(selected, sq);
      return;
    }
    if (canSelect(sq)) setSelected(sq);
  };

  const onPointerDown = (e: PointerEvent) => {
    const sq = squareAt(e.clientX, e.clientY);
    if (!sq) return;
    if ((mode === 'move' || mode === 'free') && canSelect(sq) && sq !== selected) {
      dragFrom.current = sq;
    } else {
      dragFrom.current = null;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const sq = squareAt(e.clientX, e.clientY);
    const from = dragFrom.current;
    dragFrom.current = null;
    if (!sq) return;
    if (from && sq !== from) {
      tryMove(from, sq);
      return;
    }
    onSquare(sq);
  };

  const onKey = (e: KeyboardEvent, sq: Square) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSquare(sq);
    }
  };

  const last = mode === 'free' ? freeLast : props.lastMove;
  const interactive = mode !== 'view';
  const squares: Square[] = [];
  for (let r = 8; r >= 1; r--) for (const f of FILES) squares.push(f + r);

  return (
    <div class={`board-wrap board-${mode}${interactive ? ' is-interactive' : ''}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 800 800"
        class="board"
        role="grid"
        aria-label={props.label ?? 'Chess board'}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <defs>
          <marker id="tempo-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--board-arrow)" />
          </marker>
        </defs>
        {squares.map((sq) => {
          const { x, y } = xy(sq);
          const dark = (fileIndex(sq) + rankOf(sq)) % 2 === 1;
          const mark = props.marks?.[sq];
          const isLast = last && (last[0] === sq || last[1] === sq);
          return (
            <g key={sq}>
              <rect x={x} y={y} width={S} height={S} class={dark ? 'sq-dark' : 'sq-light'} />
              {isLast && <rect x={x} y={y} width={S} height={S} class={`sq-last ${dark ? 'on-dark' : 'on-light'}`} />}
              {props.highlights?.includes(sq) && <rect x={x} y={y} width={S} height={S} class={`sq-highlight ${dark ? 'on-dark' : 'on-light'}`} />}
              {mark && <rect x={x + 3} y={y + 3} width={S - 6} height={S - 6} rx="6" class={`sq-mark sq-mark-${mark}`} />}
              {selected === sq && <rect x={x} y={y} width={S} height={S} class="sq-selected" />}
            </g>
          );
        })}
        {/* coordinates */}
        {squares
          .filter((sq) => (orientation === 'white' ? rankOf(sq) === 1 : rankOf(sq) === 8))
          .map((sq) => {
            const { x, y } = xy(sq);
            const dark = (fileIndex(sq) + rankOf(sq)) % 2 === 1;
            return (
              <text key={`f${sq}`} x={x + S - 7} y={y + S - 7} text-anchor="end" class={`coord ${dark ? 'coord-on-dark' : 'coord-on-light'}`}>
                {sq[0]}
              </text>
            );
          })}
        {squares
          .filter((sq) => (orientation === 'white' ? sq[0] === 'a' : sq[0] === 'h'))
          .map((sq) => {
            const { x, y } = xy(sq);
            const dark = (fileIndex(sq) + rankOf(sq)) % 2 === 1;
            return (
              <text key={`r${sq}`} x={x + 6} y={y + 19} class={`coord ${dark ? 'coord-on-dark' : 'coord-on-light'}`}>
                {sq[1]}
              </text>
            );
          })}
        {[...pos.board.entries()].map(([sq, p]) => {
          const { x, y } = xy(sq);
          return (
            <g key={`p${sq}`} transform={`translate(${x + 3} ${y + 3}) scale(${(S - 6) / 45})`} class="piece">
              <PieceGlyph type={p.type} color={p.color} />
            </g>
          );
        })}
        {[...(props.dots ?? []), ...targets].map((sq, i) => {
          const { x, y } = xy(sq);
          const occupied = pos.board.has(sq);
          return occupied ? (
            <circle key={`d${sq}${i}`} cx={x + S / 2} cy={y + S / 2} r={S / 2 - 5} class="dot-ring" />
          ) : (
            <circle key={`d${sq}${i}`} cx={x + S / 2} cy={y + S / 2} r={14} class="dot" />
          );
        })}
        {props.arrows?.map(([a, b], i) => {
          const p1 = xy(a);
          const p2 = xy(b);
          const x1 = p1.x + S / 2;
          const y1 = p1.y + S / 2;
          const x2 = p2.x + S / 2;
          const y2 = p2.y + S / 2;
          const len = Math.hypot(x2 - x1, y2 - y1) || 1;
          const shorten = 30;
          return (
            <line
              key={`a${i}`}
              x1={x1}
              y1={y1}
              x2={x2 - ((x2 - x1) / len) * shorten}
              y2={y2 - ((y2 - y1) / len) * shorten}
              class="arrow"
              marker-end="url(#tempo-arrow)"
            />
          );
        })}
        {/* invisible, focusable hit targets for keyboard users */}
        {interactive &&
          squares.map((sq) => {
            const { x, y } = xy(sq);
            const p = pos.board.get(sq);
            return (
              <rect
                key={`h${sq}`}
                x={x}
                y={y}
                width={S}
                height={S}
                class="sq-hit"
                tabIndex={0}
                role="gridcell"
                aria-label={p ? `${sq}, ${p.color === 'w' ? 'white' : 'black'} ${p.type}` : sq}
                onKeyDown={(e) => onKey(e as unknown as KeyboardEvent, sq)}
              />
            );
          })}
      </svg>
      {mode === 'free' && (
        <div class="board-tools">
          <span class="board-hint">
            <span class="live-dot" aria-hidden="true" /> Free board: move any piece to test the idea.
          </span>
          <button
            class="btn btn-quiet btn-small"
            onClick={() => {
              setFreePos(parseFen(props.fen));
              setFreeLast(undefined);
              setFocusSq(props.focus);
            }}
            disabled={toFen(freePos) === toFen(parseFen(props.fen))}
          >
            Reset position
          </button>
        </div>
      )}
    </div>
  );
}
