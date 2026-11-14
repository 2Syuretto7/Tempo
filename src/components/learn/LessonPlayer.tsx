"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getItem, getNode } from "@/curriculum";
import type { Activity, Block, Plan } from "@/lib/learn/planner";
import { Button } from "@/components/ui/Button";
import { ExerciseView } from "./ExerciseView";
import { Kibitzer, type KibitzerTarget } from "./Kibitzer";
import { ReflectView } from "./ReflectView";
import { TheoryView } from "./TheoryView";
import { PuzzleView, type ClientPuzzle } from "@/components/puzzles/PuzzleView";

type Entry = { block: Block; activity: Activity };

const PHASE_LABEL: Record<string, string> = {
  review: "Review",
  recall: "Recall",
  guided: "Guided practice",
  independent: "On your own",
  consolidate: "Make it stick",
  repair: "Repair",
};

const post = (body: unknown) =>
  fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => {
    if (!r.ok) throw new Error("save failed");
  });

function keyOf(a: Activity) {
  if (a.type === "exercise") return `${a.type}:${a.itemId}:${a.seed}`;
  if (a.type === "puzzle") return `puzzle:${a.index}`;
  return `${a.type}:${a.nodeId}`;
}

export function LessonPlayer() {
  const [queue, setQueue] = useState<Entry[] | null>(null);
  const [index, setIndex] = useState(0);
  const [headline, setHeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [kOpen, setKOpen] = useState(false);
  const [hintSignal, setHintSignal] = useState(0);
  const [theoryStep, setTheoryStep] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [puzzleAt, setPuzzleAt] = useState<{ id: string; ply: number } | null>(null);
  const skipped = useRef(new Set<string>());
  const started = useRef(new Set<string>());
  const outcome = useRef<{ correct: boolean; firstTry: boolean } | null>(null);

  const router = useRouter();

  const apply = useCallback((plan: Plan | null) => {
    if (!plan) return setError("Tempo could not load your session. Check your connection and try again.");
    const entries = plan.blocks.flatMap((block) => block.activities.map((activity) => ({ block, activity }))).filter((e) => !skipped.current.has(keyOf(e.activity)));
    setError(null);
    setHeadline(plan.headline);
    setQueue(entries);
    setIndex(0);
  }, []);

  const fetchPlan = useCallback(async (): Promise<Plan | null> => {
    try {
      const res = await fetch("/api/plan", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/sign-in");
        return null;
      }
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }, [router]);

  const load = useCallback(() => fetchPlan().then(apply), [fetchPlan, apply]);

  useEffect(() => {
    let live = true;
    fetchPlan().then((p) => live && apply(p));
    return () => {
      live = false;
    };
  }, [fetchPlan, apply]);

  const entry = queue?.[index];

  // Mark a new idea as started the moment its block begins.
  useEffect(() => {
    if (entry?.block.kind === "new" && entry.block.nodeId && !started.current.has(entry.block.nodeId)) {
      started.current.add(entry.block.nodeId);
      post({ action: "start", nodeId: entry.block.nodeId }).catch(() => {});
    }
  }, [entry]);

  const contextKey = entry ? `${index}:${keyOf(entry.activity)}:${entry.activity.type === "theory" ? theoryStep : ""}` : "none";

  const advance = useCallback(async () => {
    setHints(0);
    setTheoryStep(0);
    setPuzzleAt(null);
    outcome.current = null;
    setCompleted((c) => c + 1);
    if (queue && index + 1 < queue.length) setIndex(index + 1);
    else {
      setQueue(null);
      await load();
    }
  }, [queue, index, load]);

  const exercise = useMemo(() => {
    if (entry?.activity.type !== "exercise") return null;
    return getItem(entry.activity.itemId).item.generate(entry.activity.seed);
  }, [entry]);

  const target: KibitzerTarget | null = useMemo(() => {
    if (!entry) return null;
    const a = entry.activity;
    if (a.type === "puzzle") return puzzleAt ? { nodeId: "", puzzleId: puzzleAt.id, ply: puzzleAt.ply } : null;
    if (a.type === "exercise") return { nodeId: a.nodeId, itemId: a.itemId, seed: a.seed };
    if (a.type === "theory") return { nodeId: a.nodeId, step: theoryStep };
    return { nodeId: a.nodeId };
  }, [entry, theoryStep, puzzleAt]);

  const askHint = () => setHintSignal((s) => s + 1);

  if (error)
    return (
      <Centered>
        <p className="text-[16px] text-danger">{error}</p>
        <Button className="mt-6" onClick={() => void load()}>
          Try again
        </Button>
      </Centered>
    );

  if (!queue) return <Centered><div className="h-[2px] w-24 bg-hairline overflow-hidden"><div className="h-full w-1/3 bg-accent animate-pulse" /></div></Centered>;

  if (!entry)
    return (
      <Centered>
        <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">{completed || headline.startsWith("Done") ? "Session complete" : "Nothing due"}</div>
        <h1 className="mt-4 text-[40px] leading-[43px] tracking-[-1.2px]">{completed || headline.startsWith("Done") ? "That is today\u2019s work." : "You are up to date."}</h1>
        <p className="mt-4 text-[18px] leading-[28.8px] text-body max-w-[520px]">{headline}</p>
        <Link href="/" className="mt-8 inline-flex h-10 px-5 items-center bg-white text-[#0d0d0d] rounded-[2px] font-medium">
          Back to home
        </Link>
      </Centered>
    );

  const { block, activity } = entry;
  const node = getNode(activity.nodeId);
  const total = queue.length;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 md:px-8 pt-4">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.08em] font-medium text-meta">
          <span className="text-ink normal-case tracking-normal text-[14px]">{block.title}</span>
          {(() => {
            const label = activity.type === "exercise" ? PHASE_LABEL[activity.phase] : activity.type === "theory" ? "Theory" : activity.type === "puzzle" ? "Puzzle" : "Reflect";
            return block.title.startsWith(label) ? null : (
              <>
                <span aria-hidden>·</span>
                <span>{label}</span>
              </>
            );
          })()}
          {activity.type === "exercise" && activity.nodeId !== block.nodeId && <span className="normal-case tracking-normal text-meta">from {node.title}</span>}
          <span className="ml-auto font-mono normal-case tracking-normal">
            {index + 1} / {total}
          </span>
        </div>
        <div className="mt-3 h-[2px] bg-hairline" aria-hidden>
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <main className="flex-1 px-4 md:px-8 pt-8 pb-28 md:py-10 max-w-[1240px] w-full mx-auto">
        {activity.type === "theory" && (
          <TheoryView
            key={contextKey.split(":").slice(0, 3).join(":")}
            node={node}
            onStep={setTheoryStep}
            onHint={askHint}
            onDone={async () => {
              await post({ action: "theory", nodeId: node.id }).catch(() => {});
              advance();
            }}
          />
        )}
        {activity.type === "reflect" && (
          <ReflectView
            key={contextKey}
            onDone={async (text) => {
              if (text.trim()) await post({ action: "reflect", text }).catch(() => {});
              skipped.current.add(keyOf(activity));
              advance();
            }}
          />
        )}
        {activity.type === "puzzle" && (
          <LearnPuzzle
            key={contextKey}
            hints={hints}
            onHint={askHint}
            onPly={(id, ply) => setPuzzleAt({ id, ply })}
            onSkip={() => {
              skipped.current.add(keyOf(activity));
              advance();
            }}
            onContinue={advance}
          />
        )}
        {activity.type === "exercise" && exercise && (
          <ExerciseView
            key={contextKey}
            exercise={exercise}
            retries={activity.phase === "guided" || activity.phase === "recall"}
            onHint={askHint}
            onResolved={(o) => (outcome.current = o)}
            onContinue={async () => {
              const o = outcome.current;
              await post({ action: "attempt", nodeId: activity.nodeId, itemId: activity.itemId, phase: activity.phase, correct: !!o?.firstTry, hints }).catch(() => {});
              advance();
            }}
          />
        )}
      </main>

      <Kibitzer key={contextKey} target={target} open={kOpen} setOpen={setKOpen} hintSignal={hintSignal} onUse={() => setHints((h) => h + 1)} />
    </div>
  );
}

function LearnPuzzle({ hints, onHint, onPly, onSkip, onContinue }: { hints: number; onHint: () => void; onPly: (id: string, ply: number) => void; onSkip: () => void; onContinue: () => void }) {
  const [puzzle, setPuzzle] = useState<ClientPuzzle | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/puzzles/next", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live) return;
        if (d?.puzzle) setPuzzle(d.puzzle);
        else onSkip();
      })
      .catch(() => live && onSkip());
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!puzzle) return null;
  return <PuzzleView puzzle={puzzle} hints={hints} onHint={onHint} onPly={(ply) => onPly(puzzle.id, ply)} continueLabel="Continue" onContinue={onContinue} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 fade-in">{children}</div>;
}
