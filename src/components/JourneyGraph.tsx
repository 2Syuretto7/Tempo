import { CURRICULUMS, COURSES } from '../content/curriculum';
import { courseProgress } from '../engine/learning';
import { href } from '../router';

// The journey drawn as a graph of curriculums: sequential at the top,
// Strategy and Endgames in parallel, Mastery mixing both.

const W = 760;

interface Node {
  id: string;
  x: number;
  y: number;
  w: number;
}

const NODES: Node[] = [
  { id: '1', x: 230, y: 20, w: 300 },
  { id: '2', x: 230, y: 130, w: 300 },
  { id: '3', x: 40, y: 250, w: 300 },
  { id: '4', x: 420, y: 250, w: 300 },
  { id: '5', x: 230, y: 370, w: 300 },
];
const H = 76;

export function JourneyGraph() {
  const pos = (id: string) => NODES.find((n) => n.id === id)!;
  const pct = (cid: string) => {
    const courses = COURSES.filter((c) => c.curriculumId === cid);
    const done = courses.reduce((s, c) => s + courseProgress(c.id).done, 0);
    const total = courses.reduce((s, c) => s + c.lessons.length, 0);
    return { done, total };
  };
  const c = (id: string) => {
    const n = pos(id);
    return { cx: n.x + n.w / 2, top: n.y, bottom: n.y + H };
  };
  return (
    <svg viewBox={`0 0 ${W} 462`} class="journey-graph" role="img" aria-label="The five curriculums and how they connect">
      <defs>
        <marker id="jg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--ink-3)" />
        </marker>
        <marker id="jg-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--accent)" />
        </marker>
      </defs>
      <g fill="none" stroke="var(--ink-3)" stroke-width="1.4">
        <path d={`M${c('1').cx} ${c('1').bottom} V${c('2').top}`} marker-end="url(#jg-arrow)" />
        <path d={`M${c('2').cx} ${c('2').bottom} V${c('2').bottom + 18} H${c('3').cx} V${c('3').top}`} marker-end="url(#jg-arrow)" />
        <path d={`M${c('2').cx} ${c('2').bottom} V${c('2').bottom + 18} H${c('4').cx} V${c('4').top}`} marker-end="url(#jg-arrow)" />
        <path d={`M${c('3').cx} ${c('3').bottom} V${c('3').bottom + 18} H${c('5').cx} V${c('5').top}`} marker-end="url(#jg-arrow)" />
        <path d={`M${c('4').cx} ${c('4').bottom} V${c('4').bottom + 18} H${c('5').cx}`} />
      </g>
      <path d={`M${pos('3').x + pos('3').w} ${pos('3').y + H / 2} H${pos('4').x}`} stroke="var(--accent)" stroke-width="1.8" fill="none" marker-start="url(#jg-accent)" marker-end="url(#jg-accent)" />
      <text x={W / 2} y={pos('3').y + H / 2 - 10} text-anchor="middle" class="jg-note">
        cross-linked
      </text>
      {CURRICULUMS.map((cur) => {
        const n = pos(cur.id);
        const { done, total } = pct(cur.id);
        const frac = total ? done / total : 0;
        return (
          <a key={cur.id} href={href.course(COURSES.find((co) => co.curriculumId === cur.id)!.id)} class="jg-node">
            <rect x={n.x} y={n.y} width={n.w} height={H} rx="12" class="jg-box" />
            <text x={n.x + 18} y={n.y + 28} class="jg-title">
              {cur.id}. {cur.title}
            </text>
            <text x={n.x + 18} y={n.y + 48} class="jg-sub">
              {cur.tagline} · {cur.mode}
            </text>
            <rect x={n.x + 18} y={n.y + 58} width={n.w - 36} height="5" rx="2.5" class="jg-track" />
            <rect x={n.x + 18} y={n.y + 58} width={Math.max(0, (n.w - 36) * frac)} height="5" rx="2.5" class="jg-fill" />
          </a>
        );
      })}
    </svg>
  );
}
