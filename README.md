# Tempo

Learn chess from zero to hero, one well-understood idea at a time.

Tempo is a static learning site published with GitHub Pages. It follows a Feynman-inspired method: every lesson starts with a real puzzle, explains the idea in plain words on a live board, asks you to explain it back, and then gives rigorous practice. A hint-only tutor, the Kibitzer, asks questions but never gives the move.

## The journey

5 curriculums, 20 courses, 172 lessons, linked as a graph (see `src/content/curriculum.ts`).

| Curriculum | Courses | Mode |
| --- | --- | --- |
| 1 Foundations | The board and the pieces · Rules that make chess · First checkmates · Playing a whole game | sequential |
| 2 Tactics | Tactical motifs · Calculation · Attacking the king · Defensive resources | sequential |
| 3 Strategy | Pawn structure · Pieces and squares · Making plans · Strategy in practice | parallel with 4 |
| 4 Endgames | King and pawn endings · Rook endings · Minor pieces and queens · Endgame technique | parallel with 3 |
| 5 Mastery | Building a repertoire · Middlegame mastery · Learning from the masters · Competitive play | mixed |

Released so far: **Course 1.1, The board and the pieces** (10 lessons).

## Every lesson

Puzzle → Theory → Worked examples → Explain it back → Guided practice (with hints) → On your own (no hints) → Bridge → Wrap-up with spaced review (1, 3, 7, 21, 60 days).

## Development

```sh
npm install
npm run dev      # local site
npm test         # checks every lesson, puzzle, answer and hint
npm run build    # type-check and build to dist/
```

Every push to `main` is tested and deployed to GitHub Pages by `.github/workflows/deploy.yml`.

### Writing a lesson

Lessons live in `src/content/lessons/` as typed data (`src/content/types.ts`). The test suite verifies that every move is legal, every computed answer is correct, best captures really are best, hints never contain a move, and the lesson graph has no loops. Rules are cross-checked against chess.js.

Progress is stored only in the learner's browser, with export and import in Settings.

All boards, pieces and diagrams are drawn in code for Tempo.
