import { getNode } from "@/curriculum";
import { withUser } from "@/lib/api";
import { judgeExplanation } from "@/lib/kibitzer";
import { saveExplanation } from "@/lib/learn/store";

export async function POST(req: Request) {
  const { nodeId, text } = await req.json();
  return withUser(async (userId) => {
    getNode(nodeId);
    const t = String(text ?? "").slice(0, 4000);
    const verdict = await judgeExplanation(nodeId, t);
    await saveExplanation(userId, nodeId, t, verdict.ok);
    return verdict;
  });
}
