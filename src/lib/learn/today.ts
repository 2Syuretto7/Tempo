import "server-only";
import { plan } from "./planner";
import { loadState } from "./store";
import { puzzleAccess, puzzlesToday } from "@/lib/puzzles/store";

/** Today's plan with everything the planner needs, shared by Home and Learn so they agree. */
export async function todaysPlan(userId: number, more = false) {
  const [state, access, doneToday] = await Promise.all([loadState(userId), puzzleAccess(userId), puzzlesToday(userId)]);
  return { state, plan: plan({ now: new Date(), ...state, puzzles: { open: access.open, doneToday }, more }) };
}
