import { useState } from 'preact/hooks';
import { LESSON_META } from '../content/curriculum';
import { TaskRunner } from '../components/TaskRunner';
import { Icon } from '../components/ui';
import { findTask } from '../engine/learning';
import { REVIEW_INTERVALS, dueReviews, getState, gradeReview, useProgress, type ReviewCard } from '../engine/progress';
import { href } from '../router';

export function ReviewPage() {
  useProgress();
  // Take a snapshot of today's queue so cards do not vanish mid-session.
  const [queue] = useState<ReviewCard[]>(() => dueReviews().filter((c) => !!findTask(c.lessonId, c.taskId)));
  const [i, setI] = useState(0);
  const [graded, setGraded] = useState(false);
  const total = Object.keys(getState().reviews).length;

  if (!queue.length) {
    return (
      <div class="page narrow">
        <span class="eyebrow">Review</span>
        <h1>Nothing due today</h1>
        <p class="lead">
          {total
            ? `You have ${total} tasks in spaced review. Each comes back after ${REVIEW_INTERVALS.join(', ')} days, sooner if you struggle.`
            : 'Finish a lesson and its key tasks will join your review queue, returning after 1, 3, 7, 21 and 60 days.'}
        </p>
        <a class="btn btn-primary" href={href.home}>
          Back to today
        </a>
      </div>
    );
  }

  if (i >= queue.length) {
    return (
      <div class="page narrow">
        <span class="eyebrow">Review</span>
        <h1>Review complete</h1>
        <p class="lead">{queue.length} tasks reviewed. The ones you found easy will wait longer before coming back; the hard ones return tomorrow.</p>
        <a class="btn btn-primary" href={href.home}>
          Back to today <Icon name="arrow-right" size={16} />
        </a>
      </div>
    );
  }

  const card = queue[i];
  const task = findTask(card.lessonId, card.taskId)!;
  const meta = LESSON_META.get(card.lessonId);
  return (
    <div class="lesson">
      <div class="lesson-head">
        <span class="eyebrow">
          Review · {i + 1} of {queue.length}
        </span>
        <h1>From lesson {card.lessonId}: {meta?.title}</h1>
      </div>
      <TaskRunner
        key={`${card.lessonId}/${card.taskId}`}
        task={task}
        mode="review"
        seed={i}
        onSolved={(r) => {
          gradeReview(card, r);
          setGraded(true);
        }}
        footer={
          graded && (
            <div class="next-row">
              <button
                class="btn btn-primary"
                onClick={() => {
                  setGraded(false);
                  setI(i + 1);
                }}
              >
                {i + 1 < queue.length ? 'Next review' : 'Finish'} <Icon name="arrow-right" size={16} />
              </button>
            </div>
          )
        }
      />
    </div>
  );
}
