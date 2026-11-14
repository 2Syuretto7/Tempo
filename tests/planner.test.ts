import { describe, expect, it } from "vitest";
import { isMastered, plan, chooseNext, type Attempt, type NodeState, type Phase } from "@/lib/learn/planner";

const day = (n: number, h = 10) => new Date(Date.UTC(2026, 10, 14 + n, h - 5, 30)); // h o'clock IST
let s = 1;
const seed = () => s++;

function practise(nodeId: string, itemId: string, at: Date, n: number, correct = true): Attempt[] {
  return Array.from({ length: n }, (_, i) => ({ nodeId, itemId, correct, hints: 0, phase: "guided" as const, at: new Date(at.getTime() + i * 60e3) }));
}

describe("planner", () => {
  it("day one starts with the board, with theory before explanation before practice", () => {
    const p = plan({ now: day(0), nodes: [], attempts: [], dueCards: [], seed });
    expect(p.blocks).toHaveLength(1);
    const b = p.blocks[0];
    expect(b.kind).toBe("new");
    expect(b.nodeId).toBe("chess.board");
    const types = b.activities.map((a) => a.type);
    expect(types.indexOf("theory")).toBeLessThan(types.indexOf("exercise"));
    expect(types.at(-1)).toBe("exercise");
    expect(p.headline).toContain("a new idea, the board");
  });

  it("never introduces two new ideas on the same day", () => {
    const nodes: NodeState[] = [{ nodeId: "chess.board", startedAt: day(0, 9), theoryDone: true, masteredAt: day(0, 9) }];
    const p = plan({ now: day(0, 11), nodes, attempts: practise("chess.board", "chess.board.find", day(0, 9), 9), dueCards: [], seed });
    expect(p.done).toBe(true);
    expect(p.headline).toContain("Done for today");
  });

  it("requires two separate days for mastery", () => {
    const node: NodeState = { nodeId: "chess.board", startedAt: day(0), theoryDone: true, masteredAt: null };
    expect(isMastered(node, practise("chess.board", "chess.board.find", day(0), 9))).toBe(false);
    const both = [...practise("chess.board", "chess.board.find", day(0), 5), ...practise("chess.board", "chess.board.find", day(1), 5)];
    expect(isMastered(node, both)).toBe(true);
    expect(isMastered({ ...node, theoryDone: false }, both)).toBe(false);
  });

  it("does not count attempts that used hints", () => {
    const node: NodeState = { nodeId: "chess.board", startedAt: day(0), theoryDone: true, masteredAt: null };
    const hinted = [...practise("chess.board", "chess.board.find", day(0), 5), ...practise("chess.board", "chess.board.find", day(1), 5)].map((a) => ({ ...a, hints: 1 }));
    expect(isMastered(node, hinted)).toBe(false);
  });

  it("the next day consolidates before anything new, then reviews come first", () => {
    const nodes: NodeState[] = [{ nodeId: "chess.board", startedAt: day(0), theoryDone: true, masteredAt: null }];
    const p = plan({ now: day(1), nodes, attempts: practise("chess.board", "chess.board.find", day(0), 9), dueCards: [], seed });
    expect(p.blocks.map((b) => b.kind)).toEqual(["consolidate"]);
    const withReview = plan({ now: day(1), nodes, attempts: [], dueCards: [{ itemId: "chess.board.find", nodeId: "chess.board", due: day(0) }], seed });
    expect(withReview.blocks[0].kind).toBe("review");
  });

  it("unlocks branches only when prerequisites are mastered, preferring what unlocks most", () => {
    const nodes: NodeState[] = [{ nodeId: "chess.board", startedAt: day(0), theoryDone: true, masteredAt: day(1) }];
    const next = chooseNext(nodes)!;
    expect(["chess.rook", "chess.bishop", "chess.knight", "chess.king", "chess.pawn"]).toContain(next.id);
    expect(chooseNext([])!.id).toBe("chess.board");
  });

  it("a failed review triggers a repair block", () => {
    const nodes: NodeState[] = [{ nodeId: "chess.board", startedAt: day(0), theoryDone: true, masteredAt: day(1) }];
    const failed: Attempt = { nodeId: "chess.board", itemId: "chess.board.find", correct: false, hints: 0, phase: "review", at: day(5, 9) };
    const p = plan({ now: day(5, 10), nodes, attempts: [failed], dueCards: [], seed });
    expect(p.blocks[0].kind).toBe("repair");
  });
});

describe("keep going", () => {
  const now = new Date("2026-11-20T18:00:00+05:30");
  const today = new Date("2026-11-20T09:00:00+05:30");

  it("offers another new idea even after one was started today", () => {
    const nodes: NodeState[] = [{ nodeId: "chess.board", startedAt: today, theoryDone: true, masteredAt: null }];
    const attempts = Array.from({ length: 9 }, (_, i) => ({ nodeId: "chess.board", itemId: "chess.board.find", correct: true, hints: 0, phase: (i < 5 ? "guided" : "independent") as Phase, at: today }));
    const normal = plan({ now, nodes, attempts, dueCards: [], seed: () => 1 });
    expect(normal.blocks.some((b) => b.kind === "new")).toBe(false);
    const more = plan({ now, nodes, attempts, dueCards: [], more: true, seed: () => 1 });
    const fresh = more.blocks.find((b) => b.kind === "new");
    expect(fresh?.nodeId).toBeTruthy();
    expect(fresh?.nodeId).not.toBe("chess.board");
    expect(more.headline).toMatch(/^Extra:/);
  });

  it("adds puzzles beyond the daily quota", () => {
    const nodes: NodeState[] = [{ nodeId: "chess.board", startedAt: today, theoryDone: true, masteredAt: today }];
    const more = plan({ now, nodes, attempts: [], dueCards: [], puzzles: { open: true, doneToday: 40 }, more: true, seed: () => 1 });
    expect(more.blocks.find((b) => b.kind === "puzzles")?.activities.length).toBe(5);
  });
});
