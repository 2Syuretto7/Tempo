import type { Color, Square } from '../chess/position';

/**
 * The Kibitzer's hint ladder. Four rungs, each a question or a pointer:
 * 1 notice, 2 focus, 3 idea, 4 narrow. A hint never names the answer.
 */
export type Hints = [notice: string, focus: string, idea: string, narrow: string];

export interface BoardSpec {
  fen: string;
  orientation?: 'white' | 'black';
  arrows?: [Square, Square][];
  highlights?: Square[];
  /** Show the legal destinations of the piece on this square. */
  showMoves?: Square;
  /** Let the learner move pieces freely to test the idea. */
  free?: boolean;
  caption?: string;
}

interface TaskBase {
  id: string;
  prompt: string;
  hints: Hints;
  /** Shown after a correct answer: why it works. */
  explain: string;
  fen?: string;
  orientation?: 'white' | 'black';
  arrows?: [Square, Square][];
  highlights?: Square[];
}

/** Click one square. */
export interface SquareTask extends TaskBase {
  kind: 'square';
  fen?: string;
  answer: Square;
}

/** Select a set of squares, then check. The answer may be computed from the position. */
export interface SquaresTask extends TaskBase {
  kind: 'squares';
  fen: string;
  answer: Square[] | { reach: Square } | { captures: Color };
}

/** Play one move on the board. */
export interface MoveTask extends TaskBase {
  kind: 'move';
  fen: string;
  /** Accepted moves as from+to, for example "e2e4"; or any legal move. */
  accept: string[] | 'anyLegal';
  /** Explanations for specific legal but wrong moves. */
  refute?: Record<string, string>;
  /** Explanation for any other legal but wrong move. */
  wrong?: string;
  /** Extra automatic check run by the test suite. */
  verify?: 'bestCapture';
}

export interface ChoiceOption {
  text: string;
  correct?: boolean;
  /** Why this option is wrong (or right). */
  why?: string;
}

/** Pick one option. */
export interface ChoiceTask extends TaskBase {
  kind: 'choice';
  options: ChoiceOption[];
}

export type Task = SquareTask | SquaresTask | MoveTask | ChoiceTask;

export interface TheoryBlock {
  heading: string;
  /** Paragraphs. **bold** and *italic* are supported. */
  body: string[];
  board?: BoardSpec;
}

export interface ExampleStep {
  text: string;
  fen?: string;
  arrows?: [Square, Square][];
  highlights?: Square[];
  lastMove?: [Square, Square];
}

export interface WorkedExample {
  title: string;
  fen: string;
  orientation?: 'white' | 'black';
  steps: ExampleStep[];
}

export interface KeyIdea {
  label: string;
  /** Any of these words or phrases counts as the idea being present (case-insensitive). */
  anyOf: string[];
  /** The Kibitzer's question when the idea is missing. */
  followUp: string;
}

export interface ExplainBack {
  prompt: string;
  ideas: KeyIdea[];
  /** How many ideas must be present to pass. Defaults to all. */
  minIdeas?: number;
  /** One way to say it, shown only after the learner passes. */
  model: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  /** Lesson ids this lesson reuses (backward links). */
  buildsOn: string[];
  /** Lesson ids this lesson prepares (forward links). */
  leadsTo: string[];
  puzzle: { intro: string; task: Task; resolution: string };
  theory: TheoryBlock[];
  examples: WorkedExample[];
  explainBack: ExplainBack;
  guided: Task[];
  independent: Task[];
  bridge: { text: string; task: Task };
  /** Task ids that enter the spaced-review queue. */
  reviewSeeds: string[];
}
