import type { ComponentChildren } from 'preact';
import type { Hints } from '../content/types';

const RUNG_NAMES = ['Notice', 'Focus', 'Idea', 'Narrow'];

/** Socratic questions the Kibitzer offers before any hint is asked for. */
const OPENERS = [
  'Before you ask me, say out loud what you can see on the board.',
  'What is the question really asking? Put it in your own words first.',
  'Which idea from this lesson fits here?',
  'Try the simplest thing you can think of, then check it.',
];

export function KibitzerMark({ size = 34 }: { size?: number }) {
  // An onlooker's eye: the Kibitzer watches and asks, never plays.
  return (
    <svg viewBox="0 0 34 34" width={size} height={size} aria-hidden="true" class="kibitzer-mark">
      <circle cx="17" cy="17" r="16" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" />
      <path d="M7.5 17 C10.5 11.5 23.5 11.5 26.5 17 C23.5 22.5 10.5 22.5 7.5 17 Z" fill="none" stroke="var(--accent)" stroke-width="1.6" />
      <circle cx="17" cy="17" r="3.3" fill="var(--accent)" />
    </svg>
  );
}

interface Props {
  hints: Hints;
  rungs: number;
  onRung: () => void;
  quiet?: boolean;
  solved?: boolean;
  seed?: number;
  children?: ComponentChildren;
}

export function Kibitzer({ hints, rungs, onRung, quiet, solved, seed = 0, children }: Props) {
  const hasHints = !quiet && hints.some((h) => h.trim());
  return (
    <aside class="kibitzer" aria-label="The Kibitzer, your hint-only tutor">
      <header class="kibitzer-head">
        <KibitzerMark />
        <div>
          <div class="kibitzer-name">The Kibitzer</div>
          <div class="kibitzer-role">Asks questions. Never gives the move.</div>
        </div>
      </header>
      {quiet ? (
        <p class="kibitzer-say">I am staying quiet for this one. This is where you prove to yourself that the idea is yours.</p>
      ) : solved ? (
        <p class="kibitzer-say">{rungs === 0 ? 'You found that on your own. That is how ideas stick.' : 'Good. Next time, see how far you get before asking me.'}</p>
      ) : rungs === 0 ? (
        <p class="kibitzer-say">{OPENERS[seed % OPENERS.length]}</p>
      ) : null}
      {children}
      {hasHints && rungs > 0 && (
        <ol class="hint-ladder">
          {hints.slice(0, rungs).map((h, i) => (
            <li key={i} class="hint">
              <span class="hint-rung">{RUNG_NAMES[i]}</span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      )}
      {hasHints && !solved && rungs < 4 && (
        <button class="btn btn-quiet btn-small kibitzer-btn" onClick={onRung}>
          Help me think <span class="muted">({rungs + 1} of 4)</span>
        </button>
      )}
      {hasHints && !solved && rungs >= 4 && <p class="kibitzer-note">That is my last hint. The answer is yours to find; there is no reveal button here.</p>}
      {hasHints && !solved && rungs === 3 && <p class="kibitzer-note">The last hint narrows things a lot, so this task will come back sooner in review.</p>}
    </aside>
  );
}
