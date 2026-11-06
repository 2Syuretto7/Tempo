import { CURRICULUMS, COURSES } from '../content/curriculum';
import { JourneyGraph } from '../components/JourneyGraph';
import { Meter } from '../components/ui';
import { courseProgress } from '../engine/learning';
import { useProgress } from '../engine/progress';
import { href } from '../router';

export function JourneyPage() {
  useProgress();
  return (
    <div class="page">
      <p class="eyebrow">The journey</p>
      <h1>From zero to hero</h1>
      <p class="lead">
        Five curriculums, each built on the one before. Foundations and Tactics are climbed in order; Strategy and Endgames are studied side by side; Mastery draws on everything.
      </p>
      <div class="graph-card">
        <JourneyGraph />
      </div>
      {CURRICULUMS.map((c) => (
        <section key={c.id} class="curriculum">
          <div class="curriculum-head">
            <div>
              <p class="eyebrow">
                Curriculum {c.id} · {c.mode}
              </p>
              <h2>{c.title}</h2>
              <p class="muted">{c.goal}</p>
            </div>
            <p class="mode-note">{c.modeNote}</p>
          </div>
          <div class="course-grid">
            {COURSES.filter((co) => co.curriculumId === c.id).map((co) => {
              const pr = courseProgress(co.id);
              const open = pr.written > 0;
              return (
                <a key={co.id} class={`course-card${open ? '' : ' is-soon'}`} href={href.course(co.id)}>
                  <div class="course-card-top">
                    <span class="course-num">{co.id}</span>
                    <span class={`tag${open ? ' tag-accent' : ''}`}>{open ? 'Open' : 'In preparation'}</span>
                  </div>
                  <h3>{co.title}</h3>
                  <p class="small muted">{co.outcome}</p>
                  <div class="course-card-foot">
                    <Meter value={(pr.done / pr.total) * 100} size="sm" label={`${co.title} progress`} />
                    <span class="small muted">
                      {pr.done} / {pr.total} lessons
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
