export type Square = string;
export type Arrow = [Square, Square];

export type Track = "rules" | "tactics" | "mates" | "endgames" | "strategy" | "openings" | "thinking";

export const TRACK_NAMES: Record<Track, string> = {
  rules: "Rules and board vision",
  tactics: "Tactics",
  mates: "Checkmates",
  endgames: "Endgames",
  strategy: "Strategy",
  openings: "Openings",
  thinking: "Thinking",
};

export const STAGE_NAMES = ["Foundations", "Beginner", "Improver", "Intermediate", "Advanced", "Hero"] as const;

export type MoveGoal =
  | { type: "mate" }
  | { type: "check" }
  | { type: "san"; moves: string[] };

type Visuals = {
  fen?: string;
  highlight?: Square[];
  arrows?: Arrow[];
  orientation?: "white" | "black";
  /** Hide the a-h / 1-8 labels (coordinate training). */
  hideCoords?: boolean;
};

export type Exercise = Visuals & {
  prompt: string;
  /** Shown after the answer: the reason, in one or two sentences. */
  explain?: string;
} & (
    | { kind: "squares"; fen: string; targets: Square[] }
    | { kind: "move"; fen: string; goal: MoveGoal }
    | { kind: "choice"; options: string[]; answer: number }
  );

export type Item = {
  /** Stable id, used for spaced review. A generator makes a fresh instance each time. */
  id: string;
  generate: (seed: number) => Exercise;
};

export type TheoryStep = Visuals & {
  text: string;
  /** Show the moves of the piece on this square as dots. */
  showMoves?: Square;
  /** A "predict before the reveal" interaction. */
  tryIt?: Exercise;
};

export type LearningNode = {
  id: string;
  course: string;
  title: string;
  stage: number;
  track: Track;
  prereqs: string[];
  related: string[];
  /** One sentence: the idea itself. */
  summary: string;
  /** The essentials of the idea; Kibitzer aims its hints at them. */
  keyPoints: string[];
  theory: TheoryStep[];
  items: Item[];
};
