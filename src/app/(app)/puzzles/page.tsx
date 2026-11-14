import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PuzzleRoom } from "@/components/puzzles/PuzzleRoom";

export const metadata: Metadata = { title: "Puzzles" };

export default async function PuzzlesPage() {
  await requireUser();
  return <PuzzleRoom />;
}
