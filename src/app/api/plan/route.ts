import { withUser } from "@/lib/api";
import { todaysPlan } from "@/lib/learn/today";

export async function GET() {
  return withUser(async (userId) => (await todaysPlan(userId)).plan);
}
