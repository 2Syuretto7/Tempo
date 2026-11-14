import Link from "next/link";
import { NODES } from "@/curriculum";
import { STAGE_NAMES } from "@/curriculum/types";
import { requireUser } from "@/lib/auth";
import { statuses } from "@/lib/learn/planner";
import { todaysPlan } from "@/lib/learn/today";
import { Burn } from "@/components/ui/Burn";

export default async function Home() {
  const userId = await requireUser();
  const { state, plan: p } = await todaysPlan(userId);
  const st = statuses(state.nodes);
  const stage = Math.min(...NODES.filter((n) => st.get(n.id) !== "mastered").map((n) => n.stage), STAGE_NAMES.length - 1);
  const inStage = NODES.filter((n) => n.stage === stage);
  const mastered = inStage.filter((n) => st.get(n.id) === "mastered").length;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-[12px] leading-5 uppercase tracking-[0.08em] font-medium text-meta">
        Chess · Stage {stage} · {STAGE_NAMES[stage]}
      </div>
      <h1 className="mt-6 text-[44px] leading-[44px] md:text-[72px] md:leading-[72px] tracking-[-0.03em] max-w-[900px]">
        <Burn text="Slow, steady, and deep." />
      </h1>
      <p className="mt-6 text-[18px] leading-[28.8px] tracking-[0.18px] text-body max-w-[560px]">{p.headline}</p>
      <Link
        href="/learn"
        className="group mt-10 inline-flex h-12 px-8 items-center gap-2 bg-white text-[#0d0d0d] rounded-[2px] text-[16px] font-medium hover:bg-[#e6e6e6] transition-colors"
      >
        Learn
        <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden>
          ›
        </span>
      </Link>
      <div className="mt-16 w-full max-w-[320px]">
        <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.04em] text-meta">
          <span>{STAGE_NAMES[stage]}</span>
          <span>
            {mastered} of {inStage.length} mastered
          </span>
        </div>
        <div className="mt-2 grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${inStage.length}, minmax(0, 1fr))` }} aria-hidden>
          {inStage.map((n) => (
            <span key={n.id} title={n.title} className={`h-[3px] ${st.get(n.id) === "mastered" ? "bg-accent" : st.get(n.id) === "learning" ? "bg-[rgba(150,141,250,0.4)]" : "bg-hairline"}`} />
          ))}
        </div>
      </div>
    </main>
  );
}
