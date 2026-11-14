"use client";

import { useEffect, useRef, useState } from "react";
import { load } from "@/lib/chess";
import { Board } from "@/components/board/Board";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/learn/ExerciseView";
import { Stage } from "@/components/learn/Stage";

export type ClientPuzzle = {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  colour: "white" | "black";
  themes: string[];
  returning: boolean;
};

export type PuzzleResult = { rated: boolean; rating: number; delta: number; provisional: boolean };

type Props = {
  puzzle: ClientPuzzle;
  /** Hints used so far on this puzzle; any hint makes it unrated. */
  hints: number;
  onHint: () => void;
  /** Tells the parent where in the line the learner is, for Kibitzer. */
  onPly: (ply: number) => void;
  onRecorded?: (r: PuzzleResult, correct: boolean) => void;
  continueLabel?: string;
  onContinue: () => void;
};

const parts = (uci: string) => ({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });

function apply(fen: string, uci: string) {
  const g = load(fen);
  g.move(parts(uci));
  return g;
}

/**
 * A Lichess-style puzzle: the opponent's move sets it, then you find each move of the
 * line. Any checkmate counts. One wrong move fails the rated try; you may then try again,
 * or move on. There is no solution button: a missed puzzle comes back a few days later.
 */
export function PuzzleView({ puzzle, hints, onHint, onPly, onRecorded, continueLabel = "Next puzzle", onContinue }: Props) {
  const [fen, setFen] = useState(puzzle.fen);
  const [ply, setPly] = useState(0);
  const [lastMove, setLastMove] = useState<[string, string] | undefined>();
  const [state, setState] = useState<"setting" | "yours" | "wrong" | "solved" | "gaveup">("setting");
  const [saved, setSaved] = useState<{ r: PuzzleResult; correct: boolean } | null>(null);
  const [replying, setReplying] = useState(false);
  const recorded = useRef(false);
  const before = useRef<{ fen: string; lastMove?: [string, string] } | null>(null);

  // The opponent's setting move, after a moment so you can see the position first.
  useEffect(() => {
    const t = setTimeout(() => {
      const m = parts(puzzle.moves[0]);
      setFen(apply(puzzle.fen, puzzle.moves[0]).fen());
      setLastMove([m.from, m.to]);
      setPly(1);
      onPly(1);
      setState("yours");
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  const record = async (correct: boolean) => {
    if (recorded.current) return;
    recorded.current = true;
    try {
      const res = await fetch("/api/puzzles/attempt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ puzzleId: puzzle.id, correct, hints }),
      });
      if (res.ok) {
        const r = (await res.json()) as PuzzleResult;
        setSaved({ r, correct });
        onRecorded?.(r, correct);
      }
    } catch {
      /* the next puzzle still works; this one simply is not counted */
    }
  };

  const onMove = (from: string, to: string, promotion?: string) => {
    if (state !== "yours" || replying) return;
    const g = load(fen);
    let san: string;
    try {
      san = g.move({ from, to, promotion: promotion ?? "q" }).san;
    } catch {
      return;
    }
    const uci = `${from}${to}${san.includes("=") ? (promotion ?? "q") : ""}`;
    const expected = puzzle.moves[ply];
    const right = g.isCheckmate() || uci === expected;
    before.current = { fen, lastMove };
    setFen(g.fen());
    setLastMove([from, to]);
    if (!right) {
      setState("wrong");
      void record(false);
      return;
    }
    const done = g.isCheckmate() || ply + 1 >= puzzle.moves.length;
    if (done) {
      setState("solved");
      void record(true);
      return;
    }
    // The opponent answers.
    setReplying(true);
    const reply = puzzle.moves[ply + 1];
    setTimeout(() => {
      const m = parts(reply);
      setFen(apply(g.fen(), reply).fen());
      setLastMove([m.from, m.to]);
      setPly(ply + 2);
      onPly(ply + 2);
      setReplying(false);
    }, 450);
  };

  const retry = () => {
    if (before.current) {
      setFen(before.current.fen);
      setLastMove(before.current.lastMove);
    }
    setState("yours");
  };

  const finished = state === "solved" || state === "gaveup";
  const turn = puzzle.colour === "white" ? "White" : "Black";

  return (
    <div data-puzzle={puzzle.id}>
      <Stage
        focusKey={state === "wrong" || finished ? `${state}:${saved ? 1 : 0}` : undefined}
        board={<Board fen={fen} orientation={puzzle.colour} lastMove={lastMove} mode={state === "yours" && !replying ? "move" : "view"} onMove={onMove} label={`Puzzle. You play ${turn}.`} />}
        top={
          <>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.04em] text-meta">
              {puzzle.returning ? "Back for another try" : `Puzzle ${puzzle.rating}`}
            </div>
            <h2 className="text-[20px] leading-[26px] md:text-[24px] md:leading-[30px] tracking-[-0.48px]">
              {state === "setting" ? "Watch your opponent's move." : `Your move. You play ${turn}.`}
            </h2>
            <p className="mt-3 hidden md:block text-[16px] leading-6 text-body">
              {state === "setting"
                ? "Then find the best reply."
                : "Find the strongest move, and keep going until the line is finished. Before you move: checks, captures, threats."}
            </p>
          </>
        }
        bottom={
          <div>
      {state === "wrong" && (
        <div className="mt-6 fade-in" aria-live="polite">
          <Pill good={false} />
          <p className="mt-3 text-[16px] leading-6 text-body">That is not the move. Look again at what your opponent has left undefended, and what every check does.</p>
          <div className="mt-6 flex gap-3">
            <Button onClick={retry} autoFocus>
              Try again
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setState("gaveup");
              }}
            >
              Move on for now
            </Button>
          </div>
        </div>
      )}

      {finished && (
        <div className="mt-6 fade-in" aria-live="polite">
          {state === "solved" ? <Pill good text="Solved" /> : <Pill good={false} text="It will come back in a few days" />}
          {saved && (
            <p className="mt-3 text-[16px] leading-6 text-body">
              {saved.r.rated
                ? `Puzzle rating ${saved.r.rating}${saved.r.provisional ? "?" : ""} (${saved.r.delta >= 0 ? "+" : ""}${saved.r.delta}).`
                : saved.correct
                  ? "Solved with help or on a later try, so your rating stays as it is."
                  : `Puzzle rating ${saved.r.rating}${saved.r.provisional ? "?" : ""}.`}
            </p>
          )}
          {state === "solved" && puzzle.themes.length > 0 && (
            <p className="mt-2 text-[16px] leading-6 text-body">The idea: {puzzle.themes.join(", ").toLowerCase()}.</p>
          )}
          <div className="mt-6">
            <Button onClick={onContinue} chevron autoFocus>
              {continueLabel}
            </Button>
          </div>
        </div>
      )}

      {!finished && state !== "setting" && (
        <button onClick={onHint} className="mt-6 md:mt-8 inline-flex items-center gap-2 text-[14px] text-link hover:text-ink">
          Ask Kibitzer for a hint
        </button>
      )}
          </div>
        }
      />
    </div>
  );
}
