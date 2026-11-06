import { href } from '../router';

export function NotFound() {
  return (
    <div class="page narrow">
      <p class="eyebrow">Not found</p>
      <h1>This page does not exist</h1>
      <p class="lead">The link may be old, or mistyped.</p>
      <a class="btn btn-primary" href={href.home}>
        Go to the start
      </a>
    </div>
  );
}
