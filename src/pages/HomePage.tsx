import { Board } from '../chess/Board';
import { COURSES, COURSE_BY_ID, CURRICULUMS, LESSONS, LESSON_META } from '../content/curriculum';
import { LESSON_CONTENT } from '../content/lessons';
import { KibitzerMark } from '../components/Kibitzer';
import { Icon, Meter, Ring } from '../components/ui';
import { courseProgress, fadingLessons, nextLesson } from '../engine/learning';
import { REVIEW_INTERVALS, currentMastery, dueReviews, getState, useProgress } from '../engine/progress';
import { href } from '../router';

const HERO_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w - - 0 1';

const PHASES: { name: string; blurb: string; steps: [string, string][] }[] = [
  {
    name: 'Discover',
    blurb: 'A real question comes first, then the idea that answers it.',
    steps: [
      ['Puzzle', 'A position you cannot quite solve yet.'],
      ['Theory', 'Plain words on a live board you can move.'],
      ['Worked examples', 'Reasoning laid out one line at a time.'],
    ],
  },
  {
    name: 'Prove',
    blurb: 'You show yourself the idea is yours, with less help each time.',
    steps: [
      ['Explain it back', 'Put the idea in your own words.'],
      ['Guided practice', 'Easy to hard, with hints if you need them.'],
      ['On your own', 'Fresh positions, no hints, no clock.'],
    ],
  },
  {
    name: 'Connect',
    blurb: 'Each lesson is tied to what came before and what comes next.',
    steps: [
      ['Bridge', 'One position linking old and new.'],
      ['Wrap-up', 'Your mastery, and what returns for review.'],
    ],
  },
];

const RUNGS: [string, string][] = [
  ['Notice', 'Which black pawn is guarded only by its king?'],
  ['Focus', 'Look at the lines the bishop on c4 can see.'],
  ['Idea', 'Two attackers against one defender is a weakness.'],
  ['Narrow', 'Count how many white pieces aim at one square.'],
];

const TOTAL_LESSONS = LESSONS.length;

