// Progress is stored only in this browser (localStorage), with export and import.

import { useEffect, useState } from 'preact/hooks';

export interface TaskResult {
  solved: boolean;
  /** Wrong attempts before solving. */
  wrong: number;
  /** Highest hint rung used, 0 to 4. */
  rungs: number;
}

export interface LessonProgress {
  step: number;
  puzzleSeen: boolean;
  theoryIndex: number;
  explainPassed: boolean;
  explainText: string;
  guided: Record<string, TaskResult>;
  independent: Record<string, TaskResult>;
  bridgeDone: boolean;
  mastery: number;
  completed: boolean;
  completedAt?: string;
  lastReviewed?: string;
}

export interface ReviewCard {
  lessonId: string;
  taskId: string;
  box: number;
  due: string;
}

export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonProgress>;
  reviews: Record<string, ReviewCard>;
  history: string[];
}

const KEY = 'tempo.progress.v1';

export const REVIEW_INTERVALS = [1, 3, 7, 21, 60];
export const MASTERY_TO_UNLOCK = 80;
/** Mastery fades a little each week without review, never below 60. */
const FADE_PER_WEEK = 4;
const FADE_FLOOR = 60;

function empty(): ProgressState {
  return { version: 1, lessons: {}, reviews: {}, history: [] };
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1) return empty();
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); progress then lasts for this visit only.
  }
  listeners.forEach((l) => l());
}

export function getState(): ProgressState {
  return state;
}

export function useProgress(): ProgressState {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

export function blankLesson(): LessonProgress {
  return {
    step: 0,
    puzzleSeen: false,
    theoryIndex: 0,
    explainPassed: false,
    explainText: '',
    guided: {},
    independent: {},
    bridgeDone: false,
    mastery: 0,
    completed: false,
  };
}

export function lessonProgress(id: string): LessonProgress {
  return state.lessons[id] ?? blankLesson();
}

export function updateLesson(id: string, patch: Partial<LessonProgress>) {
  const current = lessonProgress(id);
  state = { ...state, lessons: { ...state.lessons, [id]: { ...current, ...patch } } };
  save();
}

export function today(offsetDays = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Score for one task: hints and wrong attempts lower it, but solving always counts for something. */
export function taskScore(r: TaskResult | undefined): number {
  if (!r || !r.solved) return 0;
  const hintCost = [0, 0.1, 0.25, 0.4, 0.6][Math.min(r.rungs, 4)];
  const wrongCost = Math.min(r.wrong * 0.2, 0.5);
  return Math.max(0.25, 1 - hintCost - wrongCost);
}

export function computeMastery(guidedIds: string[], independentIds: string[], p: LessonProgress): number {
  const avg = (ids: string[], rec: Record<string, TaskResult>) =>
    ids.length ? ids.reduce((s, id) => s + taskScore(rec[id]), 0) / ids.length : 1;
  return Math.round((0.4 * avg(guidedIds, p.guided) + 0.6 * avg(independentIds, p.independent)) * 100);
}

/** Mastery as shown today, after fading for time since the last completion or review. */
export function currentMastery(id: string): number {
  const p = state.lessons[id];
  if (!p || !p.completed) return p?.mastery ?? 0;
  const since = p.lastReviewed ?? p.completedAt;
  if (!since) return p.mastery;
  const weeks = Math.floor((Date.now() - Date.parse(since)) / (7 * 864e5));
  if (weeks <= 0) return p.mastery;
  return Math.max(Math.min(p.mastery, FADE_FLOOR), p.mastery - weeks * FADE_PER_WEEK);
}

export function seedReviews(lessonId: string, taskIds: string[]) {
  const reviews = { ...state.reviews };
  for (const taskId of taskIds) {
    const key = `${lessonId}/${taskId}`;
    if (!reviews[key]) reviews[key] = { lessonId, taskId, box: 0, due: today(REVIEW_INTERVALS[0]) };
  }
  state = { ...state, reviews };
  save();
}

export function dueReviews(): ReviewCard[] {
  const t = today();
  return Object.values(state.reviews)
    .filter((r) => r.due <= t)
    .sort((a, b) => a.due.localeCompare(b.due));
}

export function gradeReview(card: ReviewCard, result: TaskResult) {
  const key = `${card.lessonId}/${card.taskId}`;
  const clean = result.solved && result.wrong === 0 && result.rungs <= 2;
  const box = clean ? Math.min(card.box + 1, REVIEW_INTERVALS.length - 1) : 0;
  const due = today(REVIEW_INTERVALS[box]);
  const lesson = lessonProgress(card.lessonId);
  state = {
    ...state,
    reviews: { ...state.reviews, [key]: { ...card, box, due } },
    lessons: {
      ...state.lessons,
      [card.lessonId]: { ...lesson, lastReviewed: clean ? new Date().toISOString() : lesson.lastReviewed },
    },
  };
  save();
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as ProgressState;
    if (parsed.version !== 1 || typeof parsed.lessons !== 'object') return false;
    state = { ...empty(), ...parsed };
    save();
    return true;
  } catch {
    return false;
  }
}

export function resetProgress() {
  state = empty();
  save();
}

export function resetLesson(id: string) {
  const lessons = { ...state.lessons };
  delete lessons[id];
  state = { ...state, lessons };
  save();
}
