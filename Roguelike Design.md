**Top-Down 2D Roguelike**

- Art style similar to Stardew Valley
- User moves their character around the car park using WASD or arrow keys.

**Roguelike Core Design:**

- **Randomized Car Park Layouts:**
  - Each level is a randomly generated car park filled with various cars, ranging from normal sedans to luxury sports cars, vans, and even junkers. The layout of the car park and the types of cars will change every time you play, keeping it unpredictable and fresh.
  - Some cars are easier to clean or search, while others might have more hidden surprises or larger spaces to vacuum, requiring more time and effort.
- **Car Interactions (Limited Choices):**
  - For each car, you can only perform **one action**, which introduces strategic decision-making:
    - **Search:** Looking inside the car might uncover valuable loot (e.g., cash, tools, or special items) but occasionally could yield bad results (like setting off a car alarm that reduces your remaining time).
    - **Clean Outside:** Washing the exterior provides experience (XP) or points and is generally a safe option, but it might not yield immediate benefits like searching can.
    - **Vacuum Inside:** Vacuuming is the most labor-intensive but yields the highest rewards in terms of XP or progress.
  - This choice system adds risk-reward decision-making, making you think carefully about how to best use your time.
- **Time Limit:**
  - The **time limit** is crucial to the roguelike tension. You'll have to make quick decisions about which cars to work on, how much time to spend on each action, and when to move on to the next car.
  - If the time runs out, the level ends, and you're scored based on how many cars you completed, what you found, and how efficiently you managed your tasks.
- **Progression Through Levels (Car Park Floors):**
  - Each level is like a "floor" in a roguelike, and each successive level presents more difficult challenges:
    - **Higher-level cars**: As you progress, you'll encounter cars that are dirtier, have more intricate interiors, or take longer to search.
    - **Special cars**: As you go deeper, some cars may have special attributes, like being covered in grime that requires multiple cleanings or having complex interiors with hidden compartments.
  - The number of cars increases with each level, making time management more challenging.

**Roguelite Elements:**

- **Upgrades:**
  - After each level, you can choose one upgrade for your equipment, adding a progression system:
    - **Washer Upgrades**: Faster washing speed, stronger water pressure, ability to clean multiple cars at once, etc.
    - **Vacuum Upgrades**: More powerful suction, larger area covered, less time needed to vacuum, etc.
  - You may also find **temporary items or buffs** while searching cars, like stronger cleaning fluid that lasts for one level or a special tool that increases vacuum efficiency.
- **Permanent Upgrades (Meta Progression):**
  - In typical roguelite fashion, after each run, you gain currency (e.g., money or stars) that can be spent on permanent upgrades for your washer, vacuum, or even abilities:
    - **New Tools**: Unlock special equipment like a steam cleaner or a leaf blower for faster cleaning.
    - **Time Extensions**: Increase the base time limit for each level.
    - **New Abilities**: Get passive skills like reducing time penalties for making mistakes or increasing the chance of finding rare items in cars.
- **Random Events & Modifiers:**
  - Each level could have random events that alter gameplay, adding variety and surprise:
    - **Rainstorm**: Water makes cleaning easier but reduces visibility, making it harder to find good cars to clean or search.
    - **Customer Demands**: Some customers may demand extra-fast service, forcing you to prioritize their car for a time bonus or special reward.
    - **Rush Hour**: In later levels, more cars keep arriving, adding pressure to work faster before time runs out.
- **Permadeath with Unlockables:**
  - Like in most roguelikes, when you fail a run, you go back to the start, but any meta-progression (e.g., permanent equipment upgrades, unlocked abilities) carries over, allowing you to tackle the game differently next time.
  - Completing certain tasks could unlock new equipment or perks to customize your playstyle. For example:
    - **Specialized Tools**: Maybe you unlock a vacuum that has a magnet for collecting loose coins or a washer that cleans cars instantly but requires precision timing.
    - **Character Perks**: Different starting characters with unique abilities like faster searching, more powerful washing, or extended time.

**Challenge and Replayability:**

- **Difficulty Scaling:**
  - The higher the levels, the tighter the time limit, the more cars you need to handle, and the tougher decisions you have to make about which cars to clean or search.
  - The introduction of new car types with complex cleaning needs or random hazards makes each run feel fresh and challenging.
- **Replayability:**
  - The combination of procedural generation (random car park layouts, car types, and events), meta-progression (upgrades, unlocks), and different upgrade choices after each level creates varied and unique runs every time.
  - Players can experiment with different strategies: Do they focus on upgrading their washer for faster outside cleaning? Or do they become masters of vacuuming and get the most out of each car's interior?

**Potential Story/Narrative Layer:**

- To add depth, you could layer in a narrative that drives the player's progress. For example:
  - **Rising to the Top**: The player starts as a new valet, working their way up through more exclusive and challenging parking lots until they reach high-end, exotic cars that demand perfection.
  - **Rival Valets**: Introduce competitors or "bosses" at the end of certain levels, who either steal time, create additional obstacles, or introduce special challenges like racing them to clean the most cars.