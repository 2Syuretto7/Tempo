import { withUser } from "@/lib/api";
import { learnerColour } from "@/lib/puzzles/play";
import { getRating, nextPuzzle, puzzleAccess } from "@/lib/puzzles/store";
import { teachingThemes, THEME_NAMES } from "@/lib/puzzles/themes";

export async function GET(req: Request) {
  const theme = new URL(req.url).searchParams.get("theme") || undefined;
  return withUser(async (userId) => {
    const [access, rating, next] = await Promise.all([puzzleAccess(userId), getRating(userId), nextPuzzle(userId, theme)]);
    return {
      open: access.open,
      themes: access.themes,
      rating: Math.round(rating.rating),
      provisional: rating.rd > 110,
      puzzle: next && {
        id: next.puzzle.id,
        fen: next.puzzle.fen,
        moves: next.puzzle.moves,
        rating: next.puzzle.rating,
        colour: learnerColour(next.puzzle),
        // Themes are shown only after the puzzle, so they do not give the idea away.
        themes: teachingThemes(next.puzzle.tags)!.map((t) => THEME_NAMES[t] ?? t),
        returning: next.returning,
      },
    };
  });
}
