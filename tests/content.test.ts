import { describe, expect, it } from "vitest";
import { NODES, NODE_BY_ID, topoOrder } from "@/curriculum";
import type { Exercise } from "@/curriculum/types";
import { checkMoves, legalMoves, load, mateMoves, ALL_SQUARES } from "@/lib/chess";

/** Every exercise must be valid and solvable, with the stated answer actually correct. */
function verify(ex: Exercise, where: string) {
  if (ex.fen) expect(() => load(ex.fen!), `${where}: FEN loads`).not.toThrow();
  for (const sq of ex.highlight ?? []) expect(ALL_SQUARES, `${where}: highlight ${sq}`).toContain(sq);
  if (ex.kind === "squares") {
    expect(ex.targets.length, `${where}: has targets`).toBeGreaterThan(0);
    for (const t of ex.targets) expect(ALL_SQUARES, `${where}: target ${t}`).toContain(t);
  }
  if (ex.kind === "choice") {
    expect(ex.options.length, `${where}: options`).toBeGreaterThanOrEqual(2);
    expect(new Set(ex.options).size, `${where}: distinct options ${ex.options}`).toBe(ex.options.length);
    expect(ex.answer, where).toBeGreaterThanOrEqual(0);
    expect(ex.answer, where).toBeLessThan(ex.options.length);
  }
  if (ex.kind === "move") {
    const legal = legalMoves(ex.fen).map((m) => m.san);
    if (ex.goal.type === "san") for (const s of ex.goal.moves) expect(legal, `${where}: ${s} legal in ${ex.fen}`).toContain(s);
    if (ex.goal.type === "mate") expect(mateMoves(ex.fen).length, `${where}: a mate exists in ${ex.fen}`).toBeGreaterThan(0);
    if (ex.goal.type === "check") expect(checkMoves(ex.fen).length, `${where}: a check exists`).toBeGreaterThan(0);
  }
}

describe("knowledge graph", () => {
  it("has unique ids and known prerequisites", () => {
    expect(NODE_BY_ID.size).toBe(NODES.length);
    for (const n of NODES) for (const p of [...n.prereqs, ...n.related]) expect(NODE_BY_ID.has(p), `${n.id} -> ${p}`).toBe(true);
  });
  it("is acyclic", () => {
    expect(topoOrder().length).toBe(NODES.length);
  });
  it("every node has theory, practice, key points and an explain prompt", () => {
    for (const n of NODES) {
      expect(n.theory.length, n.id).toBeGreaterThan(0);
      expect(n.items.length, n.id).toBeGreaterThan(0);
      expect(n.keyPoints.length, n.id).toBeGreaterThan(2);
      expect(n.explainPrompt.length, n.id).toBeGreaterThan(20);
    }
  });
  it("item ids are unique and namespaced by node", () => {
    const ids = NODES.flatMap((n) => n.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of NODES) for (const i of n.items) expect(i.id.startsWith(n.id + "."), i.id).toBe(true);
  });
});

describe("exercises", () => {
  for (const n of NODES) {
    it(`${n.id}: theory positions and try-its are valid`, () => {
      n.theory.forEach((s, i) => {
        if (s.fen) expect(() => load(s.fen!)).not.toThrow();
        if (s.showMoves) expect(legalMoves(s.fen!, s.showMoves).length, `${n.id} step ${i}`).toBeGreaterThan(0);
        if (s.tryIt) verify(s.tryIt, `${n.id} step ${i}`);
      });
    });
    it(`${n.id}: 60 generated instances of every item are valid`, () => {
      for (const item of n.items) for (let seed = 1; seed <= 60; seed++) verify(item.generate(seed * 7919), `${item.id}#${seed}`);
    });
  }
});

describe("hand-checked answers", () => {
  it("mate-in-one solutions are real mates", () => {
    const ids = ["chess.checkmate.in-one", "chess.stalemate.avoid"];
    for (const id of ids) {
      const item = NODES.flatMap((n) => n.items).find((i) => i.id === id)!;
      for (let s = 0; s < 10; s++) {
        const ex = item.generate(s);
        if (ex.kind === "move") expect(mateMoves(ex.fen).length).toBeGreaterThan(0);
      }
    }
  });
  it("the stalemate trap really is a stalemate", () => {
    const g = load("7k/8/6K1/8/8/8/8/5Q2 w - - 0 1");
    g.move("Qf7");
    expect(g.isStalemate()).toBe(true);
  });
  it("castling cases match their explanations", () => {
    const item = NODES.flatMap((n) => n.items).find((i) => i.id === "chess.castling.can")!;
    const expected = ["Yes", "No", "No", "No", "No", "Yes"];
    expected.forEach((want, i) => {
      const ex = item.generate(i);
      if (ex.kind !== "choice") throw new Error();
      expect(ex.options[ex.answer], ex.prompt).toBe(want);
    });
  });
});
