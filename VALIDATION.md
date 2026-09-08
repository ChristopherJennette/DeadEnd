# v1.0.0 baseline validation

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
