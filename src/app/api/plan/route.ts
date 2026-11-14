import { withUser } from "@/lib/api";
import { plan } from "@/lib/learn/planner";
import { loadState } from "@/lib/learn/store";

export async function GET() {
  return withUser(async (userId) => {
    const state = await loadState(userId);
    return plan({ now: new Date(), ...state });
  });
}
