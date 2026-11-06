import type { Lesson } from '../types';

const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';

export const lesson: Lesson = {
  id: '1.1.1',
  title: 'The board: files, ranks and diagonals',
  summary: 'The chessboard is a grid of 64 squares crossed by three kinds of line. Every piece you will meet travels along them.',
  minutes: 25,
  buildsOn: [],
  leadsTo: ['1.1.2', '1.1.3', '1.1.4'],
  puzzle: {
    intro:
      'Before any rules, a question to sit with. You do not need to know the answer yet; a guess is fine, and we will come back to it.',
    task: {
      id: 'puzzle',
      kind: 'choice',
      prompt: 'The longest slanting line of squares on the board runs from one corner to the opposite corner. How many squares long is it?',
      fen: EMPTY,
      highlights: ['a1', 'h8'],
      options: [{ text: '7' }, { text: '8', correct: true }, { text: '9' }, { text: '64' }],
      hints: [
        'How many squares wide is the board?',
        'A slanting line moves one column across every time it moves one row up.',
        'If it must cross every column exactly once, how many squares does it touch?',
        'Count the columns from the left edge to the right edge.',
      ],
      explain: 'Eight. The line steps one column right and one row up each time, so it touches each of the 8 columns once.',
    },
    resolution:
      'The long diagonal from a1 to h8 has 8 squares: one on every file and one on every rank. You now have the words to say that precisely.',
  },
  theory: [
    {
      heading: 'Sixty-four squares, two shades',
      body: [
        'A chessboard is a square grid of **8 by 8 = 64 squares**. The squares alternate between a light shade and a dark shade, like a chequered floor, so no two squares that share an edge have the same shade.',
        'The board must be turned the right way. Each player has a **light square in the right-hand corner** nearest to them. If you ever set up a board yourself, check that corner first: "light on the right".',
        'On this board White sits at the bottom. The highlighted corner is White\'s right-hand corner, and it is light.',
      ],
      board: { fen: EMPTY, highlights: ['h1'], caption: 'The board from White\'s side. Bottom right is light.' },
    },
    {
      heading: 'Files run up the board',
      body: [
        'A **file** is a column of squares running from White\'s side to Black\'s side. There are 8 files, named with the letters **a to h** from White\'s left to White\'s right.',
        'Look at the letters printed along the bottom edge. The highlighted column is the **e-file**: every square in it starts with the letter e.',
      ],
      board: {
        fen: EMPTY,
        highlights: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'],
        caption: 'The e-file, one of 8 files.',
      },
    },
    {
      heading: 'Ranks run across',
      body: [
        'A **rank** is a row of squares running from left to right. There are 8 ranks, numbered **1 to 8** starting from White\'s side.',
        'White\'s pieces start on ranks 1 and 2; Black\'s start on ranks 7 and 8. The highlighted row is the **4th rank**.',
        'A quick way to keep them apart: **files are letters and go up, ranks are numbers and go across.**',
      ],
      board: {
        fen: EMPTY,
        highlights: ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4'],
        caption: 'The 4th rank, one of 8 ranks.',
      },
    },
    {
      heading: 'Diagonals run slantwise',
      body: [
        'A **diagonal** is a slanting line of squares that touch only at their corners. Each step along a diagonal moves one file sideways and one rank up or down at the same time.',
        'Because the squares touch only at corners, **every square on a diagonal has the same shade**. A diagonal is either all light or all dark.',
        'Diagonals have different lengths. The two longest, **a1 to h8** and **h1 to a8**, have 8 squares each. The shortest are single corner squares.',
      ],
      board: {
        fen: EMPTY,
        arrows: [
          ['a1', 'h8'],
          ['h1', 'a8'],
        ],
        highlights: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'],
        caption: 'The two long diagonals. The dark one is highlighted.',
      },
    },
    {
      heading: 'Why these lines matter',
      body: [
        'Almost every chess piece moves along these three kinds of line. The **rook** uses files and ranks, the **bishop** uses diagonals, and the **queen** uses all three. The knight is the one exception, and it has its own lesson.',
        'So when you look at a board, you are really looking at a web of lines. Learning to *see* files, ranks and diagonals quickly is the first skill of chess.',
      ],
      board: {
        fen: EMPTY,
        highlights: ['d1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8', 'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4'],
        arrows: [['d4', 'g7']],
        caption: 'A file, a rank and a diagonal crossing at one square.',
      },
    },
  ],
  examples: [
    {
      title: 'Is d4 on the long a1 to h8 diagonal?',
      fen: EMPTY,
      steps: [
        { text: 'Start at the corner a1. A diagonal step moves one file right and one rank up.', highlights: ['a1'] },
        { text: 'One step: from a1 to b2. Another: c3.', highlights: ['a1', 'b2', 'c3'] },
        { text: 'One more step reaches d4. The file went a, b, c, d while the rank went 1, 2, 3, 4.', highlights: ['a1', 'b2', 'c3', 'd4'] },
        {
          text: 'So yes. A neat test: on this diagonal the file\'s position in the alphabet always equals the rank number (d is the 4th letter, rank 4).',
          highlights: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'],
        },
      ],
    },
    {
      title: 'Which shade is the square e4?',
      fen: EMPTY,
      steps: [
        { text: 'We know a1 is dark. Give each file a number: a = 1, b = 2, up to h = 8.', highlights: ['a1'] },
        { text: 'For a1 that is 1 + 1 = 2, an even number, and a1 is dark. Every step to a neighbouring square changes the total by 1 and changes the shade.', highlights: ['a1', 'b1', 'a2'] },
        { text: 'So the rule is: **even total means dark, odd total means light.** For e4: e = 5, plus 4, makes 9.', highlights: ['e4'] },
        { text: '9 is odd, so e4 is light. Check it on the board: it is.', highlights: ['e4'] },
      ],
    },
  ],
  explainBack: {
    prompt: 'In your own words, explain the difference between a file, a rank and a diagonal. Imagine you are telling a friend who has never seen a chessboard.',
    ideas: [
      {
        label: 'Files go up and down',
        anyOf: ['file', 'column', 'vertical', 'up and down', 'top to bottom', 'letter'],
        followUp: 'You described some lines, but which direction does a file run, and how is it named?',
      },
      {
        label: 'Ranks go across',
        anyOf: ['rank', 'row', 'horizontal', 'across', 'side to side', 'left to right', 'number'],
        followUp: 'What about the lines that run across the board? What are they called and how are they numbered?',
      },
      {
        label: 'Diagonals slant',
        anyOf: ['diagonal', 'slant', 'corner', 'same colour', 'same color', 'same shade', 'sideways and up'],
        followUp: 'There is a third kind of line that is neither up nor across. What is it like?',
      },
    ],
    model:
      'A file is a column that runs up the board from one player to the other, named by a letter from a to h. A rank is a row that runs across the board, numbered 1 to 8. A diagonal is a slanting line of squares that touch at their corners, so all its squares share one shade.',
  },
  guided: [
    {
      id: 'g1',
      kind: 'square',
      prompt: 'Click the square h1.',
      fen: EMPTY,
      answer: 'h1',
      hints: [
        'A square\'s name is a file letter and a rank number. Which file is h?',
        'The files go a to h from White\'s left to right. Where is h?',
        'Rank 1 is the row nearest to White, at the bottom of this board.',
        'Look in the bottom row, at the far right-hand end.',
      ],
      explain: 'h1 is the corner square on White\'s right: the h-file meets the 1st rank. It is light, as the rule "light on the right" says.',
    },
    {
      id: 'g2',
      kind: 'squares',
      prompt: 'Select every square of the d-file, then press Check.',
      fen: EMPTY,
      answer: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'],
      hints: [
        'Is a file a row or a column?',
        'Find the letter d along the bottom edge.',
        'A file contains exactly one square on every rank. How many squares is that?',
        'You need all 8 squares in the fourth column from the left.',
      ],
      explain: 'The d-file is the fourth column from White\'s left: d1 up to d8, eight squares in all.',
    },
    {
      id: 'g3',
      kind: 'squares',
      prompt: 'Select every square of the 5th rank.',
      fen: EMPTY,
      answer: ['a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5'],
      hints: [
        'Is a rank a row or a column?',
        'Ranks are counted from White\'s side, starting at 1 at the bottom.',
        'The 5th rank has one square on every file.',
        'Count five rows up from the bottom and take the whole row.',
      ],
      explain: 'The 5th rank is the fifth row up from White\'s side: a5 through h5.',
    },
    {
      id: 'g4',
      kind: 'squares',
      prompt: 'Select every square on the diagonal from a1 to h8.',
      fen: EMPTY,
      answer: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'],
      hints: [
        'Where does this diagonal start and end?',
        'Each step along it goes one file to the right and one rank up.',
        'Remember the test from the worked example: letter position equals rank number.',
        'From a1, keep stepping up and to the right until you reach the far corner.',
      ],
      explain: 'a1, b2, c3, d4, e5, f6, g7, h8: each square is one file right and one rank up from the last, and all are dark.',
    },
    {
      id: 'g5',
      kind: 'choice',
      prompt: 'What shade is the square f3?',
      fen: EMPTY,
      options: [
        { text: 'Light', correct: true },
        { text: 'Dark', why: 'Try the counting rule: f is the 6th file. Is 6 + 3 even or odd?' },
      ],
      hints: [
        'You do not need to find it on the board. Is there a rule you can use?',
        'Turn the file letter into a number: a = 1, b = 2, and so on.',
        'Add the file number to the rank number. Even means dark, odd means light.',
        'f is 6. Add 3 and look at whether the total is even or odd.',
      ],
      explain: 'f = 6 and 6 + 3 = 9, which is odd, so f3 is light.',
    },
    {
      id: 'g6',
      kind: 'squares',
      prompt: 'Select every square on the diagonal that runs from h1 to a8.',
      fen: EMPTY,
      answer: ['h1', 'g2', 'f3', 'e4', 'd5', 'c6', 'b7', 'a8'],
      hints: [
        'This is the other long diagonal. Which way does it slant?',
        'Each step goes one file to the left and one rank up.',
        'Every square on it should be the same shade as h1.',
        'Start in the bottom-right corner and step up and to the left.',
      ],
      explain: 'h1, g2, f3, e4, d5, c6, b7, a8: a light diagonal of 8 squares, crossing the a1 to h8 diagonal in the centre of the board.',
    },
    {
      id: 'g7',
      kind: 'choice',
      prompt: 'A diagonal starts at a5 and runs down to the right until it reaches the edge. How many squares long is it?',
      fen: EMPTY,
      highlights: ['a5'],
      options: [
        { text: '4', why: 'Count again, including both ends: the starting square and the last square on the edge.' },
        { text: '5', correct: true },
        { text: '6', why: 'Which rank does it reach, and can it go below rank 1?' },
        { text: '8', why: 'Only the two corner-to-corner diagonals have 8 squares.' },
      ],
      hints: [
        'Which direction does each step go?',
        'Down to the right means one file right and one rank down.',
        'The line stops when it runs out of ranks. Which rank is the last?',
        'Write the squares out: a5, then b4, and keep going until rank 1.',
      ],
      explain: 'a5, b4, c3, d2, e1: five squares, ending when it reaches the 1st rank.',
    },
  ],
  independent: [
    {
      id: 'i1',
      kind: 'square',
      prompt: 'Click the square c6.',
      fen: EMPTY,
      answer: 'c6',
      hints: ['', '', '', ''],
      explain: 'c6: the c-file (third from the left) meets the 6th rank.',
    },
    {
      id: 'i2',
      kind: 'squares',
      prompt: 'Select the whole g-file.',
      fen: EMPTY,
      answer: ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
      hints: ['', '', '', ''],
      explain: 'The g-file is the second column from the right: g1 to g8.',
    },
    {
      id: 'i3',
      kind: 'choice',
      prompt: 'Which of these squares is NOT on a diagonal through c1?',
      fen: EMPTY,
      highlights: ['c1'],
      options: [
        { text: 'b2', why: 'c1 to b2 is one step up and to the left: a diagonal.' },
        { text: 'e3', why: 'c1, d2, e3: two steps up and to the right.' },
        { text: 'h6', why: 'c1, d2, e3, f4, g5, h6: that is the long way up to the right.' },
        { text: 'd3', correct: true },
      ],
      hints: ['', '', '', ''],
      explain: 'd3 is one file right but two ranks up from c1. On a diagonal, the file change and rank change are always equal.',
    },
    {
      id: 'i4',
      kind: 'choice',
      prompt: 'What shade is the square b7?',
      fen: EMPTY,
      options: [{ text: 'Light', correct: true }, { text: 'Dark' }],
      hints: ['', '', '', ''],
      explain: 'b = 2 and 2 + 7 = 9, which is odd, so b7 is light. It sits on the light long diagonal from h1 to a8.',
    },
  ],
  bridge: {
    text:
      'Next you will learn to *name* every square and write moves down. A square\'s name is nothing more than the file and the rank that cross there, so you already know half of it.',
    task: {
      id: 'bridge',
      kind: 'choice',
      prompt: 'The square e4 is where which two lines cross?',
      fen: EMPTY,
      highlights: ['e4'],
      options: [
        { text: 'The e-file and the 4th rank', correct: true },
        { text: 'The 4th file and the e-rank', why: 'Files are named by letters and ranks by numbers. Which is which?' },
        { text: 'Two diagonals only', why: 'Diagonals do cross at e4, but a square\'s name comes from straight lines.' },
      ],
      hints: [
        'A square\'s name has a letter and a number. What does each part stand for?',
        'Letters name the columns. Numbers name the rows.',
        'What do we call a column, and what do we call a row?',
        'The letter part is a file.',
      ],
      explain: 'e4 is where the e-file meets the 4th rank. Every square name works the same way.',
    },
  },
  reviewSeeds: ['g2', 'g4', 'i3'],
};
