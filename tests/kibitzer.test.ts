import { describe, expect, it } from "vitest";
import { leaks, describeBoard } from "@/lib/kibitzer";
import type { Exercise } from "@/curriculum/types";

const mate: Exercise = { kind: "move", fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", prompt: "White to move. Checkmate in one.", goal: { type: "mate" } };
const reach: Exercise = { kind: "squares", fen: "8/8/8/8/3R4/8/8/8 w - - 0 1", prompt: "Select every square the rook on d4 can move to.", targets: ["d5", "d6", "d7", "d8", "e4", "f4"] };
const pick: Exercise = { kind: "choice", prompt: "Can the bishop on c1 ever reach h5?", options: ["Yes, in two moves", "No, h5 is a light square and c1 is dark"], answer: 1 };

describe("Kibitzer guard", () => {
  it("blocks the solution move and its square", () => {
    expect(leaks("Try Ra8!", mate)).toBeTruthy();
    expect(leaks("Your rook wants to reach a8.", mate)).toBeTruthy();
    expect(leaks("What squares can the black king run to? Look at its own pawns.", mate)).toBeNull();
  });
  it("blocks listing the answer squares but allows the piece's own square", () => {
    expect(leaks("They are d5, d6, d7 and d8, plus the rank.", reach)).toBeTruthy();
    expect(leaks("Start from the rook on d4. Which directions can it travel?", reach)).toBeNull();
  });
  it("blocks the correct option", () => {
    expect(leaks("The answer is no.", pick)).toBeTruthy();
    expect(leaks("No, h5 is a light square and c1 is dark", pick)).toBeTruthy();
    expect(leaks("What colour is c1? And h5?", pick)).toBeNull();
  });
  it("describes the board in words", () => {
    expect(describeBoard(mate.fen)).toBe("White: rook a1, king g1. Black: king g8, pawn f7, pawn g7, pawn h7. White to move.");
  });
});
