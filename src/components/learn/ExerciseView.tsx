"use client";

import { useMemo, useState } from "react";
import type { Exercise } from "@/curriculum/types";
import { load, tryMove } from "@/lib/chess";
import { Board, type Mark } from "@/components/board/Board";
import { Button } from "@/components/ui/Button";
import { Rich } from "./Rich";
import { Stage } from "./Stage";

export type Outcome = { correct: boolean; firstTry: boolean };

type Props = {
  exercise: Exercise;
  /** Guided and try-it exercises allow another go after a miss. */
  retries: boolean;
  onHint?: () => void;
  onResolved: (o: Outcome) => void;
  continueLabel?: string;
  onContinue: () => void;
};

type Result = { correct: boolean; message: string } | null;

export function ExerciseView({ exercise, retries, onHint, onResolved, continueLabel = "Continue", onContinue }: Props) {
  const [fen, setFen] = useState(exercise.fen ?? "");
  const [lastMove, setLastMove] = useState<[string, string] | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [result, setResult] = useState<Result>(null);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const settle = (correct: boolean, message: string) => {
    setResult({ correct, message });
    if (correct || !retries) {
      setFinished(true);
      onResolved({ correct, firstTry: correct && misses === 0 });
    } else {
      setMisses((m) => m + 1);
    }
  };

  const reset = () => {
    setFen(exercise.fen ?? "");
    setLastMove(undefined);
    setSelected([]);
    setMarks({});
    setPicked(null);
    setResult(null);
  };

  const onMove = (from: string, to: string, promotion?: string) => {
    if (exercise.kind !== "move" || result) return;
    const res = tryMove(fen, from, to, promotion);
    if (!res) return;
    setFen(res.game.fen());
    setLastMove([from, to]);
    const san = res.move.san.replace(/[+#]/g, "");
    const g = exercise.goal;
    const ok =
      g.type === "mate" ? res.game.isCheckmate() : g.type === "check" ? res.game.inCheck() : g.moves.some((m) => m.replace(/[+#]/g, "") === san);
    let why = "";
    if (!ok) {
      if (g.type === "mate" && res.game.isStalemate()) why = "That is stalemate: Black has no move but is not in check. A draw, not a win.";
      else if (g.type === "mate" && res.game.inCheck()) why = "That is check, but Black can escape. Look for the move that leaves no way out.";
      else why = `${res.move.san} does not do what was asked.`;
    }
    settle(ok, ok ? "Correct." : why);
  };

  const checkSquares = (sel: string[]) => {
    if (exercise.kind !== "squares") return;
    const target = new Set(exercise.targets);
    const m: Record<string, Mark> = {};
    for (const s of sel) m[s] = target.has(s) ? "correct" : "wrong";
    const missed = exercise.targets.filter((t) => !sel.includes(t));
    const ok = missed.length === 0 && sel.every((s) => target.has(s));
    if (!ok && !retries) for (const t of missed) m[t] = "missed";
    setMarks(m);
    const wrong = sel.filter((s) => !target.has(s)).length;
    settle(
      ok,
      ok
        ? "Correct."
        : [wrong ? `${wrong} square${wrong > 1 ? "s" : ""} marked with a cross ${wrong > 1 ? "are" : "is"} not reachable.` : "", missed.length ? `${missed.length} square${missed.length > 1 ? "s are" : " is"} missing.` : ""]
            .filter(Boolean)
            .join(" "),
    );
  };

  const onSelect = (sq: string) => {
    if (exercise.kind !== "squares" || result) return;
    if (exercise.targets.length === 1) {
      setSelected([sq]);
      return checkSquares([sq]);
    }
    setSelected((s) => (s.includes(sq) ? s.filter((x) => x !== sq) : [...s, sq]));
  };

  const choose = (i: number) => {
    if (exercise.kind !== "choice" || result) return;
    setPicked(i);
    settle(i === exercise.answer, i === exercise.answer ? "Correct." : "Not quite.");
  };

  const multi = exercise.kind === "squares" && exercise.targets.length > 1;
  const sideNote = useMemo(() => {
    if (exercise.kind !== "move") return null;
    const g = load(exercise.fen);
    return g.turn() === "w" ? "White to move" : "Black to move";
  }, [exercise]);

  return (
    <Stage
      focusKey={result ? `${result.correct}:${misses}:${finished}` : undefined}
      board={
        exercise.fen ? (
          <Board
            fen={fen}
            orientation={exercise.orientation}
            hideCoords={exercise.hideCoords}
            highlight={exercise.highlight}
            arrows={result ? [] : exercise.arrows}
            lastMove={lastMove}
            mode={finished || (result && !result.correct) ? "view" : exercise.kind === "move" ? "move" : exercise.kind === "squares" ? "select" : "view"}
            onMove={onMove}
            selected={result ? [] : selected}
            onSelect={onSelect}
            marks={marks}
            label={exercise.prompt}
          />
        ) : undefined
      }
      top={
        <>
          {sideNote && <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.04em] text-meta">{sideNote}</div>}
          <h2 className="text-[20px] leading-[26px] md:text-[24px] md:leading-[30px] tracking-[-0.48px]">
            <Rich text={exercise.prompt} />
          </h2>
        </>
      }
      bottom={
        <div>
            {exercise.kind === "choice" && (
              <div className="mt-6 grid gap-px bg-hairline border border-hairline rounded-[2px] overflow-hidden" role="radiogroup">
                {exercise.options.map((o, i) => {
                  const state = result && picked === i ? (i === exercise.answer ? "good" : "bad") : finished && i === exercise.answer ? "good" : null;
                  return (
                    <button
                      key={o}
                      role="radio"
                      aria-checked={picked === i}
                      disabled={!!result}
                      onClick={() => choose(i)}
                      className={`text-left px-4 min-h-12 py-3 bg-raised text-[16px] flex items-center justify-between gap-3 transition-colors ${
                        state === "good" ? "bg-[rgba(69,201,143,0.12)] text-ink" : state === "bad" ? "bg-[rgba(242,85,90,0.12)] text-ink" : "hover:bg-[#1b1b1b] text-body"
                      }`}
                    >
                      <span>{o}</span>
                      {state === "good" && <Glyph kind="check" />}
                      {state === "bad" && <Glyph kind="cross" />}
                    </button>
                  );
                })}
              </div>
            )}

            {multi && !result && (
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={() => checkSquares(selected)} disabled={!selected.length}>
                  Check
                </Button>
                <Button variant="ghost" onClick={() => setSelected([])} disabled={!selected.length}>
                  Clear
                </Button>
                <span className="ml-auto font-mono text-[12px] text-meta">{selected.length} selected</span>
              </div>
            )}

            {result && (
              <div className="mt-6 fade-in" aria-live="polite">
                <Pill good={result.correct} />
                <p className="mt-3 text-[16px] leading-6 text-body">{result.message}</p>
                {finished && exercise.explain && (
                  <p className="mt-2 text-[16px] leading-6 text-body">
                    <Rich text={exercise.explain} />
                  </p>
                )}
                <div className="mt-6 flex gap-3">
                  {finished ? (
                    <Button onClick={onContinue} chevron autoFocus>
                      {continueLabel}
                    </Button>
                  ) : (
                    <>
                      <Button onClick={reset} autoFocus>
                        Try again
                      </Button>
                      {misses >= 3 && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setFinished(true);
                            onResolved({ correct: false, firstTry: false });
                          }}
                        >
                          Move on for now
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {!finished && onHint && (
              <button onClick={onHint} className="mt-8 inline-flex items-center gap-2 text-[14px] text-link hover:text-ink">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.25" /><path d="M6.5 13.5h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" /></svg>
                Ask Kibitzer for a hint
              </button>
            )}
        </div>
      }
    />
  );
}

function Glyph({ kind }: { kind: "check" | "cross" }) {
  return kind === "check" ? (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Correct"><path d="M3 8.5l3 3 7-7" fill="none" stroke="var(--green-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Incorrect"><path d="M4 4l8 8M12 4l-8 8" stroke="var(--red-500)" strokeWidth="1.5" strokeLinecap="round" /></svg>
  );
}

export function Pill({ good, text }: { good: boolean; text?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-[12px] leading-4 font-medium ${
        good ? "text-success bg-[rgba(69,201,143,0.12)]" : "text-danger bg-[rgba(242,85,90,0.12)]"
      }`}
    >
      <Glyph kind={good ? "check" : "cross"} />
      {text ?? (good ? "Correct" : "Not quite")}
    </span>
  );
}
