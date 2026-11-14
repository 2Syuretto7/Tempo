import { FILES, fenFrom, isDark } from "@/lib/chess";
import { choice, randomSquare, rng } from "../gen";
import type { LearningNode } from "../types";

const EMPTY = "8/8/8/8/8/8/8/8 w - - 0 1";

export const board: LearningNode = {
  id: "chess.board",
  course: "chess",
  title: "The board",
  stage: 0,
  track: "rules",
  prereqs: [],
  related: [],
  summary: "The board has 64 squares in 8 files (a to h) and 8 ranks (1 to 8); every square is named by its file then its rank, and the light corner is on each player's right.",
  keyPoints: [
    "64 squares in 8 files and 8 ranks",
    "files are lettered a to h from White's left",
    "ranks are numbered 1 to 8 from White's side",
    "a square's name is its file letter then its rank number",
    "the bottom-right corner (h1) is a light square: light on the right",
  ],
  theory: [
    {
      text: "A chessboard is a grid of **64 squares**, 8 across and 8 up. Every square has a name. Once you can name squares instantly, every later lesson becomes easier, so we start here, slowly.",
      fen: EMPTY,
    },
    {
      text: "The columns are called **files**. They are lettered **a to h**, from White's left to White's right. Here is the e-file.",
      fen: EMPTY,
      highlight: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"],
    },
    {
      text: "The rows are called **ranks**. They are numbered **1 to 8**, starting from White's side. Here is the 4th rank.",
      fen: EMPTY,
      highlight: FILES.map((f) => `${f}4`),
    },
    {
      text: "A square's name is its **file, then its rank**. Where the e-file crosses the 4th rank is **e4**. Like a map reference: across first, then up.",
      fen: EMPTY,
      highlight: ["e4"],
    },
    {
      text: "Squares alternate light and dark. The corner on each player's right is always **light**: h1 for White, a8 for Black. Remember 'light on the right'; it is how you check a board is set up correctly.",
      fen: EMPTY,
      highlight: ["h1", "a8"],
    },
    {
      text: "Lines of same-coloured squares running corner-ways are **diagonals**, such as a1 to h8. They matter as soon as we meet the bishop. Now try one.",
      fen: EMPTY,
      highlight: ["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8"],
      tryIt: {
        kind: "squares",
        fen: EMPTY,
        prompt: "Select the square d5.",
        targets: ["d5"],
        explain: "d5 is on the d-file (fourth from the left) and the 5th rank.",
      },
    },
  ],
  items: [
    {
      id: "chess.board.find",
      generate: (seed) => {
        const sq = randomSquare(rng(seed));
        return { kind: "squares", fen: EMPTY, prompt: `Select the square ${sq}.`, targets: [sq], explain: `${sq}: the ${sq[0]}-file, then rank ${sq[1]}.` };
      },
    },
    {
      id: "chess.board.find-blind",
      generate: (seed) => {
        const sq = randomSquare(rng(seed));
        return {
          kind: "squares",
          fen: EMPTY,
          hideCoords: true,
          prompt: `The labels are hidden. Select the square ${sq}.`,
          targets: [sq],
          explain: `Count files from the left (a is first) and ranks from the bottom.`,
        };
      },
    },
    {
      id: "chess.board.name",
      generate: (seed) => {
        const r = rng(seed);
        const sq = randomSquare(r);
        const f = sq.charCodeAt(0) - 97;
        const rank = Number(sq[1]);
        const mirrorFile = `${FILES[7 - f]}${rank}`;
        const mirrorRank = `${sq[0]}${9 - rank}`;
        const neighbour = `${FILES[(f + 1) % 8]}${rank}`;
        const wrong = [...new Set([mirrorFile, mirrorRank, neighbour, `${FILES[(f + 2) % 8]}${9 - rank}`])].filter((x) => x !== sq).slice(0, 3);
        return { kind: "choice", fen: EMPTY, hideCoords: true, highlight: [sq], prompt: "What is the name of the highlighted square?", ...choice(r, sq, wrong), explain: `It is ${sq}.` };
      },
    },
    {
      id: "chess.board.colour",
      generate: (seed) => {
        const r = rng(seed);
        const sq = randomSquare(r);
        const ans = isDark(sq) ? "Dark" : "Light";
        return {
          kind: "choice",
          prompt: `Without looking at a board: is ${sq} a light or a dark square?`,
          ...choice(r, ans, ["Light", "Dark"]),
          explain: `a1 is dark, and colours alternate. ${sq} is ${ans.toLowerCase()}.`,
        };
      },
    },
    {
      id: "chess.board.line",
      generate: (seed) => {
        const r = rng(seed);
        if (r.next() < 0.5) {
          const f = r.pick(FILES);
          return { kind: "squares", fen: EMPTY, prompt: `Select every square on the ${f}-file.`, targets: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${f}${n}`), explain: "A file runs from bottom to top." };
        }
        const n = 1 + r.int(8);
        return { kind: "squares", fen: EMPTY, prompt: `Select every square on the ${["1st", "2nd", "3rd"][n - 1] ?? `${n}th`} rank.`, targets: FILES.map((f) => `${f}${n}`), explain: "A rank runs from left to right." };
      },
    },
  ],
};

export { fenFrom };
