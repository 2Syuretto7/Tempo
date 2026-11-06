import { KibitzerMark } from '../components/Kibitzer';
import { href } from '../router';

const SPINE = [
  ['Puzzle', 'A position you cannot quite solve yet. The idea then arrives as the answer to a question you already care about.'],
  ['Theory', 'Short, plain explanations, each shown on a live board. Where the board is free, move the pieces and check every claim yourself.'],
  ['Worked examples', 'Reasoning laid out one line at a time. Predict each line before you reveal it.'],
  ['Explain it back', 'Write the idea in your own words. The Kibitzer listens for the key ideas and asks about anything missing.'],
  ['Guided practice', 'Tasks from easy to hard, with a four-rung hint ladder: notice, focus, idea, narrow.'],
  ['On your own', 'The same idea in fresh positions, with no hints, to prove it is yours.'],
  ['Bridge', 'One position that ties this lesson to an earlier one and points to where it leads next.'],
  ['Wrap-up', 'Your mastery score, and the tasks that join your spaced review.'],
];

export function MethodPage() {
  return (
    <div class="page narrow">
      <p class="eyebrow">How Tempo teaches</p>
      <h1>Learning that lasts</h1>
      <p class="lead">
        Tempo borrows four habits from the physicist Richard Feynman, famous for explaining hard ideas simply: start from a real question, explain in plain words, test the explanation by teaching it back, and treat confusion as a map of where to dig.
      </p>

      <h2>Every lesson has the same eight steps</h2>
      <ol class="spine">
        {SPINE.map(([t, d], i) => (
          <li key={t}>
            <span class="spine-num">{i + 1}</span>
            <div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2>Slow and steady, by design</h2>
      <ul class="plain-list">
        <li>A lesson opens only when the lessons it builds on reach 80% mastery.</li>
        <li>Tempo suggests at most two new lessons a day, and reviews always come first.</li>
        <li>Key tasks return after 1, 3, 7, 21 and 60 days. Struggle with one and it comes back tomorrow.</li>
        <li>Mastery fades gently without review, so older ideas keep returning, mixed in with new ones.</li>
      </ul>

      <h2>Lessons form a network, not a list</h2>
      <p>
        Every lesson links <strong>backwards</strong> to the ideas it reuses and <strong>forwards</strong> to the lessons it prepares. Some lessons are linked <strong>sideways</strong>: for example, passed pawns in Strategy and the outside passed pawn in Endgames teach one idea from two angles, and are studied close together.
      </p>
      <p>
        <a href={href.journey}>See the whole journey</a>.
      </p>

      <div class="callout callout-kibitzer">
        <KibitzerMark size={40} />
        <div>
          <h3>The Kibitzer</h3>
          <p>
            In chess, a kibitzer is an onlooker who comments on a game. Tempo's Kibitzer is a patient one: it asks questions and gives hints, one rung at a time, but it never plays the move for you. There is no "show solution" button anywhere on this site.
          </p>
        </div>
      </div>
    </div>
  );
}
