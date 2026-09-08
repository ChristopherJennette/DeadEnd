# Dead End

**Version 1.0.0 — pre-interiors baseline.** A mobile-first, isometric zombie survival game: scavenge an outdoor town, fight automatically, develop your character, and complete a radio escape objective. Desktop widescreen and touch controls are supported.

The project intentionally uses only static HTML, CSS, and vanilla JavaScript. No frameworks, runtime libraries, CDNs, npm, Node dependency, backend, database, or build step are required.

## Play

Open `index.html`, or visit the GitHub Pages site after deployment:
https://ChristopherJennette.github.io/DeadEnd/

Choose **New Survival Run**, review Character, then press **Resume**. Stand still beside supply crates to search once nearby zombies are cleared. Use Character to spend points, consume supplies, and select radio objectives. Equipment purchased in the title-screen Locker applies to new runs.

| Control | Action |
| --- | --- |
| Touch/mouse drag on the play area | Floating movement joystick |
| WASD / arrow keys | Move |
| C / Sneak button | Toggle sneak; hold automatic gunfire |
| Space / Dodge button | Dodge in movement direction |
| B / Character button | Character, inventory, stats, skills |
| Escape / P / pause button | Pause or resume through the existing menus |
| Combat | Automatic ranged and melee attacks |

Saves and permanent equipment use the existing localStorage keys. Runs autosave every 15 seconds and during menu actions. Continue Survival loads a saved run. End Run banks scrap and removes the active run save. Browser storage is origin-specific: an old local-file save does not automatically transfer to GitHub Pages.

## GitHub Pages

In repository **Settings → Pages**, select **Deploy from a branch**, then **main** and **/ (root)**, and click **Save**. The entry point is `index.html`. All assets use relative URLs compatible with `/DeadEnd/`. `.nojekyll` keeps publishing static files directly.

## Source layout and dependency order

| Path | Responsibility |
| --- | --- |
| `index.html` | Existing canvas/UI markup and ordered script references |
| `css/game.css` | Original stylesheet |
| `assets/sprites/sprite-atlas.png` | Original 4×4 sprite atlas, extracted unchanged |
| `js/core.js` | Version, shared state, math, viewport |
| `js/world.js` | Town generation, collision, line of sight |
| `js/zombies.js` | Spawning, perception, pursuit, separation |
| `js/combat.js` | Damage, accuracy, dodge, kill rewards |
| `js/progression.js` | XP, attributes, skills, talents |
| `js/survival.js` | Needs, loot, collection, radio mission rules |
| `js/equipment.js` | Gear, loadouts, scrap and locker persistence |
| `js/save.js` | Active-run save/load and existing migrations |
| `js/ui.js` | Title, Character, radio, locker and pause menus |
| `js/rendering.js` | Atlas loading, world/actor drawing, HUD, minimap |
| `js/input.js` | Pointer and keyboard input, focus handling |
| `js/main.js` | Run initialization, intact simulation loop, startup |

Scripts share the original global bindings; they are intentionally classic scripts, not ES modules. Keep the order in `index.html`, do not add `async`, and keep `main.js` last. Functions may refer to other files' bindings, but startup only runs once all scripts have loaded. The tightly coupled simulation and drawing functions remain intact to preserve operation order.

## Development rule

This release establishes the supplied pre-interiors build as the authoritative baseline. No intentional gameplay changes. Version future gameplay changes in `GAME_VERSION` in `js/core.js` and document them in `CHANGELOG.md`. Application versioning is separate from the preserved save-schema versions. Do not add interiors or later-build features without a separate versioned change.

To replace artwork independently, replace the PNG while preserving its dimensions and 4×4 frame mapping. Its loading path is in `js/rendering.js`.
