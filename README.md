# Orbit Crew

A cooperative space rescue game designed around disabled players. One to six people choose untimed actions, coordinate with preset signals, and finish a five-sector mission together.

## Development

Use Node 22.13 or newer. Run `npm run install:ci`, `npm run db:generate` only for schema changes, and `npm run build`. Apply the initial local migration using the D1 command in the Sites starter documentation, then run `npm run dev`. The development server defaults to http://127.0.0.1:5173.

The application uses Vinext, React, and Cloudflare D1. Rooms persist server-side. Polling every two seconds synchronizes clients. Compare-and-swap writes protect simultaneous joins and actions. Every room member has a separate secret token kept in tab session storage. Room codes allow joining in the lobby; no in-game accounts are required. Room data expires after seven days of inactivity.

## Checks

- `node tests/game-checks.mjs`: mission rules, pauses, round boundaries, token privacy, departure, solo victory, replay, and low energy.
- `node tests/api-checks.mjs`: run against a local server; exercises concurrent joins, capacity, simultaneous moves, persistence, and full six-player victory.
- `npx tsc --noEmit`: TypeScript validation.

## Accessibility design

- All gameplay information is available as text; decorative SVGs are hidden from assistive technology.
- Keyboard operation, named controls, native modal dialogs, focus management, and polite mission announcements.
- Three text sizes, higher contrast, simpler presentation, optional spoken mission updates, and Space-key single-switch scanning with four speeds. Escape stops scanning.
- Invite links avoid manual room-code entry; preset callsigns and crew messages avoid mandatory typing or speaking.
- No round timers, flashing effects, background animation, dragging, held buttons, or required rapid input.
- Calm and expedition modes, solo practice, crew pause/resume, persistent mission logs, and repeatable missions.

These are implemented access features, not a claim of universal accessibility. Testing with disabled players using their usual assistive technology remains part of validating the game.

## Hosting

`.openai/hosting.json` identifies the Site and its D1 binding. Publish through the Sites source workflow. The initial hosted version is owner-private. The game is ready for anonymous room-based play once the Site audience is changed to public by the owner.
