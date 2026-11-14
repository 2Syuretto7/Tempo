import type { Metadata } from "next";
import { getNode } from "@/curriculum";
import { requireUser } from "@/lib/auth";
import { DRILLS } from "@/lib/train/drills";
import { bests, startedNodes } from "@/lib/train/store";
import { TrainRoom } from "@/components/train/TrainRoom";

export const metadata: Metadata = { title: "Train" };

export default async function TrainPage() {
  const userId = await requireUser();
  const [started, best] = await Promise.all([startedNodes(userId), bests(userId)]);
  const drills = DRILLS.map((d) => ({ ...d, ready: started.has(d.nodeId), nodeTitle: getNode(d.nodeId).title, best: best[d.id] ?? null }));
  return <TrainRoom drills={drills} />;
}
