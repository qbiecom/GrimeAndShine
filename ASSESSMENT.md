# Grime and Shine Assessment

Assessment date: 2026-03-26

This review focuses on implementation risks in `game.js` and `index.html`, security posture for the browser build, and gaps between the current game and the documented design in `Roguelike Design.md` and `README.md`.

## Executive Summary

- The most immediate runtime issues in core gameplay flow have been addressed, but several state-management and maintainability issues still remain.
- The browser shell is functional but still weak from a supply-chain perspective because it loads a third-party engine from a CDN without integrity protection.
- The game implements the broad loop of moving around a lot, servicing cars, leveling up, and earning persistent stars, but many of the stronger roguelike/roguelite design goals are still partial or absent.

## High-Priority Code Issues

## Medium-Priority Code Quality / Logic Issues

## Security Review

### 2. All progression and high-score state is fully client-trusted

- Save data for stars, unlocks, permanent upgrades, and high scores lives entirely in `localStorage` in `game.js:305` through `game.js:454`.
- This is acceptable for a local single-player prototype, but it means progression and scores are trivially editable from devtools.
- If the project later exposes leaderboards or achievements, current saved data must be treated as untrusted.

## Missing or Partial Features Compared to the Design Documents

### 1. Car park layouts are not procedurally generated

- The design calls for randomized car park layouts in `Roguelike Design.md:8` through `Roguelike Design.md:10`.
- The implementation uses a fixed hard-coded parking grid in `game.js:197` through `game.js:235`.
- Only car placement order and car type selection vary.

### 4. Permanent upgrade system is narrower than the design vision

- The design mentions unlocking broader tool types and abilities such as steam cleaners, leaf blowers, time extensions, and rare-item boosts in `Roguelike Design.md:33` through `Roguelike Design.md:47`.
- Permanent upgrades in `game.js:1548` through `game.js:1616` mainly cover timers, stat multipliers, starting cash, and character unlocks.
- Specialized tools exist only as run upgrades, not as clear permanent unlock paths.

### 5. Difficulty scaling is present, but challenge variety is still shallow

- The game does reduce time and add more cars in `game.js:1786` through `game.js:1799` and `game.js:1993` through `game.js:1997`.
- Special properties also expand by level in `game.js:2157` through `game.js:2174`.
- Missing pieces include more varied layouts, stronger event mechanics, arrival pressure, boss/rival encounters, and higher-level objective variation described in `Roguelike Design.md:49` through `Roguelike Design.md:62`.

### 6. Narrative and rival/boss systems are absent

- The narrative layer and rival valet ideas from `Roguelike Design.md:58` through `Roguelike Design.md:62` are not represented in `game.js`.

## Recommended Fix Order

1. Add Subresource Integrity to the Kaboom CDN load or vend the dependency locally.
2. Implement the higher-priority missing gameplay features from the design docs.

## Overall Assessment

The project is a promising prototype with a visible gameplay loop and a decent amount of content scaffolding, but it is not yet robust. Several defects are likely to surface quickly in live play, especially once rarer cars and more upgrade paths are exercised. The biggest implementation gap is not polish but reliability: core systems need stronger state management, safer asset handling, and clearer separation between per-run state and persistent progression before the broader roguelike design can land cleanly.
