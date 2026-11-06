import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { CURRICULUMS, COURSES, LESSONS, LESSON_META } from '../src/content/curriculum';
import { LESSON_CONTENT } from '../src/content/lessons';
import type { Task } from '../src/content/types';
import {
  PIECE_VALUES,
  allLegalMoves,
  findKing,
  isSquare,
  legalMoves,
  makeSquare,
  fileIndex,
  rankOf,
  parseFen,
  squareShade,
} from '../src/chess/position';
import { allTasks, checkExplanation, squaresAnswer } from '../src/engine/learning';

const lessons = Object.values(LESSON_CONTENT);

describe('curriculum graph', () => {
  it('has 5 curriculums, 20 courses and 172 lessons', () => {
    expect(CURRICULUMS).toHaveLength(5);
    expect(COURSES).toHaveLength(20);
    expect(LESSONS).toHaveLength(172);
  });

  it('only links to lessons that exist', () => {
    for (const l of LESSONS) {
      for (const id of [...l.prereqs, ...l.siblings]) expect(LESSON_META.has(id), `${l.id} -> ${id}`).toBe(true);
    }
  });

  it('has no prerequisite loops', () => {
    const state = new Map<string, 'visiting' | 'done'>();
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 'done') return;
      if (state.get(id) === 'visiting') throw new Error(`Loop: ${[...path, id].join(' > ')}`);
      state.set(id, 'visiting');
      for (const p of LESSON_META.get(id)!.prereqs) visit(p, [...path, id]);
      state.set(id, 'done');
    };
    for (const l of LESSONS) visit(l.id, []);
  });

  it('connects every lesson except the very first to something earlier', () => {
    for (const l of LESSONS.slice(1)) expect(l.prereqs.length, l.id).toBeGreaterThan(0);
  });
});

function legalUci(fen: string): string[] {
  const pos = parseFen(fen);
  return allLegalMoves(pos, pos.turn);
}

function hasSanMove(text: string): boolean {
  return /\b[KQRBN]x?[a-h][1-8]\b/.test(text) || /\b[a-h]x[a-h][1-8]\b/.test(text) || /\b[a-h][1-8]-?[a-h][1-8]\b/.test(text);
}

function checkTask(lessonId: string, t: Task, quiet: boolean) {
  const where = `${lessonId}/${t.id}`;
  if (t.fen) expect(() => parseFen(t.fen!), where).not.toThrow();
  if (quiet) {
    expect(t.hints.every((h) => h === ''), `${where} should have no hints`).toBe(true);
  } else {
    expect(t.hints.every((h) => h.trim().length > 0), `${where} needs four hints`).toBe(true);
    for (const h of t.hints) expect(hasSanMove(h), `${where} hint gives a move: "${h}"`).toBe(false);
  }
  expect(t.explain.length, where).toBeGreaterThan(5);
  switch (t.kind) {
    case 'choice':
      expect(t.options.filter((o) => o.correct), `${where} needs exactly one correct option`).toHaveLength(1);
      break;
    case 'square':
      expect(isSquare(t.answer), where).toBe(true);
      break;
    case 'squares': {
      const ans = squaresAnswer(t);
      expect(ans.length, `${where} has an empty answer`).toBeGreaterThan(0);
      ans.forEach((s) => expect(isSquare(s), where).toBe(true));
      if ('answer' in t && !Array.isArray(t.answer) && 'reach' in t.answer) {
        expect(parseFen(t.fen).board.has(t.answer.reach), `${where} reach square is empty`).toBe(true);
      }
      break;
    }
    case 'move': {
      const legal = legalUci(t.fen);
      if (t.accept !== 'anyLegal') {
        expect(t.accept.length, where).toBeGreaterThan(0);
        for (const m of t.accept) expect(legal, `${where} accepts illegal ${m}`).toContain(m);
      }
      for (const m of Object.keys(t.refute ?? {})) {
        expect(legal, `${where} refutes illegal ${m}`).toContain(m);
        if (t.accept !== 'anyLegal') expect(t.accept, `${where} refutes an accepted move`).not.toContain(m);
      }
      if (t.verify === 'bestCapture' && t.accept !== 'anyLegal') {
        const pos = parseFen(t.fen);
        const captures = legal.filter((m) => pos.board.get(m.slice(2, 4)));
        const best = Math.max(...captures.map((m) => PIECE_VALUES[pos.board.get(m.slice(2, 4))!.type]));
        const bestMoves = captures.filter((m) => PIECE_VALUES[pos.board.get(m.slice(2, 4))!.type] === best).sort();
        expect([...t.accept].sort(), `${where} best capture`).toEqual(bestMoves);
      }
      break;
    }
  }
}

