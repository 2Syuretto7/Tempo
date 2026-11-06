import { LESSONS, LESSON_META, COURSE_BY_ID } from '../content/curriculum';
import { LESSON_CONTENT } from '../content/lessons';
import type { ExplainBack, MoveTask, SquaresTask, Task } from '../content/types';
import { allLegalMoves, captureTargets, legalMoves, parseFen, type Square } from '../chess/position';
import { MASTERY_TO_UNLOCK, currentMastery, getState } from './progress';

export type LessonState = 'done' | 'available' | 'locked' | 'soon';

export function isDone(id: string): boolean {
  return passed(id);
}

/** A prerequisite is passed once completed at 80% mastery. Later fading prompts review but never re-locks. */
function passed(id: string): boolean {
  const p = getState().lessons[id];
  return !!p && p.completed && p.mastery >= MASTERY_TO_UNLOCK;
}

export function lessonState(id: string): LessonState {
  if (isDone(id)) return 'done';
  const meta = LESSON_META.get(id);
  if (!meta) return 'locked';
  if (!LESSON_CONTENT[id]) return 'soon';
  return meta.prereqs.every(passed) ? 'available' : 'locked';
}

/** The next lesson to study: the first available lesson in journey order. */
export function nextLesson(): string | undefined {
  return LESSONS.find((l) => lessonState(l.id) === 'available')?.id;
}

export function courseProgress(courseId: string): { done: number; total: number; written: number } {
  const course = COURSE_BY_ID.get(courseId)!;
  return {
    done: course.lessonIds.filter((id) => getState().lessons[id]?.completed).length,
    total: course.lessonIds.length,
    written: course.lessonIds.filter((id) => !!LESSON_CONTENT[id]).length,
  };
}

/** Lessons whose mastery has faded below the unlock line and would benefit from a revisit. */
export function fadingLessons(): string[] {
  return Object.keys(getState().lessons).filter(
    (id) => getState().lessons[id].completed && currentMastery(id) < MASTERY_TO_UNLOCK,
  );
}

export function squaresAnswer(task: SquaresTask): Square[] {
  const pos = parseFen(task.fen);
  if (Array.isArray(task.answer)) return [...task.answer].sort();
  if ('reach' in task.answer) return [...legalMoves(pos, task.answer.reach)].sort();
  return captureTargets(pos, task.answer.captures);
}

export function moveAccepted(task: MoveTask, uci: string): boolean {
  if (task.accept === 'anyLegal') {
    const pos = parseFen(task.fen);
    return allLegalMoves(pos, pos.turn).includes(uci);
  }
  return task.accept.includes(uci);
}

export interface ExplainVerdict {
  passed: boolean;
  found: string[];
  missing: { label: string; followUp: string }[];
}

function normalise(s: string): string {
  return ` ${s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'+#=\s-]/g, ' ').replace(/\s+/g, ' ')} `;
}

export function checkExplanation(eb: ExplainBack, text: string): ExplainVerdict {
  const t = normalise(text);
  const found: string[] = [];
  const missing: { label: string; followUp: string }[] = [];
  for (const idea of eb.ideas) {
    const hit = idea.anyOf.some((w) => {
      const n = normalise(w).trim();
      // whole-word match for short tokens, substring for phrases
      return n.length <= 3 ? t.includes(` ${n} `) : t.includes(n);
    });
    if (hit) found.push(idea.label);
    else missing.push({ label: idea.label, followUp: idea.followUp });
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const need = eb.minIdeas ?? eb.ideas.length;
  return { passed: words >= 6 && found.length >= need, found, missing };
}

export function allTasks(lessonId: string): Task[] {
  const l = LESSON_CONTENT[lessonId];
  if (!l) return [];
  return [l.puzzle.task, ...l.guided, ...l.independent, l.bridge.task];
}

export function findTask(lessonId: string, taskId: string): Task | undefined {
  return allTasks(lessonId).find((t) => t.id === taskId);
}

export { COURSE_BY_ID, LESSON_META };
