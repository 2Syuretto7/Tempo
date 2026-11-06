import { COURSE_BY_ID, LESSON_META, curriculumOf } from '../content/curriculum';
import { LESSON_CONTENT } from '../content/lessons';
import { Icon, Meter } from '../components/ui';
import { courseProgress, lessonState } from '../engine/learning';
import { currentMastery, useProgress } from '../engine/progress';
import { href } from '../router';
import { NotFound } from './NotFound';

export function CoursePage({ id }: { id: string }) {
  useProgress();
  const course = COURSE_BY_ID.get(id);
  if (!course) return <NotFound />;
  const cur = curriculumOf(id);
  const pr = courseProgress(id);
  const minutes = course.lessonIds.reduce((n, l) => n + (LESSON_CONTENT[l]?.minutes ?? 0), 0);
  return (
    <div class="page">
      <a class="crumb" href={href.journey}>
        <Icon name="arrow-left" size={16} /> Curriculum {cur.id}: {cur.title}
      </a>
      <header class="page-head">
        <span class="eyebrow">
          Course {course.id} <span class="eyebrow-sep" aria-hidden="true" /> {cur.title}
        </span>
        <h1>{course.title}</h1>
        <p class="page-lead">
          <strong>By the end:</strong> {course.outcome}
        </p>
      </header>
      <div class="course-meta">
        <div class="course-progress">
          <div class="course-progress-head">
            <span class="eyebrow">Your progress</span>
            <span class="small">
              <strong>{pr.done}</strong> <span class="muted">of {pr.total} lessons complete</span>
            </span>
          </div>
          <Meter value={(pr.done / pr.total) * 100} label="Course progress" threshold={false} />
        </div>
        <div class="course-facts small muted">
          <span>
            <Icon name="layers" size={15} /> {pr.total} lessons
          </span>
          {minutes > 0 && (
            <span>
              <Icon name="clock" size={15} /> about {minutes >= 90 ? `${Math.round(minutes / 60)} hours` : `${minutes} minutes`} of lessons
            </span>
          )}
        </div>
        {course.requires.length > 0 && (
          <div class="small muted">
            Builds on course{course.requires.length > 1 ? 's' : ''}{' '}
            {course.requires.map((r, i) => (
              <span key={r}>
                {i > 0 && ' and '}
                <a href={href.course(r)}>
                  {r} {COURSE_BY_ID.get(r)?.title}
                </a>
              </span>
            ))}
          </div>
        )}
      </div>
      {pr.written === 0 && (
        <div class="callout">
          <Icon name="pen" />
          <div>
            <div class="callout-label">In preparation</div>
            <p>The lessons of this course are being written and checked. The list below shows exactly what is coming.</p>
          </div>
        </div>
      )}
      <ol class="lesson-path">
        {course.lessonIds.map((lid) => {
          const meta = LESSON_META.get(lid)!;
          const state = lessonState(lid);
          const content = LESSON_CONTENT[lid];
          const clickable = state === 'available' || state === 'done';
          const inner = (
            <>
              <span class={`node node-${state}`}>
                {state === 'done' ? <Icon name="check" size={16} /> : state === 'locked' ? <Icon name="lock" size={15} /> : <span>{meta.index + 1}</span>}
              </span>
              <span class="lesson-row-body">
                <span class="lesson-row-title">
                  <span class="mono">{lid}</span>
                  {meta.title}
                </span>
                {content && <span class="small muted">{content.summary}</span>}
                {meta.siblings.length > 0 && (
                  <span class="small sibling-note">
                    <Icon name="link" size={14} /> Linked sideways to {meta.siblings.map((s) => `${s} ${LESSON_META.get(s)?.title}`).join(', ')}
                  </span>
                )}
              </span>
              <span class="lesson-row-end">
                {state === 'done' && <span class="tag tag-good">{currentMastery(lid)}% mastery</span>}
                {state === 'available' && <span class="tag tag-accent">Open</span>}
                {state === 'locked' && <span class="tag">Locked</span>}
                {state === 'soon' && <span class="tag">In preparation</span>}
                {content && <span class="small muted">{content.minutes} min</span>}
              </span>
            </>
          );
          return (
            <li key={lid} class={`lesson-row is-${state}`}>
              {clickable ? (
                <a href={href.lesson(lid)} class="lesson-row-link">
                  {inner}
                </a>
              ) : (
                <div class="lesson-row-link">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
