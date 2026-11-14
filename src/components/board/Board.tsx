"use client";

import { useMemo, useRef, useState } from "react";
import { FILES, legalMoves, piecesOf, isDark } from "@/lib/chess";
import { Piece } from "./Piece";

export type Mark = "correct" | "missed" | "wrong";

type Props = {
  fen: string;
  orientation?: "white" | "black";
  hideCoords?: boolean;
  highlight?: string[];
  arrows?: [string, string][];
  lastMove?: [string, string];
  /** Show the legal moves of the piece on this square, read-only. */
  showMoves?: string;
  mode?: "view" | "move" | "select";
  /** move mode: called with a legal move; return nothing. */
  onMove?: (from: string, to: string, promotion?: string) => void;
  /** select mode */
  selected?: string[];
  onSelect?: (square: string) => void;
  marks?: Record<string, Mark>;
  label?: string;
};

const S = 100;

export function Board({
  fen,
  orientation = "white",
  hideCoords,
  highlight = [],
  arrows = [],
  lastMove,
  showMoves,
  mode = "view",
  onMove,
  selected = [],
  onSelect,
  marks = {},
  label,
}: Props) {
  const pieces = useMemo(() => piecesOf(fen), [fen]);
  const [picked, setPicked] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ from: string; x: number; y: number } | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [focus, setFocus] = useState<string>("e4");
  const svgRef = useRef<SVGSVGElement>(null);
  const flipped = orientation === "black";

  const sideToMove = fen.split(" ")[1] === "b" ? "b" : "w";
  const targets = useMemo(() => {
    const from = picked ?? drag?.from;
    if (mode !== "move" || !from) return [] as string[];
    return [...new Set(legalMoves(fen, from).map((m) => m.to))];
  }, [mode, picked, drag, fen]);
  const shown = useMemo(() => (showMoves ? [...new Set(legalMoves(fen, showMoves).map((m) => m.to))] : []), [fen, showMoves]);

  const xy = (sq: string) => {
    const f = sq.charCodeAt(0) - 97;
    const r = Number(sq[1]) - 1;
    return flipped ? { x: (7 - f) * S, y: r * S } : { x: f * S, y: (7 - r) * S };
  };
  const squareAt = (px: number, py: number): string | null => {
    const f = Math.floor(px / S);
    const r = Math.floor(py / S);
    if (f < 0 || f > 7 || r < 0 || r > 7) return null;
    return flipped ? `${FILES[7 - f]}${r + 1}` : `${FILES[f]}${8 - r}`;
  };
  const toBoard = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const own = (sq: string) => {
    const p = pieces[sq];
    return !!p && (p === p.toUpperCase() ? "w" : "b") === sideToMove;
  };

  const attempt = (from: string, to: string) => {
    if (!legalMoves(fen, from).some((m) => m.to === to)) return false;
    const p = pieces[from];
    if (p?.toLowerCase() === "p" && (to[1] === "8" || to[1] === "1")) {
      setPromo({ from, to });
      return true;
    }
    onMove?.(from, to);
    return true;
  };

  const activate = (sq: string) => {
    if (mode === "select") return onSelect?.(sq);
    if (mode !== "move") return;
    if (picked && picked !== sq && attempt(picked, sq)) return setPicked(null);
    setPicked(own(sq) && picked !== sq ? sq : null);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (promo) return;
    const { x, y } = toBoard(e);
    const sq = squareAt(x, y);
    if (!sq) return;
    setFocus(sq);
    if (mode === "move" && own(sq) && picked !== sq) {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDrag({ from: sq, x, y });
      setPicked(sq);
      return;
    }
    activate(sq);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const { x, y } = toBoard(e);
    setDrag({ ...drag, x, y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const { x, y } = toBoard(e);
    const sq = squareAt(x, y);
    setDrag(null);
    if (sq && sq !== drag.from && attempt(drag.from, sq)) setPicked(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const f = focus.charCodeAt(0) - 97;
    const r = Number(focus[1]);
    const d = flipped ? -1 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] };
    if (moves[e.key]) {
      e.preventDefault();
      const nf = Math.min(7, Math.max(0, f + moves[e.key][0]));
      const nr = Math.min(8, Math.max(1, r + moves[e.key][1]));
      setFocus(`${FILES[nf]}${nr}`);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(focus);
    } else if (e.key === "Escape") setPicked(null);
  };

  const squares = [];
  for (let r = 1; r <= 8; r++)
    for (const f of FILES) {
      const sq = `${f}${r}`;
      const { x, y } = xy(sq);
      squares.push(<rect key={sq} x={x} y={y} width={S} height={S} fill={isDark(sq) ? "var(--gray-800)" : "var(--gray-700)"} />);
    }

  const overlay = (sq: string, fill: string, key: string) => {
    const { x, y } = xy(sq);
    return <rect key={key} x={x} y={y} width={S} height={S} fill={fill} />;
  };

  const dot = (sq: string, key: string, occupied: boolean) => {
    const { x, y } = xy(sq);
    if (occupied) {
      const c = 18;
      return (
        <g key={key} stroke="var(--purple-400)" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d={`M${x + 4} ${y + 4 + c}V${y + 4}H${x + 4 + c}`} />
          <path d={`M${x + S - 4 - c} ${y + 4}H${x + S - 4}V${y + 4 + c}`} />
          <path d={`M${x + 4} ${y + S - 4 - c}V${y + S - 4}H${x + 4 + c}`} />
          <path d={`M${x + S - 4 - c} ${y + S - 4}H${x + S - 4}V${y + S - 4 - c}`} />
        </g>
      );
    }
    return <circle key={key} cx={x + S / 2} cy={y + S / 2} r="12" fill="var(--purple-400)" fillOpacity="0.6" />;
  };

  const arrow = ([a, b]: [string, string], i: number) => {
    const p = xy(a);
    const q = xy(b);
    const x1 = p.x + S / 2, y1 = p.y + S / 2, x2 = q.x + S / 2, y2 = q.y + S / 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const ex = x2 - ux * 30, ey = y2 - uy * 30;
    const head = `${x2 - ux * 8},${y2 - uy * 8} ${ex - uy * 22},${ey + ux * 22} ${ex + uy * 22},${ey - ux * 22}`;
    return (
      <g key={`arrow-${i}`} opacity="0.8" pointerEvents="none">
        <line x1={x1 + ux * 20} y1={y1 + uy * 20} x2={ex} y2={ey} stroke="var(--purple-400)" strokeWidth="13" strokeLinecap="round" />
        <polygon points={head} fill="var(--purple-400)" />
      </g>
    );
  };

  const markBadge = (sq: string, m: Mark) => {
    const { x, y } = xy(sq);
    const fill = m === "wrong" ? "var(--red-500)" : m === "missed" ? "var(--yellow-400)" : "var(--green-500)";
    return (
      <g key={`mark-${sq}`} pointerEvents="none">
        <rect x={x + 2} y={y + 2} width={S - 4} height={S - 4} fill="none" stroke={fill} strokeWidth="4" />
        <circle cx={x + S - 16} cy={y + 16} r="12" fill={fill} />
        {m === "wrong" ? (
          <path d={`M${x + S - 21} ${y + 11}l10 10m0 -10l-10 10`} stroke="#0d0d0d" strokeWidth="3" strokeLinecap="round" />
        ) : m === "missed" ? (
          <path d={`M${x + S - 16} ${y + 9}v9m0 4v0.5`} stroke="#0d0d0d" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d={`M${x + S - 22} ${y + 16}l4 4l8 -8`} stroke="#0d0d0d" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
    );
  };

  const fileLabels = flipped ? [...FILES].reverse() : FILES;
  const rankLabels = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const interactive = mode !== "view";

  return (
    <div className="relative w-full select-none" style={{ touchAction: interactive ? "none" : undefined }}>
      <svg
        ref={svgRef}
        viewBox={hideCoords ? "-2 -2 804 804" : "-34 -2 838 838"}
        className="block w-full h-auto outline-none"
        role="application"
        aria-label={label ?? "Chessboard"}
        data-fen={fen}
        tabIndex={interactive ? 0 : -1}
        onKeyDown={interactive ? onKeyDown : undefined}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
        style={{ cursor: interactive ? "pointer" : "default" }}
      >
        <rect x="-1" y="-1" width="802" height="802" rx="4" fill="none" stroke="var(--gray-700)" strokeWidth="2" />
        {squares}
        {lastMove && lastMove.map((sq, i) => overlay(sq, "rgba(150,141,250,0.24)", `last-${i}`))}
        {highlight.map((sq) => overlay(sq, "rgba(150,141,250,0.30)", `hl-${sq}`))}
        {selected.map((sq) => (
          <g key={`sel-${sq}`}>
            {overlay(sq, "rgba(108,53,245,0.40)", `self-${sq}`)}
            <rect x={xy(sq).x + 3} y={xy(sq).y + 3} width={S - 6} height={S - 6} fill="none" stroke="var(--purple-400)" strokeWidth="3" />
          </g>
        ))}
        {picked && (
          <rect x={xy(picked).x + 2} y={xy(picked).y + 2} width={S - 4} height={S - 4} fill="rgba(150,141,250,0.18)" stroke="var(--purple-400)" strokeWidth="3" />
        )}
        {drag && (() => {
          const sq = squareAt(drag.x, drag.y);
          return sq ? overlay(sq, "var(--overlay)", "hover") : null;
        })()}
        {Object.entries(pieces).map(([sq, p]) => {
          const { x, y } = xy(sq);
          const dragging = drag?.from === sq;
          return <Piece key={sq} piece={p} x={x} y={y} opacity={dragging ? 0.3 : 1} />;
        })}
        {targets.map((sq) => dot(sq, `t-${sq}`, !!pieces[sq]))}
        {shown.map((sq) => dot(sq, `s-${sq}`, !!pieces[sq]))}
        {arrows.map(arrow)}
        {Object.entries(marks).map(([sq, m]) => markBadge(sq, m))}
        {drag && pieces[drag.from] && <Piece piece={pieces[drag.from]} x={drag.x - 52} y={drag.y - 52} size={105} />}
        {interactive && (
          <rect
            x={xy(focus).x + 1}
            y={xy(focus).y + 1}
            width={S - 2}
            height={S - 2}
            fill="none"
            stroke="var(--purple-400)"
            strokeWidth="2"
            strokeDasharray="6 6"
            className="board-focus"
          />
        )}
        {!hideCoords && (
          <g fontFamily="var(--font-mono)" fontSize="15" fill="var(--gray-300)">
            {fileLabels.map((f, i) => (
              <text key={f} x={i * S + S / 2} y={826} textAnchor="middle">
                {f}
              </text>
            ))}
            {rankLabels.map((r, i) => (
              <text key={r} x={-16} y={i * S + S / 2 + 5} textAnchor="middle">
                {r}
              </text>
            ))}
          </g>
        )}
        {promo && (
          <g>
            <rect x="0" y="0" width="800" height="800" fill="rgba(0,0,0,0.6)" onPointerDown={(e) => (e.stopPropagation(), setPromo(null))} />
            {(["q", "r", "b", "n"] as const).map((p, i) => {
              const { x } = xy(promo.to);
              const top = promo.to[1] === (flipped ? "1" : "8");
              const y = top ? i * S : 800 - (i + 1) * S;
              const glyph = sideToMove === "w" ? p.toUpperCase() : p;
              return (
                <g
                  key={p}
                  role="button"
                  aria-label={`Promote to ${{ q: "queen", r: "rook", b: "bishop", n: "knight" }[p]}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onMove?.(promo.from, promo.to, p);
                    setPromo(null);
                    setPicked(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={x} y={y} width={S} height={S} fill="var(--gray-800)" stroke="var(--gray-700)" strokeWidth="2" />
                  <Piece piece={glyph} x={x} y={y} />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
