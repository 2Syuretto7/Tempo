import { getNode } from "@/curriculum";
import { withUser } from "@/lib/api";
import type { Phase } from "@/lib/learn/planner";
import { markTheoryDone, recordAttempt, startNode } from "@/lib/learn/store";

const PHASES: Phase[] = ["review", "recall", "guided", "independent", "consolidate", "repair", "try"];

export async function POST(req: Request) {
  const body = await req.json();
  return withUser(async (userId) => {
    switch (body.action) {
      case "start":
        getNode(body.nodeId);
        await startNode(userId, body.nodeId);
        return { ok: true };
      case "theory":
        getNode(body.nodeId);
        await markTheoryDone(userId, body.nodeId);
        return { ok: true };
      case "attempt":
        if (!PHASES.includes(body.phase)) throw new Error("Unknown phase");
        if (body.phase === "try") return { ok: true };
        await recordAttempt(userId, { nodeId: body.nodeId, itemId: body.itemId, correct: !!body.correct, hints: Number(body.hints) || 0, phase: body.phase });
        return { ok: true };
      default:
        throw new Error("Unknown action");
    }
  });
}
