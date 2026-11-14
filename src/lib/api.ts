import "server-only";
import { NextResponse } from "next/server";
import { currentUserId } from "./auth";

export async function withUser(fn: (userId: number) => Promise<unknown>) {
  const userId = await currentUserId();
  if (userId === null) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    return NextResponse.json(await fn(userId));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong" }, { status: 400 });
  }
}
