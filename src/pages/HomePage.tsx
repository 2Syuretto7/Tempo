import { Board } from '../chess/Board';
import { COURSE_BY_ID, LESSONS, LESSON_META } from '../content/curriculum';
import { LESSON_CONTENT } from '../content/lessons';
import { Icon, Meter } from '../components/ui';
import { courseProgress, fadingLessons, nextLesson } from '../engine/learning';
import { dueReviews, getState, useProgress } from '../engine/progress';
import { href } from '../router';

const HERO_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w - - 0 1';

export function HomePage() {
  useProgress();
  const next = nextLesson();
  const due = dueReviews();
  const started = Object.keys(getState().lessons).length;
  const fading = fadingLessons();
  const nextMeta = next ? LESSON_META.get(next) : undefined;
  const nextContent = next ? LESSON_CONTENT[next] : undefined;
  const course = nextMeta ? COURSE_BY_ID.get(nextMeta.courseId) : undefined;
  const done = LESSONS.filter((l) => getState().lessons[l.id]?.completed).length;

  if (started === 0) {
    return (
      <div class="page">
        <section class="hero">
          <div class="hero-text">
            <p class="eyebrow">Chess, from zero to hero</p>
            <h1 class="display">Understand every move you make.</h1>
            <p class="lead">
              Tempo teaches chess the way good physics is taught: start with a real question, explain it in plain words, test the idea with your own hands, and teach it back. No rushing, no tricks, no answers handed over.
            </p>
            <div class="row gap">
              <a class="btn btn-primary btn-large" href={href.lesson('1.1.1')}>
                Begin the first lesson <Icon name="arrow-right" size={18} />
              </a>
              <a class="btn btn-quiet btn-large" href={href.method}>
                How Tempo teaches
              </a>
            </div>
            <ul class="facts">
              <li>
                <strong>5</strong> curriculums
              </li>
              <li>
                <strong>20</strong> courses
              </li>
              <li>
                <strong>172</strong> connected lessons
              </li>
            </ul>
          </div>
          <div class="hero-board">
            <Board fen={HERO_FEN} arrows={[['c4', 'f7'], ['f3', 'g5']]} highlights={['f7']} />
            <p class="caption">Why is f7 the weakest square in Black's camp? You will be able to explain it.</p>
          </div>
        </section>
        <section class="pillars">
          <div class="pillar">
            <h3>Puzzle first</h3>
            <p>Every lesson opens with a position you cannot quite solve yet, so the idea arrives as an answer to a real question.</p>
          </div>
          <div class="pillar">
            <h3>Explain it back</h3>
            <p>You put each idea in your own words. If you can explain it simply, you understand it; if not, you know where to look.</p>
          </div>
          <div class="pillar">
            <h3>Hints, never answers</h3>
            <p>The Kibitzer, your tutor, only asks questions and gives nudges. There is no reveal button anywhere in Tempo.</p>
          </div>
          <div class="pillar">
            <h3>Slow and steady</h3>
            <p>Spaced review brings old ideas back, blended with new ones, so nothing you learn is left behind.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div class="page">
      <p class="eyebrow">Today</p>
      <h1>Welcome back</h1>
      <div class="today-grid">
        <div class={`card${due.length ? ' card-accent' : ''}`}>
          <div class="eyebrow">Review first</div>
          {due.length ? (
            <>
              <div class="big-number">{due.length}</div>
              <p>{due.length === 1 ? 'task is' : 'tasks are'} due for review. Old ideas, kept fresh.</p>
              <a class="btn btn-primary" href={href.review}>
                Start review <Icon name="arrow-right" size={16} />
              </a>
            </>
          ) : (
            <p>Nothing is due today. Your review queue is clear.</p>
          )}
        </div>
        <div class={`card${!due.length && next ? ' card-accent' : ''}`}>
          <div class="eyebrow">Next lesson</div>
          {next && nextMeta && nextContent ? (
            <>
              <h3>
                {next} {nextMeta.title}
              </h3>
              <p class="muted">
                {course?.title} · about {nextContent.minutes} minutes
              </p>
              <p>{nextContent.summary}</p>
              <a class={`btn ${due.length ? 'btn-quiet' : 'btn-primary'}`} href={href.lesson(next)}>
                {getState().lessons[next] ? 'Continue' : 'Start'} <Icon name="arrow-right" size={16} />
              </a>
            </>
          ) : (
            <>
              <p>You have finished every lesson released so far. New courses are on the way; until then, review keeps your skills sharp.</p>
              <a class="btn btn-quiet" href={href.journey}>
                See the journey
              </a>
            </>
          )}
        </div>
        <div class="card">
          <div class="eyebrow">Your journey</div>
          <div class="big-number">
            {done}
            <span class="muted"> / 172</span>
          </div>
          <p>lessons completed.</p>
          <Meter value={(courseProgress('1.1').done / 10) * 100} label="Course 1.1 progress" />
          <p class="small muted">Course 1.1: {courseProgress('1.1').done} of 10</p>
          <a class="btn btn-quiet" href={href.journey}>
            Open the map
          </a>
        </div>
      </div>
      {fading.length > 0 && (
        <div class="callout">
          <div class="callout-label">Fading</div>
          <p>
            Some lessons have not been reviewed for a while: {fading.map((f) => `${f} ${LESSON_META.get(f)?.title}`).join(', ')}. Their review tasks will bring them back.
          </p>
        </div>
      )}
    </div>
  );
}
