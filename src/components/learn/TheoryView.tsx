"use client";

import { useState } from "react";
import type { LearningNode } from "@/curriculum/types";
import { Board } from "@/components/board/Board";
import { Button } from "@/components/ui/Button";
import { ExerciseView } from "./ExerciseView";
import { Rich } from "./Rich";

type Props = {
  node: LearningNode;
  onStep: (index: number) => void;
  onHint: () => void;
  onDone: () => void;
};

export function TheoryView({ node, onStep, onHint, onDone }: Props) {
  const [i, setI] = useState(0);
  const [trying, setTrying] = useState(false);
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const step = node.theory[i];
  const last = i === node.theory.length - 1;

  const go = (n: number) => {
    setI(n);
    setTrying(false);
    onStep(n);
  };
  const next = () => (last ? onDone() : go(i + 1));

  if (trying && step.tryIt) {
    return (
      <div>
        <StepHeader node={node} i={i} label="Your turn" />
        <ExerciseView
          key={`${node.id}-${i}`}
          exercise={step.tryIt}
          retries
          onHint={onHint}
          onResolved={() => setSolved((s) => new Set(s).add(i))}
          continueLabel={last ? "Finish the lesson" : "Next"}
          onContinue={next}
        />
      </div>
    );
  }

  return (
    <div>
      <StepHeader node={node} i={i} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        {step.fen && (
          <div className="w-full max-w-[min(100%,calc(100svh-230px))] mx-auto lg:mx-0">
            <Board fen={step.fen} highlight={step.highlight} arrows={step.arrows} showMoves={step.showMoves} hideCoords={step.hideCoords} orientation={step.orientation} />
          </div>
        )}
        <div className="lg:pt-2">
          <p className="text-[18px] leading-[28.8px] tracking-[0.18px] text-body">
            <Rich text={step.text} />
          </p>
          <div className="mt-8 flex items-center gap-3">
            {step.tryIt && !solved.has(i) ? (
              <Button onClick={() => setTrying(true)} chevron autoFocus>
                Try it
              </Button>
            ) : (
              <Button onClick={next} chevron autoFocus>
                {last ? "Finish the lesson" : "Next"}
              </Button>
            )}
            {i > 0 && (
              <Button variant="ghost" onClick={() => go(i - 1)}>
                Back
              </Button>
            )}
          </div>
          <button onClick={onHint} className="mt-8 inline-flex items-center gap-2 text-[14px] text-link hover:text-ink">
            Not clear? Ask Kibitzer →
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ node, i, label }: { node: LearningNode; i: number; label?: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="text-[12px] uppercase tracking-[0.08em] font-medium text-meta">{label ?? "Theory"}</div>
      <div className="flex gap-1" aria-label={`Step ${i + 1} of ${node.theory.length}`}>
        {node.theory.map((_, k) => (
          <span key={k} className={`h-[2px] w-6 ${k <= i ? "bg-accent" : "bg-hairline"}`} />
        ))}
      </div>
    </div>
  );
}
