import { board } from "./chess/board";
import { bishop, king, knight, pawn, queen, rook } from "./chess/pieces";
import { castling, check, checkmate, draws, enPassant, notation, promotion, setup, stalemate, values } from "./chess/rules";
import type { LearningNode } from "./types";

export const NODES: LearningNode[] = [
  board,
  rook,
  bishop,
  knight,
  king,
  pawn,
  queen,
  values,
  check,
  checkmate,
  stalemate,
  castling,
  promotion,
  enPassant,
  draws,
  notation,
  setup,
];

export const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

export function getNode(id: string): LearningNode {
  const n = NODE_BY_ID.get(id);
  if (!n) throw new Error(`Unknown node ${id}`);
  return n;
}

const ITEM_INDEX = new Map(NODES.flatMap((n) => n.items.map((i) => [i.id, { node: n, item: i }] as const)));

export function getItem(itemId: string) {
  const hit = ITEM_INDEX.get(itemId);
  if (!hit) throw new Error(`Unknown item ${itemId}`);
  return hit;
}

/** Nodes that list this node as a prerequisite. */
export function unlocks(id: string): LearningNode[] {
  return NODES.filter((n) => n.prereqs.includes(id));
}

/** Every node this one depends on, directly or indirectly. */
export function ancestors(id: string): Set<string> {
  const out = new Set<string>();
  const walk = (x: string) => {
    for (const p of getNode(x).prereqs) {
      if (out.has(p)) continue;
      out.add(p);
      walk(p);
    }
  };
  walk(id);
  return out;
}

/** Topological order; throws on a cycle. */
export function topoOrder(): string[] {
  const order: string[] = [];
  const state = new Map<string, 1 | 2>();
  const visit = (id: string, path: string[]) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) throw new Error(`Cycle: ${[...path, id].join(" -> ")}`);
    state.set(id, 1);
    for (const p of getNode(id).prereqs) visit(p, [...path, id]);
    state.set(id, 2);
    order.push(id);
  };
  for (const n of NODES) visit(n.id, []);
  return order;
}
