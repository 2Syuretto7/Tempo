import { href } from '../router';

export function NotFound() {
  return (
    <div class="page narrow">
      <span class="eyebrow">Not found</span>
      <h1>This page does not exist</h1>
      <p class="lead">The link may be old, or mistyped.</p>
      <a class="btn btn-primary" href={href.home}>
        Go to the start
      </a>
    </div>
  );
}
