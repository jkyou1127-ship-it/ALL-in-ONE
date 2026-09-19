// Generates a simple isometric Rubik's-cube style icon as SVG and writes it
// to public/favicon.svg. Run `node scripts/generate-icon.mjs` afterwards to
// rasterize it into build/icon.ico for the desktop app.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const s = 100; // cube edge length
const w = s * Math.cos(Math.PI / 6); // 86.6
const h = s * Math.sin(Math.PI / 6); // 50

const T = [128, 22]; // top vertex
const L = [T[0] - w, T[1] + h];
const R = [T[0] + w, T[1] + h];
const M = [T[0], T[1] + 2 * h];
const c = [0, s]; // vertical drop

const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
const lerp = (p, v, t) => [p[0] + v[0] * t, p[1] + v[1] * t];

const a = [L[0] - T[0], L[1] - T[1]]; // T -> L
const b = [R[0] - T[0], R[1] - T[1]]; // T -> R

function grid(origin, v1, v2, fill) {
  const cells = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const p0 = add(add(origin, lerp([0, 0], v1, i / 3)), lerp([0, 0], v2, j / 3));
      const p1 = add(add(origin, lerp([0, 0], v1, (i + 1) / 3)), lerp([0, 0], v2, j / 3));
      const p2 = add(add(origin, lerp([0, 0], v1, (i + 1) / 3)), lerp([0, 0], v2, (j + 1) / 3));
      const p3 = add(add(origin, lerp([0, 0], v1, i / 3)), lerp([0, 0], v2, (j + 1) / 3));
      const pts = [p0, p1, p2, p3].map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' ');
      cells.push(`<polygon points="${pts}" fill="${fill}" stroke="#00000022" stroke-width="1.5" />`);
    }
  }
  return cells.join('\n      ');
}

const topCells = grid(T, a, b, '#f4f5f7');
const leftCells = grid(L, b, c, '#f2822a');
const rightCells = grid(R, a, c, '#3b6cf6');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <g>
      ${topCells}
      ${leftCells}
      ${rightCells}
  </g>
</svg>
`;

writeFileSync(path.join(root, 'public', 'favicon.svg'), svg);
console.log('wrote public/favicon.svg');
