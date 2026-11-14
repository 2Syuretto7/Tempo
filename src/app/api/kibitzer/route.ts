import { getItem, getNode } from "@/curriculum";
import { withUser } from "@/lib/api";
import { hint, type ChatTurn } from "@/lib/kibitzer";
import { puzzleExercise } from "@/lib/puzzles/exercise";

export async function POST(req: Request) {
  const body = await req.json();
  return withUser(async () => {
    if (body.puzzleId) {
      const { nodeId, exercise } = puzzleExercise(String(body.puzzleId), Number(body.ply) || 1);
      return hint({ nodeId, exercise, hintLevel: Number(body.hintLevel) || 1 }, sanitise(body.messages));
    }
    const node = getNode(body.nodeId);
    let exercise;
    let theoryText: string | undefined;
    if (body.itemId) {
      const { node: owner, item } = getItem(body.itemId);
      exercise = item.generate(Number(body.seed) || 0);
      return hint({ nodeId: owner.id, exercise, hintLevel: Number(body.hintLevel) || 1 }, sanitise(body.messages));
    }
    if (typeof body.step === "number") {
      const step = node.theory[body.step];
      theoryText = step?.text;
      exercise = step?.tryIt;
    }
    return hint({ nodeId: node.id, exercise, theoryText, hintLevel: Number(body.hintLevel) || 1 }, sanitise(body.messages));
  });
}

function sanitise(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content }));
}
