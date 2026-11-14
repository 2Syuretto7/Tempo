"use client";

import { useState } from "react";
import type { LearningNode } from "@/curriculum/types";
import { Button } from "@/components/ui/Button";
import { Pill } from "./ExerciseView";

export function ExplainView({ node, onHint, onDone, onSkip }: { node: LearningNode; onHint: () => void; onDone: () => void; onSkip: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean; feedback: string } | null>(null);
  const [tries, setTries] = useState(0);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: node.id, text }) });
      const v = await res.json();
      setVerdict(v.error ? { ok: false, feedback: v.error } : v);
      setTries((t) => t + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[720px]">
      <div className="mb-6 text-[12px] uppercase tracking-[0.08em] font-medium text-meta">Explain it simply</div>
      <h2 className="text-[24px] leading-[30px] tracking-[-0.48px]">{node.explainPrompt}</h2>
      <p className="mt-3 text-[16px] leading-6 text-body">
        Feynman&apos;s test: if you can explain it simply to someone new, you understand it. Write in your own words; Kibitzer will read it and ask about anything missing.
      </p>
      <label htmlFor="explain" className="sr-only">Your explanation</label>
      <textarea
        id="explain"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        disabled={busy || verdict?.ok}
        className="mt-6 w-full bg-page border border-hairline rounded-[2px] p-4 text-[16px] leading-6 text-ink focus:outline-none focus:border-accent resize-y"
        placeholder="Imagine a friend sitting across the board from you…"
      />
      {verdict && (
        <div className="mt-4 fade-in" aria-live="polite">
          <Pill good={verdict.ok} text={verdict.ok ? "Clear and complete" : "Not yet complete"} />
          <p className="mt-3 text-[16px] leading-6 text-body">{verdict.feedback}</p>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {verdict?.ok ? (
          <Button onClick={onDone} chevron autoFocus>
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={busy || text.trim().length < 20} chevron>
            {busy ? "Kibitzer is reading" : verdict ? "Check my revision" : "Check my explanation"}
          </Button>
        )}
        {!verdict?.ok && tries >= 2 && (
          <Button variant="ghost" onClick={onSkip}>
            Come back to this later
          </Button>
        )}
        {!verdict?.ok && (
          <button onClick={onHint} className="ml-auto text-[14px] text-link hover:text-ink">
            Talk it through with Kibitzer →
          </button>
        )}
      </div>
    </div>
  );
}
