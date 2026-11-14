"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Kibitzer } from "@/components/learn/Kibitzer";
import { PuzzleView, type ClientPuzzle } from "./PuzzleView";

type Theme = { id: string; name: string; count: number };
type Next = { open: boolean; themes: Theme[]; rating: number; provisional: boolean; puzzle: ClientPuzzle | null };

export function PuzzleRoom() {
  const [data, setData] = useState<Next | null>(null);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState("");
  const [count, setCount] = useState(0);
  const [hints, setHints] = useState(0);
  const [hintSignal, setHintSignal] = useState(0);
  const [kOpen, setKOpen] = useState(false);
  const [ply, setPly] = useState(1);

  const fetchNext = useCallback(async (t: string): Promise<Next | null> => {
    try {
      const res = await fetch(`/api/puzzles/next${t ? `?theme=${encodeURIComponent(t)}` : ""}`, { cache: "no-store" });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }, []);

  const show = useCallback((d: Next | null) => {
    setError(!d);
    setData(d);
    setHints(0);
    setPly(1);
    setCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let live = true;
    fetchNext("").then((d) => live && show(d));
    return () => {
      live = false;
    };
  }, [fetchNext, show]);

  const next = (t = theme) => {
    setData((d) => (d ? { ...d, puzzle: null } : d));
    void fetchNext(t).then(show);
  };

  if (error)
    return (
      <Centered>
        <p className="text-[16px] text-danger">Tempo could not load a puzzle. Check your connection and try again.</p>
        <button onClick={() => next()} className="mt-6 h-10 px-5 bg-white text-[#0d0d0d] rounded-[2px] font-medium">
          Try again
        </button>
      </Centered>
    );

  if (!data) return <Centered><div className="h-[2px] w-24 bg-hairline overflow-hidden"><div className="h-full w-1/3 bg-accent animate-pulse" /></div></Centered>;

  if (!data.open)
    return (
      <Centered>
        <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">Puzzles</div>
        <h1 className="mt-4 text-[40px] leading-[43px] tracking-[-1.2px]">Opens with checkmate.</h1>
        <p className="mt-4 text-[18px] leading-[28.8px] text-body max-w-[520px]">
          Every puzzle here is a real position from a real game, and each uses only ideas you have already mastered. The first ones open when you master Checkmate in Learn.
        </p>
        <Link href="/learn" className="mt-8 inline-flex h-10 px-5 items-center bg-white text-[#0d0d0d] rounded-[2px] font-medium">
          Continue learning
        </Link>
      </Centered>
    );

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 md:px-8 pt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[14px] text-ink">Puzzles</span>
        <span className="font-mono text-[12px] text-meta">
          Rating {data.rating}
          {data.provisional ? "?" : ""}
        </span>
        <label className="ml-auto flex items-center gap-2 text-[14px] text-meta">
          <span className="sr-only md:not-sr-only">Theme</span>
          <select
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value);
              next(e.target.value);
            }}
            className="h-8 bg-page border border-hairline rounded-[2px] px-2 text-[14px] text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Mixed (recommended)</option>
            {data.themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <main className="flex-1 px-4 md:px-8 pt-8 pb-28 md:py-10 max-w-[1240px] w-full mx-auto">
        {data.puzzle ? (
          <PuzzleView key={`${count}:${data.puzzle.id}`} puzzle={data.puzzle} hints={hints} onHint={() => setHintSignal((s) => s + 1)} onPly={setPly} onContinue={() => next()} />
        ) : (
          <p className="text-[16px] text-body">You have solved every puzzle open to you in this theme. Choose another, or learn a new idea to open more.</p>
        )}
      </main>
      <Kibitzer
        key={`${count}`}
        target={data.puzzle ? { nodeId: "", puzzleId: data.puzzle.id, ply } : null}
        open={kOpen}
        setOpen={setKOpen}
        hintSignal={hintSignal}
        onUse={() => setHints((h) => h + 1)}
      />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 fade-in">{children}</div>;
}
