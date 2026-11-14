# Tempo

A private, personal university. One Learn button, a knowledge graph underneath it, and Kibitzer, a Feynman-style tutor that gives hints, never answers. The first course is chess, from zero.

## How it works

- **Knowledge graph** (`src/curriculum`): every idea is a node with prerequisites, related ideas, theory steps, practice items and the key points of a good explanation. Chess Stage 0 has 17 nodes.
- **Planner** (`src/lib/learn/planner.ts`): due reviews first, then repair of anything forgotten, then consolidation, then at most one new idea per day, taught as recall, theory, guided practice, independent mixed practice.
- **Mastery**: 7 of the last 8 hint-free attempts correct, across two separate days, plus an explanation Kibitzer accepts. Mastered items join an FSRS spaced-review schedule.
- **Kibitzer** (`src/lib/kibitzer.ts`): a hint ladder grounded in the actual position; a server-side guard rejects any reply that names the solution.
- **Sign-in**: one owner, a passphrase (Argon2id), a one-time recovery code, 90-day sessions.

## Develop

```bash
npm install
npm run dev     # uses an embedded Postgres in ./.data, no setup needed
npm run check   # types, lint, and tests (every lesson position and answer is verified)
```

## Deploy

Vercel, with a Neon Postgres database from the Vercel Storage tab and `ANTHROPIC_API_KEY` set. See `.env.example`.

## Puzzles

`data/puzzles.csv` holds about 32,500 puzzles chosen from the [Lichess open puzzle database](https://database.lichess.org/#puzzles) (CC0). To refresh it, run the "Refresh puzzle set" workflow in GitHub Actions; it downloads the database, runs `scripts/select_puzzles.py` and commits the result. A puzzle appears only when every theme it carries belongs to a mastered node (`src/lib/puzzles/themes.ts`).

## Devices

Tempo must work beautifully on laptop, tablet and phone. Every screen is checked at 1440×900 and 1280×720 (laptop), iPad portrait and landscape, and 390 and 360 px wide phones, with Kibitzer open and closed. Board screens use `Stage` (`src/components/learn/Stage.tsx`, `.stage` in `globals.css`): the prompt sits above the board and the actions below it on narrow screens, and beside it on wide ones, sized to the space left when Kibitzer is docked (a bottom sheet on tablets, a side panel on laptops).
