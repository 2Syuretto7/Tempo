import { withUser } from "@/lib/api";
import { recordPuzzle } from "@/lib/puzzles/store";

export async function POST(req: Request) {
  const body = await req.json();
  return withUser((userId) => recordPuzzle(userId, String(body.puzzleId), !!body.correct, Math.max(0, Number(body.hints) || 0)));
}
