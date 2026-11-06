import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Board, type Mark } from '../chess/Board';
import { PIECE_NAMES, applyMove, isAttacked, parseFen, pseudoMoves, toFen, type Square } from '../chess/position';
import type { Task } from '../content/types';
import { moveAccepted, squaresAnswer } from '../engine/learning';
import type { TaskResult } from '../engine/progress';
import { Kibitzer } from './Kibitzer';
import { Icon, Rich, Stage } from './ui';

export type TaskMode = 'puzzle' | 'guided' | 'independent' | 'bridge' | 'review';

interface Props {
  task: Task;
  mode: TaskMode;
  previous?: TaskResult;
  onSolved: (r: TaskResult) => void;
  /** Rendered under the explanation once solved, for example a Next button. */
  footer?: ComponentChildren;
  /** Rendered above the prompt. */
  header?: ComponentChildren;
  seed?: number;
}

interface Feedback {
  tone: 'good' | 'bad' | 'info';
  text: string;
}

function illegalReason(fen: string, from: Square, to: Square): string {
  const pos = parseFen(fen);
  const piece = pos.board.get(from);
  if (!piece) return 'There is no piece there.';
  const target = pos.board.get(to);
  if (target && target.color === piece.color) return 'You cannot capture your own piece.';
  const name = PIECE_NAMES[piece.type];
  if (!pseudoMoves(pos, from).includes(to)) {
    if (piece.type === 'p' && target && to[0] === from[0]) return 'A pawn cannot capture straight ahead.';
    return `A ${name} cannot move from ${from} to ${to}. Think about how the ${name} moves.`;
  }
  const after = applyMove(pos, from, to);
  if (piece.type === 'k' && isAttacked(after, to, piece.color === 'w' ? 'b' : 'w')) return `${to} is attacked, and a king may never move onto an attacked square.`;
  return 'That move would leave your king attacked, which the rules do not allow.';
}

