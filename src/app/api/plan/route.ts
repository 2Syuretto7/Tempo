import { withUser } from "@/lib/api";
import { todaysPlan } from "@/lib/learn/today";

export async function GET(req: Request) {
  const more = new URL(req.url).searchParams.get("more") === "1";
  return withUser(async (userId) => (await todaysPlan(userId, more)).plan);
}
