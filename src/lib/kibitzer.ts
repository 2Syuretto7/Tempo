import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getNode } from "@/curriculum";
import type { Exercise } from "@/curriculum/types";
import { checkMoves, mateMoves, PIECE_NAMES, piecesOf } from "@/lib/chess";

const HINT_MODEL = process.env.KIBITZER_MODEL ?? "claude-sonnet-5-5";

function client() {
  return process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type KibitzerContext = { nodeId: string; exercise?: Exercise; theoryText?: string; hintLevel: number };

/** The board in words, so the tutor reasons from facts rather than guessing from a FEN. */
export function describeBoard(fen: string): string {
  const pieces = piecesOf(fen);
  const side = (white: boolean) =>
    Object.entries(pieces)
      .filter(([, p]) => (p === p.toUpperCase()) === white)
      .map(([sq, p]) => `${PIECE_NAMES[p.toLowerCase()]} ${sq}`)
      .join(", ") || "nothing";
  const turn = fen.split(" ")[1] === "b" ? "Black" : "White";
  return `White: ${side(true)}. Black: ${side(false)}. ${turn} to move.`;
}

/** Everything that would give the answer away. Used by the guard, never shown to the learner. */
export function secretsOf(ex: Exercise | undefined): { words: string[]; squares: string[]; promptSquares: string[] } {
  if (!ex) return { words: [], squares: [], promptSquares: [] };
  const promptSquares: string[] = ex.prompt.match(/\b[a-h][1-8]\b/g) ?? [];
  if (ex.kind === "move") {
    const sans = ex.goal.type === "san" ? ex.goal.moves : ex.goal.type === "mate" ? mateMoves(ex.fen) : checkMoves(ex.fen);
    const clean = sans.map((s) => s.replace(/[+#]/g, ""));
    const squares = clean.flatMap((s) => (s.startsWith("O-O") ? [] : (s.match(/[a-h][1-8]/g) ?? []).slice(-1)));
    // When a single move is asked for by name, it is already public.
    const words = clean.filter((s) => !ex.prompt.includes(s));
    return { words: [...words, ...clean.filter((s) => s.startsWith("O-O") && !ex.prompt.toLowerCase().includes("castle"))], squares: squares.filter((s) => !promptSquares.includes(s)), promptSquares };
  }
  if (ex.kind === "squares") return { words: [], squares: ex.targets.filter((t) => !promptSquares.includes(t)), promptSquares };
  return { words: ex.options[ex.answer].length > 3 ? [ex.options[ex.answer]] : [], squares: [], promptSquares };
}

/** True when the reply leaks the solution. */
export function leaks(reply: string, ex: Exercise | undefined): string | null {
  if (!ex) return null;
  const { words, squares } = secretsOf(ex);
  const text = reply.replace(/[*_`]/g, "");
  for (const w of words) {
    const re = new RegExp(`(^|[^A-Za-z0-9])${w.replace(/[.*+?^${}()|[\]\\=-]/g, "\\$&")}([^A-Za-z0-9]|$)`, "i");
    if (re.test(text)) return w;
  }
  const named = squares.filter((s) => new RegExp(`\\b${s}\\b`, "i").test(text));
  if (ex.kind === "squares" ? named.length >= Math.max(1, Math.ceil(squares.length / 3)) && named.length > 0 : named.length > 0) return named.join(", ");
  if (ex.kind === "choice" && /\b(the )?(correct |right )?answer is\b/i.test(text)) return "the answer";
  return null;
}

const LADDER = [
  "Rung 1: ask one question that points the learner at what matters (a threat, a piece, a rule), without saying where the answer is.",
  "Rung 2: say where to look: a region of the board, a line, or a piece, still without naming the answer.",
  "Rung 3: name the idea or rule from the lesson that solves it, and ask the learner to apply it.",
  "Rung 4: narrow it to a comparison between two or three candidates or a yes/no check the learner can do, still letting them make the final step.",
];

function systemPrompt(ctx: KibitzerContext): string {
  const node = getNode(ctx.nodeId);
  const ex = ctx.exercise;
  const secret = secretsOf(ex);
  const lines = [
    "You are Kibitzer, the tutor inside Tempo, a private learning platform. You teach the way Richard Feynman did: curious, warm, plain words, simple analogies before jargon, questions that make the learner think, and honesty when something is subtle.",
    "Your learner is an adult who is new to chess and learning slowly and deeply. Use Indian English spelling (colour, centre, recognise). Never use emojis. Keep each reply to one to three short sentences (under 60 words) unless the learner asks for more.",
    "ABSOLUTE RULE: you give hints, never solutions. Never name the solution move, its destination square, the correct option, or the set of correct squares, in any notation or wording. If the learner asks for the answer, say kindly that finding it themselves is what makes it stick, and give the next hint instead.",
    `Lesson: "${node.title}". The idea: ${node.summary}`,
    `Key points of this lesson: ${node.keyPoints.join("; ")}.`,
  ];
  if (ctx.theoryText) lines.push(`The learner is reading this part of the lesson: ${ctx.theoryText}`);
  if (ex) {
    lines.push(`Current exercise: ${ex.prompt}`);
    if (ex.fen) lines.push(`Board: ${describeBoard(ex.fen)}`);
    if (ex.kind === "choice") lines.push(`Options: ${ex.options.map((o, i) => `${i + 1}. ${o}`).join(" | ")}`);
    lines.push(
      `PRIVATE, for aiming your hints only, never to be revealed: ${
        ex.kind === "choice" ? `the correct option is "${ex.options[ex.answer]}".` : ex.kind === "squares" ? `the correct squares are ${ex.targets.join(", ")}.` : `solutions: ${secret.words.join(", ") || "as named in the exercise"}; destination squares to keep secret: ${secret.squares.join(", ") || "none"}.`
      } ${ex.explain ? `Reason: ${ex.explain}` : ""}`,
    );
    lines.push(LADDER[Math.min(LADDER.length - 1, Math.max(0, ctx.hintLevel - 1))]);
  }
  return lines.join("\n\n");
}

const FALLBACK: Record<string, string[]> = {
  move: [
    "What is the exercise really asking for? Read it once more, then look at every move your pieces can make.",
    "Look at the enemy king, or the piece you want to reach. Which of your pieces can travel towards it?",
    "Think back to the rule from this lesson. Which of your pieces does it apply to here?",
    "Try each of your candidate moves in your head, one at a time, and ask: does this do what the exercise asks?",
  ],
  squares: [
    "Start from the piece itself. Which directions is it allowed to travel?",
    "Follow one direction at a time until something stops you. What stops it: a friend or an enemy?",
    "Remember the rule from this lesson about blocking and capturing. Have you counted the squares an enemy piece stands on?",
    "Go round each direction once more, slowly, and count. Is every square you selected really reachable?",
  ],
  choice: [
    "What does the question hinge on? Name the rule it is testing.",
    "Picture the position, and test each option against that rule.",
    "Which option can you rule out for certain? Start there.",
    "Between the options left, what single fact would decide it?",
  ],
};

export async function hint(ctx: KibitzerContext, history: ChatTurn[]): Promise<{ reply: string; offline?: boolean }> {
  const kind = ctx.exercise?.kind ?? "choice";
  const offline = () => ({ reply: FALLBACK[kind][Math.min(3, Math.max(0, ctx.hintLevel - 1))], offline: true });
  const anthropic = client();
  if (!anthropic) return offline();
  const system = systemPrompt(ctx);
  const messages: ChatTurn[] = [];
  for (const m of history.slice(-12)) {
    const content = m.content.slice(0, 2000);
    if (!messages.length && m.role === "assistant") continue;
    if (messages.at(-1)?.role === m.role) messages.at(-1)!.content += `\n\n${content}`;
    else messages.push({ role: m.role, content });
  }
  if (!messages.length || messages.at(-1)!.role !== "user") messages.push({ role: "user", content: "Can I have a hint?" });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await anthropic.messages.create({
        model: HINT_MODEL,
        max_tokens: 300,
        system: attempt === 0 ? system : `${system}\n\nYour previous draft gave the answer away. Rewrite it as a question that leads the learner there without naming the move, square or option.`,
        messages,
      });
      const reply = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      if (reply && !leaks(reply, ctx.exercise)) return { reply };
    }
    return offline();
  } catch (err) {
    console.error("Kibitzer error", err);
    return offline();
  }
}

