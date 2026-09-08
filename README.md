# Dead End

**Version 1.1.0 — interiors and doors.** A mobile-first, isometric zombie survival game: explore a town and its buildings, scavenge, fight automatically, develop your character, and complete a radio escape objective. Desktop widescreen and touch controls are supported.

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
| E / nearby-door button | Open a closed door in 1 second; close an open door |
| Escape / P / pause button | Pause or resume through the existing menus |
| Combat | Automatic ranged and melee attacks |

Saves and permanent equipment use the existing localStorage keys. Runs autosave every 15 seconds and during menu actions. Continue Survival loads a saved run. End Run banks scrap and removes the active run save. Browser storage is origin-specific: an old local-file save does not automatically transfer to GitHub Pages.

## Interiors and doors

Existing buildings now contain two rooms connected by an interior doorway, plus front and rear entrances. Roofs disappear while you are inside. Walls and roofs that overlap your character fade; the player is drawn above world scenery so no building or tree can hide them.

- **Closed:** walk against the door for one uninterrupted second, or press E / the door button and remain nearby for one second. Releasing movement cancels automatic opening; leaving or opening a menu cancels an unfinished action.
- **Open:** both players and zombies can pass. Press E / the door button to close it; an occupied doorway cannot close.
- **Locked:** impassable, with a “Locked” message when attempted. Some rear entrances start locked; front and room doors start closed but unlocked. No keys, unlocking, or lockpicking in this version.

Walls and closed/locked doors block movement, sight, gunfire, melee, and pickups. Zombies can follow open doorways but do not operate doors. Doors retain their states when saving/loading. Existing v1.0.0 saves gain interiors without resetting the run or locker. No new loot, enemies, building footprints, or speed/damage changes were added.

## GitHub Pages

In repository **Settings → Pages**, select **Deploy from a branch**, then **main** and **/ (root)**, and click **Save**. The entry point is `index.html`. All assets use relative URLs compatible with `/DeadEnd/`. `.nojekyll` keeps publishing static files directly.

## Source layout and dependency order

| Path | Responsibility |
| --- | --- |
| `index.html` | Existing canvas/UI markup and ordered script references |
| `css/game.css` | Baseline styling plus the contextual door button |
| `assets/sprites/sprite-atlas.png` | Original 4×4 sprite atlas, extracted unchanged |
| `js/core.js` | Version, shared state, math, viewport |
| `js/world.js` | Town generation, interiors, doors, collision, line of sight, doorway routes |
| `js/zombies.js` | Spawning, perception, pursuit, doorway navigation, separation |
| `js/combat.js` | Damage, accuracy, dodge, kill rewards |
| `js/progression.js` | XP, attributes, skills, talents |
| `js/survival.js` | Needs, loot, collection, radio mission rules |
| `js/equipment.js` | Gear, loadouts, scrap and locker persistence |
| `js/save.js` | Active-run save/load and existing migrations |
| `js/ui.js` | Title, Character, radio, locker and pause menus |
| `js/rendering.js` | Atlas loading, floors/walls/doors, cutaways, player visibility, HUD, minimap |
| `js/input.js` | Pointer and keyboard input, focus handling |
| `js/main.js` | Run initialization, simulation loop, startup |
| `tests/interiors.cjs` | Optional standard-library-only logic regression tests |

Scripts share the original global bindings; they are intentionally classic scripts, not ES modules. Keep the order in `index.html`, do not add `async`, and keep `main.js` last. Functions may refer to other files' bindings, but startup only runs once all scripts have loaded. Interior geometry is derived without consuming the game's random sequence; only door states are added to saved buildings.

## Development rule

**v1.0.0 is the pre-interiors baseline**, preserved in Git history at `6808f8f1d562e94e748ae1795e4895609f95c374`. v1.1.0 adds the separately approved interiors/doors feature. Version every gameplay change in `GAME_VERSION` in `js/core.js` and document it in `CHANGELOG.md`. Application versioning is separate from save-schema versions.

To replace artwork independently, replace the PNG while preserving its dimensions and 4×4 frame mapping. Its loading path is in `js/rendering.js`.

Optional developer check: `node tests/interiors.cjs` from a full Git checkout. These tests need only Node's standard library, not npm or third-party packages, and do not run in the game. They use DOM/canvas stubs and do not replace actual browser/touch testing. See `VALIDATION.md`.
