import { CURRICULUMS, COURSES } from '../content/curriculum';
import { JourneyGraph } from '../components/JourneyGraph';
import { Icon, Meter } from '../components/ui';
import { courseProgress } from '../engine/learning';
import { useProgress } from '../engine/progress';
import { href } from '../router';

export function JourneyPage() {
  useProgress();
  return (
    <div class="page">
      <header class="page-head">
        <span class="eyebrow">The journey</span>
        <h1>From zero to hero</h1>
        <p class="page-lead">
          Five curriculums, each built on the one before. Foundations and Tactics are climbed in order; Strategy and Endgames are studied side by side; Mastery draws on everything.
        </p>
      </header>
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
            <p class="mode-note">
              <Icon name="layers" size={16} />
              <span>{c.modeNote}</span>
            </p>
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
                      {pr.done} of {pr.total} lessons
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
