// The whole journey: 5 curriculums, 20 courses, 172 lessons.
// Lesson ids look like "1.1.3" (curriculum.course.lesson).
// Links between lessons are generated here so the graph has one source of truth.

export type Mode = 'sequential' | 'parallel' | 'mixed';

export interface CourseDef {
  id: string;
  title: string;
  outcome: string;
  /** Course ids that must be finished before this course opens. */
  requires: string[];
  lessons: string[];
}

export interface CurriculumDef {
  id: string;
  title: string;
  tagline: string;
  goal: string;
  mode: Mode;
  modeNote: string;
  courses: CourseDef[];
}

export const CURRICULUMS: CurriculumDef[] = [
  {
    id: '1',
    title: 'Foundations',
    tagline: 'From zero to a full game',
    goal: 'Play a complete legal game, deliver the basic checkmates and stop leaving pieces undefended.',
    mode: 'sequential',
    modeNote: 'Learnt strictly in order: every idea here rests on the one before it.',
    courses: [
      {
        id: '1.1',
        title: 'The board and the pieces',
        outcome: 'Name every square, move every piece correctly and judge a capture by the value of what is won and lost.',
        requires: [],
        lessons: [
          'The board: files, ranks and diagonals',
          'Coordinates and notation',
          'The rook',
          'The bishop',
          'The queen',
          'The king',
          'The knight',
          'The pawn',
          'Capturing',
          'Piece value, a first look',
        ],
      },
      {
        id: '1.2',
        title: 'Rules that make chess',
        outcome: 'Know every rule of the game, including the special moves and every way a game can be drawn.',
        requires: ['1.1'],
        lessons: ['Check', 'Getting out of check', 'Checkmate', 'Stalemate', 'Castling', 'En passant', 'Promotion', 'Draws'],
      },
      {
        id: '1.3',
        title: 'First checkmates',
        outcome: 'Force checkmate with a big material advantage and spot mate in one or two.',
        requires: ['1.2'],
        lessons: [
          'The two-rook ladder mate',
          'King and queen against king',
          'King and rook against king',
          'The back-rank mate',
          'Queen mating patterns',
          'Smothered mate, the idea',
          'Recognising mate in one',
          'Mate in two',
        ],
      },
      {
        id: '1.4',
        title: 'Playing a whole game',
        outcome: 'Start a game sensibly, keep your pieces safe and review your own games honestly.',
        requires: ['1.3'],
        lessons: [
          'Fight for the centre',
          'Develop your pieces',
          'Keep the king safe',
          'The blunder check',
          'Counting attackers and defenders',
          'When to trade',
          'Your first full game',
          'Reviewing your own game',
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'Tactics',
    tagline: 'Seeing the short-range ideas',
    goal: 'Spot and play two- to four-move combinations, and defend against them.',
    mode: 'sequential',
    modeNote: 'Learnt in order, with older motifs mixed into every new practice set.',
    courses: [
      {
        id: '2.1',
        title: 'Tactical motifs',
        outcome: 'Recognise the twelve core tactical patterns on sight.',
        requires: ['1.4'],
        lessons: [
          'Forks',
          'Knight forks',
          'Pins',
          'Skewers',
          'Discovered attack',
          'Discovered check',
          'Double check',
          'Removing the defender',
          'Deflection',
          'Decoy',
          'Overloading',
          'Interference',
        ],
      },
      {
        id: '2.2',
        title: 'Calculation',
        outcome: 'Calculate forcing lines accurately and check your own moves before playing them.',
        requires: ['2.1'],
        lessons: [
          'Checks, captures and threats',
          'Candidate moves',
          'Forcing lines',
          'Visualisation drills',
          'Counting material outcomes',
          'A blunder-check routine',
          'The in-between move',
          'Calculating on the clock',
        ],
      },
      {
        id: '2.3',
        title: 'Attacking the king',
        outcome: 'Build and finish attacks on a castled or uncastled king.',
        requires: ['2.2'],
        lessons: [
          'Mating nets',
          'Classic mating patterns I',
          'Classic mating patterns II',
          'Opening lines to the king',
          'The bishop sacrifice on h7',
          'Opposite-side castling',
          'Pawn storms',
          'Defending an attack',
          'Counterattack',
        ],
      },
      {
        id: '2.4',
        title: 'Defensive resources',
        outcome: 'Find the saving resource in difficult positions.',
        requires: ['2.3'],
        lessons: [
          "Spotting the opponent's threat",
          'Desperado pieces',
          'Perpetual check',
          'Stalemate tricks',
          'The fortress idea',
          'Fighting on in bad positions',
        ],
      },
    ],
  },
  {
    id: '3',
    title: 'Strategy',
    tagline: 'Long-range thinking',
    goal: 'Evaluate a quiet position and choose a sound plan.',
    mode: 'parallel',
    modeNote: 'Studied side by side with Endgames, alternating one lesson from each.',
    courses: [
      {
        id: '3.1',
        title: 'Pawn structure',
        outcome: 'Read a pawn structure and know which plans it suggests.',
        requires: ['2.4'],
        lessons: [
          'Pawn islands',
          'The isolated pawn',
          'Doubled pawns',
          'Backward pawns',
          'Passed pawns',
          'Pawn chains',
          'Pawn majorities',
          'Hanging pawns',
          'Pawn breaks',
          'Structures that come from openings',
        ],
      },
      {
        id: '3.2',
        title: 'Pieces and squares',
        outcome: 'Place each piece where it does the most work.',
        requires: ['3.1'],
        lessons: [
          'Good and bad bishops',
          'Knight outposts',
          'Bishop against knight',
          'Rooks on open files',
          'The seventh rank',
          'Weak squares and holes',
          'Colour complexes',
          'Deciding exchanges',
          'Space',
        ],
      },
      {
        id: '3.3',
        title: 'Making plans',
        outcome: 'Turn an evaluation into a concrete plan.',
        requires: ['3.2'],
        lessons: [
          'Evaluating a position',
          'Imbalances',
          'From evaluation to plan',
          'The minority attack',
          'Prophylaxis',
          'Improve your worst piece',
          'The principle of two weaknesses',
          'Transition to the endgame',
        ],
      },
      {
        id: '3.4',
        title: 'Strategy in practice',
        outcome: 'Apply strategic ideas across whole games.',
        requires: ['3.3'],
        lessons: [
          'Model game: the weak square',
          'Model game: the bad bishop',
          'Model game: the minority attack',
          'Model game: prophylaxis',
          'Plan-against-plan training games',
          'Capstone: annotate a strategic game',
        ],
      },
    ],
  },
  {
    id: '4',
    title: 'Endgames',
    tagline: 'Converting and saving',
    goal: 'Win won endings and draw drawn ones, by technique rather than luck.',
    mode: 'parallel',
    modeNote: 'Studied side by side with Strategy, alternating one lesson from each.',
    courses: [
      {
        id: '4.1',
        title: 'King and pawn endings',
        outcome: 'Play king and pawn endings with exact technique.',
        requires: ['2.4'],
        lessons: [
          'The active king',
          'The square of the pawn',
          'Opposition',
          'Key squares',
          'Triangulation',
          'The outside passed pawn',
          'The protected passed pawn',
          'Pawn breakthroughs',
          'Corresponding squares, an introduction',
          'Pawn races',
        ],
      },
      {
        id: '4.2',
        title: 'Rook endings',
        outcome: 'Know the essential rook endings that decide most games.',
        requires: ['4.1'],
        lessons: [
          'The Lucena position',
          'The Philidor position',
          'Rook behind the passed pawn',
          'Cutting off the king',
          'The active rook',
          'Rook against pawn',
          'Defending from the side',
          'Rook and pawns against rook',
          'Practical rook endings',
        ],
      },
      {
        id: '4.3',
        title: 'Minor pieces and queens',
        outcome: 'Handle bishop, knight and queen endings with confidence.',
        requires: ['4.2'],
        lessons: [
          'Bishop against pawns',
          'Knight against pawns',
          'Same-coloured bishops',
          'Opposite-coloured bishops',
          'Bishop against knight endings',
          'The bishop and knight mate',
          'Queen against pawn',
          'Queen endings, the basics',
        ],
      },
      {
        id: '4.4',
        title: 'Endgame technique',
        outcome: 'Convert advantages calmly and hold difficult endings.',
        requires: ['4.3', '3.3'],
        lessons: [
          'Converting an extra pawn',
          'Two weaknesses in the endgame',
          'Do not hurry',
          'Drawing techniques',
          'Capstone: endgame gauntlet against the engine',
        ],
      },
    ],
  },
  {
    id: '5',
    title: 'Mastery',
    tagline: 'From strong to hero',
    goal: 'A personal opening repertoire, deep calculation and a self-directed training habit.',
    mode: 'mixed',
    modeNote: 'Repertoire runs as a weekly thread alongside the middlegame and masters courses.',
    courses: [
      {
        id: '5.1',
        title: 'Building a repertoire',
        outcome: 'Own a small, well-understood opening repertoire with both colours.',
        requires: ['3.4', '4.4'],
        lessons: [
          'How openings really work',
          'Open games after 1.e4 e5',
          'Italian Game ideas',
          'Spanish Game ideas',
          'Sicilian Defence ideas',
          'French and Caro-Kann ideas',
          "Queen's Gambit ideas",
          'Indian Defence ideas',
          'Choosing your White repertoire',
          'Choosing your Black repertoire',
          'Keeping a study file',
          'Traps to know and avoid',
        ],
      },
      {
        id: '5.2',
        title: 'Middlegame mastery',
        outcome: 'Handle sharp, double-edged middlegames.',
        requires: ['3.4', '4.4'],
        lessons: [
          'Dynamic against static factors',
          'Sacrificing for the initiative',
          'The exchange sacrifice',
          'Balancing attack and defence',
          'Calculation trees',
          'Positional sacrifices',
          'Recognising critical moments',
          'Managing your time',
          'Converting a winning position',
          'Coming back from worse',
        ],
      },
      {
        id: '5.3',
        title: 'Learning from the masters',
        outcome: 'Understand how chess thinking developed, and borrow from the best.',
        requires: ['5.2'],
        lessons: [
          'The romantic era',
          'Steinitz and the first principles',
          "Capablanca's simplicity",
          'The hypermodern revolution',
          "Tal's attacks",
          "Karpov's prophylaxis",
          'Chess in the engine era',
          'Your own hero study',
        ],
      },
      {
        id: '5.4',
        title: 'Competitive play',
        outcome: 'Prepare, play and train like a serious competitor.',
        requires: ['5.1', '5.3'],
        lessons: [
          'Preparing for a tournament',
          'Clock management',
          'Psychology and tilt',
          'Using an engine honestly',
          'Designing your training plan',
          'Measuring improvement',
          'Online against over-the-board play',
          'Final capstone: a 10-game self-annotated portfolio',
        ],
      },
    ],
  },
];

/** Horizontal links: two lessons that teach one idea from different sides. */
export const SIBLINGS: [string, string][] = [
  ['1.3.4', '2.3.2'],
  ['1.4.5', '2.2.5'],
  ['1.4.6', '3.2.8'],
  ['3.1.5', '4.1.6'],
  ['3.2.1', '4.3.3'],
  ['3.2.3', '4.3.5'],
  ['3.2.4', '4.2.3'],
  ['3.3.7', '4.4.2'],
  ['3.3.8', '4.4.1'],
];

/** Extra vertical links across courses, beyond the course order. */
export const EXTRA_PREREQS: Record<string, string[]> = {
  '2.1.2': ['1.1.7'],
  '2.3.1': ['1.3.8'],
  '4.1.2': ['1.1.8'],
};

export interface LessonMeta {
  id: string;
  title: string;
  courseId: string;
  curriculumId: string;
  index: number;
  prereqs: string[];
  siblings: string[];
}

export interface CourseMeta extends CourseDef {
  curriculumId: string;
  lessonIds: string[];
}

export const COURSES: CourseMeta[] = CURRICULUMS.flatMap((c) =>
  c.courses.map((course) => ({
    ...course,
    curriculumId: c.id,
    lessonIds: course.lessons.map((_, i) => `${course.id}.${i + 1}`),
  })),
);

export const COURSE_BY_ID = new Map(COURSES.map((c) => [c.id, c]));

export const LESSONS: LessonMeta[] = COURSES.flatMap((course) =>
  course.lessons.map((title, i) => {
    const id = `${course.id}.${i + 1}`;
    const prereqs =
      i === 0
        ? course.requires.map((cid) => COURSE_BY_ID.get(cid)!.lessonIds.at(-1)!)
        : [`${course.id}.${i}`];
    prereqs.push(...(EXTRA_PREREQS[id] ?? []));
    const siblings = SIBLINGS.filter((pair) => pair.includes(id)).map((pair) => (pair[0] === id ? pair[1] : pair[0]));
    return { id, title, courseId: course.id, curriculumId: course.curriculumId, index: i, prereqs, siblings };
  }),
);

export const LESSON_META = new Map(LESSONS.map((l) => [l.id, l]));

export function curriculumOf(courseId: string): CurriculumDef {
  return CURRICULUMS.find((c) => c.id === courseId.split('.')[0])!;
}