describe.each(lessons.map((l) => [l.id, l] as const))('lesson %s', (id, lesson) => {
  it('matches the curriculum', () => {
    const meta = LESSON_META.get(id);
    expect(meta, id).toBeDefined();
    expect(lesson.title).toBe(meta!.title);
    for (const link of [...lesson.buildsOn, ...lesson.leadsTo]) expect(LESSON_META.has(link), `${id} links to ${link}`).toBe(true);
  });

  it('has the full Feynman spine', () => {
    expect(lesson.theory.length).toBeGreaterThanOrEqual(3);
    expect(lesson.examples.length).toBeGreaterThanOrEqual(2);
    expect(lesson.guided.length).toBeGreaterThanOrEqual(5);
    expect(lesson.independent.length).toBeGreaterThanOrEqual(4);
    expect(lesson.explainBack.ideas.length).toBeGreaterThanOrEqual(1);
  });

  it('has unique task ids and valid review seeds', () => {
    const ids = allTasks(id).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const seed of lesson.reviewSeeds) expect(ids, `${id} seed ${seed}`).toContain(seed);
  });

  it('has valid tasks with hint-only help', () => {
    checkTask(id, lesson.puzzle.task, false);
    lesson.guided.forEach((t) => checkTask(id, t, false));
    lesson.independent.forEach((t) => checkTask(id, t, true));
    checkTask(id, lesson.bridge.task, false);
  });

  it('has valid boards in theory and examples', () => {
    for (const b of lesson.theory) {
      if (!b.board) continue;
      const pos = parseFen(b.board.fen);
      if (b.board.showMoves) expect(pos.board.has(b.board.showMoves), `${id} ${b.heading}`).toBe(true);
    }
    for (const ex of lesson.examples) {
      parseFen(ex.fen);
      ex.steps.forEach((s) => s.fen && parseFen(s.fen));
    }
  });

  it('accepts its own model explanation', () => {
    expect(checkExplanation(lesson.explainBack, lesson.explainBack.model).passed).toBe(true);
  });
});

describe('chess rules', () => {
  it('agrees with chess.js on legal moves wherever both kings are present', () => {
    let compared = 0;
    for (const l of lessons) {
      for (const t of allTasks(l.id)) {
        if (!t.fen || t.kind === 'choice') continue;
        const pos = parseFen(t.fen);
        if (!findKing(pos, 'w') || !findKing(pos, 'b')) continue;
        let chess: Chess;
        try {
          chess = new Chess(t.fen);
        } catch {
          continue;
        }
        const theirs = [...new Set(chess.moves({ verbose: true }).map((m) => m.from + m.to))].sort();
        expect(legalUci(t.fen).sort(), `${l.id}/${t.id}`).toEqual(theirs);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(5);
  });

  it('shades squares correctly', () => {
    expect(squareShade('a1')).toBe('dark');
    expect(squareShade('h1')).toBe('light');
    expect(squareShade('e4')).toBe('light');
    expect(squareShade('d4')).toBe('dark');
  });

  it('gives the reach counts the lessons quote', () => {
    const count = (fen: string, sq: string) => legalMoves(parseFen(fen), sq).length;
    expect(count('8/8/8/8/3R4/8/8/8 w', 'd4')).toBe(14);
    expect(count('8/8/8/8/3B4/8/8/8 w', 'd4')).toBe(13);
    expect(count('8/8/8/8/3Q4/8/8/8 w', 'd4')).toBe(27);
    expect(count('8/8/8/8/3N4/8/8/8 w', 'd4')).toBe(8);
    expect(count('8/8/8/8/8/8/8/N7 w', 'a1')).toBe(2);
    expect(count('8/8/8/8/8/8/8/B7 w', 'a1')).toBe(7);
  });

  it('needs four knight moves from a1 to b2', () => {
    const jumps = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
    const dist = new Map([['a1', 0]]);
    const queue = ['a1'];
    while (queue.length) {
      const sq = queue.shift()!;
      for (const [df, dr] of jumps) {
        const n = makeSquare(fileIndex(sq) + df, rankOf(sq) + dr);
        if (n && !dist.has(n)) {
          dist.set(n, dist.get(sq)! + 1);
          queue.push(n);
        }
      }
    }
    expect(dist.get('b2')).toBe(4);
  });
});
