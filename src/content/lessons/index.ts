import type { Lesson } from '../types';
import { lesson as l1 } from './1-1-1';
import { lesson as l2 } from './1-1-2';
import { lesson as l3 } from './1-1-3';
import { lesson as l4 } from './1-1-4';
import { lesson as l5 } from './1-1-5';
import { lesson as l6 } from './1-1-6';
import { lesson as l7 } from './1-1-7';
import { lesson as l8 } from './1-1-8';
import { lesson as l9 } from './1-1-9';
import { lesson as l10 } from './1-1-10';

/** Lessons that have been written so far, by id. Others show as "in preparation". */
export const LESSON_CONTENT: Record<string, Lesson> = Object.fromEntries(
  [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10].map((l) => [l.id, l]),
);
