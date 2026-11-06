import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Board } from '../chess/Board';
import { LESSON_META, COURSE_BY_ID } from '../content/curriculum';
import { LESSON_CONTENT } from '../content/lessons';
import type { Lesson, Task, WorkedExample } from '../content/types';
import { TaskRunner } from '../components/TaskRunner';
import { KibitzerMark } from '../components/Kibitzer';
import { Icon, Meter, Paragraphs, Rich, Ring, Stage } from '../components/ui';
import { checkExplanation, lessonState, nextLesson, type ExplainVerdict } from '../engine/learning';
import {
  MASTERY_TO_UNLOCK,
  computeMastery,
  getState,
  lessonProgress,
  seedReviews,
  today,
  updateLesson,
  useProgress,
  type TaskResult,
} from '../engine/progress';
import { href } from '../router';
import { NotFound } from './NotFound';

const STEPS = ['Puzzle', 'Theory', 'Worked examples', 'Explain it back', 'Guided practice', 'On your own', 'Bridge', 'Wrap-up'];
const PHASE_OF = (n: number) => (n < 3 ? 'Discover' : n < 6 ? 'Prove' : 'Connect');

function LessonLink({ id }: { id: string }) {
  const meta = LESSON_META.get(id);
  if (!meta) return null;
  const state = lessonState(id);
  const label = `${id} ${meta.title}`;
  return state === 'soon' ? (
    <span class="lesson-chip is-soon" title="In preparation">
      {label}
    </span>
  ) : (
    <a class={`lesson-chip is-${state}`} href={href.lesson(id)}>
      {state === 'done' && <Icon name="check" size={14} />}
      {label}
    </a>
  );
}

export function LessonPage({ id }: { id: string }) {
  useProgress();
  const lesson = LESSON_CONTENT[id];
  const meta = LESSON_META.get(id);
  if (!meta) return <NotFound />;
  if (!lesson) return <InPreparation id={id} />;
  const state = lessonState(id);
  if (state === 'locked') return <Locked id={id} />;
  return <Player key={id} lesson={lesson} />;
}

function InPreparation({ id }: { id: string }) {
  const meta = LESSON_META.get(id)!;
  return (
    <div class="page narrow state-page">
      <span class="state-icon">
        <Icon name="pen" size={22} />
      </span>
      <span class="eyebrow">Lesson {id} · In preparation</span>
      <h1>{meta.title}</h1>
      <p class="lead">This lesson is being written. Lessons are released course by course so that each one is checked properly before it reaches you.</p>
      <p>
        <a class="btn btn-primary" href={href.course(meta.courseId)}>
          Back to the course
        </a>
      </p>
    </div>
  );
}

function Locked({ id }: { id: string }) {
  const meta = LESSON_META.get(id)!;
  return (
    <div class="page narrow state-page">
      <span class="state-icon">
        <Icon name="lock" size={22} />
      </span>
      <span class="eyebrow">Lesson {id} · Locked</span>
      <h1>{meta.title}</h1>
      <p class="lead">
        This lesson opens once you reach {MASTERY_TO_UNLOCK}% mastery in the lessons it builds on. Slow and steady: each idea rests on the one before.
      </p>
      <span class="eyebrow">Finish these first</span>
      <div class="chips">
        {meta.prereqs.map((p) => (
          <LessonLink key={p} id={p} />
        ))}
      </div>
    </div>
  );
}

