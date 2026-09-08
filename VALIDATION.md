# Validation

## v1.1.0 — interiors and doors

Automated logic checks: `node tests/interiors.cjs` (optional developer command, not a game runtime requirement). Uses isolated JavaScript contexts with stubbed DOM/canvas/Image/localStorage, and compares the initial world to the committed v1.0.0 baseline.

- Initial world generation, building footprints, trees/cars, zombie population, player stats, and RNG seed match the baseline.
- All existing buildings have two rooms and three doors. Main entrances are closed/unlocked; some rear entrances are locked.
- One-second closed-door opening, cancellation, keyboard/button interactions, locked-door messages and collision, and occupied-doorway closing protection checked.
- Thin-wall collision, exact line of sight, interior partition passage, and zombie navigation through open doorways checked.
- Closed-door combat blocking and open-door automatic ranged/melee attacks checked.
- Door states and indoor positions survive save/load; old saves gain default doors without resetting progression.
- Rendering-call order puts the player after all buildings and trees; screen-space fading tests include the entire sprite.
- Runtime files parse and use existing static, project-relative loading. No new runtime dependencies or generated artwork.

**Not browser-validated:** real visual output, native touch/pointer capture, actual image requests, mobile performance, and live GitHub Pages deployment. The logic/render-order checks are not screenshots or browser tests.

Manual release checks:

1. Enter a front door by pushing against it: it stays closed for one second, then opens. Try a locked rear door and confirm “Locked.”
2. Walk through both rooms; check roof removal and player visibility behind every exterior/interior wall. Return outside and check roof/wall fading.
3. Open a path for pursuing zombies, then close an empty doorway. Confirm nobody passes, bites, or shoots through the closed door.
4. Reload and Continue Survival: confirm player location, progression, and door states persist. Repeat on touch and desktop browsers and check for console errors.

## v1.0.0 — historical baseline validation

Authoritative input: `dead-end-pre-interiors.html`.

- Source SHA-256: `3f9cc235f91ccb8c98a5ef0d54dace9ed795aef83c3d0dd6c0cdc1f25297843e`
- Extracted PNG SHA-256: `4d74190ecd971583d0645b26289176c4d071b01d3acc9e8aa8b85d3d23036890`
- PNG dimensions: 1254 × 1254. Original bytes decoded exactly; no optimization or artwork changes.

## Completed checks

- All 12 JavaScript files parse successfully.
- Every static CSS/script reference exists and uses a project-relative path.
- PNG decoding and integrity checked; atlas path exists.
- No embedded image data remains in HTML or JavaScript.
- Original stylesheet preserved exactly.
- Every original JavaScript function/declaration segment retained exactly once, with only the atlas URL substituted. Classic-script ordering checked; main starts last.
- Original and modular scripts executed with identical deterministic inputs in isolated JavaScript contexts using DOM, canvas, Image and localStorage stubs. Initial world state and final gameplay/save state matched exactly.
- That simulation exercised title markup, New Survival Run, Character, stat/skill spending, radio menu, keyboard and pointer handlers, 165 initial zombies, pursuit, ranged and melee combat, inventory consumption, drawing code, and save/load.

## Browser validation limitation

Full browser execution was unavailable: Chromium was absent and its download failed. The simulation does not establish visual correctness, real touch/pointer capture, actual browser console cleanliness, image network loading, or live GitHub Pages behavior. Check these in the published site before treating the release as browser-validated.

1. Open the project URL; confirm the title screen and sprite artwork render.
2. Start New Survival Run, review Character, and Resume. Move by touch/drag or keyboard; confirm pursuit and automatic ranged/melee combat.
3. Open Character, use supplies and spend points, then reload and choose Continue Survival. Confirm saved progress returns.
4. Check browser console/network for errors or missing assets, and check desktop widescreen plus mobile portrait layout.

## Differences from the source

- CSS and JavaScript extracted into responsibility-based static files; declarations grouped and script load ordering made explicit.
- Original embedded atlas changed to `./assets/sprites/sprite-atlas.png`. It now loads as a separate request, using the original fallback drawing while unavailable.
- Added `GAME_VERSION = "1.0.0"`; no visible version label or title-screen redesign.
- Added whitespace between static HTML elements for readability; original markup and inline element styles retained.
- Added README, changelog, this validation record, and `.nojekyll`.
- Existing save keys, schema versions, gameplay values, rendering functions and UI text are unchanged. Browser-origin storage rules still apply when moving from a local file to a hosted page.
