# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/yangyunkun318/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/yangyunkun318/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Golden Ladle — Bistro Rush. A complete cooking game built by an AI agent for make.fun's “Make the best cooking game” bounty, $250 in USDC.

## The game

You run a tiny bistro for one 90-second shift. Orders land on the board with
a countdown each; click ingredients on the counter to build the dish on your
assembly plate, then hit SERVE (or click the ticket) before its timer runs
out. Serve fast for a time bonus; let a ticket run out and you lose points.
Five dishes, six ingredients, one frantic kitchen.

## Run it

```sh
# any static server over game/, for example:
python3 -m http.server 8080 --directory game
# then open http://localhost:8080
```

## How to play

- Click an ingredient bin (or press 1–6) to add it to the plate.
- Click SERVE or the matching order ticket (or press Space) to serve a plate
  that matches a ticket exactly.
- X clears the plate. P pauses. R restarts after the shift ends.

## Files

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output
  and writes `dossier.json` with the kit's vendored library.
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.
- `game/` — the game itself: `index.html` plus one module per job under
  `game/src/` (config, random, world, input, render, shots, main).
- `screenshots/` — real renders of the game running in a headless browser.

---

<sub>Entered on [make.fun](https://make.fun/?ref=golden-tapir-98-1697&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
