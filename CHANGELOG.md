# Changelog

## 1.1.0

- Added walk-in, two-room interiors within existing building footprints.
- Added front, rear, and interior doors with open, closed, and locked states.
- Closed doors take one second to open by walking against them or using E / the nearby-door button.
- Locked doors block entry and show “Locked”; some rear doors start locked, with an unlocked front entrance available.
- Added closing for open doors, with occupied-doorway protection and saved door states.
- Added roof cutaways, fading obstructing walls/roofs, and a foreground player pass to prevent scenery hiding the player.
- Replaced solid building collision with walls and doors, including exact sight/attack blocking and swept movement against thin walls.
- Added zombie navigation through open entrances and room doorways; zombies cannot operate closed/locked doors.
- Existing saves gain interiors without resetting progression. Map generation, initial zombie population, artwork, speeds, and damage values remain unchanged.
- Added optional logic regression checks; browser visual/touch validation remains outstanding.

## 1.0.0

- Established pre-interiors Dead End build as new project baseline.
- Extracted CSS from monolithic HTML.
- Extracted JavaScript into logical source files.
- Extracted embedded sprite atlas into standalone asset.
- Prepared project for GitHub Pages hosting.
- No intentional gameplay changes.
