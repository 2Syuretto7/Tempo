import { getItem, getNode } from "@/curriculum";
import { withUser } from "@/lib/api";
import { hint, type ChatTurn } from "@/lib/kibitzer";

export async function POST(req: Request) {
  const body = await req.json();
  return withUser(async () => {
    const node = getNode(body.nodeId);
    let exercise;
    let theoryText: string | undefined;
    if (body.itemId) {
      const { node: owner, item } = getItem(body.itemId);
      exercise = item.generate(Number(body.seed) || 0);
      return hint({ nodeId: owner.id, exercise, hintLevel: Number(body.hintLevel) || 1 }, sanitise(body.messages));
    }
    if (body.purpose === "explain") {
      theoryText = `The learner is writing, in their own words, an answer to: "${node.explainPrompt}". Never write the explanation for them and never list the key points. Ask one question at a time that helps them find their own words, or point out gently where their thinking is unclear.`;
    } else if (typeof body.step === "number") {
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
