"""Pick Tempo's puzzle set from the Lichess open puzzle database (CC0).

Reads the full CSV on stdin and writes data/puzzles.csv: for every theme the
curriculum teaches, in every 100-point rating band, the most popular
well-tested puzzles. Run by .github/workflows/puzzles.yml.
"""
import csv
import heapq
import sys
from collections import defaultdict

THEMES = [
    "mateIn1", "mateIn2", "mateIn3", "backRankMate", "smotheredMate", "anastasiaMate",
    "arabianMate", "hookMate", "doubleBishopMate", "dovetailMate", "bodenMate",
    "hangingPiece", "fork", "pin", "skewer", "discoveredAttack", "doubleCheck",
    "deflection", "attraction", "capturingDefender", "trappedPiece", "intermezzo",
    "xRayAttack", "clearance", "interference", "quietMove", "defensiveMove",
    "sacrifice", "promotion", "underPromotion", "enPassant", "castling", "zugzwang",
    "advancedPawn", "exposedKing", "kingsideAttack",
    "pawnEndgame", "rookEndgame", "queenEndgame", "bishopEndgame", "knightEndgame",
]
PER_BAND = 60
LOW, HIGH = 400, 2700
MIN_POP, MIN_PLAYS, MAX_RD = 85, 300, 80

best = defaultdict(list)  # (theme, band) -> heap of (score, id)
rows = {}
reader = csv.reader(sys.stdin)
header = next(reader)
for r in reader:
    pid, fen, moves, rating, rd, pop, plays, themes = r[:8]
    rating, rd, pop, plays = int(rating), int(rd), int(pop), int(plays)
    if not (LOW <= rating < HIGH) or pop < MIN_POP or plays < MIN_PLAYS or rd > MAX_RD:
        continue
    tags = themes.split()
    hit = [t for t in tags if t in THEMES]
    if not hit:
        continue
    band = rating // 100
    score = (pop, plays)
    kept = False
    for t in hit:
        h = best[(t, band)]
        if len(h) < PER_BAND:
            heapq.heappush(h, (score, pid)); kept = True
        elif score > h[0][0]:
            heapq.heapreplace(h, (score, pid)); kept = True
    if kept:
        rows[pid] = (pid, fen, moves, rating, " ".join(tags))

import os
os.makedirs("data", exist_ok=True)
chosen = sorted({pid for h in best.values() for _, pid in h})
with open("data/puzzles.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["id", "fen", "moves", "rating", "themes"])
    for pid in chosen:
        w.writerow(rows[pid])
print(f"wrote {len(chosen)} puzzles", file=sys.stderr)