function Player({ lesson }: { lesson: Lesson }) {
  const p = lessonProgress(lesson.id);
  const [step, setStep] = useState(Math.min(p.step, STEPS.length - 1));
  const [paceOk, setPaceOk] = useState(false);
  const furthest = p.step;
  const meta = LESSON_META.get(lesson.id)!;
  const course = COURSE_BY_ID.get(meta.courseId)!;

  // Record the first visit, for the gentle daily pace guide.
  const startedToday = getState().history.filter((h) => h.startsWith(today())).length;
  const isNew = !getState().lessons[lesson.id];

  const go = (s: number) => {
    setStep(s);
    if (s > lessonProgress(lesson.id).step) updateLesson(lesson.id, { step: s });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isNew && startedToday >= 2 && !paceOk) {
    return (
      <div class="page narrow state-page">
        <span class="state-icon">
          <Icon name="clock" size={22} />
        </span>
        <span class="eyebrow">A note on pace</span>
        <h1>You have started two new lessons today</h1>
        <p class="lead">
          Ideas settle best with sleep in between. Tempo suggests at most two new lessons a day, with review first. You can carry on if you are sure; it is your journey.
        </p>
        <div class="row gap">
          <a class="btn btn-primary" href={href.review}>
            Go to review
          </a>
          <button class="btn btn-quiet" onClick={() => setPaceOk(true)}>
            Continue anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="lesson">
      <div class="lesson-head">
        <a class="crumb" href={href.course(course.id)}>
          <Icon name="arrow-left" size={16} /> Course {course.id}: {course.title}
        </a>
        <div class="lesson-title">
          <span class="lesson-kicker">
            <span class="mono">Lesson {lesson.id}</span>
            <span aria-hidden="true">·</span>
            <span>
              <Icon name="clock" size={14} /> {lesson.minutes} min
            </span>
          </span>
          <h1>{lesson.title}</h1>
          <p class="lead">{lesson.summary}</p>
        </div>
        <nav class="steps" aria-label="Lesson steps" style={{ '--progress': `${(step / (STEPS.length - 1)) * 100}%` } as any}>
          <div class="steps-mobile" aria-hidden="true">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <strong>{STEPS[step]}</strong>
          </div>
          <ol class="steps-list">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  class={`step${i === step ? ' is-current' : ''}${i < furthest ? ' is-done' : ''}`}
                  disabled={i > furthest}
                  onClick={() => go(i)}
                  aria-current={i === step ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s}${i < furthest ? ', done' : ''}`}
                >
                  <span class="step-num">{i < furthest ? <Icon name="check" size={12} /> : i + 1}</span>
                  <span class="step-label">{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <OnFirstVisit lessonId={lesson.id} />
      <div class="step-body" key={step}>
      {step === 0 && <PuzzleStep lesson={lesson} onDone={() => go(1)} />}
      {step === 1 && <TheoryStep lesson={lesson} onDone={() => go(2)} />}
      {step === 2 && <ExamplesStep lesson={lesson} onDone={() => go(3)} />}
      {step === 3 && <ExplainStep lesson={lesson} onDone={() => go(4)} />}
      {step === 4 && <PracticeStep lesson={lesson} kind="guided" onDone={() => go(5)} />}
      {step === 5 && <PracticeStep lesson={lesson} kind="independent" onDone={() => go(6)} />}
      {step === 6 && <BridgeStep lesson={lesson} onDone={() => go(7)} />}
      {step === 7 && <WrapUp lesson={lesson} onRetry={() => go(5)} />}
      </div>
    </div>
  );
}

function OnFirstVisit({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    const s = getState();
    if (!s.lessons[lessonId]) {
      s.history.push(`${today()}:${lessonId}`);
      updateLesson(lessonId, {});
    }
  }, [lessonId]);
  return null;
}

function StepTitle({ n, title, children }: { n: number; title: string; children?: ComponentChildren }) {
  return (
    <div class="step-title">
      <span class="eyebrow">
        Step {n + 1} of {STEPS.length} <span class="eyebrow-sep" aria-hidden="true" /> {PHASE_OF(n)}
      </span>
      <h2>{title}</h2>
      {children && <div class="step-intro">{children}</div>}
    </div>
  );
}

function NextButton({ onClick, label = 'Continue' }: { onClick: () => void; label?: string }) {
  return (
    <div class="next-row">
      <button class="btn btn-primary" onClick={onClick}>
        {label} <Icon name="arrow-right" size={16} />
      </button>
    </div>
  );
}

function PuzzleStep({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const p = lessonProgress(lesson.id);
  const [touched, setTouched] = useState(p.puzzleSeen);
  return (
    <TaskRunner
      task={lesson.puzzle.task}
      mode="puzzle"
      onSolved={() => {
        setTouched(true);
        updateLesson(lesson.id, { puzzleSeen: true });
      }}
      header={
        <StepTitle n={0} title="Start with a puzzle">
          <Rich text={lesson.puzzle.intro} />
        </StepTitle>
      }
      footer={
        <div class="next-row">
          <button
            class={`btn ${touched ? 'btn-primary' : 'btn-quiet'}`}
            onClick={() => {
              updateLesson(lesson.id, { puzzleSeen: true });
              onDone();
            }}
          >
            {touched ? 'Continue to the theory' : 'I will come back to it'} <Icon name="arrow-right" size={16} />
          </button>
        </div>
      }
    />
  );
}

function TheoryStep({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const p = lessonProgress(lesson.id);
  const [i, setI] = useState(Math.min(p.theoryIndex, lesson.theory.length - 1));
  const block = lesson.theory[i];
  const last = i === lesson.theory.length - 1;
  const move = (n: number) => {
    setI(n);
    if (n > lessonProgress(lesson.id).theoryIndex) updateLesson(lesson.id, { theoryIndex: n });
  };
  const spec = block.board;
  const board = spec ? (
    <div class="board-figure">
      <Board key={`${i}`} fen={spec.fen} orientation={spec.orientation} arrows={spec.arrows} highlights={spec.highlights} focus={spec.showMoves} mode={spec.free ? 'free' : 'view'} />
      {spec.caption && <p class="caption">{spec.caption}</p>}
    </div>
  ) : undefined;
  return (
    <Stage board={board}>
      <StepTitle n={1} title="Theory" />
      <div class="theory-progress">
        {lesson.theory.map((_, k) => (
          <button key={k} class={`pip${k === i ? ' is-current' : ''}${k < i ? ' is-done' : ''}`} onClick={() => move(k)} aria-label={`Part ${k + 1}`} />
        ))}
        <span class="muted small">
          Part {i + 1} of {lesson.theory.length}
        </span>
      </div>
      <h3>{block.heading}</h3>
      <Paragraphs items={block.body} />
      {last && (
        <div class="callout">
          <div class="callout-label">Back to the puzzle</div>
          <p>
            <Rich text={lesson.puzzle.resolution} />
          </p>
        </div>
      )}
      <div class="next-row">
        {i > 0 && (
          <button class="btn btn-quiet" onClick={() => move(i - 1)}>
            <Icon name="arrow-left" size={16} /> Back
          </button>
        )}
        {last ? (
          <button class="btn btn-primary" onClick={onDone}>
            On to worked examples <Icon name="arrow-right" size={16} />
          </button>
        ) : (
          <button class="btn btn-primary" onClick={() => move(i + 1)}>
            Next part <Icon name="arrow-right" size={16} />
          </button>
        )}
      </div>
    </Stage>
  );
}

function exampleFrame(ex: WorkedExample, s: number) {
  let fen = ex.fen;
  for (let k = 0; k <= s; k++) if (ex.steps[k].fen) fen = ex.steps[k].fen!;
  return { fen, step: ex.steps[s] };
}

function ExamplesStep({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const [e, setE] = useState(0);
  const [s, setS] = useState(0);
  const ex = lesson.examples[e];
  const { fen, step } = exampleFrame(ex, s);
  const lastStep = s === ex.steps.length - 1;
  const lastEx = e === lesson.examples.length - 1;
  const board = <Board fen={fen} orientation={ex.orientation} arrows={step.arrows} highlights={step.highlights} lastMove={step.lastMove} mode="view" />;
  return (
    <Stage board={board}>
      <StepTitle n={2} title="Worked examples">
        Step through each example slowly. Before pressing Next, predict what the next line will say.
      </StepTitle>
      <p class="eyebrow">
        Example {e + 1} of {lesson.examples.length}
      </p>
      <h3>{ex.title}</h3>
      <ol class="walkthrough">
        {ex.steps.slice(0, s + 1).map((st, k) => (
          <li key={k} class={k === s ? 'is-current' : ''}>
            <Rich text={st.text} />
          </li>
        ))}
      </ol>
      <div class="next-row">
        {s > 0 && (
          <button class="btn btn-quiet" onClick={() => setS(s - 1)}>
            <Icon name="arrow-left" size={16} /> Back
          </button>
        )}
        {!lastStep && (
          <button class="btn btn-primary" onClick={() => setS(s + 1)}>
            Next line <Icon name="arrow-right" size={16} />
          </button>
        )}
        {lastStep && !lastEx && (
          <button
            class="btn btn-primary"
            onClick={() => {
              setE(e + 1);
              setS(0);
            }}
          >
            Next example <Icon name="arrow-right" size={16} />
          </button>
        )}
        {lastStep && lastEx && (
          <button class="btn btn-primary" onClick={onDone}>
            Explain it back <Icon name="arrow-right" size={16} />
          </button>
        )}
      </div>
    </Stage>
  );
}

function ExplainStep({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const p = lessonProgress(lesson.id);
  const [text, setText] = useState(p.explainText);
  const [verdict, setVerdict] = useState<ExplainVerdict | null>(p.explainPassed ? checkExplanation(lesson.explainBack, p.explainText) : null);
  const [tries, setTries] = useState(0);
  const passed = p.explainPassed || verdict?.passed;
  const eb = lesson.explainBack;
  const check = () => {
    const v = checkExplanation(eb, text);
    setVerdict(v);
    setTries((t) => t + 1);
    updateLesson(lesson.id, { explainText: text, explainPassed: v.passed || p.explainPassed });
  };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <Stage>
      <StepTitle n={3} title="Explain it back">
        If you can explain an idea simply, in your own words, you understand it. If you cannot yet, that is useful too: it shows exactly where to look again.
      </StepTitle>
      <div class="explain-grid">
        <div>
          <label class="field-label" for="explain">
            <Rich text={eb.prompt} />
          </label>
          <textarea id="explain" class="textarea" rows={6} value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} placeholder="Write two or three plain sentences..." />
          <div class="row gap">
            <button class="btn btn-primary" onClick={check} disabled={words < 3}>
              Check my explanation
            </button>
            <span class="muted small">{words} words</span>
          </div>
        </div>
        <aside class="kibitzer">
          <header class="kibitzer-head">
            <KibitzerMark />
            <div>
              <div class="kibitzer-name">The Kibitzer</div>
              <div class="kibitzer-role">Listens, then asks.</div>
            </div>
          </header>
          {!verdict && <p class="kibitzer-say">Write as if to a friend who has never played. Short words are fine. I will ask about anything that seems missing.</p>}
          {verdict && !verdict.passed && (
            <>
              {verdict.found.length > 0 && <p class="kibitzer-say">You have the idea: {verdict.found.join(', ').toLowerCase()}.</p>}
              {verdict.missing.length > 0 ? (
                <p class="kibitzer-say kibitzer-question">{verdict.missing[0].followUp}</p>
              ) : (
                <p class="kibitzer-say kibitzer-question">Say a little more. A full sentence or two, please.</p>
              )}
              {tries >= 3 && <p class="kibitzer-note">Stuck? Go back to the theory step and reread it, then try again in your own words.</p>}
            </>
          )}
          {verdict && verdict.passed && (
            <>
              <p class="kibitzer-say">That is a real explanation. You covered: {verdict.found.join(', ').toLowerCase()}.</p>
              <div class="explain">
                <div class="explain-label">One other way to say it</div>
                <p>{eb.model}</p>
              </div>
            </>
          )}
          {p.explainPassed && !verdict && <p class="kibitzer-say">You passed this step before.</p>}
        </aside>
      </div>
      {passed && <NextButton onClick={onDone} label="On to guided practice" />}
    </Stage>
  );
}

function PracticeStep({ lesson, kind, onDone }: { lesson: Lesson; kind: 'guided' | 'independent'; onDone: () => void }) {
  const tasks = kind === 'guided' ? lesson.guided : lesson.independent;
  const p = lessonProgress(lesson.id);
  const results = p[kind];
  const firstOpen = tasks.findIndex((t) => !results[t.id]?.solved);
  const [i, setI] = useState(firstOpen === -1 ? 0 : firstOpen);
  const task = tasks[i];
  const done = tasks.every((t) => results[t.id]?.solved);
  const save = (t: Task, r: TaskResult) => {
    const cur = lessonProgress(lesson.id)[kind];
    if (cur[t.id]?.solved) return;
    updateLesson(lesson.id, { [kind]: { ...cur, [t.id]: r } });
  };
  const last = i === tasks.length - 1;
  const title = kind === 'guided' ? 'Guided practice' : 'On your own';
  const intro =
    kind === 'guided'
      ? 'Tasks go from easy to harder. The Kibitzer is here if you need a nudge, but try first.'
      : 'No hints now. Take your time: there is no clock. This is how you prove the idea is yours.';
  return (
    <TaskRunner
      key={task.id}
      task={task}
      mode={kind}
      previous={results[task.id]}
      seed={i}
      onSolved={(r) => save(task, r)}
      header={
        <>
          <StepTitle n={kind === 'guided' ? 4 : 5} title={title}>
            {intro}
          </StepTitle>
          <div class="task-dots" aria-label="Tasks">
            {tasks.map((t, k) => (
              <button key={t.id} class={`pip${k === i ? ' is-current' : ''}${results[t.id]?.solved ? ' is-done' : ''}`} onClick={() => setI(k)} aria-label={`Task ${k + 1}`} />
            ))}
            <span class="muted small">
              Task {i + 1} of {tasks.length}
            </span>
          </div>
        </>
      }
      footer={
        last ? (
          done ? (
            <NextButton onClick={onDone} label={kind === 'guided' ? 'Practise on your own' : 'On to the bridge'} />
          ) : (
            <p class="muted">Some tasks are still open: use the dots above to return to them.</p>
          )
        ) : (
          <NextButton onClick={() => setI(i + 1)} label="Next task" />
        )
      }
    />
  );
}

function BridgeStep({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const p = lessonProgress(lesson.id);
  return (
    <TaskRunner
      task={lesson.bridge.task}
      mode="bridge"
      previous={p.bridgeDone ? { solved: true, wrong: 0, rungs: 0 } : undefined}
      onSolved={() => updateLesson(lesson.id, { bridgeDone: true })}
      header={
        <StepTitle n={6} title="Bridge">
          <Rich text={lesson.bridge.text} />
        </StepTitle>
      }
      footer={<NextButton onClick={onDone} label="Finish the lesson" />}
    />
  );
}

function WrapUp({ lesson, onRetry }: { lesson: Lesson; onRetry: () => void }) {
  const p = lessonProgress(lesson.id);
  const mastery = useMemo(
    () =>
      computeMastery(
        lesson.guided.map((t) => t.id),
        lesson.independent.map((t) => t.id),
        p,
      ),
    [p],
  );
  const passed = mastery >= MASTERY_TO_UNLOCK;

  const assisted = lesson.guided.filter((t) => (p.guided[t.id]?.rungs ?? 0) >= 4).map((t) => t.id);

  useEffect(() => {
    const cur = lessonProgress(lesson.id);
    const best = Math.max(cur.mastery, mastery);
    if (!cur.completed || best !== cur.mastery) {
      updateLesson(lesson.id, { completed: true, mastery: best, completedAt: cur.completedAt ?? new Date().toISOString() });
    }
    // Lesson seeds, plus any task that needed the last hint, enter spaced review.
    seedReviews(lesson.id, [...lesson.reviewSeeds, ...assisted]);
  }, [mastery]);

  const next = nextLesson();

  return (
    <Stage>
      <StepTitle n={7} title={passed ? 'Lesson complete' : 'Nearly there'} />
      <div class="wrap-grid">
        <div class="card">
          <div class="eyebrow">Mastery</div>
          <div class="mastery">
            <Ring value={Math.max(mastery, p.mastery)} size={88} label={`Mastery ${Math.max(mastery, p.mastery)}%`} />
            <div>
              <div class="big-number">{Math.max(mastery, p.mastery)}%</div>
              <span class={`tag ${passed || p.mastery >= MASTERY_TO_UNLOCK ? 'tag-good' : 'tag-warn'}`}>{passed || p.mastery >= MASTERY_TO_UNLOCK ? 'Next lesson unlocked' : `${MASTERY_TO_UNLOCK}% needed`}</span>
            </div>
          </div>
          <Meter value={Math.max(mastery, p.mastery)} />
          <p class="small muted">
            Guided practice counts for 40% and practice on your own for 60%. Hints and wrong tries lower the score a little. {MASTERY_TO_UNLOCK}% opens the next lesson.
          </p>
          {!passed && p.mastery < MASTERY_TO_UNLOCK && (
            <>
              <p>
                You are close. Practise on your own once more; slow and steady is how this sticks.
              </p>
              <button
                class="btn btn-primary"
                onClick={() => {
                  updateLesson(lesson.id, { independent: {} });
                  onRetry();
                }}
              >
                <Icon name="refresh" size={16} /> Practise again
              </button>
            </>
          )}
        </div>
        <div class="card">
          <div class="eyebrow">Added to your review</div>
          <p>
            {lesson.reviewSeeds.length + assisted.length} tasks from this lesson will come back to you in 1, 3, 7, 21 and 60 days. Reviews always come before new lessons.
          </p>
          <a class="btn btn-quiet" href={href.review}>
            <Icon name="clock" size={16} /> Open review
          </a>
        </div>
      </div>
      <div class="links-grid">
        {lesson.buildsOn.length > 0 && (
          <div>
            <div class="eyebrow">This lesson built on</div>
            <div class="chips">
              {lesson.buildsOn.map((l) => (
                <LessonLink key={l} id={l} />
              ))}
            </div>
          </div>
        )}
        <div>
          <div class="eyebrow">It leads to</div>
          <div class="chips">
            {lesson.leadsTo.map((l) => (
              <LessonLink key={l} id={l} />
            ))}
          </div>
        </div>
      </div>
      {(passed || p.mastery >= MASTERY_TO_UNLOCK) && (
        <div class="next-row">
          {next ? (
            <a class="btn btn-primary" href={href.lesson(next)}>
              Next lesson: {next} {LESSON_META.get(next)?.title} <Icon name="arrow-right" size={16} />
            </a>
          ) : (
            <a class="btn btn-primary" href={href.journey}>
              Back to your journey <Icon name="arrow-right" size={16} />
            </a>
          )}
        </div>
      )}
      <aside class="kibitzer kibitzer-inline">
        <header class="kibitzer-head">
          <KibitzerMark />
          <div>
            <div class="kibitzer-name">The Kibitzer</div>
            <div class="kibitzer-role">One last question.</div>
          </div>
        </header>
        <p class="kibitzer-say kibitzer-question">Before you go: which idea from this lesson surprised you most, and why? Say it out loud, or write it in your notebook.</p>
      </aside>
    </Stage>
  );
}
