# Quaza — Frontier alpha

A playable browser survival game with an original isometric Canvas 2D renderer, seeded toroidal worlds, and a server-backed shared world catalogue. Target browsers: modern Chrome and Firefox.

## Play

- WASD / arrows: move in screen directions. Click ground to walk; click a nearby resource to gather. Space gathers under the cursor.
- Shift: sprint. F: eat berries. E: load or collect from a nearby machine, or rest at a campfire.
- 1–8: select a tool or structure. C: crafting. B / Tab: backpack. J: research. M: world and underground layers. U: universe.
- Select a structure in crafting and click a clear tile within four tiles. R rotates output direction. Right-click dismantles for 75% recovery.
- The world menu provides two underground mining layers. Clear rock to reach copper and crystal veins.
- Drills extract finite mineral deposits. Belts transport one item per second in their facing direction. Furnaces and ore processors consume the displayed mineral-specific recipe. E loads ingredients and collects outputs. Assemblers can produce gears, circuits or research; configure them in Settings.
- Build a World anchor to change daylight, gravity and hostile creature rules.
- The fifth research era, an orbital shuttle, and 72,000 active simulated seconds are required to visit another explorer's world. Creating your own new world starts separate progression.

## Run locally

Node 22.13 or newer is required. Preserve the npm lockfile.

```sh
npm ci
npx wrangler d1 execute DB --local --file drizzle/0000_lethal_joshua_kane.sql --config wrangler.local.json
npm run dev
```

Worlds live in D1, including inventory, player position, depletion, buildings, machine buffers, technology and world rules. An opaque HttpOnly cookie identifies the current browser's explorer; there is no cross-device account recovery yet. Owner-only saves use revision checks to avoid silently overwriting another tab. Save every 15 seconds and when the tab becomes hidden; Settings also provides an explicit Save action. Closing abruptly may lose the most recent unsaved interval.

## Verification

```sh
npx tsc --noEmit
npx esbuild tests/game.test.ts --bundle --platform=node --format=esm --outfile=outputs/game.test.mjs
node outputs/game.test.mjs
node tests/api.test.mjs
npm run build
```

The integration suite needs the running local server. It creates an isolated test world and writes its ID to `outputs/api-test-worlds.json`; remove those exact test records after running it. Never run these tests against production data.

## Architecture and performance

- `lib/game.ts`: deterministic periodic value-noise terrain, three 96 × 96 layers, survival and a fixed 20 Hz simulation. Wrapped coordinate helpers are used for terrain lookup, distances, movement, entities and machines.
- `lib/renderer.ts`: camera culling, cached pixel sprites and terrain tiles, depth sorting, cached minimap, capped device pixel ratio and `requestAnimationFrame`. Hidden tabs stop simulation; frame catch-up is bounded. React receives HUD updates at 5 Hz instead of on every frame.
- `app/api/worlds`: D1-backed catalogue and snapshots, prepared statements, ownership checks, input bounds, same-origin mutations and optimistic save revisions. Active playtime credit is capped by elapsed server wall time.
- `db/schema.ts` and `drizzle/`: schema and versioned migration. Sites packages and applies the migration during deployment.
- `lib/webmcp.ts`: optional feature-detected `read_expedition` and `craft_field_item` tools. No supported WebMCP browser validation context was available during development; tool registration has not been verified in a supporting browser.

## Current boundaries

This is a first playable alpha, not a finished massively multiplayer game. Worlds are shared as persisted snapshots; visitors can explore but cannot modify them. Live player networking, trading, combat beyond animal contact, extensive adventure/puzzle scripting, regional claim permissions, and account-based identity are not implemented. World anchors currently govern whole-world rules. Local simulation remains client-authoritative; the server validates saves and time but is not an anti-cheat simulation server.

The orbital gate enforces a minimum 20 active hours. The current five-era content and economy have not been playtested for a balanced 20-hour campaign. The renderer is written for browser compatibility, but cross-browser UI and frame-rate measurements have not been performed. Performance structures and deterministic tests are in place; large-scale player and factory load testing remains necessary.

Next substantial milestones: authoritative multiplayer regions and player identity; programmable gates, shops and encounter systems; expanded mineral processing and ecology; automated logistics balancing and 20-hour progression playtesting.
