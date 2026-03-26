# Grime and Shine Assessment

Assessment date: 2026-03-26

This review focuses on implementation risks in `game.js` and `index.html`, security posture for the browser build, and gaps between the current game and the documented design in `Roguelike Design.md` and `README.md`.

## Executive Summary

- The most immediate runtime issues in core gameplay flow have been addressed, but several state-management and maintainability issues still remain.
- The browser shell is functional but still weak from a supply-chain perspective because it loads a third-party engine from a CDN without integrity protection.
- The game implements the broad loop of moving around a lot, servicing cars, leveling up, and earning persistent stars, but many of the stronger roguelike/roguelite design goals are still partial or absent.

## High-Priority Code Issues

## Medium-Priority Code Quality / Logic Issues

### 1. Level completion measures "interacted" cars, not completed service states

- Time-out completion uses `car.interacted` in `game.js:2463` through `game.js:2498`.
- Full completion also counts `car.interacted` in `game.js:3201` through `game.js:3225`.
- This matches the current one-action model, but it weakens design intent around actually servicing cars and makes some upgrade descriptions misleading.

## Security Review

### 1. Third-party engine is loaded from a CDN without Subresource Integrity

- `index.html:15` loads Kaboom from jsDelivr.
- There is no `integrity` or `crossorigin` attribute.
- If the CDN asset is tampered with, arbitrary JavaScript runs in the page.

### 2. All progression and high-score state is fully client-trusted

- Save data for stars, unlocks, permanent upgrades, and high scores lives entirely in `localStorage` in `game.js:305` through `game.js:454`.
- This is acceptable for a local single-player prototype, but it means progression and scores are trivially editable from devtools.
- If the project later exposes leaderboards or achievements, current saved data must be treated as untrusted.

## Missing or Partial Features Compared to the Design Documents

### 1. Car park layouts are not procedurally generated

- The design calls for randomized car park layouts in `Roguelike Design.md:8` through `Roguelike Design.md:10`.
- The implementation uses a fixed hard-coded parking grid in `game.js:197` through `game.js:235`.
- Only car placement order and car type selection vary.

### 2. WASD movement from the design is missing

- The design specifies movement with WASD or arrow keys in `Roguelike Design.md:4`.
- Gameplay only binds arrow keys in `game.js:1877` through `game.js:1927`.
- `grep` did not show any gameplay `onKeyDown("w")`, `("a")`, `("s")`, or `("d")` movement handlers.

### 3. Search does not find temporary items or buffs during play

- The design mentions finding temporary items or buffs while searching cars in `Roguelike Design.md:32`.
- Search results in `game.js:2885` through `game.js:2968` only yield cash, nothing, or alarms.
- Temporary buffs exist, but only as upgrade-scene purchases in `game.js:1317` through `game.js:1375`.

### 4. Random events are only partially implemented

- The design calls out richer event effects such as reduced visibility, customer priority pressure, and continued arrivals in rush hour in `Roguelike Design.md:38` through `Roguelike Design.md:42`.
- Current events in `game.js:1379` through `game.js:1413` are limited.
- `Customer Demands` is only a placeholder comment in `game.js:1405` through `game.js:1409`.
- `Rainstorm` speeds cleaning but does not alter visibility or targeting.

### 5. Roguelike "one action per car" is undermined by current and planned logic

- The design emphasizes one strategic action per car in `Roguelike Design.md:11` through `Roguelike Design.md:16`.
- Current input already allows invalid off-menu actions as described earlier.
- The `Multitasker` upgrade in `game.js:1525` through `game.js:1530` explicitly promises all three actions on one car, which changes a core rule rather than extending it carefully.

### 6. Permanent upgrade system is narrower than the design vision

- The design mentions unlocking broader tool types and abilities such as steam cleaners, leaf blowers, time extensions, and rare-item boosts in `Roguelike Design.md:33` through `Roguelike Design.md:47`.
- Permanent upgrades in `game.js:1548` through `game.js:1616` mainly cover timers, stat multipliers, starting cash, and character unlocks.
- Specialized tools exist only as run upgrades, not as clear permanent unlock paths.

### 7. Difficulty scaling is present, but challenge variety is still shallow

- The game does reduce time and add more cars in `game.js:1786` through `game.js:1799` and `game.js:1993` through `game.js:1997`.
- Special properties also expand by level in `game.js:2157` through `game.js:2174`.
- Missing pieces include more varied layouts, stronger event mechanics, arrival pressure, boss/rival encounters, and higher-level objective variation described in `Roguelike Design.md:49` through `Roguelike Design.md:62`.

### 8. Narrative and rival/boss systems are absent

- The narrative layer and rival valet ideas from `Roguelike Design.md:58` through `Roguelike Design.md:62` are not represented in `game.js`.

## Recommended Fix Order

1. Add Subresource Integrity to the Kaboom CDN load or vend the dependency locally.
2. Implement WASD movement and the higher-priority missing gameplay features from the design docs.

## Overall Assessment

The project is a promising prototype with a visible gameplay loop and a decent amount of content scaffolding, but it is not yet robust. Several defects are likely to surface quickly in live play, especially once rarer cars and more upgrade paths are exercised. The biggest implementation gap is not polish but reliability: core systems need stronger state management, safer asset handling, and clearer separation between per-run state and persistent progression before the broader roguelike design can land cleanly.
