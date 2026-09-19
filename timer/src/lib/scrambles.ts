/**
 * Scramble generators for WCA-recognized puzzle events.
 *
 * These are random-move generators using standard WCA notation, not true
 * random-state scramblers (real WCA competitions use TNoodle, which is out
 * of scope here - see the note in scramble.ts / the disclaimer shown for
 * the less common puzzles). For NxN cubes this produces well-mixed,
 * reasonably-sized scrambles. For Megaminx the exact official notation is
 * more intricate; this generator produces a structurally-similar, best-effort
 * approximation for practice purposes. Square-1 simulates the actual layer
 * state so every "/" it emits is physically executable, and Clock is ported
 * directly from TNoodle's own random-move algorithm (ClockPuzzle.generateRandomMoves).
 */

const AXIS6: Record<string, number> = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
const FACES6 = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS3 = ['', "'", '2'];

export function generateNxNScramble(n: number, length: number, faceSet: string[] = FACES6): string {
  const maxDepth = Math.max(1, Math.floor(n / 2));
  const moves: string[] = [];
  let prevFace: string | null = null;
  let prevAxis = -1;

  for (let i = 0; i < length; i++) {
    let face: string;
    do {
      face = faceSet[Math.floor(Math.random() * faceSet.length)];
    } while (face === prevFace || (AXIS6[face] !== undefined && AXIS6[face] === prevAxis));

    const depth = 1 + Math.floor(Math.random() * maxDepth);
    const modifier = MODIFIERS3[Math.floor(Math.random() * MODIFIERS3.length)];
    let notation: string;
    if (depth === 1) notation = face + modifier;
    else if (depth === 2) notation = face + 'w' + modifier;
    else notation = depth + face + 'w' + modifier;

    moves.push(notation);
    prevFace = face;
    prevAxis = AXIS6[face];
  }

  return moves.join(' ');
}

export function generatePyraminxScramble(): string {
  const faces = ['U', 'L', 'R', 'B'];
  const modifiers = ['', "'"];
  const moves: string[] = [];
  let prevFace: string | null = null;

  for (let i = 0; i < 11; i++) {
    let face: string;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (face === prevFace);
    moves.push(face + modifiers[Math.floor(Math.random() * 2)]);
    prevFace = face;
  }

  const tipMoves: string[] = [];
  for (const t of ['u', 'l', 'r', 'b']) {
    if (Math.random() < 0.7) {
      tipMoves.push(t + modifiers[Math.floor(Math.random() * 2)]);
    }
  }

  return [...moves, ...tipMoves].join(' ');
}

export function generateSkewbScramble(): string {
  const faces = ['R', 'U', 'L', 'B'];
  const modifiers = ['', "'"];
  const moves: string[] = [];
  let prevFace: string | null = null;

  for (let i = 0; i < 10; i++) {
    let face: string;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (face === prevFace);
    moves.push(face + modifiers[Math.floor(Math.random() * 2)]);
    prevFace = face;
  }

  return moves.join(' ');
}

export function generateMegaminxScramble(): string {
  const lines: string[] = [];
  for (let i = 0; i < 7; i++) {
    const tokens: string[] = [];
    for (let j = 0; j < 10; j++) {
      const face = Math.random() < 0.5 ? 'R' : 'D';
      const dir = Math.random() < 0.5 ? '++' : '--';
      tokens.push(face + dir);
    }
    const u = Math.random() < 0.5 ? 'U' : "U'";
    lines.push(`${tokens.join(' ')} ${u}`);
  }
  return lines.join('\n');
}

// Square-1 layer model: each layer (top/bottom) is 12 slots of 30 degrees each,
// occupied by 4 corner pieces (2 slots wide) and 4 edge pieces (1 slot wide).
// A slot is "true" here if a piece starts there (a layer boundary). Twisting a
// layer just rotates this array; a "/" (slash) move physically swaps the right
// half (slots 6-11) between the two layers, but is only possible on a real
// puzzle when both layers currently have a clean cut at slots 0 and 6 - i.e.
// no piece straddles the seam. Simulating this (instead of emitting fully
// random twists) guarantees every generated scramble can actually be turned
// on a physical Square-1.
const SQ1_SOLVED_BOUNDARY = [0, 2, 3, 5, 6, 8, 9, 11];

function sq1SolvedLayer(): boolean[] {
  const layer = new Array(12).fill(false);
  for (const slot of SQ1_SOLVED_BOUNDARY) layer[slot] = true;
  return layer;
}

function sq1Rotate(layer: boolean[], amount: number): boolean[] {
  const next = new Array(12).fill(false);
  for (let i = 0; i < 12; i++) {
    if (layer[i]) next[(((i + amount) % 12) + 12) % 12] = true;
  }
  return next;
}

function sq1CanSlash(top: boolean[], bottom: boolean[]): boolean {
  return top[0] && top[6] && bottom[0] && bottom[6];
}

export function generateSquareOneScramble(): string {
  const rand = () => Math.floor(Math.random() * 12) - 5; // -5..6, matches WCA twist notation
  let top = sq1SolvedLayer();
  let bottom = sq1SolvedLayer();
  const groups: string[] = [];
  const groupCount = 12;

  for (let g = 0; g < groupCount; g++) {
    const isLast = g === groupCount - 1;
    let topTwist = 0;
    let bottomTwist = 0;
    let nextTop = top;
    let nextBottom = bottom;

    for (let attempt = 0; attempt < 500; attempt++) {
      topTwist = rand();
      bottomTwist = rand();
      if (topTwist === 0 && bottomTwist === 0) continue;
      nextTop = sq1Rotate(top, topTwist);
      nextBottom = sq1Rotate(bottom, bottomTwist);
      if (isLast || sq1CanSlash(nextTop, nextBottom)) break;
    }

    groups.push(`(${topTwist},${bottomTwist})`);
    top = nextTop;
    bottom = nextBottom;

    if (!isLast) {
      // slash: swap the right half (slots 6-11) between the two layers
      for (let i = 6; i < 12; i++) {
        const swap = top[i];
        top[i] = bottom[i];
        bottom[i] = swap;
      }
    }
  }

  return groups.join(' / ');
}

// Ported from the official WCA scrambler (TNoodle's ClockPuzzle.generateRandomMoves):
// all 9 pin/dial moves on the front, a y2 flip, then only the 5 moves that are
// still reachable on the back (U/R/D/L/ALL - the 4 corner pins stay as the front
// left them, so UR/DR/DL/UL aren't independently turned again).
const CLOCK_MOVES = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'];

function clockMove(name: string): string {
  const turn = Math.floor(Math.random() * 12) - 5; // -5..6
  const clockwise = turn >= 0;
  return `${name}${Math.abs(turn)}${clockwise ? '+' : '-'}`;
}

export function generateClockScramble(): string {
  const front = CLOCK_MOVES.map(clockMove).join(' ');
  const back = CLOCK_MOVES.slice(4).map(clockMove).join(' ');
  return `${front} y2 ${back}`;
}
