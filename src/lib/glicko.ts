/**
 * Glicko-2 (Glickman, 2012) for one game at a time: you against a puzzle.
 * Ratings are on the familiar 1500-centred scale; the maths runs on the internal scale.
 */
export type Glicko = { rating: number; rd: number; vol: number };

export const START: Glicko = { rating: 800, rd: 300, vol: 0.06 };
const TAU = 0.5;
const SCALE = 173.7178;
const MIN_RD = 45;
const MAX_RD = 350;

export function update(me: Glicko, opponent: { rating: number; rd: number }, score: number): Glicko {
  const mu = (me.rating - 1500) / SCALE;
  const phi = me.rd / SCALE;
  const muJ = (opponent.rating - 1500) / SCALE;
  const phiJ = opponent.rd / SCALE;
  const g = 1 / Math.sqrt(1 + (3 * phiJ * phiJ) / (Math.PI * Math.PI));
  const e = 1 / (1 + Math.exp(-g * (mu - muJ)));
  const v = 1 / (g * g * e * (1 - e));
  const delta = v * g * (score - e);

  // New volatility by the Illinois algorithm.
  const a = Math.log(me.vol * me.vol);
  const f = (x: number) => {
    const ex = Math.exp(x);
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * (phi * phi + v + ex) ** 2) - (x - a) / (TAU * TAU);
  };
  let A = a;
  let B: number;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else {
    let k = 1;
    while (f(a - k * TAU) < 0) k++;
    B = a - k * TAU;
  }
  let fA = f(A);
  let fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > 1e-6; i++) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else fA /= 2;
    B = C;
    fB = fC;
  }
  const vol = Math.exp(A / 2);
  const phiStar = Math.sqrt(phi * phi + vol * vol);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muNew = mu + phiNew * phiNew * g * (score - e);
  return {
    rating: Math.round((muNew * SCALE + 1500) * 10) / 10,
    rd: Math.min(MAX_RD, Math.max(MIN_RD, phiNew * SCALE)),
    vol,
  };
}
