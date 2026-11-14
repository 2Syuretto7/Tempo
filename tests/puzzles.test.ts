import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { load } from "@/lib/chess";
import { update, START } from "@/lib/glicko";
import { parsePuzzles } from "@/lib/puzzles/data";
import { judgeMove, learnerColour, positionAt, uciParts } from "@/lib/puzzles/play";
import { isEligible, teachingThemes, THEME_NAMES, THEME_NODE } from "@/lib/puzzles/themes";
import { checksTask, knightDistance, knightTask, squareOptions } from "@/lib/train/drills";
import { plan } from "@/lib/learn/planner";

const all = parsePuzzles(readFileSync("data/puzzles.csv", "utf8"));

describe("puzzle set", () => {
  it("is large and well-formed", () => {
    expect(all.length).toBeGreaterThan(20000);
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });

  it("every puzzle line is legal and ends where the learner moved", () => {
    for (const p of all) {
      const game = load(p.fen);
      for (const m of p.moves) game.move(uciParts(m));
      expect(p.moves.length % 2, p.id).toBe(0);
    }
  }, 120_000);

  it("every tag is either neutral or tied to a node, and every theme has a name", () => {
    for (const p of all) expect(teachingThemes(p.tags), `${p.id} ${p.tags.join(" ")}`).not.toBeNull();
    for (const t of Object.keys(THEME_NODE)) expect(THEME_NAMES[t], t).toBeTruthy();
  });

  it("only mate-in-one puzzles are open after Checkmate alone, and there are hundreds", () => {
    const open = all.filter((p) => isEligible(p.tags, new Set(["mateIn1"])));
    expect(open.length).toBeGreaterThan(300);
    for (const p of open) expect(p.tags).toContain("mateIn1");
  });

  it("judges the stored move right and any mate right", () => {
    const p = all.find((x) => x.tags.includes("mateIn1"))!;
    expect(judgeMove(p, 1, p.moves[1])).toBe("mate");
    const q = all.find((x) => !x.tags.includes("mate") && x.moves.length >= 4)!;
    expect(judgeMove(q, 1, q.moves[1])).toBe("right");
    const fen = positionAt(q, 1);
    const other = load(fen).moves({ verbose: true }).find((m) => `${m.from}${m.to}` !== q.moves[1].slice(0, 4))!;
    expect(judgeMove(q, 1, `${other.from}${other.to}`)).not.toBe("right");
    expect(learnerColour(q)).toBe(load(fen).turn() === "w" ? "white" : "black");
  });
});

describe("Glicko-2", () => {
  it("rises on a win, falls on a loss, and narrows the deviation", () => {
    const win = update(START, { rating: 800, rd: 80 }, 1);
    const loss = update(START, { rating: 800, rd: 80 }, 0);
    expect(win.rating).toBeGreaterThan(START.rating);
    expect(loss.rating).toBeLessThan(START.rating);
    expect(win.rd).toBeLessThan(START.rd);
    const upset = update(START, { rating: 1600, rd: 80 }, 1);
    expect(upset.rating - START.rating).toBeGreaterThan(win.rating - START.rating);
  });
});

describe("drills", () => {
  it("knows knight distances", () => {
    expect(knightDistance("a1", "b3")).toBe(1);
    expect(knightDistance("a1", "b2")).toBe(4);
    expect(knightDistance("a1", "h8")).toBe(6);
    for (let s = 0; s < 50; s++) {
      const t = knightTask(s);
      expect(t.moves).toBeGreaterThanOrEqual(2);
      expect(t.moves).toBeLessThanOrEqual(4);
    }
  });

  it("builds legal check-finding positions with two to five checks and no mate", () => {
    for (let s = 0; s < 60; s++) {
      const { fen, checks } = checksTask(s);
      const g = load(fen);
      expect(g.inCheck()).toBe(false);
      expect(checks.length).toBeGreaterThanOrEqual(2);
      expect(checks.length).toBeLessThanOrEqual(5);
      expect(g.moves().filter((m) => m.endsWith("+")).sort()).toEqual([...checks].sort());
    }
  });

  it("offers four distinct square names including the right one", () => {
    for (let s = 0; s < 50; s++) {
      const o = squareOptions(s, "e4");
      expect(new Set(o).size).toBe(4);
      expect(o).toContain("e4");
    }
  });
});

describe("planner with puzzles", () => {
  const now = new Date("2026-11-20T10:00:00+05:30");
  const day = (d: number) => new Date(now.getTime() - d * 864e5);
  const nodes = [{ nodeId: "chess.board", startedAt: day(5), theoryDone: true, explanationOk: true, masteredAt: day(3) }];

  it("adds the day's puzzles when the room is open, without blocking a new idea", () => {
    const p = plan({ now, nodes, attempts: [], dueCards: [], puzzles: { open: true, doneToday: 2 }, seed: () => 1 });
    const block = p.blocks.find((b) => b.kind === "puzzles");
    expect(block?.activities.length).toBe(3);
    expect(p.blocks.some((b) => b.kind === "new")).toBe(true);
    expect(p.headline).toContain("3 puzzles");
  });

  it("leaves puzzles out when the room is closed or the day's quota is met", () => {
    expect(plan({ now, nodes, attempts: [], dueCards: [], puzzles: { open: false, doneToday: 0 } }).blocks.some((b) => b.kind === "puzzles")).toBe(false);
    expect(plan({ now, nodes, attempts: [], dueCards: [], puzzles: { open: true, doneToday: 5 } }).blocks.some((b) => b.kind === "puzzles")).toBe(false);
  });
});
