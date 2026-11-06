import type { Hints, Lesson } from '../types';

const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
const QUIET: Hints = ['', '', '', ''];

export const lesson: Lesson = {
  id: '1.1.2',
  title: 'Coordinates and notation',
  summary: 'Every square has a name, and every move can be written in a few characters. This is the language the rest of the journey is written in.',
  minutes: 30,
  buildsOn: ['1.1.1'],
  leadsTo: ['1.1.3', '1.2.1'],
  puzzle: {
    intro: 'Chess players can describe a whole game without a board in front of them. Try reading a description now.',
    task: {
      id: 'puzzle',
      kind: 'square',
      prompt: 'A friend says, "My knight is on f6." Click the square they mean.',
      fen: EMPTY,
      answer: 'f6',
      hints: [
        'The name has a letter and a number. You met both in the last lesson.',
        'The letter is a file. The number is a rank.',
        'Find the f-file, then count up to the 6th rank.',
        'The f-file is the third column from the right.',
      ],
      explain: 'f6 is where the f-file meets the 6th rank.',
    },
    resolution: 'f6 is simply the f-file crossed with the 6th rank. Every square on the board is named this way, always letter first.',
  },
  theory: [
    {
      heading: 'Every square has a name',
      body: [
        'Put the file letter first and the rank number second, and you have the square\'s name: **e4**, **a1**, **h8**. There are exactly 64 names, one for each square, and no two squares share one.',
        'This is called **algebraic notation**. It is the international standard: a game played in Chennai and a game played in Oslo are written down the same way.',
      ],
      board: { fen: EMPTY, highlights: ['e4'], free: false, caption: 'e4: the e-file and the 4th rank.' },
    },
    {
      heading: 'Names do not change when you turn the board',
      body: [
        'Square names belong to the board, not to the player. Seen from Black\'s side, a1 is in the *top right*, and the letters run h to a from left to right.',
        'This trips up beginners, so practise it: when the board is flipped, read the letters and numbers printed on the edges rather than relying on position.',
      ],
      board: { fen: EMPTY, orientation: 'black', highlights: ['e4'], caption: 'The same square e4, seen from Black\'s side.' },
    },
    {
      heading: 'A letter for each piece',
      body: [
        'Each piece except the pawn has a capital letter: **K** king, **Q** queen, **R** rook, **B** bishop, **N** knight. The knight uses N because K was already taken by the king.',
        'Pawns have no letter. When you see a move with no capital letter, it is a pawn move.',
      ],
      board: { fen: START, caption: 'The starting position. White is at the bottom.' },
    },
    {
      heading: 'Writing a move',
      body: [
        'A move is written as the piece letter followed by the square it moves to. **Nf3** means "a knight moves to f3". **e4** means "a pawn moves to e4".',
        'A capture adds an **x** before the square: **Bxe5** means "a bishop captures on e5". Later you will meet **+** for check and **#** for checkmate.',
        'Moves are numbered in pairs: **1. e4 e5 2. Nf3** means White played e4, Black answered e5, then White played Nf3 on move two.',
      ],
      board: {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b - - 0 2',
        arrows: [['g1', 'f3']],
        caption: 'After 1. e4 e5 2. Nf3.',
      },
    },
  ],
  examples: [
    {
      title: 'Reading 1. e4 e5 2. Nf3 Nc6',
      fen: START,
      steps: [
        { text: '1. e4: no capital letter, so a pawn moves to e4. Only the pawn on e2 can get there.', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b - - 0 1', lastMove: ['e2', 'e4'] },
        { text: '1... e5: Black answers with a pawn to e5. The three dots mean "Black\'s move".', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w - - 0 2', lastMove: ['e7', 'e5'] },
        { text: '2. Nf3: a knight moves to f3. Only the knight on g1 can reach f3.', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b - - 0 2', lastMove: ['g1', 'f3'] },
        { text: '2... Nc6: a black knight moves to c6. Four short words described the whole opening.', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w - - 0 3', lastMove: ['b8', 'c6'] },
      ],
    },
    {
      title: 'Reading a capture: Bxc6',
      fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w - - 0 4',
      steps: [
        { text: 'Here White\'s bishop stands on b5. The move written is **Bxc6**.', highlights: ['b5'] },
        { text: 'B is the bishop, x means a capture, c6 is where it lands. The black knight on c6 is taken off the board.', arrows: [['b5', 'c6']] },
        { text: 'The bishop now stands on c6. Notice the notation never says where the piece came from: usually only one piece can make the move.', fen: 'r1bqkbnr/pppp1ppp/2B5/4p3/4P3/5N2/PPPP1PPP/RNBQK2R b - - 0 4', lastMove: ['b5', 'c6'] },
      ],
    },
  ],
  explainBack: {
    prompt: 'Explain how you would write down "a knight moves to the square f3", and why the knight uses the letter it does.',
    ideas: [
      { label: 'Letter then square', anyOf: ['nf3', 'n f3', 'letter', 'then the square', 'followed by'], followUp: 'What exactly would you write, piece letter and square together?' },
      { label: 'K is the king\'s letter', anyOf: ['king', 'k is', 'k was', 'already'], followUp: 'Why can the knight not use K?' },
    ],
    model: 'You write the piece\'s capital letter followed by the destination square: Nf3. The knight uses N because K already belongs to the king.',
  },
  guided: [
    {
      id: 'g1',
      kind: 'square',
      prompt: 'Click e4.',
      fen: EMPTY,
      answer: 'e4',
      hints: ['Which part of the name is the file?', 'Find e along the bottom edge.', 'Now count up the ranks.', 'It is the fifth column from the left, fourth row up.'],
      explain: 'e4: the e-file crossed with the 4th rank, near the centre.',
    },
    {
      id: 'g2',
      kind: 'square',
      prompt: 'Click b7.',
      fen: EMPTY,
      answer: 'b7',
      hints: ['Letter first, then number.', 'b is the second file from White\'s left.', 'Rank 7 is near Black\'s side.', 'Second column, second row from the top.'],
      explain: 'b7 sits on the b-file, one rank below Black\'s back row.',
    },
    {
      id: 'g3',
      kind: 'square',
      prompt: 'The board is now seen from Black\'s side. Click g2.',
      fen: EMPTY,
      orientation: 'black',
      answer: 'g2',
      hints: [
        'Did the square names move when the board turned?',
        'Read the letters printed on the edge of this board. Which way do they run?',
        'Rank 2 is near White, and White is now at the top.',
        'Look in the second row from the top, near the left side.',
      ],
      explain: 'From Black\'s side, rank 2 is near the top and the g-file is second from the left. The name stayed the same; only your view changed.',
    },
    {
      id: 'g4',
      kind: 'choice',
      prompt: 'What does Qd1 mean?',
      options: [
        { text: 'A queen moves to d1', correct: true },
        { text: 'A queen moves away from d1', why: 'Notation gives the destination square, not the starting square.' },
        { text: 'A pawn moves to d1', why: 'Q is a capital letter, so this is not a pawn.' },
      ],
      hints: ['Break it into two parts: the capital letter and the square.', 'Which piece is Q?', 'Does the square tell you where a piece goes or where it came from?', 'Notation always names the destination.'],
      explain: 'Q is the queen and d1 is where she arrives.',
    },
    {
      id: 'g5',
      kind: 'move',
      prompt: 'This is the starting position. Play the move Nf3 on the board: click the piece, then the square.',
      fen: START,
      accept: ['g1f3'],
      wrong: 'That is a legal move, but it is not Nf3. Which piece does N stand for, and where must it land?',
      hints: ['N is which piece?', 'Find the square f3 first.', 'Which of your knights is close enough to land on f3?', 'Look at the knight on the king\'s side.'],
      explain: 'The knight on g1 jumps to f3. The other knight cannot reach f3 in one move, so "Nf3" is clear without saying where it came from.',
    },
    {
      id: 'g6',
      kind: 'move',
      prompt: 'From the starting position, play e4.',
      fen: START,
      accept: ['e2e4'],
      wrong: 'That is a legal move, but not e4. No capital letter means which kind of piece?',
      hints: ['There is no capital letter. What does that tell you?', 'Pawns have no letter.', 'Which pawn stands on the e-file?', 'Move the e-pawn forward to the 4th rank.'],
      explain: 'The pawn on e2 moves two squares to e4. You will learn in the pawn lesson why it may move two squares here.',
    },
    {
      id: 'g7',
      kind: 'choice',
      prompt: 'In the move Bxe5, what does the x mean?',
      options: [
        { text: 'The bishop captures a piece on e5', correct: true },
        { text: 'The move is a mistake', why: 'Mistakes are marked with ? in comments, not with x.' },
        { text: 'The bishop is taken', why: 'The bishop is the piece doing the capturing.' },
      ],
      hints: ['There are three parts: B, x and e5.', 'You know B and e5 already.', 'What happens to a piece standing on the destination square?', 'x stands for a capture.'],
      explain: 'x marks a capture: the bishop lands on e5 and removes the piece there.',
    },
  ],
  independent: [
    { id: 'i1', kind: 'square', prompt: 'Click h5.', fen: EMPTY, answer: 'h5', hints: QUIET, explain: 'h5: the right-hand edge, fifth rank.' },
    {
      id: 'i2',
      kind: 'move',
      prompt: 'From the starting position, play Nc3.',
      fen: START,
      accept: ['b1c3'],
      wrong: 'That is legal, but it is not Nc3.',
      hints: QUIET,
      explain: 'The knight on b1 jumps to c3.',
    },
    {
      id: 'i3',
      kind: 'choice',
      prompt: 'Which is the correct way to write "a pawn moves to d4"?',
      options: [
        { text: 'Pd4', why: 'Pawns have no letter in notation.' },
        { text: 'd4', correct: true },
        { text: '4d', why: 'The file letter always comes first.' },
        { text: 'D4', why: 'File letters are lower case. Capitals are for pieces.' },
      ],
      hints: QUIET,
      explain: 'A pawn move is just the destination square, in lower case: d4.',
    },
    {
      id: 'i4',
      kind: 'square',
      prompt: 'The board is seen from Black\'s side. Click c7.',
      fen: EMPTY,
      orientation: 'black',
      answer: 'c7',
      hints: QUIET,
      explain: 'From Black\'s side, rank 7 is the second row from the bottom and the c-file is third from the right.',
    },
  ],
  bridge: {
    text: 'You will use these names in every lesson from now on. Next comes the first piece, the rook, which travels along the files and ranks you have just learnt to name.',
    task: {
      id: 'bridge',
      kind: 'choice',
      prompt: 'A rook moves from a1 to a8. Which kind of line did it travel along?',
      fen: '8/8/8/8/8/8/8/R7 w - - 0 1',
      arrows: [['a1', 'a8']],
      options: [
        { text: 'A file', correct: true },
        { text: 'A rank', why: 'The rank number changed from 1 to 8, so the rook did not stay on one rank.' },
        { text: 'A diagonal', why: 'The letter stayed the same. On a diagonal, both the letter and the number change.' },
      ],
      hints: ['Compare the two square names. Which part stayed the same?', 'The letter stayed a.', 'A line where the letter stays the same is called what?', 'Letters name files.'],
      explain: 'The letter stayed a and only the number changed, so it moved along the a-file.',
    },
  },
  reviewSeeds: ['g3', 'g4', 'i3'],
};
