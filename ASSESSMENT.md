# Grime and Shine Assessment

Assessment date: 2026-03-26

This review focuses on implementation risks in `game.js` and `index.html`, security posture for the browser build, and gaps between the current game and the documented design in `Roguelike Design.md` and `README.md`.

## Executive Summary

- The project has several likely runtime-breaking issues in core gameplay flow, especially around asset loading, upgrade effects, and scene-local helper usage.
- The browser shell is functional but weak from a supply-chain and hardening perspective because it loads a third-party engine from a CDN without integrity protection and defines no Content Security Policy.
- The game implements the broad loop of moving around a lot, servicing cars, leveling up, and earning persistent stars, but many of the stronger roguelike/roguelite design goals are still partial or absent.

## High-Priority Code Issues

### 1. Kaboom is initialized with a missing canvas selector

- `game.js:12` passes `canvas: document.querySelector("#game-canvas")`.
- `index.html:28` through `index.html:33` contains no element with `id="game-canvas"`.
- Best case, Kaboom ignores `null` and creates its own canvas. Worst case, startup fails or behaves inconsistently across versions/browsers.

### 2. Most car types do not have the alternate sprites the game uses at runtime

- Only `sedan_*` and `sportscar_*` variants are loaded in `game.js:464` through `game.js:473`.
- Spawn logic switches cars to `${carType}_dirty` or `${carType}_vacuum` in `game.js:2124` through `game.js:2132`.
- Completion switches every interacted car to `${carType}_clean` in `game.js:2843` through `game.js:2844`.
- For `compact`, `suv`, `pickup`, `van`, `luxury`, and `junker`, this is a likely missing-asset runtime failure.

### 3. Multiple movement upgrades reference `playerSpeed`, but `playerSpeed` is not in scope

- Upgrade effects in `game.js:1445`, `game.js:1463`, `game.js:1477`, and `game.js:1495` mutate `playerSpeed`.
- Movement speed is actually declared as a scene-local constant at `game.js:1845`.
- When any of these upgrade effects run, they are likely to throw `ReferenceError: playerSpeed is not defined`.

### 4. `showFeedback()` is called from the upgrade scene, but it only exists inside the main gameplay scene

- `upgradeScene` calls `showFeedback()` in `game.js:3870` and `game.js:3913`.
- `showFeedback()` is defined inside `scene("main", ...)` at `game.js:3337` through `game.js:3369`.
- This should throw at runtime the first time the player cannot afford an upgrade or unlocks a character from the upgrade scene.

### 5. Action restrictions are enforced by UI, not by gameplay logic

- The interaction menu only shows valid actions for a car state in `game.js:2608` through `game.js:2616`.
- Input handlers still allow all three actions whenever a target car is selected in `game.js:3309` through `game.js:3324`.
- `performInteraction()` checks only `car.interacted` and `actionInProgress` in `game.js:2752` through `game.js:2755`; it does not validate whether the chosen action is allowed for that car.
- A player can open the menu on a cleaning-only car and still press `1` or `3`, bypassing the intended decision model.

### 6. Permanent upgrades can stack incorrectly across sessions and runs

- Purchased permanent upgrades mutate `playerStats` immediately in the shop via their `effect()` functions.
- They are applied again at run start in `game.js:1766` through `game.js:1777`.
- `playerStats` is only reset on the game-over path in `game.js:3488` through `game.js:3498`.
- Result: bonuses can be double-applied in the same browser session, and repeated level-1 restarts can produce inflated permanent bonuses.

### 7. Character selection is not persisted even though save data has a setting for it

- Save structure defines `settings.selectedCharacter` in `game.js:324` through `game.js:326`.
- The characters scene only updates the in-memory `selectedCharacterId` in `game.js:817` through `game.js:819` and `game.js:860` through `game.js:863`.
- `selectedCharacterId` is initialized to `"base"` in `game.js:1750` through `game.js:1751` and is never loaded from save data.
- Reloading the page loses the player’s selected character.