export function TaskRunner({ task, mode, previous, onSolved, footer, header, seed = 0 }: Props) {
  const quiet = mode === 'independent';
  const [rungs, setRungs] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [solved, setSolved] = useState(!!previous?.solved);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [picked, setPicked] = useState<Square[]>([]);
  const [badSquares, setBadSquares] = useState<Square[]>([]);
  const [triedOptions, setTriedOptions] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [fen, setFen] = useState(task.fen ?? '8/8/8/8/8/8/8/8 w - - 0 1');
  const [lastMove, setLastMove] = useState<[Square, Square] | undefined>(undefined);

  useEffect(() => {
    setRungs(0);
    setWrong(0);
    setSolved(!!previous?.solved);
    setFeedback(null);
    setPicked([]);
    setBadSquares([]);
    setTriedOptions([]);
    setChosen(null);
    setFen(task.fen ?? '8/8/8/8/8/8/8/8 w - - 0 1');
    setLastMove(undefined);
  }, [task.id, task.prompt]);

  const succeed = () => {
    setSolved(true);
    setFeedback({ tone: 'good', text: wrong === 0 && rungs === 0 ? 'Correct, first time.' : 'Correct.' });
    onSolved({ solved: true, wrong, rungs });
  };

  const fail = (text: string) => {
    setWrong((w) => w + 1);
    setFeedback({ tone: 'bad', text });
  };

  const answerSet = useMemo(() => (task.kind === 'squares' ? squaresAnswer(task) : []), [task]);

  const onPick = (sq: Square) => {
    if (solved) return;
    if (task.kind === 'square') {
      if (sq === task.answer) {
        setPicked([sq]);
        succeed();
      } else {
        setBadSquares([sq]);
        fail(`That is ${sq}. Read the edge labels and try again.`);
      }
    } else if (task.kind === 'squares') {
      setBadSquares([]);
      setFeedback(null);
      setPicked((p) => (p.includes(sq) ? p.filter((x) => x !== sq) : [...p, sq]));
    }
  };

  const checkSquares = () => {
    const want = new Set(answerSet);
    const missing = answerSet.filter((s) => !picked.includes(s));
    const extra = picked.filter((s) => !want.has(s));
    if (!missing.length && !extra.length) {
      succeed();
      return;
    }
    setBadSquares(extra);
    const parts: string[] = [];
    const found = picked.length - extra.length;
    parts.push(`You have ${found} of ${answerSet.length} squares.`);
    if (extra.length) parts.push(`${extra.length === 1 ? 'The square marked in red does' : `The ${extra.length} squares marked in red do`} not belong.`);
    if (missing.length && !extra.length) parts.push(`${missing.length === 1 ? 'One square is' : `${missing.length} squares are`} still missing.`);
    fail(parts.join(' '));
  };

  const onMove = (from: Square, to: Square) => {
    if (task.kind !== 'move' || solved) return;
    const uci = from + to;
    const pos = parseFen(fen);
    if (moveAccepted(task, uci)) {
      setFen(toFen(applyMove(pos, from, to)));
      setLastMove([from, to]);
      succeed();
      return;
    }
    fail(task.refute?.[uci] ?? task.wrong ?? 'That move is legal, but it does not do what the task asks. Read the task again.');
  };

  const onIllegal = (from: Square, to: Square) => {
    if (solved) return;
    setFeedback({ tone: 'info', text: illegalReason(fen, from, to) });
  };

  const choose = (i: number) => {
    if (task.kind !== 'choice' || solved || triedOptions.includes(i)) return;
    setChosen(i);
    const opt = task.options[i];
    if (opt.correct) {
      succeed();
    } else {
      setTriedOptions((t) => [...t, i]);
      fail(opt.why ?? 'Not quite. Think again.');
    }
  };

  const marks: Record<Square, Mark> = {};
  for (const s of picked) marks[s] = solved ? 'good' : 'pick';
  for (const s of badSquares) marks[s] = 'bad';

  const boardMode = solved ? 'view' : task.kind === 'move' ? 'move' : task.kind === 'square' || task.kind === 'squares' ? 'pick' : 'view';
  const showBoard = !!task.fen || task.kind === 'square';

  const board = showBoard ? (
    <Board
      fen={fen}
      orientation={task.orientation}
      arrows={task.arrows}
      highlights={task.highlights}
      marks={marks}
      lastMove={lastMove}
      mode={boardMode}
      onPick={onPick}
      onMove={onMove}
      onIllegal={onIllegal}
      label={task.prompt}
    />
  ) : undefined;

  const turnNote =
    task.kind === 'move' && !solved ? (parseFen(task.fen).turn === 'w' ? 'You play White.' : 'You play Black.') : null;

  const kibitzer = (
    <Kibitzer hints={task.hints} rungs={rungs} onRung={() => setRungs((r) => Math.min(4, r + 1))} quiet={quiet} solved={solved} seed={seed} />
  );

  return (
    <Stage board={board} aside={kibitzer}>
      {header}
      <p class="task-prompt">
        <Rich text={task.prompt} />
      </p>
      {turnNote && <p class="task-note">{turnNote} Click a piece, then its destination, or drag it.</p>}
      {task.kind === 'squares' && !solved && <p class="task-note">Click squares to select or unselect them.</p>}

      {task.kind === 'choice' && (
        <div class="choices" role="group" aria-label="Options">
          {task.options.map((o, i) => {
            const state = solved && o.correct ? 'right' : triedOptions.includes(i) ? 'wrong' : chosen === i && solved ? 'right' : '';
            return (
              <button key={i} class={`choice ${state}`} onClick={() => choose(i)} disabled={solved || triedOptions.includes(i)}>
                <span class="choice-letter">{String.fromCharCode(65 + i)}</span>
                <span>{o.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {task.kind === 'squares' && !solved && (
        <div class="row gap">
          <button class="btn btn-primary" onClick={checkSquares} disabled={picked.length === 0}>
            Check
          </button>
          <button class="btn btn-quiet" onClick={() => { setPicked([]); setBadSquares([]); setFeedback(null); }} disabled={picked.length === 0}>
            Clear
          </button>
          <span class="muted small">{picked.length} selected</span>
        </div>
      )}

      {/* The Kibitzer sits beside the board; on tasks without a board it sits here. */}
      {!board && kibitzer}

      {feedback && (
        <div class={`feedback feedback-${feedback.tone}`} role="status">
          {feedback.tone === 'good' && <Icon name="check" />}
          <span>
            <Rich text={feedback.text} />
          </span>
        </div>
      )}

      {solved && (
        <div class="explain">
          <div class="explain-label">Why it works</div>
          <p>
            <Rich text={task.explain} />
          </p>
        </div>
      )}
      {(solved || mode === 'puzzle') && footer}
    </Stage>
  );
}
