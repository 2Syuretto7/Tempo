import type { Hints, Lesson } from '../types';

const QUIET: Hints = ['', '', '', ''];

export const lesson: Lesson = {
  id: '1.1.6',
  title: 'The king',
  summary: 'The king moves one square at a time and may never step into danger. Protecting it is what every game of chess is ultimately about.',
  minutes: 30,
  buildsOn: ['1.1.3', '1.1.5'],
  leadsTo: ['1.2.1', '1.2.3', '4.1.1'],
  puzzle: {
    intro: 'The king moves just one square in any direction. But there is a rule that makes some squares forbidden. See if you can feel it out.',
    task: {
      id: 'puzzle',
      kind: 'squares',
      prompt: 'A black rook watches the d-file. Select every square the white king on e4 may move to.',
      fen: '3r3k/8/8/8/4K3/8/8/8 w - - 0 1',
      answer: { reach: 'e4' },
      hints: [
        'Start with all the neighbouring squares.',
        'Which squares can the black rook capture on?',
        'Would it be sensible to walk into the rook\'s line?',
        'Leave out every square on the d-file.',
      ],
      explain: 'The king may go to e3, e5, f3, f4 or f5. The three d-file squares are attacked by the rook.',
    },
    resolution: 'The king may never move to a square an enemy piece attacks. The rook on d8 rules out d3, d4 and d5, leaving 5 safe squares.',
  },
  theory: [
    {
      heading: 'One step in any direction',
      body: [
        'The king moves **exactly one square**: up, down, sideways or diagonally. In open space that gives it up to 8 squares to choose from.',
        'It captures the same way it moves, by stepping onto an enemy piece one square away.',
      ],
      board: { fen: '7k/8/8/8/3K4/8/8/8 w - - 0 1', showMoves: 'd4', free: true, caption: 'Eight squares from the middle.' },
    },
    {
      heading: 'Never into danger',
      body: [
        'Here is the rule that makes the king special: **a king may never move to a square that an enemy piece attacks.** Doing so would let the enemy capture it, and that is not allowed.',
        'The black bishop on d8 watches f6 and g5, so those squares are off-limits for the white king, even though they are next to it.',
      ],
      board: { fen: '3b3k/8/8/5K2/8/8/8/8 w - - 0 1', showMoves: 'f5', free: true, caption: 'The bishop rules out f6 and g5.' },
    },
    {
      heading: 'Kings keep their distance',
      body: [
        'Each king attacks the 8 squares around it. So two kings can never stand on neighbouring squares: whichever moved there would be stepping into the other\'s attack.',
        'There is always at least one empty square between the kings. This simple fact will decide many endgames you study later.',
      ],
      board: { fen: '8/8/4k3/8/4K3/8/8/8 w - - 0 1', showMoves: 'e4', highlights: ['d5', 'e5', 'f5'], caption: 'd5, e5 and f5 are attacked by the black king.' },
    },
    {
      heading: 'The piece the game is about',
      body: [
        'The king is never captured. When a king is attacked and cannot escape, the game is over: that is **checkmate**, and it is how chess is won.',
        'A king that is attacked is said to be in **check**. Check, escaping check and checkmate are the first lessons of the next course.',
      ],
      board: { fen: '8/8/8/8/8/8/8/4K3 w - - 0 1', highlights: ['e1'], caption: 'Protect this piece above all others.' },
    },
  ],
  examples: [
    {
      title: 'Where can the king go?',
      fen: '7k/8/8/8/8/8/r7/4K3 w - - 0 1',
      steps: [
        { text: 'White\'s king on e1. A black rook on a2 controls the whole 2nd rank.', arrows: [['a2', 'h2']] },
        { text: 'The king\'s neighbours are d1, f1, d2, e2 and f2. The three on the 2nd rank are attacked.', highlights: ['d2', 'e2', 'f2'] },
        { text: 'So the king can only shuffle sideways: d1 or f1.', highlights: ['d1', 'f1'] },
      ],
    },
    {
      title: 'Capturing with the king',
      fen: '7k/8/2p5/3nn3/4K3/8/8/8 w - - 0 1',
      steps: [
        { text: 'Two black knights stand next to White\'s king. Can it capture either?', highlights: ['d5', 'e5'] },
        { text: 'The knight on d5 is defended by the black pawn on c6: if the king took it, the pawn could capture the king. Not allowed.', arrows: [['c6', 'd5']] },
        { text: 'Nothing defends e5, so the king may take it: **Kxe5**.', fen: '7k/8/2p5/3nK3/8/8/8/8 b - - 0 1', lastMove: ['e4', 'e5'] },
      ],
    },
  ],
  explainBack: {
    prompt: 'Explain why one king can never move next to the other king.',
    ideas: [
      { label: 'Kings attack their neighbours', anyOf: ['attack', 'capture', 'take', 'guard', 'control'], followUp: 'What does a king do to the squares around it?' },
      { label: 'A king may not enter attacked squares', anyOf: ['not allowed', 'cannot', "can't", 'never', 'illegal', 'danger', 'check', 'into'], followUp: 'What rule stops a king from stepping onto an attacked square?' },
    ],
    model: 'A king attacks every square next to it. Moving beside the enemy king would mean stepping onto an attacked square, and a king may never do that.',
  },
  guided: [
    {
      id: 'g1',
      kind: 'squares',
      prompt: 'Select every square the white king may move to.',
      fen: '7k/8/8/8/8/8/8/K7 w - - 0 1',
      answer: { reach: 'a1' },
      hints: ['How many neighbours does a corner square have?', 'Most directions run off the board.', 'Check up, right and diagonal.', 'Three squares.'],
      explain: 'From the corner only a2, b1 and b2 exist. That is why a king in the corner is easier to trap.',
    },
    {
      id: 'g2',
      kind: 'squares',
      prompt: 'Select every square the white king may move to.',
      fen: '3b3k/8/8/5K2/8/8/8/8 w - - 0 1',
      answer: { reach: 'f5' },
      hints: ['List the 8 neighbouring squares first.', 'Which of them does the bishop watch?', 'Trace the bishop\'s diagonal toward the king.', 'Two squares on the d8 to h4 diagonal are forbidden.'],
      explain: 'The bishop\'s diagonal passes through f6 and g5, so the king has 6 squares.',
    },
    {
      id: 'g3',
      kind: 'squares',
      prompt: 'Select every square the white king may move to.',
      fen: '7k/8/8/8/8/8/r7/4K3 w - - 0 1',
      answer: { reach: 'e1' },
      hints: ['Where does the rook\'s line run?', 'The rook controls a whole rank.', 'Which of the king\'s neighbours are on that rank?', 'Only sideways moves remain.'],
      explain: 'The rook controls the 2nd rank, so only d1 and f1 are safe.',
    },
    {
      id: 'g4',
      kind: 'move',
      prompt: 'Capture the black knight that is not defended.',
      fen: '7k/8/2p5/3nn3/4K3/8/8/8 w - - 0 1',
      accept: ['e4e5'],
      wrong: 'That does not capture a knight.',
      hints: ['Two knights are within reach. Is either protected?', 'Look at the black pawn. Which squares does it attack?', 'A pawn attacks diagonally forward. For Black, forward is down the board.', 'One knight is covered by the pawn.'],
      explain: 'The pawn on c6 defends d5, so the king must not go there. The knight on e5 is unprotected: Kxe5.',
    },
    {
      id: 'g5',
      kind: 'choice',
      prompt: 'On an empty board, how many squares can a king reach from the centre?',
      fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
      options: [{ text: '4' }, { text: '8', correct: true }, { text: '9' }, { text: '14' }],
      hints: ['One step in every direction.', 'Up, down, left, right...', '...and the four diagonals.', 'Count the squares around d4.'],
      explain: 'Eight: the full ring of squares around it.',
    },
  ],
  independent: [
    {
      id: 'i1',
      kind: 'squares',
      prompt: 'Select every square the white king may move to.',
      fen: '8/3k4/8/3K4/7r/8/8/8 w - - 0 1',
      answer: { reach: 'd5' },
      hints: QUIET,
      explain: 'The rook controls the 4th rank and the black king controls the 6th-rank squares. Only c5 and e5 are safe.',
    },
    {
      id: 'i2',
      kind: 'move',
      prompt: 'Capture the black pawn that is not protected.',
      fen: 'k7/8/8/8/2p5/3pKp2/8/8 w - - 0 1',
      accept: ['e3f3'],
      wrong: 'That move does not capture the unprotected pawn.',
      hints: QUIET,
      explain: 'The pawn on d3 is protected by the pawn on c4. The pawn on f3 has no defender: Kxf3.',
    },
    {
      id: 'i3',
      kind: 'choice',
      prompt: 'A black queen on g8 faces the white king on g1 with nothing in between. Is the white king attacked right now?',
      fen: '6qk/8/8/8/8/8/8/6K1 w - - 0 1',
      options: [{ text: 'Yes', correct: true }, { text: 'No' }],
      hints: QUIET,
      explain: 'Yes: the queen sees straight down the g-file. A king under attack is "in check", the first lesson of the next course.',
    },
    {
      id: 'i4',
      kind: 'squares',
      prompt: 'Select every square the white king may move to.',
      fen: 'k7/8/8/8/8/5n2/8/7K w - - 0 1',
      answer: { reach: 'h1' },
      hints: QUIET,
      explain: 'The knight on f3 attacks g1 and h2. Only g2 is safe.',
    },
  ],
  bridge: {
    text: 'The king is attacked here along a diagonal, by the queen you met last lesson. Getting out of such attacks is the heart of the next course.',
    task: {
      id: 'bridge',
      kind: 'move',
      prompt: 'The black queen attacks your king along a diagonal. Move the king to any safe square.',
      fen: 'q6k/8/8/8/4K3/8/8/8 w - - 0 1',
      arrows: [['a8', 'e4']],
      accept: 'anyLegal',
      hints: ['Which line is the queen attacking along?', 'Does stepping along that same line help?', 'Squares on the long diagonal stay attacked.', 'Step off the diagonal.'],
      explain: 'Any step off the a8 to h1 diagonal works. Notice that d5 and f3, though they are neighbours, stay on the queen\'s line.',
    },
  },
  reviewSeeds: ['g2', 'g4', 'i4'],
};
