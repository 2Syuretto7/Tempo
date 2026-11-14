"use client";

import { useState } from "react";
import type { DrillId, DrillInfo } from "@/lib/train/drills";
import { Button } from "@/components/ui/Button";
import { FindChecks, KnightRoute, NameSquare, FindSquare, type DrillDone } from "./Drills";

export type DrillCard = DrillInfo & { open: boolean; nodeTitle: string; best: { best: number; total: number; runs: number } | null };

export function TrainRoom({ drills: initial }: { drills: DrillCard[] }) {
  const [drills, setDrills] = useState(initial);
  const [active, setActive] = useState<DrillId | null>(null);
  const [run, setRun] = useState(0);
  const [last, setLast] = useState<{ score: number; total: number; best: boolean } | null>(null);
  const drill = drills.find((d) => d.id === active);

  const done: DrillDone = async (score, total) => {
    const prev = drill?.best;
    const isBest = !prev || (total ? score / total > prev.best / (prev.total || 1) : score > prev.best);
    setLast({ score, total, best: isBest && score > 0 });
    try {
      const res = await fetch("/api/drills", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ drill: active, score, total }) });
      if (res.ok) {
        const b = await res.json();
        setDrills((ds) => ds.map((d) => ({ ...d, best: b[d.id] ?? d.best })));
      }
    } catch {
      /* the result is shown even if it could not be saved */
    }
  };

  if (drill) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 md:px-8 pt-4 flex items-center gap-3 text-[14px]">
          <button onClick={() => (setActive(null), setLast(null))} className="text-meta hover:text-ink">
            ‹ Train
          </button>
          <span className="text-ink">{drill.title}</span>
          {drill.best && (
            <span className="ml-auto font-mono text-[12px] text-meta">
              Best {drill.best.best}
              {drill.unit === "ratio" ? ` / ${drill.best.total}` : ""}
            </span>
          )}
        </div>
        <main className="flex-1 px-4 md:px-8 pt-8 pb-28 md:py-10 max-w-[1240px] w-full mx-auto">
          {last ? (
            <div className="max-w-[560px] fade-in">
              <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">{last.best ? "New best" : "Result"}</div>
              <h2 className="mt-3 text-[40px] leading-[43px] tracking-[-1.2px] font-mono">
                {last.score}
                {drill.unit === "ratio" ? ` / ${last.total}` : ""}
              </h2>
              <p className="mt-3 text-[16px] leading-6 text-body">
                {drill.unit === "timed" ? `${last.score} correct in 30 seconds${last.total > last.score ? `, ${last.total - last.score} slip${last.total - last.score === 1 ? "" : "s"}` : ""}.` : "Short and often beats long and rare. Come back tomorrow and try again."}
              </p>
              <div className="mt-8 flex gap-3">
                <Button onClick={() => (setLast(null), setRun((r) => r + 1))} chevron autoFocus>
                  Again
                </Button>
                <Button variant="ghost" onClick={() => (setActive(null), setLast(null))}>
                  Other drills
                </Button>
              </div>
            </div>
          ) : drill.id === "find-square" ? (
            <FindSquare key={run} onDone={done} />
          ) : drill.id === "name-square" ? (
            <NameSquare key={run} onDone={done} />
          ) : drill.id === "knight-route" ? (
            <KnightRoute key={run} onDone={done} />
          ) : (
            <FindChecks key={run} onDone={done} />
          )}
        </main>
      </div>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-8 py-10 max-w-[1240px] w-full mx-auto">
      <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">Train</div>
      <h1 className="mt-4 text-[40px] leading-[43px] tracking-[-1.2px]">Short drills, done often.</h1>
      <p className="mt-4 text-[18px] leading-[28.8px] text-body max-w-[620px]">
        Each drill sharpens one skill from a lesson until it is automatic. A few minutes a day is enough; each opens when you start its lesson in Learn.
      </p>
      <div className="mt-10 grid gap-px bg-hairline border border-hairline rounded-[2px] overflow-hidden sm:grid-cols-2">
        {drills.map((d) => (
          <button
            key={d.id}
            disabled={!d.open}
            onClick={() => (setActive(d.id), setLast(null), setRun((r) => r + 1))}
            className="text-left bg-raised p-6 min-h-[148px] flex flex-col hover:bg-[#1b1b1b] transition-colors disabled:hover:bg-raised disabled:cursor-not-allowed"
          >
            <span className={`text-[20px] leading-[26px] tracking-[-0.2px] ${d.open ? "text-ink" : "text-meta"}`}>{d.title}</span>
            <span className="mt-2 text-[14px] leading-[22px] text-body">{d.summary}</span>
            <span className="mt-auto pt-4 font-mono text-[11px] uppercase tracking-[0.04em] text-meta">
              {d.open ? (d.best ? `Best ${d.best.best}${d.unit === "ratio" ? ` / ${d.best.total}` : ""} · ${d.best.runs} run${d.best.runs === 1 ? "" : "s"}` : "Not tried yet") : `Opens with ${d.nodeTitle}`}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
