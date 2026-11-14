"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_SQUARES, tryMove } from "@/lib/chess";
import { checksTask, DRILL_SECONDS, isKnightHop, knightTask, squareOptions } from "@/lib/train/drills";
import { Board, type Mark } from "@/components/board/Board";
import { Button } from "@/components/ui/Button";
import { Stage } from "@/components/learn/Stage";

export type DrillDone = (score: number, total: number) => void;

const EMPTY = "8/8/8/8/8/8/8/8 w - - 0 1";
const newSeed = () => Math.floor(Math.random() * 2 ** 31);
const randomSq = (not?: string) => {
  for (;;) {
    const s = ALL_SQUARES[Math.floor(Math.random() * 64)];
    if (s !== not) return s;
  }
};

function Layout({ board, children, bottom }: { board: React.ReactNode; children: React.ReactNode; bottom?: React.ReactNode }) {
  return <Stage board={board} top={children} bottom={bottom} />;
}

/** Thirty seconds on the clock once started; calls onEnd when it runs out. */
function useClock(running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(DRILL_SECONDS);
  const end = useRef(onEnd);
  useEffect(() => {
    end.current = onEnd;
  });
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const t = setInterval(() => {
      const l = Math.max(0, DRILL_SECONDS - Math.floor((Date.now() - started) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(t);
        end.current();
      }
    }, 200);
    return () => clearInterval(t);
  }, [running]);
  return left;
}

function Orientation({ value, onChange }: { value: "white" | "black"; onChange: (v: "white" | "black") => void }) {
  return (
    <div className="mt-6 inline-flex border border-hairline rounded-[2px] overflow-hidden text-[14px]" role="radiogroup" aria-label="Board side">
      {(["white", "black"] as const).map((v) => (
        <button key={v} role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`h-9 px-4 ${value === v ? "bg-white text-[#0d0d0d]" : "text-body hover:text-ink"}`}>
          As {v === "white" ? "White" : "Black"}
        </button>
      ))}
    </div>
  );
}

function Score({ left, score }: { left: number; score: number }) {
  return (
    <div className="flex items-baseline gap-6 font-mono">
      <span className="text-[40px] leading-[43px] text-ink">{score}</span>
      <span className={`text-[14px] ${left <= 5 ? "text-danger" : "text-meta"}`}>{left}s</span>
    </div>
  );
}

export function FindSquare({ onDone }: { onDone: DrillDone }) {
  const [side, setSide] = useState<"white" | "black">("white");
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState(() => randomSq());
  const [score, setScore] = useState(0);
  const [slips, setSlips] = useState(0);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const left = useClock(running, () => {
    setRunning(false);
    onDone(score, score + slips);
  });

  const pick = (sq: string) => {
    if (!running) return;
    if (sq === target) {
      setScore((s) => s + 1);
      setMarks({ [sq]: "correct" });
      setTarget(randomSq(sq));
    } else {
      setSlips((s) => s + 1);
      setMarks({ [sq]: "wrong" });
    }
  };

  return (
    <Layout board={<Board fen={EMPTY} hideCoords orientation={side} mode={running ? "select" : "view"} onSelect={pick} marks={marks} label="Empty board without coordinates" />}>
      {running ? (
        <>
          <div className="flex items-end justify-between gap-6 md:block">
            <div className="md:mb-8">
              <Score left={left} score={score} />
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">Click</div>
              <div className="mt-1 md:mt-2 font-mono text-[48px] leading-[48px] md:text-[72px] md:leading-[72px] text-ink" aria-live="polite">
                {target}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-[24px] leading-[30px] tracking-[-0.48px]">Find the square</h2>
          <p className="mt-3 text-[16px] leading-6 text-body">A square is named; click it on the board. You have thirty seconds. Practise from both sides, since in half your games you will sit behind the black pieces.</p>
          <Orientation value={side} onChange={setSide} />
          <div className="mt-8">
            <Button onClick={() => setRunning(true)} chevron autoFocus>
              Start
            </Button>
          </div>
        </>
      )}
    </Layout>
  );
}

