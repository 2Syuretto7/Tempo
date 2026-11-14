import { withUser } from "@/lib/api";
import type { DrillId } from "@/lib/train/drills";
import { recordDrill } from "@/lib/train/store";

export async function POST(req: Request) {
  const body = await req.json();
  return withUser((userId) => recordDrill(userId, String(body.drill) as DrillId, Number(body.score), Number(body.total)));
}
