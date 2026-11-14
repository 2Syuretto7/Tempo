import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { LessonPlayer } from "@/components/learn/LessonPlayer";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage() {
  await requireUser();
  return <LessonPlayer />;
}