export function NameSquare({ onDone }: { onDone: DrillDone }) {
  const [side, setSide] = useState<"white" | "black">("white");
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState(() => randomSq());
  const [seed, setSeed] = useState(newSeed);
  const [score, setScore] = useState(0);
  const [slips, setSlips] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const options = useMemo(() => squareOptions(seed, target), [seed, target]);
  const left = useClock(running, () => {
    setRunning(false);
    onDone(score, score + slips);
  });

  const answer = (o: string) => {
    if (o === target) {
      setScore((s) => s + 1);
      setWrong(null);
      setTarget(randomSq(target));
      setSeed(newSeed());
    } else {
      setSlips((s) => s + 1);
      setWrong(o);
    }
  };

  return (
    <Layout
      board={<Board fen={EMPTY} hideCoords orientation={side} highlight={running ? [target] : []} label="Empty board with one square lit" />}
      bottom={
        running && (
          <div className="mt-5 md:mt-8">
            <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">Which square is lit?</div>
            <div className="mt-3 grid grid-cols-2 gap-px bg-hairline border border-hairline rounded-[2px] overflow-hidden">
              {options.map((o) => (
                <button key={o} onClick={() => answer(o)} className={`h-14 font-mono text-[20px] ${wrong === o ? "bg-[rgba(242,85,90,0.12)] text-ink" : "bg-raised text-ink hover:bg-[#1b1b1b]"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        )
      }
    >
      {running ? (
        <>
          <Score left={left} score={score} />
        </>
      ) : (
        <>
          <h2 className="text-[24px] leading-[30px] tracking-[-0.48px]">Name the square</h2>
          <p className="mt-3 text-[16px] leading-6 text-body">A square lights up; pick its name. Thirty seconds. Count from the corner only when you must: the aim is to see the name at a glance.</p>
          <Orientation value={side} onChange={setSide} />
          <div className="mt-8">
            <Button onClick={() => setRunning(true)} chevron autoFocus>
              Start
            </Button>
          </div>
        </>
      )}
    </Layout>
  );
}

const ROUTES = 5;

export function KnightRoute({ onDone }: { onDone: DrillDone }) {
  const [round, setRound] = useState(0);
  const [task, setTask] = useState(() => knightTask(newSeed()));
  const [path, setPath] = useState<string[]>([]);
  const [best, setBest] = useState(0);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [result, setResult] = useState<"best" | "long" | null>(null);
  const at = path.at(-1) ?? task.from;
  const fen = useMemo(() => {
    const rows: string[] = [];
    for (let r = 8; r >= 1; r--) {
      let row = "";
      let gap = 0;
      for (const f of "abcdefgh") {
        if (`${f}${r}` === at) {
          if (gap) row += gap;
          gap = 0;
          row += "N";
        } else gap++;
      }
      rows.push(row + (gap ? gap : ""));
    }
    return `${rows.join("/")} w - - 0 1`;
  }, [at]);

  const hop = (sq: string) => {
    if (result) return;
    if (!isKnightHop(at, sq)) {
      setMarks({ [sq]: "wrong" });
      return;
    }
    const next = [...path, sq];
    setPath(next);
    setMarks({});
    if (sq === task.to) {
      const ok = next.length === task.moves;
      setResult(ok ? "best" : "long");
      if (ok) setBest((b) => b + 1);
    }
  };

  const nextRound = () => {
    if (round + 1 >= ROUTES) return onDone(best, ROUTES);
    setRound(round + 1);
    setTask(knightTask(newSeed()));
    setPath([]);
    setMarks({});
    setResult(null);
  };

  return (
    <Layout
      board={
        <Board
          fen={fen}
          highlight={[task.to]}
          lastMove={path.length ? [path.at(-2) ?? task.from, at] : undefined}
          mode={result ? "view" : "select"}
          onSelect={hop}
          marks={marks}
          label={`Knight on ${at}; target ${task.to}`}
        />
      }
      bottom={
        <div className="mt-5 md:mt-0">
      <p className="mt-3 text-[16px] leading-6 text-body">Click each square the knight lands on. Moves so far: {path.length}.</p>
      {result && (
        <div className="mt-6 fade-in" aria-live="polite">
          <p className="text-[16px] leading-6 text-body">
            {result === "best" ? `The shortest route: ${task.moves} moves.` : `You arrived in ${path.length}; it can be done in ${task.moves}. Try to plan the route before the first hop.`}
          </p>
          <div className="mt-6">
            <Button onClick={nextRound} chevron autoFocus>
              {round + 1 >= ROUTES ? "Finish" : "Next route"}
            </Button>
          </div>
        </div>
      )}
      {!result && path.length > 0 && (
        <Button variant="ghost" className="mt-6 -ml-3" onClick={() => (setPath([]), setMarks({}))}>
          Start this route again
        </Button>
      )}
        </div>
      }
    >
      <div className="font-mono text-[12px] text-meta">
        Route {round + 1} of {ROUTES}
      </div>
      <h2 className="mt-2 text-[20px] leading-[26px] md:text-[24px] md:leading-[30px] tracking-[-0.48px]">
        Take the knight from {task.from} to {task.to} in as few moves as you can.
      </h2>
    </Layout>
  );
}

const POSITIONS = 3;

export function FindChecks({ onDone }: { onDone: DrillDone }) {
  const [round, setRound] = useState(0);
  const [task, setTask] = useState(() => checksTask(newSeed()));
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [shown, setShown] = useState(false);
  const [tally, setTally] = useState({ found: 0, total: 0 });

  const play = (from: string, to: string, promotion?: string) => {
    if (shown) return;
    const res = tryMove(task.fen, from, to, promotion);
    if (!res) return;
    const san = res.move.san;
    if (!san.endsWith("+")) setMessage(`${san} is not check.`);
    else if (found.includes(san)) setMessage(`You already have ${san}.`);
    else {
      setFound([...found, san]);
      setMessage(`${san}: check.`);
    }
  };

  const finish = () => {
    setShown(true);
    setTally((t) => ({ found: t.found + found.length, total: t.total + task.checks.length }));
  };

  const next = () => {
    if (round + 1 >= POSITIONS) return onDone(tally.found, tally.total);
    setRound(round + 1);
    setTask(checksTask(newSeed()));
    setFound([]);
    setMessage("");
    setShown(false);
  };

  const missed = task.checks.filter((c) => !found.includes(c));

  return (
    <Layout
      board={<Board fen={task.fen} mode={shown ? "view" : "move"} onMove={play} label="Find every check for White" />}
      bottom={
        <div className="mt-1 md:mt-0">
      <div className="mt-6 flex flex-wrap gap-2 min-h-8" aria-live="polite">
        {found.map((c) => (
          <span key={c} className="h-8 px-3 inline-flex items-center font-mono text-[14px] text-ink border border-hairline rounded-[2px]">
            {c}
          </span>
        ))}
      </div>
      {message && !shown && <p className="mt-3 text-[14px] text-meta">{message}</p>}
      {shown ? (
        <div className="mt-6 fade-in">
          <p className="text-[16px] leading-6 text-body">
            {missed.length ? `You found ${found.length} of ${task.checks.length}. Missed: ${missed.join(", ")}.` : `All ${task.checks.length} found.`}
          </p>
          <div className="mt-6">
            <Button onClick={next} chevron autoFocus>
              {round + 1 >= POSITIONS ? "Finish" : "Next position"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <Button onClick={finish}>Done</Button>
        </div>
      )}
        </div>
      }
    >
      <div className="font-mono text-[12px] text-meta">
        Position {round + 1} of {POSITIONS} · White to move
      </div>
      <h2 className="mt-2 text-[20px] leading-[26px] md:text-[24px] md:leading-[30px] tracking-[-0.48px]">Play every move that gives check.</h2>
      <p className="mt-3 hidden md:block text-[16px] leading-6 text-body">Each move you try is taken back so you can look for the next. Press Done when you think you have them all.</p>
    </Layout>
  );
}
