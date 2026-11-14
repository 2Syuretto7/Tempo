"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ReflectView({ onDone }: { onDone: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="max-w-[720px]">
      <div className="mb-6 text-[12px] uppercase tracking-[0.08em] font-medium text-meta">Reflect</div>
      <h2 className="text-[24px] leading-[30px] tracking-[-0.48px]">In one line: what clicked today, and what still feels shaky?</h2>
      <p className="mt-3 text-[16px] leading-6 text-body">Naming the shaky part is how tomorrow&apos;s session gets better.</p>
      <label htmlFor="reflect" className="sr-only">Reflection</label>
      <textarea
        id="reflect"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="mt-6 w-full bg-page border border-hairline rounded-[2px] p-4 text-[16px] leading-6 text-ink focus:outline-none focus:border-accent"
      />
      <div className="mt-6 flex gap-3">
        <Button onClick={() => onDone(text)} chevron>
          Save and finish
        </Button>
        <Button variant="ghost" onClick={() => onDone("")}>
          Skip
        </Button>
      </div>
    </div>
  );
}
