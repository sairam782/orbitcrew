# Orbit Crew · Beyond the last lighthouse

A cooperative space adventure designed around disabled players. One to six crew members follow distress signals, solve shared relay puzzles, and bring stranded travelers home across four jumps.

## Play

1. Create a crew, invite friends by room code or link, and choose a specialty: Pilot, Engineer, or Signal analyst. Every role can solve every puzzle.
2. Vote for a destination. Routes show traveler count, crossing damage, and energy cost. Majority wins; the captain breaks ties.
3. Rotate relays to connect the ship entry to the shuttle exit. Everyone shares one persistent board. Keyboard arrows move between relays; Enter or Space turns a relay. Left and Right controls turn the focused relay in either direction.
4. Use free hints or one of your two specialist tool uses. Pilot shields absorb damage; Engineer bridges align two relays; Analyst tools recover energy and show a clue.
5. When the connection is complete, everyone confirms the rescue. A board change clears all confirmations so nobody launches an outdated plan.
6. The crossing consumes energy and hull. Each missing energy unit costs eight additional hull. Vote for one of two persistent upgrades after each of the first three rescues.
7. Reach home after four rescues with hull remaining and at least ten travelers in Calm voyage or twelve in Expedition. Replay for different routes, boards, tools, upgrades, and endings.

## Development

Use Node 22.13 or newer. Install with `npm run install:ci`, build with `npm run build`, and start the preview with `npm run dev`. The local URL defaults to http://127.0.0.1:5173.

The application uses Vinext, React, and Cloudflare D1. Apply `drizzle/0000_bent_silver_surfer.sql` to the local D1 database before first use. The local database in this project has already been initialized. Generate new migrations only when the schema changes.

Rooms persist server-side; polling synchronizes players. Compare-and-swap database writes protect concurrent joins and moves. Each member has a secret session token. Public puzzle data omits solution orientations and the intended solution path. Existing version-one rooms safely return to the lobby on upgrade while retaining membership. Room sessions expire after seven days of inactivity.

## Checks

- `node tests/game-checks.mjs`: generated board solvability, private solutions, votes, pauses, tool limits, changing confirmations, upgrades, full solo and six-player adventures, replay, and old-room migration.
- `node tests/api-checks.mjs`: with the local server running, exercises real concurrent joins and moves, puzzle solving through public hints, all four rescues, upgrades, victory, persistence, and replay.
- `npx tsc --noEmit`: TypeScript checks.

## Access features

Untimed play, no move limits, free hints, shared clues, named keyboard controls, direction descriptions on every relay, persistent mission text, native modal dialogs, focus management, and live status announcements. Each device has three text sizes, higher contrast, a simpler view, optional spoken updates, and Space-key single-switch scanning with four speeds. Escape stops scanning. All important information is available as text; voice and precise pointer movement are optional. Invitation links and preset crew signals avoid required typing. Anyone can pause.

These features still need playtesting with disabled players using their usual assistive technology. No particular role requires a specific input method or sensory ability.

## Hosting

`.openai/hosting.json` preserves the existing Site identity and D1 binding. The hosted review version remains owner-private. Use the Sites source workflow to publish updates; the separate project Git history remains in this folder.