function Landing() {
  return (
    <div class="landing">
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-text">
            <a class="pill" href={href.course('1.1')}>
              <span class="pill-dot" /> Course 1.1 is open <Icon name="chevron-right" size={14} />
            </a>
            <h1 class="display">
              Understand every move <em>you make.</em>
            </h1>
            <p class="hero-lead">
              Tempo teaches chess the way good physics is taught: start with a real question, explain it in plain words, test it with your own hands, and teach it back. No rushing, no tricks, no answers handed over.
            </p>
            <div class="hero-actions">
              <a class="btn btn-primary btn-large" href={href.lesson('1.1.1')}>
                Begin the first lesson <Icon name="arrow-right" size={18} />
              </a>
              <a class="btn btn-ghost btn-large" href={href.method}>
                How Tempo teaches
              </a>
            </div>
            <ul class="hero-assurances">
              <li>
                <Icon name="check" size={16} /> Free, no account
              </li>
              <li>
                <Icon name="check" size={16} /> No adverts
              </li>
              <li>
                <Icon name="check" size={16} /> Progress stays on your device
              </li>
            </ul>
          </div>
          <figure class="hero-visual" aria-label="A preview of a Tempo lesson">
            <div class="frame">
              <div class="frame-bar">
                <span class="frame-crumb">
                  <span class="mono">1.1.4</span> The bishop
                </span>
                <span class="frame-steps" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} class={i < 2 ? 'is-done' : i === 2 ? 'is-current' : ''} />
                  ))}
                </span>
              </div>
              <div class="frame-board">
                <Board fen={HERO_FEN} arrows={[['c4', 'f7'], ['f3', 'g5']]} highlights={['f7']} label="Italian-style opening position with White eyeing the f7 square" />
              </div>
            </div>
            <div class="float-card float-kibitzer" aria-hidden="true">
              <KibitzerMark size={30} />
              <div>
                <span class="float-label">The Kibitzer · hint 1 of 4</span>
                <p>Why is f7 the weakest square in Black's camp?</p>
              </div>
            </div>
            <div class="float-card float-mastery" aria-hidden="true">
              <Ring value={84} size={40} />
              <div>
                <span class="float-label">Mastery</span>
                <strong>84%</strong>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section class="stats-band" aria-label="Tempo in numbers">
        <div class="container stats">
          <div>
            <strong>{CURRICULUMS.length}</strong>
            <span>curriculums</span>
          </div>
          <div>
            <strong>{COURSES.length}</strong>
            <span>courses</span>
          </div>
          <div>
            <strong>{TOTAL_LESSONS}</strong>
            <span>connected lessons</span>
          </div>
          <div>
            <strong>0</strong>
            <span>reveal buttons</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <header class="section-head">
            <span class="eyebrow">The method</span>
            <h2>Every lesson follows the same eight steps.</h2>
            <p class="section-lead">The shape never changes, so your attention goes to the chess. Each step hands a little more of the thinking over to you.</p>
          </header>
          <ol class="phases">
            {PHASES.map((ph, pi) => {
              const offset = PHASES.slice(0, pi).reduce((n, p) => n + p.steps.length, 0);
              return (
                <li key={ph.name} class={`phase phase-${pi + 1}`}>
                  <div class="phase-head">
                    <span class="phase-name">{ph.name}</span>
                    <p>{ph.blurb}</p>
                  </div>
                  <ol class="phase-steps">
                    {ph.steps.map(([t, d], si) => (
                      <li key={t}>
                        <span class="phase-num">{offset + si + 1}</span>
                        <div>
                          <strong>{t}</strong>
                          <span>{d}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container split">
          <div class="split-text">
            <span class="eyebrow">The Kibitzer</span>
            <h2>A tutor that asks, and never plays the move for you.</h2>
            <p>
              Stuck? The Kibitzer climbs a four-rung ladder, one nudge at a time: what to notice, where to focus, which idea fits, and finally a narrower pointer. It never names the answer, and there is no reveal button anywhere in Tempo.
            </p>
            <ul class="ticks">
              <li>
                <Icon name="check" size={16} /> Hints are questions, not solutions
              </li>
              <li>
                <Icon name="check" size={16} /> Silent when you practise on your own
              </li>
              <li>
                <Icon name="check" size={16} /> Tasks that needed the last hint return sooner in review
              </li>
            </ul>
          </div>
          <div class="ladder-demo" aria-label="Example of the four-rung hint ladder">
            <div class="ladder-head">
              <KibitzerMark size={36} />
              <div>
                <strong>The Kibitzer</strong>
                <span>Asks questions. Never gives the move.</span>
              </div>
            </div>
            <ol class="ladder">
              {RUNGS.map(([r, t], i) => (
                <li key={r} style={{ '--i': i } as any}>
                  <span class="ladder-rung">
                    <span class="mono">{i + 1}</span> {r}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container split split-reverse">
          <div class="split-text">
            <span class="eyebrow">Spaced review</span>
            <h2>Slow and steady, so nothing slips away.</h2>
            <p>
              Key tasks from every lesson come back after {REVIEW_INTERVALS.slice(0, -1).join(', ')} and {REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]} days, just as you are about to forget them. Struggle with one and it returns tomorrow. Reviews always come before new lessons.
            </p>
            <ul class="ticks">
              <li>
                <Icon name="check" size={16} /> A lesson opens at 80% mastery of the ones it builds on
              </li>
              <li>
                <Icon name="check" size={16} /> At most two new lessons a day are suggested
              </li>
            </ul>
          </div>
          <ReviewCurve />
        </div>
      </section>

      <section class="section">
        <div class="container">
          <header class="section-head">
            <span class="eyebrow">The journey</span>
            <h2>From your first move to master-level play.</h2>
            <p class="section-lead">Five curriculums, each built on the one before. Lessons link backwards, forwards and sideways, so ideas reinforce one another.</p>
          </header>
          <div class="curr-strip">
            {CURRICULUMS.map((c) => {
              const courses = COURSES.filter((co) => co.curriculumId === c.id);
              const lessons = courses.reduce((n, co) => n + co.lessons.length, 0);
              return (
                <a key={c.id} class="curr-tile" href={href.journey}>
                  <span class="curr-index mono">0{c.id}</span>
                  <strong>{c.title}</strong>
                  <span class="curr-tag">{c.tagline}</span>
                  <span class="curr-meta">
                    {courses.length} courses · {lessons} lessons
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section class="cta-band">
        <div class="container cta-inner">
          <div>
            <h2>Your first lesson takes about {LESSON_CONTENT['1.1.1']?.minutes ?? 20} minutes.</h2>
            <p>No account, no setup. Open it and start with a puzzle.</p>
          </div>
          <a class="btn btn-on-brand btn-large" href={href.lesson('1.1.1')}>
            Begin lesson 1.1.1 <Icon name="arrow-right" size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}

/** A forgetting curve that is topped up at each review: the spacing visualised. */
function ReviewCurve() {
  const days = REVIEW_INTERVALS;
  const max = 60;
  const W = 520;
  const H = 240;
  const pad = { l: 36, r: 16, t: 20, b: 36 };
  const x = (d: number) => pad.l + (Math.sqrt(d) / Math.sqrt(max)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v) * (H - pad.t - pad.b);
  // Each review restores memory to full; it then decays more slowly than before.
  let d0 = 0;
  let path = `M${x(0)} ${y(1)}`;
  const marks: number[] = [];
  days.forEach((gap) => {
    const strength = gap * 1.1;
    const end = Math.min(max, d0 + gap);
    for (let t = d0 + 0.25; t <= end + 0.001; t += 0.25) {
      const v = 0.35 + 0.65 * Math.exp(-(t - d0) / strength);
      path += ` L${x(t).toFixed(1)} ${y(v).toFixed(1)}`;
    }
    if (end < max) {
      path += ` L${x(end).toFixed(1)} ${y(1)}`;
      marks.push(end);
    }
    d0 = end;
  });
  return (
    <figure class="curve-card">
      <svg viewBox={`0 0 ${W} ${H}`} class="curve" role="img" aria-label={`Memory strength over 60 days, topped up by reviews after ${days.join(', ')} days`}>
        {[0, 0.5, 1].map((v) => (
          <line key={v} x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} class="curve-grid" />
        ))}
        <text x={pad.l - 8} y={y(1) + 4} text-anchor="end" class="curve-axis">
          100
        </text>
        <text x={pad.l - 8} y={y(0.5) + 4} text-anchor="end" class="curve-axis">
          50
        </text>
        <path d={`${path} L${x(max)} ${y(0)} L${x(0)} ${y(0)} Z`} class="curve-area" />
        <path d={path} class="curve-line" />
        {marks.map((m, i) => (
          <g key={m}>
            <line x1={x(m)} x2={x(m)} y1={y(1)} y2={y(0)} class="curve-tick" />
            <circle cx={x(m)} cy={y(1)} r="5" class="curve-dot" />
            <text x={x(m)} y={H - 12} text-anchor="middle" class="curve-axis">
              day {m}
            </text>
            <title>{`Review ${i + 1}`}</title>
          </g>
        ))}
      </svg>
      <figcaption>Each review tops your memory back up, and the gaps grow as the idea settles.</figcaption>
    </figure>
  );
}

function Dashboard() {
  const next = nextLesson();
  const due = dueReviews();
  const fading = fadingLessons();
  const nextMeta = next ? LESSON_META.get(next) : undefined;
  const nextContent = next ? LESSON_CONTENT[next] : undefined;
  const course = nextMeta ? COURSE_BY_ID.get(nextMeta.courseId) : undefined;
  const state = getState();
  const done = LESSONS.filter((l) => state.lessons[l.id]?.completed).length;
  const cp = courseProgress('1.1');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const puzzleFen = nextContent?.puzzle.task.fen;
  const recent = LESSONS.filter((l) => state.lessons[l.id]?.completed).slice(-4).reverse();

  return (
    <div class="page">
      <header class="page-head">
        <span class="eyebrow">{dateLabel}</span>
        <h1>{greeting}.</h1>
        <p class="page-lead">{due.length ? 'Review comes first today, then something new.' : next ? 'Your review queue is clear. Time for something new.' : 'You are fully up to date.'}</p>
      </header>

      <div class="dash">
        <section class={`dash-next${!due.length ? ' is-primary' : ''}`}>
          {next && nextMeta && nextContent ? (
            <>
              <div class="dash-next-text">
                <span class="eyebrow">{state.lessons[next] ? 'Continue' : 'Next lesson'}</span>
                <h2>
                  <span class="mono num">{next}</span> {nextMeta.title}
                </h2>
                <p class="muted">
                  {course?.title} · about {nextContent.minutes} minutes
                </p>
                <p>{nextContent.summary}</p>
                <a class={`btn ${due.length ? 'btn-secondary' : 'btn-primary'}`} href={href.lesson(next)}>
                  {state.lessons[next] ? 'Continue lesson' : 'Start lesson'} <Icon name="arrow-right" size={16} />
                </a>
              </div>
              {puzzleFen && (
                <a class="dash-next-board" href={href.lesson(next)} aria-label={`Open lesson ${next}`}>
                  <Board fen={puzzleFen} orientation={nextContent.puzzle.task.orientation} label="The opening puzzle of your next lesson" />
                </a>
              )}
            </>
          ) : (
            <div class="dash-next-text">
              <span class="eyebrow">All caught up</span>
              <h2>Every released lesson is complete.</h2>
              <p>New courses are on the way. Until then, review keeps your skills sharp.</p>
              <a class="btn btn-secondary" href={href.journey}>
                See the journey
              </a>
            </div>
          )}
        </section>

        <section class={`card dash-card${due.length ? ' is-primary' : ''}`}>
          <div class="dash-card-head">
            <span class="dash-icon">
              <Icon name="refresh" />
            </span>
            <span class="eyebrow">Review</span>
          </div>
          {due.length ? (
            <>
              <div class="big-number">{due.length}</div>
              <p class="muted">{due.length === 1 ? 'task is' : 'tasks are'} due today. Old ideas, kept fresh.</p>
              <a class="btn btn-primary btn-block" href={href.review}>
                Start review <Icon name="arrow-right" size={16} />
              </a>
            </>
          ) : (
            <>
              <div class="big-number">0</div>
              <p class="muted">Nothing is due today. Your queue is clear.</p>
              <a class="btn btn-secondary btn-block" href={href.method}>
                How review works
              </a>
            </>
          )}
        </section>

        <section class="card dash-card">
          <div class="dash-card-head">
            <span class="dash-icon">
              <Icon name="map" />
            </span>
            <span class="eyebrow">Your journey</span>
          </div>
          <div class="dash-ring">
            <Ring value={(cp.done / cp.total) * 100} size={72} label={`Course 1.1: ${cp.done} of ${cp.total}`} />
            <div>
              <div class="big-number">
                {done}
                <span class="of"> / {TOTAL_LESSONS}</span>
              </div>
              <p class="muted small">lessons complete</p>
            </div>
          </div>
          <p class="small muted">
            Course 1.1: {cp.done} of {cp.total}
          </p>
          <a class="btn btn-secondary btn-block" href={href.journey}>
            Open the map
          </a>
        </section>
      </div>

      {fading.length > 0 && (
        <div class="callout callout-warn">
          <Icon name="clock" />
          <div>
            <div class="callout-label">Fading</div>
            <p>
              Some lessons have not been reviewed for a while: {fading.map((f) => `${f} ${LESSON_META.get(f)?.title}`).join(', ')}. Their review tasks will bring them back.
            </p>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <section class="recent">
          <h2 class="h3">Recently completed</h2>
          <ul class="recent-list">
            {recent.map((l) => (
              <li key={l.id}>
                <a href={href.lesson(l.id)}>
                  <span class="mono num">{l.id}</span>
                  <span class="recent-title">{l.title}</span>
                  <span class="recent-meter">
                    <Meter value={currentMastery(l.id)} size="sm" label={`${l.title} mastery`} />
                  </span>
                  <span class="recent-pct">{currentMastery(l.id)}%</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function HomePage() {
  useProgress();
  const started = Object.keys(getState().lessons).length;
  return started === 0 ? <Landing /> : <Dashboard />;
}