### 8. "End run and unlock character" does not actually end the run cleanly

- The upgrade scene advertises `[U] End run and unlock character` in `game.js:3888`.
- The handler immediately starts a new run with `go("main", { level: 1, cash: cash })` in `game.js:3917`.
- This skips a clear run-complete/menu transition, and it interacts poorly with the already fragile stat reset logic.

## Medium-Priority Code Quality / Logic Issues

### 9. Event-handler cleanup code is misleading and likely incorrect

- Scenes register new handlers inside `onSceneLeave()` in `game.js:876` through `game.js:885`, `game.js:1246` through `game.js:1256`, `game.js:3504` through `game.js:3507`, and `game.js:3989` through `game.js:4005`.
- Calling `onKeyPress(..., () => {})` during teardown does not remove an old handler; it registers another one.
- If Kaboom does not fully isolate scene handlers, this can produce duplicate or ghost input behavior.

### 10. Save data is parsed without schema/version validation

- `SaveSystem.load()` directly parses whatever is in `localStorage` in `game.js:333` through `game.js:345`.
- There is no migration step and no merge with defaults.
- Corrupt or manually edited save payloads can leave missing fields such as `settings`, `statistics`, or `unlockedCharacters`, causing unstable behavior later.

### 11. Level completion measures "interacted" cars, not completed service states

- Time-out completion uses `car.interacted` in `game.js:2463` through `game.js:2498`.
- Full completion also counts `car.interacted` in `game.js:3201` through `game.js:3225`.
- This matches the current one-action model, but it weakens design intent around actually servicing cars and makes some upgrade descriptions misleading.

### 12. Debug UI is always visible in gameplay

- `debugText` is added in `game.js:1937` through `game.js:1947` and constantly updated in `game.js:1951` through `game.js:1987`.
- This looks like development instrumentation left enabled in production.

## Security Review

### 1. Third-party engine is loaded from a CDN without Subresource Integrity

- `index.html:15` loads Kaboom from jsDelivr.
- There is no `integrity` or `crossorigin` attribute.
- If the CDN asset is tampered with, arbitrary JavaScript runs in the page.

### 2. No Content Security Policy is present

- `index.html` defines no CSP meta tag, and there is no evidence of server-side CSP guidance.
- For a static game, a restrictive CSP is one of the main hardening measures against script injection and compromised dependencies.

### 3. All progression and high-score state is fully client-trusted

- Save data for stars, unlocks, permanent upgrades, and high scores lives entirely in `localStorage` in `game.js:305` through `game.js:454`.
- This is acceptable for a local single-player prototype, but it means progression and scores are trivially editable from devtools.
- If the project later exposes leaderboards or achievements, current saved data must be treated as untrusted.

### 4. Local save tampering can break game state, not just cheat progression

- The game assumes loaded save fields are structurally valid.
- A malformed save can trigger logic errors, stale unlock states, or broken upgrade requirements rather than failing safely.

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

1. Remove the canvas mismatch or add the expected canvas element in `index.html` and validate startup.
2. Fix sprite-state handling so all car types either have valid alternate assets or fall back safely.
3. Replace `playerSpeed` upgrade mutations with a real persistent movement stat in `playerStats`.
4. Move `showFeedback()` to shared scope or stop calling it outside `scene("main")`.
5. Enforce valid car actions in logic, not only in the interaction menu UI.
6. Refactor run-state reset so permanent upgrades are applied exactly once per run.
7. Persist and reload selected character through `SaveSystem.settings`.
8. Harden the page with SRI/CSP and add save-data validation.

## Overall Assessment

The project is a promising prototype with a visible gameplay loop and a decent amount of content scaffolding, but it is not yet robust. Several defects are likely to surface quickly in live play, especially once rarer cars and more upgrade paths are exercised. The biggest implementation gap is not polish but reliability: core systems need stronger state management, safer asset handling, and clearer separation between per-run state and persistent progression before the broader roguelike design can land cleanly.
