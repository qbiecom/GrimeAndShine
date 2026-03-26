/**
 * Grime and Shine - A Roguelike Car Cleaning Game
 *
 * This game uses the Kaboom.js library for rendering and game logic.
 * Players clean cars in a parking lot, earning cash and upgrades.
 */

// Initialize Kaboom
kaboom({
    width: 1280, // Match background image
    height: 720, // Match background image
    canvas: document.querySelector("#game-canvas"), // Optional: if you want to use a specific canvas element
    background: [50, 50, 50], // Dark gray background fallback
    font: "arcadia", // Use custom font
});



// Load custom font

loadFont("arcadia", "art/Arcadia-Regular.woff");



// --- Game Data ---

// Configuration Constants
const CONFIG = {
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    PLAYER_SPEED: 300,
    PLAYER_SIZE: 100,
    INTERACTION_RANGE: 120,
    BASE_TIME: 60,
    TIME_DECREASE_PER_LEVEL: 5,
    MIN_TIME: 30,
    LEVEL_COMPLETE_THRESHOLD: 0.5, // 50% of cars
    SPECIAL_PROPERTY_BASE_CHANCE: 0.1,
    SPECIAL_PROPERTY_LEVEL_INCREASE: 0.05,
    RANDOM_EVENT_CHANCE: 0.3 // 30% chance per level
};

const EVENT_PRIORITY_TIME_BONUS = 6;
const EVENT_PRIORITY_CASH_BONUS = 12;
const EVENT_RAIN_VISIBILITY_RADIUS = 230;

// Car Type Definitions (Adjusted for Kaboom - size might need tweaking)
/**
 * Each car type has unique characteristics that affect gameplay:
 * - searchModifier: Affects search time and loot chance (higher = more time, better loot)
 * - cleanModifier: Affects cleaning time (higher = more time)
 * - vacuumModifier: Affects vacuuming time (higher = more time)
 * - cashMultiplier: Affects base cash rewards (higher = more cash)
 */
const carTypes = [
    // Basic Cars (Common)
    {
        name: 'Sedan',
        spriteName: 'sedan',
        width: 80,
        height: 120,
        searchModifier: 1.0,
        cleanModifier: 1.0,
        vacuumModifier: 1.0,
        cashMultiplier: 1.0,
        rarity: 'common',
        description: 'Standard family car'
    },
    {
        name: 'Compact',
        spriteName: 'compact',
        width: 70,
        height: 110,
        searchModifier: 0.8,
        cleanModifier: 0.8,
        vacuumModifier: 0.7,
        cashMultiplier: 0.8,
        rarity: 'common',
        description: 'Small and quick to service'
    },
    
    // Mid-tier Cars (Uncommon)
    {
        name: 'Sports Car',
        spriteName: 'sportscar',
        width: 85,
        height: 115,
        searchModifier: 1.2,
        cleanModifier: 0.8,
        vacuumModifier: 0.9,
        cashMultiplier: 1.3,
        rarity: 'uncommon',
        description: 'Fast to clean, good loot potential'
    },
    {
        name: 'SUV',
        spriteName: 'suv',
        width: 90,
        height: 130,
        searchModifier: 1.1,
        cleanModifier: 1.2,
        vacuumModifier: 1.3,
        cashMultiplier: 1.2,
        rarity: 'uncommon',
        description: 'Large vehicle, takes longer to service'
    },
    {
        name: 'Pickup',
        spriteName: 'pickup',
        width: 85,
        height: 125,
        searchModifier: 1.0,
        cleanModifier: 1.1,
        vacuumModifier: 1.2,
        cashMultiplier: 1.1,
        rarity: 'uncommon',
        description: 'Work truck with decent rewards'
    },
    
    // Large/Special Cars (Rare)
    {
        name: 'Van',
        spriteName: 'van',
        width: 95,
        height: 135,
        searchModifier: 1.3,
        cleanModifier: 1.3,
        vacuumModifier: 1.5,
        cashMultiplier: 1.4,
        rarity: 'rare',
        description: 'Large van, high rewards but time-consuming'
    },
    {
        name: 'Luxury',
        spriteName: 'luxury',
        width: 85,
        height: 120,
        searchModifier: 1.4,
        cleanModifier: 1.0,
        vacuumModifier: 1.2,
        cashMultiplier: 1.6,
        rarity: 'rare',
        description: 'Luxury car with excellent loot potential'
    },
    
    // Special Cars (Very Rare)
    {
        name: 'Junker',
        spriteName: 'junker',
        width: 80,
        height: 120,
        searchModifier: 0.9,
        cleanModifier: 1.4,
        vacuumModifier: 1.3,
        cashMultiplier: 0.9,
        rarity: 'rare',
        description: 'Old car, very dirty but quick to search'
    }
];

/**
 * Get a random car type based on rarity weights
 * Higher levels have better chances for rare cars
 */
function getRandomCarType(level) {
    const availableCarTypes = carTypes.filter((car) => CAR_SHEET_CONFIG[car.spriteName]);

    if (availableCarTypes.length === 0) {
        throw new Error("No car sprite sheets are configured.");
    }

    // Rarity weights that improve with level
    const baseWeights = {
        common: 60,
        uncommon: 30,
        rare: 10
    };
    
    // Increase rare car chance by 2% per level (max 40%)
    const rarityBonus = Math.min(level * 2, 40);
    const weights = {
        common: Math.max(baseWeights.common - rarityBonus, 20),
        uncommon: baseWeights.uncommon,
        rare: baseWeights.rare + rarityBonus
    };
    
    // Build weighted pool
    const pool = [];
    availableCarTypes.forEach(car => {
        const weight = weights[car.rarity] || 10;
        for (let i = 0; i < weight; i++) {
            pool.push(car);
        }
    });
    
    return choose(pool);
}



// Parking Spot Definitions based on art/backgroundv1.png (1280x720)

// Coordinates are approximate top-left corners for vertical spots.

// Added 'id' for easier tracking.

let parkingSpots = [

    // Top Row (Facing Down) - Y ~50px

    { id: 1, x: 70, y: 50, orientation: 'vertical', occupied: false },

    { id: 2, x: 215, y: 50, orientation: 'vertical', occupied: false },

    { id: 3, x: 360, y: 50, orientation: 'vertical', occupied: false },

    { id: 4, x: 505, y: 50, orientation: 'vertical', occupied: false },

    { id: 5, x: 650, y: 50, orientation: 'vertical', occupied: false },

    { id: 6, x: 795, y: 50, orientation: 'vertical', occupied: false },

    { id: 7, x: 940, y: 50, orientation: 'vertical', occupied: false },

    { id: 8, x: 1085, y: 50, orientation: 'vertical', occupied: false },

    // Bottom Row (Facing Up) - Y ~410px

    { id: 9, x: 70, y: 410, orientation: 'vertical', occupied: false },

    { id: 10, x: 215, y: 410, orientation: 'vertical', occupied: false },

    { id: 11, x: 360, y: 410, orientation: 'vertical', occupied: false },

    { id: 12, x: 505, y: 410, orientation: 'vertical', occupied: false },

    { id: 13, x: 650, y: 410, orientation: 'vertical', occupied: false },

    { id: 14, x: 795, y: 410, orientation: 'vertical', occupied: false },

    { id: 15, x: 940, y: 410, orientation: 'vertical', occupied: false },

    { id: 16, x: 1085, y: 410, orientation: 'vertical', occupied: false },

];



// --- Utility Functions ---

/**
 * Reset all parking spots to unoccupied state for a new level
 */
function resetParkingSpots() {
    parkingSpots.forEach(spot => spot.occupied = false);
}

/**
 * Calculate the final action duration based on base time, modifiers, and special properties
 * @param {string} actionType - 'search', 'clean', or 'vacuum'
 * @param {object} car - The car object being interacted with
 * @returns {number} The calculated duration in seconds
 */
function calculateActionDuration(actionType, car) {
    let duration;
    
    switch (actionType) {
        case 'search':
            duration = playerStats.baseSearchTime * playerStats.searchLootMultiplier;
            break;
        case 'clean':
            duration = playerStats.baseCleanTime * playerStats.cleanSpeedMultiplier;
            // Apply Extra Dirty penalty
            if (car.specialProperty === "Extra Dirty") {
                duration *= 1.5; // 50% longer to clean
            }
            break;
        case 'vacuum':
            duration = playerStats.baseVacuumTime * playerStats.vacuumSpeedMultiplier;
            // Apply Complex Interior penalty
            if (car.specialProperty === "Complex Interior") {
                duration *= 1.5; // 50% longer to vacuum
            }
            break;
        default:
            duration = 5;
    }
    
    // Apply car type modifier
    duration *= car.carData[`${actionType}Modifier`];
    
    return duration;
}

/**
 * Format a multiplier as a percentage for display
 * @param {number} multiplier - The multiplier value
 * @param {boolean} inverse - If true, calculate as (1 - multiplier) for speed bonuses
 * @returns {number} The percentage value
 */
function formatMultiplierAsPercent(multiplier, inverse = false) {
    if (inverse) {
        return Math.round((1 - multiplier) * 100);
    }
    return Math.round((multiplier - 1) * 100);
}

function showFeedback(message, color = rgb(255, 255, 255)) {
    announceCanvasStatus(message);

    if (!feedbackTextObject || !feedbackTextObject.exists()) {
        feedbackTextObject = add([
            text("", { size: 18 }),
            pos(center().x, 60),
            anchor("center"),
            z(300),
            opacity(0),
            fixed(),
            "feedbackText",
        ]);
    }

    feedbackTextObject.text = message;
    feedbackTextObject.color = color;
    feedbackTextObject.opacity = 1;

    wait(1.5, () => {
        if (feedbackTextObject && feedbackTextObject.exists()) {
            feedbackTextObject.opacity = 0;
        }
    });
}

function getEventSummary(state) {
    if (!state || !state.name) {
        return "";
    }

    switch (state.name) {
        case "Rainstorm":
            return `Clean 30% faster. Only cars within ${state.visibilityRadius || EVENT_RAIN_VISIBILITY_RADIUS}px stay visible.`;
        case "Rush Hour":
            return `+${state.extraCars || 3} cars this level and -${state.timePenalty || 5}s on the clock.`;
        case "Customer Demands":
            return `${state.priorityCarCount || 2} priority cars grant +$${state.priorityCashBonus || EVENT_PRIORITY_CASH_BONUS} and +${state.priorityTimeBonus || EVENT_PRIORITY_TIME_BONUS}s each when completed.`;
        default:
            return state.description || "";
    }
}

function choosePriorityCars(cars, count) {
    const shuffled = cars.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function applyRainstormVisibility(player, cars) {
    const radius = currentEventState.visibilityRadius || EVENT_RAIN_VISIBILITY_RADIUS;

    cars.forEach((car) => {
        if (!car.exists()) {
            return;
        }

        if (car.completed) {
            car.opacity = 0.5;
            return;
        }

        const distanceToPlayer = player.pos.dist(car.worldPos());
        car.opacity = distanceToPlayer <= radius ? 1 : 0.22;
    });
}



// --- Persistent Data Management (localStorage) ---

/**
 * Save/Load system for persistent data between runs
 */
const SaveSystem = {
    SAVE_KEY: 'grimeAndShine_saveData',
    SAVE_VERSION: 1,
    
    /**
     * Get default save data structure
     */
    getDefaultData() {
        return {
            version: this.SAVE_VERSION,
            metaCurrency: 0, // Stars earned across all runs
            permanentUpgrades: [], // IDs of purchased permanent upgrades
            unlockedCharacters: ['base'], // Character IDs that are unlocked
            statistics: {
                totalRuns: 0,
                totalCarsCompleted: 0,
                totalCashEarned: 0,
                highestLevel: 1,
                bestScore: 0
            },
            highScores: [], // Array of {score, level, date}
            settings: {
                selectedCharacter: 'base'
            }
        };
    },

    normalizeData(rawData) {
        const defaults = this.getDefaultData();
        const data = rawData && typeof rawData === 'object' ? rawData : {};

        const normalized = {
            ...defaults,
            version: this.SAVE_VERSION,
            metaCurrency: Number.isFinite(data.metaCurrency) ? Math.max(0, Math.floor(data.metaCurrency)) : defaults.metaCurrency,
            permanentUpgrades: Array.isArray(data.permanentUpgrades)
                ? [...new Set(data.permanentUpgrades.filter((id) => typeof id === 'string'))]
                : defaults.permanentUpgrades,
            unlockedCharacters: Array.isArray(data.unlockedCharacters)
                ? [...new Set(['base', ...data.unlockedCharacters.filter((id) => typeof id === 'string')])]
                : defaults.unlockedCharacters,
            statistics: {
                totalRuns: Number.isFinite(data.statistics?.totalRuns) ? Math.max(0, Math.floor(data.statistics.totalRuns)) : defaults.statistics.totalRuns,
                totalCarsCompleted: Number.isFinite(data.statistics?.totalCarsCompleted) ? Math.max(0, Math.floor(data.statistics.totalCarsCompleted)) : defaults.statistics.totalCarsCompleted,
                totalCashEarned: Number.isFinite(data.statistics?.totalCashEarned) ? Math.max(0, Math.floor(data.statistics.totalCashEarned)) : defaults.statistics.totalCashEarned,
                highestLevel: Number.isFinite(data.statistics?.highestLevel) ? Math.max(1, Math.floor(data.statistics.highestLevel)) : defaults.statistics.highestLevel,
                bestScore: Number.isFinite(data.statistics?.bestScore) ? Math.max(0, Math.floor(data.statistics.bestScore)) : defaults.statistics.bestScore,
            },
            highScores: Array.isArray(data.highScores)
                ? data.highScores
                    .filter((entry) => entry && Number.isFinite(entry.score) && Number.isFinite(entry.level) && typeof entry.date === 'string')
                    .map((entry) => ({
                        score: Math.max(0, Math.floor(entry.score)),
                        level: Math.max(1, Math.floor(entry.level)),
                        date: entry.date,
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                : defaults.highScores,
            settings: {
                selectedCharacter: typeof data.settings?.selectedCharacter === 'string'
                    ? data.settings.selectedCharacter
                    : defaults.settings.selectedCharacter,
            },
        };

        if (!normalized.unlockedCharacters.includes(normalized.settings.selectedCharacter)) {
            normalized.settings.selectedCharacter = 'base';
        }

        return normalized;
    },
    
    /**
     * Load save data from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.SAVE_KEY);
            if (saved) {
                const data = this.normalizeData(JSON.parse(saved));
                console.log('Save data loaded:', data);
                return data;
            }
        } catch (e) {
            console.error('Error loading save data:', e);
        }
        return this.getDefaultData();
    },
    
    /**
     * Save data to localStorage
     */
    save(data) {
        try {
            const normalized = this.normalizeData(data);
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(normalized));
            console.log('Save data saved:', normalized);
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    },
    
    /**
     * Add meta-currency (stars) to save data
     */
    addMetaCurrency(amount) {
        const data = this.load();
        data.metaCurrency += amount;
        this.save(data);
        return data.metaCurrency;
    },
    
    /**
     * Spend meta-currency
     */
    spendMetaCurrency(amount) {
        const data = this.load();
        if (data.metaCurrency >= amount) {
            data.metaCurrency -= amount;
            this.save(data);
            return true;
        }
        return false;
    },
    
    /**
     * Add a permanent upgrade
     */
    addPermanentUpgrade(upgradeId) {
        const data = this.load();
        if (!data.permanentUpgrades.includes(upgradeId)) {
            data.permanentUpgrades.push(upgradeId);
            this.save(data);
            return true;
        }
        return false;
    },
    
    /**
     * Check if permanent upgrade is owned
     */
    hasPermanentUpgrade(upgradeId) {
        const data = this.load();
        return data.permanentUpgrades.includes(upgradeId);
    },
    
    /**
     * Unlock a character
     */
    unlockCharacter(characterId) {
        const data = this.load();
        if (!data.unlockedCharacters.includes(characterId)) {
            data.unlockedCharacters.push(characterId);
            this.save(data);
            return true;
        }
        return false;
    },
    
    /**
     * Update statistics after a run
     */
    updateStatistics(stats) {
        const data = this.load();
        data.statistics.totalRuns++;
        data.statistics.totalCarsCompleted += stats.carsCompleted || 0;
        data.statistics.totalCashEarned += stats.cashEarned || 0;
        data.statistics.highestLevel = Math.max(data.statistics.highestLevel, stats.level || 1);
        
        // Update best score
        if (stats.score && stats.score > data.statistics.bestScore) {
            data.statistics.bestScore = stats.score;
        }
        
        // Add to high scores (keep top 10)
        if (stats.score) {
            data.highScores.push({
                score: stats.score,
                level: stats.level,
                date: new Date().toISOString()
            });
            data.highScores.sort((a, b) => b.score - a.score);
            data.highScores = data.highScores.slice(0, 10);
        }
        
        this.save(data);
    },
    
    /**
     * Reset all save data (for testing)
     */
    reset() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log('Save data reset');
    }
};

// Initialize save data on game start
let saveData = SaveSystem.load();
let selectedCharacterId = saveData.settings?.selectedCharacter || "base";

function persistSelectedCharacter(characterId) {
    const data = SaveSystem.load();
    data.settings = data.settings || {};
    data.settings.selectedCharacter = characterId;
    SaveSystem.save(data);
    selectedCharacterId = characterId;
}

// --- Load Assets ---

const CAR_SHEET_CONFIG = {
    sedan: "cars/compact_sedan.png",
    sportscar: "cars/sportscar.png",
    suv: "cars/suv.png",
    junker: "cars/junker.png",
    van: "cars/van.png",
    pickup: "cars/pickup.png",
    luxury: "cars/luxury.png",
};

const CAR_STATE_FRAMES = {
    base: 0,
    dirty: 1,
    clean: 2,
    vacuum: 3,
};

function getCarSpriteComponent(carType, state = "base") {
    return sprite(`${carType}_sheet`, {
        frame: CAR_STATE_FRAMES[state] ?? CAR_STATE_FRAMES.base,
    });
}

function getCarCollisionScale(carType) {
    return 0.62;
}

loadSprite("background", "art/backgroundv1.png"); // Use absolute path

Object.entries(CAR_SHEET_CONFIG).forEach(([carType, path]) => {
    loadSprite(`${carType}_sheet`, path, {
        sliceX: 2,
        sliceY: 2,
    });
});

loadSprite("player", "art/player_temp.png");

loadSprite("titleLogo", "art/title.png"); // Load the title logo



// --- Define Scenes ---



// Title Scene

scene("title", () => {

    resetRunHUD("Title Screen");

    // Add the background image to the title screen

    add([

        sprite("background", { width: width(), height: height() }),

        pos(0, 0),

        z(-1),

    ]);



    // Add the title logo

    add([

        sprite("titleLogo"),

        pos(center().x, center().y - 100),

        scale(0.8),

        anchor("center"),

    ]);



    // Start Game button

    const startBtn = add([

        rect(200, 60, { radius: 8 }),

        pos(center().x - 120, center().y + 200), // Moved down and to the left

        color(0, 180, 255),

        outline(4, rgb(0, 120, 215)),

        anchor("center"),

        area(),

        "button",

        { action: "start" }

    ]);

    startBtn.add([

        text("Start Game", { size: 24 }),

        anchor("center"),

        color(255, 255, 255)

    ]);



    // Rules button

    const rulesBtn = add([

        rect(200, 60, { radius: 8 }),

        pos(center().x + 120, center().y + 200), // Moved down and to the right

        color(0, 200, 100),

        outline(4, rgb(0, 150, 80)),

        anchor("center"),

        area(),

        "button",

        { action: "rules" }

    ]);

    rulesBtn.add([

        text("Game Rules", { size: 24 }),

        anchor("center"),

        color(255, 255, 255)

    ]);



    // Characters button

    const charsBtn = add([

        rect(200, 60, { radius: 8 }),

        pos(center().x - 120, center().y + 280),

        color(255, 165, 0),

        outline(4, rgb(200, 120, 0)),

        anchor("center"),

        area(),

        "button",

        { action: "characters" }

    ]);

    charsBtn.add([

        text("Characters", { size: 24 }),

        anchor("center"),

        color(255, 255, 255)

    ]);

    // Upgrades button (NEW)
    const upgradesBtn = add([
        rect(200, 60, { radius: 8 }),
        pos(center().x + 120, center().y + 280),
        color(255, 215, 0),
        outline(4, rgb(200, 170, 0)),
        anchor("center"),
        area(),
        "button",
        { action: "upgrades" }
    ]);

    upgradesBtn.add([
        text("★ Upgrades", { size: 24 }),
        anchor("center"),
        color(0, 0, 0)
    ]);

    // Display star count
    const savedData = SaveSystem.load();
    add([
        text(`★ ${savedData.metaCurrency} Stars`, { size: 20 }),
        pos(width() - 20, 20),
        anchor("topright"),
        color(255, 215, 0)
    ]);

    // Handle button clicks

    onClick("button", (btn) => {

        if (btn.action === "start") {

            go("main", { level: 1, cash: 0 });

        } else if (btn.action === "rules") {

            go("rules");

        } else if (btn.action === "characters") {

            go("characters");

        } else if (btn.action === "upgrades") {

            go("permanentUpgrades");

        }

    });

    // Hover effects
    onHover("button", (btn) => {
        btn.scale = vec2(1.05);
        document.body.style.cursor = "pointer";
    });

    onHoverEnd("button", (btn) => {
        btn.scale = vec2(1);
        document.body.style.cursor = "default";
    });

}); // End of title scene

// Character Unlock Scene

scene("characters", () => {
    resetRunHUD("Characters");

    // Sync character unlock status with save data
    const savedData = SaveSystem.load();
    characters.forEach(char => {
        char.unlocked = savedData.unlockedCharacters.includes(char.id);
    });

        add([

            rect(width(), height()),

            color(20, 20, 40),

            z(-1)

        ]);



        add([

            text("Characters", { size: 48 }),

            pos(center().x, 60),

            anchor("center"),

            color(255, 255, 255)

        ]);

        add([
            text("Press number key to select unlocked character", { size: 20 }),
            pos(center().x, 100),
            anchor("center"),
            color(200, 200, 200)
        ]);

        characters.forEach((char, index) => {

            const yPos = 140 + index * 100;

            // Character button/selector
            const charButton = add([
                rect(width() - 100, 80, { radius: 8 }),
                pos(50, yPos - 10),
                color(char.unlocked ? (char.id === selectedCharacterId ? rgb(0, 100, 0) : rgb(40, 40, 60)) : rgb(30, 30, 30)),
                outline(3, char.id === selectedCharacterId ? rgb(0, 255, 0) : rgb(100, 100, 100)),
                area(),
                char.unlocked ? "charButton" : null,
                { charData: char, charIndex: index }
            ]);

            add([

                text(`[${index + 1}] ${char.name} (${char.rarity})`, { size: 24 }),

                pos(200, yPos),

                color(char.unlocked ? rgb(0, 255, 0) : rgb(150, 150, 150))

            ]);

            add([

                text(char.description, { size: 18, width: width() - 400 }),

                pos(200, yPos + 30),

                color(200, 200, 200)

            ]);

            if (!char.unlocked) {

                add([

                    text(`Cost: $${char.cost}`, { size: 18 }),

                    pos(width() - 200, yPos + 15),

                    anchor("right"),

                    color(255, 215, 0)

                ]);

            } else if (char.id === selectedCharacterId) {

                add([

                    text("✓ SELECTED", { size: 20 }),

                    pos(width() - 200, yPos + 15),

                    anchor("right"),

                    color(0, 255, 0)

                ]);

            } else {

                add([

                    text("Available", { size: 18 }),

                    pos(width() - 200, yPos + 15),

                    anchor("right"),

                    color(0, 200, 255)

                ]);

            }

            // Handle character selection with number keys
            if (char.unlocked) {
                onKeyPress(String(index + 1), () => {
                    persistSelectedCharacter(char.id);
                    console.log(`Selected character: ${char.name}`);
                    go("characters"); // Refresh scene to show selection
                });
            }

        });



        // Back to Menu button

        const backBtn = add([

            rect(200, 60, { radius: 8 }),

            pos(center().x, height() - 80),

            color(200, 100, 100),

            outline(4, rgb(150, 80, 80)),

            anchor("center"),

            area(),

            "button"

        ]);

        backBtn.add([

            text("Back to Menu", { size: 24 }),

            anchor("center"),

            color(255, 255, 255)

        ]);



        // Handle button clicks for character selection
        onClick("charButton", (btn) => {
            persistSelectedCharacter(btn.charData.id);
            console.log(`Selected character: ${btn.charData.name}`);
            go("characters"); // Refresh scene to show selection
        });

        onClick("button", () => {

            go("title");

        });

        

        onKeyPress("escape", () => {

            go("title");

        });

    }); // End of characters scene



// Rules Scene

scene("rules", () => {

    resetRunHUD("Rules");

    add([

        rect(width(), height()),

        color(30, 30, 50),

        z(-1)

    ]);



        add([
            text("Controls:\n- Arrow keys: Move\n- E: Interact\n- Number keys: Select options\n- Esc or Backspace: Go back", { size: 20, width: 400 }),
            pos(20, height() - 80),
            anchor("botleft"),
            color(255, 255, 255)
        ]);

    add([

        text("Game Rules", { size: 48 }),

        pos(center().x, 80),

        anchor("center"),

        color(255, 255, 255)

    ]);



    // Add intro story

    add([

        text("You are a hardworking car cleaner in a busy city parking lot.", { size: 22, width: width() - 200 }),

        pos(center().x, 140),

        anchor("center"),

        color(220, 220, 255)

    ]);

    add([

        text("Your goal: clean, vacuum, and search as many cars as you can before time runs out!", { size: 22, width: width() - 200 }),

        pos(center().x, 180),

        anchor("center"),

        color(220, 220, 255)

    ]);



    const rules = [

        "• Service cars by searching, cleaning, or vacuuming them.",

        "• Each action earns you cash.",

        "• Each level rolls an objective, such as clean jobs or interior jobs, shown in the HUD.",

        "• Complete the level by hitting the objective target, or survive to the buzzer with enough serviced cars to satisfy that target.",

        "• After each level, choose an upgrade to improve your skills.",

        "• Rush Hour can add late arrivals mid-level, so unfinished lanes can get busier over time."

    ];



    rules.forEach((rule, i) => {

        add([

            text(rule, { size: 20, width: width() - 200 }),

            pos(center().x, 240 + i * 40),

            anchor("center"),

            color(200, 200, 255)

        ]);

    });



    const backBtn = add([

        rect(230, 60, { radius: 8 }),

        pos(width() - 20, height() - 80),

        color(200, 100, 100),

        outline(4, rgb(150, 80, 80)),

        anchor("botright"),

        area(),

        "button"

    ]);

    backBtn.add([

        text("Back to Title", { size: 24 }),

        pos(-115, -30), // Position relative to parent's bottom-right anchor

        anchor("center"),

        color(255, 255, 255)

    ]);



    onClick("button", () => {

        go("title");

    });

    onHover("button", (btn) => {
        btn.scale = vec2(1.05);
        document.body.style.cursor = "pointer";
    });

    onHoverEnd("button", (btn) => {
        btn.scale = vec2(1);
        document.body.style.cursor = "default";
    });

    onKeyPress("escape", () => {
        go("title");
    });

}); // End of rules scene

// --- Permanent Upgrades Shop Scene ---
scene("permanentUpgrades", () => {
    resetRunHUD("Permanent Upgrades");

    const savedData = SaveSystem.load();
    let currentStars = savedData.metaCurrency;

    // Camera offset for scrolling
    let camY = 0;
    const maxScroll = Math.max(0, permanentUpgrades.length * 90 - 400); // Calculate max scroll based on content

    add([
        rect(width(), height()),
        color(20, 20, 40),
        z(-1)
    ]);

    // Fixed UI elements (don't scroll)
    add([
        text("★ Permanent Upgrades Shop ★", { size: 48 }),
        pos(center().x, 60),
        anchor("center"),
        color(255, 215, 0),
        fixed()
    ]);

    add([
        text("Unlock permanent tools, time boosts, and passive abilities.", { size: 20 }),
        pos(center().x, 110),
        anchor("center"),
        color(200, 200, 200),
        fixed()
    ]);

    add([
        text("Use Arrow Keys or Mouse Wheel to scroll", { size: 16 }),
        pos(center().x, 135),
        anchor("center"),
        color(150, 150, 150),
        fixed()
    ]);

    // Star display
    const starText = add([
        text(`Stars: ${currentStars}`, { size: 28 }),
        pos(width() - 30, 30),
        anchor("topright"),
        color(255, 215, 0),
        fixed()
    ]);

    // Display upgrades in a scrollable list
    const startY = 180;
    const spacing = 90;

    // Scroll controls
    onKeyDown("up", () => {
        camY = Math.max(camY - 300 * dt(), 0);
        camPos(0, camY);
    });

    onKeyDown("down", () => {
        camY = Math.min(camY + 300 * dt(), maxScroll);
        camPos(0, camY);
    });

    onKeyDown("arrow-up", () => {
        camY = Math.max(camY - 300 * dt(), 0);
        camPos(0, camY);
    });

    onKeyDown("arrow-down", () => {
        camY = Math.min(camY + 300 * dt(), maxScroll);
        camPos(0, camY);
    });

    permanentUpgrades.forEach((upgrade, index) => {
        const yPos = startY + index * spacing;
        const isOwned = savedData.permanentUpgrades.includes(upgrade.id);
        const canAfford = currentStars >= upgrade.cost;
        const meetsRequirements = !upgrade.requires || savedData.permanentUpgrades.includes(upgrade.requires);
        const titleSuffix = upgrade.category ? ` - ${upgrade.category}` : "";

        // Upgrade container
        const container = add([
            rect(width() - 100, 80, { radius: 8 }),
            pos(50, yPos),
            color(isOwned ? rgb(0, 100, 0) : (canAfford && meetsRequirements ? rgb(40, 40, 60) : rgb(30, 30, 30))),
            outline(3, isOwned ? rgb(0, 255, 0) : (canAfford && meetsRequirements ? rgb(100, 100, 255) : rgb(80, 80, 80))),
            area(),
            !isOwned && canAfford && meetsRequirements ? "upgradeButton" : null,
            { upgradeData: upgrade, upgradeIndex: index }
        ]);

        // Upgrade name
        add([
            text(`[${index + 1}] ${upgrade.name}${titleSuffix}`, { size: 22 }),
            pos(70, yPos + 15),
            color(isOwned ? rgb(0, 255, 0) : rgb(255, 255, 255))
        ]);

        // Upgrade description
        add([
            text(upgrade.description, { size: 16, width: 600 }),
            pos(70, yPos + 42),
            color(200, 200, 200)
        ]);

        // Cost or status
        if (isOwned) {
            add([
                text("✓ OWNED", { size: 20 }),
                pos(width() - 80, yPos + 30),
                anchor("right"),
                color(0, 255, 0)
            ]);
        } else if (!meetsRequirements) {
            add([
                text("LOCKED", { size: 18 }),
                pos(width() - 80, yPos + 30),
                anchor("right"),
                color(150, 150, 150)
            ]);
        } else {
            add([
                text(`★ ${upgrade.cost}`, { size: 24 }),
                pos(width() - 80, yPos + 30),
                anchor("right"),
                color(canAfford ? rgb(255, 215, 0) : rgb(150, 100, 100))
            ]);
        }

        // Handle number key purchase
        if (!isOwned && canAfford && meetsRequirements) {
            onKeyPress(String(index + 1), () => {
                if (SaveSystem.spendMetaCurrency(upgrade.cost)) {
                    SaveSystem.addPermanentUpgrade(upgrade.id);
                    // Apply the upgrade effect if it's a character unlock
                    if (upgrade.effect) {
                        upgrade.effect();
                    }
                    console.log(`Purchased: ${upgrade.name}`);
                    go("permanentUpgrades"); // Refresh scene
                }
            });
        }
    });

    // Handle click purchase
    onClick("upgradeButton", (btn) => {
        const upgrade = btn.upgradeData;
        if (SaveSystem.spendMetaCurrency(upgrade.cost)) {
            SaveSystem.addPermanentUpgrade(upgrade.id);
            if (upgrade.effect) {
                upgrade.effect();
            }
            console.log(`Purchased: ${upgrade.name}`);
            go("permanentUpgrades"); // Refresh scene
        }
    });

    // Back button (fixed position)
    const backBtn = add([
        rect(200, 60, { radius: 8 }),
        pos(center().x, height() - 80),
        color(200, 100, 100),
        outline(4, rgb(150, 80, 80)),
        anchor("center"),
        area(),
        fixed(),
        "button"
    ]);

    backBtn.add([
        text("Back to Menu", { size: 24 }),
        anchor("center"),
        color(255, 255, 255)
    ]);

    onClick("button", () => {
        camPos(0, 0); // Reset camera
        go("title");
    });

    onKeyPress("escape", () => {
        camPos(0, 0); // Reset camera
        go("title");
    });

    // Cleanup
    onSceneLeave(() => {
        camPos(0, 0); // Reset camera when leaving
    });
}); // End of permanentUpgrades scene

// --- Global Game State & UI ---
// Note: These globals could be refactored into a state management system for better maintainability

let currentLevel = 1;
let currentCash = 0; // Player's accumulated cash
let timeLeft = 60; // Countdown timer for current level
let timerInterval = null;
let carsInLevel = []; // Array of car game objects in current level

// UI References
let interactionMenu = null; // Reference to the interaction menu group
let targetCar = null; // Car currently targeted for interaction
let isInteracting = false; // Flag to pause player movement during interaction
let feedbackTextObject = null; // Reference to the persistent feedback text object
let actionInProgress = false; // Flag to track if an action is currently in progress
let actionProgressBar = null; // Reference to the action progress bar

const hudElements = {
    sceneLabel: document.getElementById("scene-label"),
    runState: document.getElementById("run-state"),
    canvasStatus: document.getElementById("canvas-status"),
    cash: document.getElementById("hud-cash"),
    level: document.getElementById("hud-level"),
    timer: document.getElementById("hud-timer"),
    event: document.getElementById("hud-event"),
    objective: document.getElementById("hud-objective"),
    upgrades: document.getElementById("hud-upgrades"),
    upgradesEmpty: document.getElementById("hud-upgrades-empty"),
    buffs: document.getElementById("hud-buffs"),
    buffsEmpty: document.getElementById("hud-buffs-empty"),
};

function setTextContent(element, value) {
    if (element) {
        element.textContent = value;
    }
}

function setStatusList(listElement, emptyElement, items, fallbackText) {
    if (!listElement || !emptyElement) {
        return;
    }

    listElement.innerHTML = "";

    if (!items || items.length === 0) {
        emptyElement.hidden = false;
        emptyElement.textContent = fallbackText;
        return;
    }

    emptyElement.hidden = true;

    items.forEach((item) => {
        const entry = document.createElement("li");
        entry.textContent = item;
        listElement.appendChild(entry);
    });
}

function announceCanvasStatus(message) {
    setTextContent(hudElements.canvasStatus, message);
}

function updateRunHUD(options = {}) {
    const {
        scene = "Menu",
        inRun = false,
        cash = 0,
        level = null,
        timer = null,
        eventName = "None",
        eventSummary = "",
        objectiveSummary = "",
        upgrades = [],
        buffs = [],
        runState = inRun ? "Run active" : "Run inactive",
        announce = "",
    } = options;

    setTextContent(hudElements.sceneLabel, scene);
    setTextContent(hudElements.runState, runState);
    setTextContent(hudElements.cash, inRun ? `$${cash}` : "$0");
    setTextContent(hudElements.level, inRun && level !== null ? `${level}` : "-");
    setTextContent(hudElements.timer, inRun && timer !== null ? `${timer}s` : "-");

    const eventLabel = inRun
        ? (eventSummary ? `${eventName}: ${eventSummary}` : eventName)
        : "None";
    setTextContent(hudElements.event, eventLabel);
    setTextContent(hudElements.objective, inRun ? objectiveSummary || "No active objective" : "No active objective");

    setStatusList(hudElements.upgrades, hudElements.upgradesEmpty, inRun ? upgrades : [], "No upgrades active.");
    setStatusList(hudElements.buffs, hudElements.buffsEmpty, inRun ? buffs : [], "No buffs active.");

    if (announce) {
        announceCanvasStatus(announce);
    }
}

function resetRunHUD(scene = "Menu", runState = "Run inactive") {
    updateRunHUD({ scene, runState, inRun: false });
}



// --- Player Upgrade Stats ---
/**
 * Player stats that persist across levels and get modified by upgrades
 * Multipliers < 1.0 are better for speed, > 1.0 are better for rewards
 */
function createDefaultPlayerStats() {
    return {
        // Speed multipliers (lower = faster)
        cleanSpeedMultiplier: 1.0, // Lower is faster (e.g., 0.8 means 20% faster)
        vacuumSpeedMultiplier: 1.0,
        moveSpeedMultiplier: 1.0,

        // Reward multipliers (higher = better)
        searchLootMultiplier: 1.0, // Higher is better
        searchAlarmModifier: 1.0, // Lower is better (reduces alarm chance)
        rareItemChanceMultiplier: 1.0,

        // Base action times (in seconds)
        baseCleanTime: 5,
        baseVacuumTime: 5,
        baseSearchTime: 5,

        // Bonus stats
        timeBonus: 0 // Additional seconds added to timer
    };
}

let playerStats = createDefaultPlayerStats();

let playerUpgrades = []; // Names of purchased upgrades for display



// Temporary buffs and upgrade tracking
let activeBuffs = []; // Buffs purchased in shop, applied at start of next level
let purchasedUpgradeIds = []; // IDs of permanent upgrades to prevent duplicates
let currentBuffs = []; // Buffs active in current level

function resetRunState() {
    playerStats = createDefaultPlayerStats();
    playerUpgrades = [];
    activeBuffs = [];
    purchasedUpgradeIds = [];
    currentBuffs = [];
}



// List of possible temporary buffs/items

const tempBuffs = [

    {

        name: "Stronger Cleaning Fluid",

        description: "Clean cars 30% faster this level.",

        rarity: "common",

        cost: 20,

        apply: () => { playerStats.cleanSpeedMultiplier *= 0.7; }

    },

    {

        name: "Turbo Vacuum",

        description: "Vacuum cars 30% faster this level.",

        rarity: "common",

        cost: 20,

        apply: () => { playerStats.vacuumSpeedMultiplier *= 0.7; }

    },

    {

        name: "Lucky Charm",

        description: "Find 20% more loot this level.",

        rarity: "uncommon",

        cost: 40,

        apply: () => { playerStats.searchLootMultiplier *= 1.2; }

    },

    {

        name: "Silent Gloves",

        description: "Reduce alarm chance by 20% this level.",

        rarity: "uncommon",

        cost: 40,

        apply: () => { playerStats.searchAlarmModifier *= 0.8; }

    }

];



// List of possible random events/modifiers

const levelEvents = [

    {

        name: "Rainstorm",

        description: "Rain speeds cleaning by 30%, but only nearby cars stay visible.",

        apply: () => {
            playerStats.cleanSpeedMultiplier *= 0.7;
            return {
                rainstorm: true,
                visibilityRadius: EVENT_RAIN_VISIBILITY_RADIUS,
            };
        }

    },

    {

        name: "Rush Hour",

        description: "Rush hour! The clock starts 5 seconds lower, extra cars are added, and more arrivals trickle in mid-level.",

        apply: () => {
            extraCarsThisLevel += 3;
            return {
                name: "Rush Hour",
                rushHour: true,
                extraCars: 3,
                timePenalty: 5,
                arrivalPressure: true,
                rushHourCarsRemaining: 2,
                rushHourWaveSize: 1,
                arrivalInterval: 12,
                arrivalSeconds: 12,
            };
        }

    },

    {

        name: "Customer Demands",

        description: "Two cars become priority jobs. Finish them for +6s and +$12 each.",

        apply: () => ({
            customerDemands: true,
            priorityCarCount: 2,
            priorityTimeBonus: EVENT_PRIORITY_TIME_BONUS,
            priorityCashBonus: EVENT_PRIORITY_CASH_BONUS,
        })

    }

];



// Current event for this level

let currentEvent = null;

let currentEventState = {};

let currentLevelObjective = null;



// Extra cars added by events

let extraCarsThisLevel = 0;

const levelObjectives = [
    {
        id: "any-service",
        name: "Keep the Line Moving",
        description: "Service enough cars before the clock runs out.",
        summary: ({ requiredCount, progressCount }) => `Service ${progressCount}/${requiredCount} cars before time runs out.`,
        isCarEligible: () => true,
        getProgressCount: (cars) => cars.filter((car) => car.completed).length,
        shouldCompleteLevel: ({ cars, requiredCount }) => cars.filter((car) => car.completed).length >= requiredCount,
    },
    {
        id: "clean-focus",
        name: "Exterior Detail Sweep",
        description: "Finish enough clean jobs this level.",
        summary: ({ requiredCount, progressCount }) => `Complete ${progressCount}/${requiredCount} clean jobs to clear the level.`,
        isCarEligible: (car) => car.needsCleaning,
        getProgressCount: (cars) => cars.filter((car) => car.completed && car.completedAction === "clean").length,
        shouldCompleteLevel: ({ cars, requiredCount }) => cars.filter((car) => car.completed && car.completedAction === "clean").length >= requiredCount,
    },
    {
        id: "interior-focus",
        name: "Interior Pickup",
        description: "Finish enough search or vacuum jobs this level.",
        summary: ({ requiredCount, progressCount }) => `Complete ${progressCount}/${requiredCount} interior jobs (search or vacuum).`,
        isCarEligible: (car) => car.needsVacuumOrSearch,
        getProgressCount: (cars) => cars.filter((car) => car.completed && (car.completedAction === "search" || car.completedAction === "vacuum")).length,
        shouldCompleteLevel: ({ cars, requiredCount }) => cars.filter((car) => car.completed && (car.completedAction === "search" || car.completedAction === "vacuum")).length >= requiredCount,
    },
];

function calculateObjectiveRequirement(level, eligibleCount) {
    if (eligibleCount <= 0) {
        return 0;
    }

    const pressureTarget = Math.min(eligibleCount, 3 + Math.floor(level / 2));
    const ratioTarget = Math.ceil(eligibleCount * 0.6);
    return Math.max(1, Math.min(eligibleCount, Math.max(pressureTarget, ratioTarget)));
}

function createLevelObjective(level, cars) {
    const weightedPool = levelObjectives.filter((objective) => cars.some((car) => objective.isCarEligible(car)));
    const selectedObjective = choose(weightedPool.length > 0 ? weightedPool : [levelObjectives[0]]);
    const eligibleCount = cars.filter((car) => selectedObjective.isCarEligible(car)).length;
    const requiredCount = calculateObjectiveRequirement(level, eligibleCount);

    return {
        id: selectedObjective.id,
        name: selectedObjective.name,
        description: selectedObjective.description,
        requiredCount,
        eligibleCount,
        getProgressCount: () => selectedObjective.getProgressCount(cars),
        shouldCompleteLevel: () => selectedObjective.shouldCompleteLevel({ cars, requiredCount }),
        getSummary: () => selectedObjective.summary({
            requiredCount,
            eligibleCount,
            progressCount: selectedObjective.getProgressCount(cars),
        }),
    };
}

function getObjectiveSummary() {
    return currentLevelObjective ? currentLevelObjective.getSummary() : "No active objective";
}

function getRequiredCompletionRatio() {
    if (!currentLevelObjective || currentLevelObjective.requiredCount <= 0 || carsInLevel.length === 0) {
        return CONFIG.LEVEL_COMPLETE_THRESHOLD;
    }

    return Math.max(CONFIG.LEVEL_COMPLETE_THRESHOLD, currentLevelObjective.requiredCount / carsInLevel.length);
}

function getArrivalPressureLabel() {
    if (currentEventState.rushHourWaveSize > 0 && currentEventState.arrivalSeconds > 0) {
        return `Next arrival in ${currentEventState.arrivalSeconds}s (${currentEventState.rushHourCarsRemaining} incoming)`;
    }

    if (currentEventState.rushHourCarsRemaining > 0) {
        return `${currentEventState.rushHourCarsRemaining} more rush-hour arrivals queued`;
    }

    return currentEventState.arrivalPressure ? "Rush-hour arrivals exhausted" : "";
}

function getRunStateLabel() {
    if (actionInProgress) {
        return "Action in progress";
    }

    const arrivalLabel = getArrivalPressureLabel();
    if (arrivalLabel) {
        return arrivalLabel;
    }

    return `Level ${currentLevel} active`;
}





// --- Available Upgrades ---

const availableUpgrades = [

    // ===== COMMON UPGRADES (GREEN) =====

    { id: "clean1", name: "Faster Cleaning", description: "Clean cars 15% faster.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.cleanSpeedMultiplier *= 0.85; } },

    { id: "vacuum1", name: "Faster Vacuuming", description: "Vacuum cars 15% faster.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.85; } },

    { id: "search1", name: "Better Loot Sense", description: "Slightly increase loot found.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.searchLootMultiplier *= 1.1; } },

    { id: "search2", name: "Quieter Search", description: "Slightly reduce alarm chance.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.searchAlarmModifier *= 0.9; } },

    { id: "move1", name: "Running Shoes", description: "Move 5% faster.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.moveSpeedMultiplier *= 1.05; } },

    { id: "tipjar", name: "Tip Jar", description: "5% chance to receive a small tip after completing a car.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.tipChance = (playerStats.tipChance || 0) + 0.05; } },

    { id: "gloves", name: "Rubber Gloves", description: "20% faster cleaning on dirty cars.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.dirtyCarBonus = (playerStats.dirtyCarBonus || 0) + 0.2; } },

    

    // ===== UNCOMMON UPGRADES (BLUE) =====

    { id: "clean2", name: "Power Washer", description: "Clean cars 25% faster.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.cleanSpeedMultiplier *= 0.75; } },

    { id: "vacuum2", name: "Turbo Vacuum", description: "Vacuum cars 25% faster.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.75; } },

    { id: "search3", name: "Lucky Find", description: "Increase loot found by 20%.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.searchLootMultiplier *= 1.2; } },

    { id: "search4", name: "Silent Search", description: "Reduce alarm chance by 25%.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.searchAlarmModifier *= 0.75; } },

    { id: "move2", name: "Sprint Sneakers", description: "Move 10% faster.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.moveSpeedMultiplier *= 1.10; } },

    

    // ===== RARE UPGRADES (PURPLE) =====

    { id: "clean3", name: "Nano Cleaner", description: "Clean cars 40% faster.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.cleanSpeedMultiplier *= 0.6; } },

    { id: "vacuum3", name: "Hyper Vacuum", description: "Vacuum cars 40% faster.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.6; } },

    { id: "search5", name: "Treasure Hunter", description: "Increase loot found by 30%.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.searchLootMultiplier *= 1.3; } },

    { id: "search6", name: "Ghost Touch", description: "Reduce alarm chance by 35%.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.searchAlarmModifier *= 0.65; } },

    { id: "move3", name: "Jet Boots", description: "Move 15% faster.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.moveSpeedMultiplier *= 1.15; } },

    { id: "connections", name: "Customer Connections", description: "15% chance to receive a large tip after completing a car.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.largeTipChance = (playerStats.largeTipChance || 0) + 0.15; } },

    

    // ===== LEGENDARY UPGRADES (GOLD) =====

    { id: "clean4", name: "Instant Wash", description: "Clean cars instantly!", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.cleanSpeedMultiplier *= 0.1; } },

    { id: "vacuum4", name: "Black Hole Vacuum", description: "Vacuum cars instantly!", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.1; } },

    { id: "search7", name: "Master Thief", description: "Double loot found.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.searchLootMultiplier *= 2.0; } },

    { id: "search8", name: "Phantom Hands", description: "No alarm chance at all.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.searchAlarmModifier = 0; } },

    { id: "timewarp", name: "Time Warp Watch", description: "Permanently adds 5 seconds to your timer.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.timeBonus += 5; } },

    { id: "move4", name: "Quantum Dash", description: "Move 20% faster.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.moveSpeedMultiplier *= 1.20; } },

    { id: "vipservice", name: "VIP Service", description: "Every 5th car completed gives a significant cash bonus.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.vipServiceActive = true; } },
    
    // ===== SPECIALIZED TOOLS (Unique Mechanics) =====
    {
        id: "steamcleaner",
        name: "Steam Cleaner",
        description: "Clean actions also pay an interior-service bonus.",
        rarity: "rare",
        color: rgb(128, 0, 255),
        effect: () => { playerStats.steamCleanerActive = true; }
    },
    {
        id: "magnetvac",
        name: "Magnetic Vacuum",
        description: "Vacuum actions pull in extra loose change.",
        rarity: "rare",
        color: rgb(128, 0, 255),
        effect: () => { playerStats.magnetVacActive = true; }
    },
    {
        id: "xrayvision",
        name: "X-Ray Goggles",
        description: "See special properties before interacting.",
        rarity: "legendary",
        color: rgb(255, 215, 0),
        effect: () => { playerStats.xrayVision = true; }
    },
    {
        id: "multitask",
        name: "Multitasker",
        description: "Your chosen action pays double rewards on the serviced car.",
        rarity: "legendary",
        color: rgb(255, 215, 0),
        effect: () => { playerStats.multitaskCashMultiplier = (playerStats.multitaskCashMultiplier || 1) * 2; }
    },
    {
        id: "efficiency",
        name: "Efficiency Expert",
        description: "Completing cars faster gives bonus cash.",
        rarity: "uncommon",
        color: rgb(0, 128, 255),
        effect: () => { playerStats.efficiencyExpert = true; }
    }

];

// --- Permanent Upgrades (Meta-Progression) ---
/**
 * Permanent upgrades that persist between runs
 * Purchased with meta-currency (stars)
 */
const permanentUpgrades = [
    {
        id: "perm_time_1",
        name: "Extra Time I",
        description: "Start each level with +5 seconds",
        cost: 50,
        category: "Time Extension",
        effect: () => { playerStats.timeBonus += 5; }
    },
    {
        id: "perm_time_2",
        name: "Extra Time II",
        description: "Start each level with +10 seconds",
        cost: 150,
        requires: "perm_time_1",
        category: "Time Extension",
        effect: () => { playerStats.timeBonus += 10; }
    },
    {
        id: "perm_speed_1",
        name: "Quick Start",
        description: "Start with 10% faster cleaning and vacuuming",
        cost: 75,
        category: "Core Stats",
        effect: () => {
            playerStats.cleanSpeedMultiplier *= 0.9;
            playerStats.vacuumSpeedMultiplier *= 0.9;
        }
    },
    {
        id: "perm_loot_1",
        name: "Lucky Finder",
        description: "Start with 15% better loot from searches",
        cost: 75,
        category: "Passive Ability",
        effect: () => { playerStats.searchLootMultiplier *= 1.15; }
    },
    {
        id: "perm_alarm_1",
        name: "Stealth Training",
        description: "Start with 20% reduced alarm chance",
        cost: 100,
        category: "Passive Ability",
        effect: () => { playerStats.searchAlarmModifier *= 0.8; }
    },
    {
        id: "perm_starting_cash",
        name: "Nest Egg",
        description: "Start each run with $50",
        cost: 100,
        category: "Economy",
        effect: () => { /* Applied at run start */ }
    },
    {
        id: "perm_tool_steam_cleaner",
        name: "Steam Cleaner Bay",
        description: "Start every run with the Steam Cleaner tool unlocked. Clean actions also pay an interior-service bonus on cars that still need inside work.",
        cost: 125,
        category: "Tool Unlock",
        effect: () => {
            playerStats.steamCleanerActive = true;
            if (!playerUpgrades.includes("Steam Cleaner")) {
                playerUpgrades.push("Steam Cleaner");
            }
        }
    },
    {
        id: "perm_tool_magnet_vac",
        name: "Magnetic Vacuum Rig",
        description: "Start every run with the Magnetic Vacuum tool unlocked. Vacuum actions pull in extra loose change.",
        cost: 150,
        category: "Tool Unlock",
        effect: () => {
            playerStats.magnetVacActive = true;
            if (!playerUpgrades.includes("Magnetic Vacuum")) {
                playerUpgrades.push("Magnetic Vacuum");
            }
        }
    },
    {
        id: "perm_time_3",
        name: "Extra Time III",
        description: "Start each level with +15 more seconds, for a total of +30 seconds with the full clock chain.",
        cost: 300,
        requires: "perm_time_2",
        category: "Time Extension",
        effect: () => { playerStats.timeBonus += 15; }
    },
    {
        id: "perm_rare_item_1",
        name: "Rare Item Radar",
        description: "Searches are 25% more likely to uncover temporary buffs and high-value loot outcomes in cars.",
        cost: 175,
        category: "Passive Ability",
        effect: () => { playerStats.rareItemChanceMultiplier *= 1.25; }
    },
    {
        id: "perm_char_unlock_1",
        name: "Unlock Speedster",
        description: "Unlock the Speedster character",
        cost: 200,
        category: "Character",
        effect: () => { SaveSystem.unlockCharacter('speedster'); }
    },
    {
        id: "perm_char_unlock_2",
        name: "Unlock Lucky",
        description: "Unlock the Lucky character",
        cost: 400,
        category: "Character",
        effect: () => { SaveSystem.unlockCharacter('lucky'); }
    },
    {
        id: "perm_char_unlock_3",
        name: "Unlock Ghost",
        description: "Unlock the Ghost character",
        cost: 600,
        category: "Character",
        effect: () => { SaveSystem.unlockCharacter('ghost'); }
    }
];

const characters = [

    {

        id: "base",

        name: "Rookie",

        description: "Standard cleaner with no special abilities.",

        cost: 0,

        rarity: "common",

        unlocked: true,

        applyAbility: () => {}

    },

    {

        id: "speedster",

        name: "Speedster",

        description: "Cleans and vacuums 20% faster.",

        cost: 500,

        rarity: "uncommon",

        unlocked: false,

        applyAbility: () => {

            playerStats.cleanSpeedMultiplier *= 0.8;

            playerStats.vacuumSpeedMultiplier *= 0.8;

        }

    },

    {

        id: "lucky",

        name: "Lucky",

        description: "Finds 30% more loot.",

        cost: 1000,

        rarity: "rare",

        unlocked: false,

        applyAbility: () => {

            playerStats.searchLootMultiplier *= 1.3;

        }

    },

    {

        id: "ghost",

        name: "Ghost",

        description: "Reduces alarm chance by 50%.",

        cost: 2000,

        rarity: "epic",

        unlocked: false,

        applyAbility: () => {

            playerStats.searchAlarmModifier *= 0.5;

        }

    }

];

// --- Scoring System ---
/**
 * Calculate comprehensive score for a run
 */
function calculateScore(runData) {
    const {
        level,
        carsCompleted,
        totalCars,
        cashEarned,
        timeRemaining,
        actionsPerformed
    } = runData;
    
    let score = 0;
    
    // Base score from cars completed
    score += carsCompleted * 100;
    
    // Completion bonus (all cars done)
    if (carsCompleted === totalCars) {
        score += 500 * level;
    }
    
    // Level multiplier
    score *= level;
    
    // Time bonus (remaining time * 10 per second)
    score += timeRemaining * 10;
    
    // Cash bonus (10% of cash earned)
    score += Math.floor(cashEarned * 0.1);
    
    // Efficiency bonus (if completed >75% of cars)
    const completionRate = totalCars > 0 ? carsCompleted / totalCars : 0;
    if (completionRate >= 0.75) {
        score += 1000;
    }
    
    return Math.floor(score);
}

// Main Game Scene

scene("main", (levelData = { level: 1, cash: 0 }) => {

    // --- Level Setup ---

    currentLevel = levelData.level;

    currentCash = levelData.cash;

    updateRunHUD({
        scene: "In Run",
        inRun: true,
        cash: currentCash,
        level: currentLevel,
        timer: timeLeft,
        eventName: "None",
        objectiveSummary: "Rolling level setup...",
        upgrades: playerUpgrades,
        buffs: currentBuffs.map((buff) => buff.name),
        runState: `Loading level ${currentLevel}`,
        announce: `Level ${currentLevel} started`,
    });
    
    // Track if this is the start of a new run (level 1 with 0 cash)
    const isNewRun = currentLevel === 1 && currentCash === 0;
    
    // Apply permanent upgrades at start of run
    if (isNewRun) {
        resetRunState();

        const savedData = SaveSystem.load();
        
        // Apply all purchased permanent upgrades
        savedData.permanentUpgrades.forEach(upgradeId => {
            const upgrade = permanentUpgrades.find(u => u.id === upgradeId);
            if (upgrade && upgrade.effect) {
                upgrade.effect();
                console.log(`Applied permanent upgrade: ${upgrade.name}`);
            }
        });
        
        // Apply starting cash if player has Nest Egg upgrade
        if (savedData.permanentUpgrades.includes('perm_starting_cash')) {
            currentCash += 50;
            console.log('Applied Nest Egg: +$50 starting cash');
        }
    }

    carsInLevel = [];

    resetParkingSpots();

    // Reset event for this level
    currentEvent = null;
    currentEventState = {};
    currentLevelObjective = null;
    extraCarsThisLevel = 0;

    // Apply random event (30% chance)
    if (Math.random() < CONFIG.RANDOM_EVENT_CHANCE) {
        currentEvent = choose(levelEvents);
        console.log(`Random Event: ${currentEvent.name} - ${currentEvent.description}`);
        currentEventState = {
            name: currentEvent.name,
            description: currentEvent.description,
            ...(currentEvent.apply() || {}),
        };

        wait(0.5, () => {
            showFeedback(`Event: ${currentEvent.name}! ${getEventSummary(currentEventState)}`, rgb(255, 215, 0));
        });
    }

    // Time decreases by 5 seconds per level, with a minimum of 30 seconds

    timeLeft = Math.max(
        CONFIG.BASE_TIME + playerStats.timeBonus - (currentLevel - 1) * CONFIG.TIME_DECREASE_PER_LEVEL - (currentEventState.timePenalty || 0),
        CONFIG.MIN_TIME
    );

    updateRunHUD({
        scene: "In Run",
        inRun: true,
        cash: currentCash,
        level: currentLevel,
        timer: timeLeft,
        eventName: currentEventState.name || "None",
        eventSummary: getEventSummary(currentEventState),
        objectiveSummary: getObjectiveSummary(),
        upgrades: playerUpgrades,
        buffs: currentBuffs.map((buff) => buff.name),
        runState: `Level ${currentLevel} active`,
    });

    // Apply selected character's ability
    const selectedChar = characters.find(c => c.id === selectedCharacterId);
    if (selectedChar && selectedChar.applyAbility) {
        selectedChar.applyAbility();
        console.log(`Applied ${selectedChar.name}'s ability`);
    }

    // Apply temporary buffs purchased in shop

    currentBuffs = activeBuffs.slice();

    currentBuffs.forEach(buff => buff.apply());

    activeBuffs = [];

    updateRunHUD({
        scene: "In Run",
        inRun: true,
        cash: currentCash,
        level: currentLevel,
        timer: timeLeft,
        eventName: currentEventState.name || "None",
        eventSummary: getEventSummary(currentEventState),
        objectiveSummary: getObjectiveSummary(),
        upgrades: playerUpgrades,
        buffs: currentBuffs.map((buff) => buff.name),
        runState: `Level ${currentLevel} active`,
    });



    // Add the background

    add([

        sprite("background", { width: width(), height: height() }), // Scale sprite to canvas size

        pos(0, 0),

        area(), // Add area component for collisions if needed later

        z(-1), // Draw background behind other layers

    ]);



    // Player Setup

    const playerSpeed = CONFIG.PLAYER_SPEED * playerStats.moveSpeedMultiplier;

    // Player size (scaled down from 1024x1024)

    const playerSize = CONFIG.PLAYER_SIZE;

    const playerScale = playerSize / 1024;



    const player = add([

        sprite("player"), // Use the player sprite

        pos(center().x, height() - 60), // Start near bottom-center

        scale(playerScale), // Scale down from 1024x1024

        anchor("center"),

        area({ scale: 0.7 }), // Slightly smaller collision area than visual

        body({ isStatic: false }), // Make player a dynamic physics body

        "player", // Tag for identifying the player object

    ]);



    // Player Movement with direct position updates instead of move()

    const movePlayer = (dx, dy) => {
        if (!isInteracting && !actionInProgress) {
            player.pos.x += dx * playerSpeed * dt();
            player.pos.y += dy * playerSpeed * dt();
        }
    };

    onKeyDown("a", () => {

        movePlayer(-1, 0);

    });

    onKeyDown("d", () => {

        movePlayer(1, 0);

    });

    onKeyDown("w", () => {

        movePlayer(0, -1);

    });

    onKeyDown("s", () => {

        movePlayer(0, 1);

    });

    onKeyDown("left", () => {

        movePlayer(-1, 0);

    });

    onKeyDown("right", () => {

        movePlayer(1, 0);

    });

    onKeyDown("up", () => {

        movePlayer(0, -1);

    });

    onKeyDown("down", () => {

        movePlayer(0, 1);

    });



    // Also add arrow key support

    onKeyDown("arrow-left", () => {

        movePlayer(-1, 0);

    });

    onKeyDown("arrow-right", () => {

        movePlayer(1, 0);

    });

    onKeyDown("arrow-up", () => {

        movePlayer(0, -1);

    });

    onKeyDown("arrow-down", () => {

        movePlayer(0, 1);

    });



    // Remove custom onUpdate collision handling, let physics engine handle it



    player.onUpdate(() => {



        // Keep player within screen bounds (simple clamp using center anchor)

        // Use fixed values for screen bounds to ensure player can move throughout the entire screen

        if (player.pos.x < 50) player.pos.x = 50;

        if (player.pos.x > width() - 50) player.pos.x = width() - 50;

        if (player.pos.y < 50) player.pos.y = 50;

        if (player.pos.y > height() - 50) player.pos.y = height() - 50;



        if (currentEventState.rainstorm) {
            applyRainstormVisibility(player, carsInLevel);
        }

    });



    // --- Car Spawning ---

    const requestedCars = 5 + currentLevel * 2 + extraCarsThisLevel; // Increase cars per level + event bonus

    const availableSpots = parkingSpots.filter(spot => !spot.occupied);

    const numberOfCars = Math.min(requestedCars, availableSpots.length);



    if (requestedCars > availableSpots.length) {

        console.warn(`Level ${currentLevel}: Requested ${requestedCars} cars, but only ${availableSpots.length} spots available. Placing ${numberOfCars} cars.`);

    }



    // Shuffle available spots to randomize placement

    const shuffledSpots = availableSpots.sort(() => 0.5 - Math.random());



    for (let i = 0; i < numberOfCars; i++) {

        const spot = shuffledSpots[i];



        // Select a random car type using weighted selection based on level

        const selectedType = getRandomCarType(currentLevel);



        // Determine car dimensions based on orientation

        // For vertical spots, we'll swap width and height

        const carWidth = spot.orientation === 'vertical' ? selectedType.width : selectedType.height;

        const carHeight = spot.orientation === 'vertical' ? selectedType.height : selectedType.width;



        // Calculate position to center the car in the parking spot

        // Each parking spot is approximately 120px wide with white lines as boundaries

        const spotWidth = 120;

        const spotHeight = 180; // Taller for vertical spots



        // Add slight random offset to simulate imperfect parking (±5 pixels)

        const offsetX = Math.random() * 10 - 5;

        const offsetY = Math.random() * 10 - 5;



        // Center the car in the spot with slight random offset

        const centerX = spot.x + (spotWidth / 2) + offsetX;

        const centerY = spot.y + 90 + offsetY;



        // Calculate scale factor to fit the sprite in the parking spot

        // Original sprites are 300x450, we want to scale them down to fit our desired dimensions

        const scaleX = carWidth / 300;

        const scaleY = carHeight / 450;



        // Randomly determine if the car should be flipped (facing up or down)

        // This simulates some cars backing into spaces

        const shouldFlip = Math.random() > 0.5;



        const car = add([

            getCarSpriteComponent(selectedType.spriteName, "base"), // Use the car's sprite

            pos(centerX, centerY),

            anchor("center"), // Center the car in the parking spot

            scale(scaleX * 1, scaleY * (shouldFlip ? -1 : 1)), // Flip by using negative scale for Y

            area({ scale: getCarCollisionScale(selectedType.spriteName) }), // Tighten collision for padded sprite sheets

            body({ isStatic: true }), // Make cars static physics bodies

            "car", // Tag for identifying cars

            { // Custom properties stored on the car game object

                carData: selectedType,

                spotId: spot.id,

                interacted: false,

                isPriorityCustomer: false,

                priorityRewardClaimed: false,

                orientation: spot.orientation,

                specialProperty: null, // Initialize special property

            }

        ]);
// --- Initialize Car State Properties ---
        car.completed = false; // Track whether this car has been serviced
        car.state = 'idle'; // Initial state

        // --- Set Car State (only two possible states) ---
        const needsCleaning = Math.random() < 0.5; // 50% chance needs cleaning
        
        // Set the car state to either "needs cleaning" or "needs vacuum/searching"
        car.needsCleaning = needsCleaning;
        car.needsVacuumOrSearch = !needsCleaning;
        
        // --- Update sprite based on state ---
        const carType = car.carData.spriteName; // 'sedan' or 'sportscar'
        
        if (car.needsCleaning) {
            // Use dirty sprite
            car.use(getCarSpriteComponent(carType, "dirty"));
        } else if (car.needsVacuumOrSearch) {
            // Use vacuum/search sprite
            car.use(getCarSpriteComponent(carType, "vacuum"));
        }
        // --- End State Setting ---
        
        // --- Add state text overlay for testing (commented out) ---
        /*
        const stateText = car.add([
            text(car.needsCleaning ? "NEEDS CLEANING" : "NEEDS VACUUM/SEARCH", {
                size: 18,
                width: 100,
                align: "center"
            }),
            pos(0, 0),
            anchor("center"),
            color(255, 255, 255),
            outline(2, rgb(0, 0, 0)),
            z(10) // Make sure text is above the car
        ]);
        */

        carsInLevel.push(car);

        spot.occupied = true; // Mark the spot as occupied



        // --- Assign Special Property (Increasing chance with level) ---

        const specialChance = CONFIG.SPECIAL_PROPERTY_BASE_CHANCE + (currentLevel * CONFIG.SPECIAL_PROPERTY_LEVEL_INCREASE);

        if (Math.random() < specialChance) {

            // More special properties unlock at higher levels
            let possibleProperties = ["Extra Dirty", "Hidden Compartment"];
            
            if (currentLevel >= 3) {
                possibleProperties.push("Complex Interior"); // Takes longer to vacuum
            }
            if (currentLevel >= 5) {
                possibleProperties.push("VIP Owner"); // Higher rewards, no alarm risk
            }
            if (currentLevel >= 7) {
                possibleProperties.push("Suspicious"); // Higher alarm chance, better loot
            }



            car.specialProperty = choose(possibleProperties);

            console.log(`Car in spot ${spot.id} is special: ${car.specialProperty}`);

            // Visual indicator for special cars
            if (car.specialProperty === "Extra Dirty") {
                car.color = rgb(165, 113, 78, 0.4); // Brown tint
            } else if (car.specialProperty === "Hidden Compartment") {
                car.color = rgb(255, 215, 0, 0.3); // Gold tint
            } else if (car.specialProperty === "Complex Interior") {
                car.color = rgb(128, 0, 255, 0.3); // Purple tint
            } else if (car.specialProperty === "VIP Owner") {
                car.color = rgb(0, 255, 255, 0.3); // Cyan tint
            } else if (car.specialProperty === "Suspicious") {
                car.color = rgb(255, 0, 0, 0.3); // Red tint
            }
            
            // X-Ray Goggles: Show special property text
            if (playerStats.xrayVision) {
                car.add([
                    text(car.specialProperty, {
                        size: 14,
                        width: 100,
                        align: "center"
                    }),
                    pos(0, -60),
                    anchor("center"),
                    color(255, 255, 0),
                    outline(2, rgb(0, 0, 0)),
                    z(10)
                ]);
            }

        }

    }

    if (currentEventState.customerDemands) {
        const priorityCars = choosePriorityCars(carsInLevel.filter(car => !car.completed), currentEventState.priorityCarCount || 2);
        currentEventState.priorityCarsRemaining = priorityCars.length;

        priorityCars.forEach((car) => {
            car.isPriorityCustomer = true;
            car.add([
                text("PRIORITY", {
                    size: 14,
                    width: 100,
                    align: "center",
                }),
                pos(0, -62),
                anchor("center"),
                color(255, 210, 80),
                outline(2, rgb(0, 0, 0)),
                z(10),
                "priorityBadge",
            ]);
        });
    }

    console.log(`Level ${currentLevel}: Spawned ${carsInLevel.length} cars.`);



    // --- UI Setup ---

    // UI dirty flags to track which elements need updating

    const uiDirty = {

        cash: true,

        level: true,

        timer: true,

        inventory: true

    };

    

    // Helper function to update UI elements

    const updateUI = (forceUpdate = false) => {

        if (uiDirty.cash || uiDirty.level || uiDirty.timer || uiDirty.inventory || forceUpdate) {
            updateRunHUD({
                scene: "In Run",
                inRun: true,
                cash: currentCash,
                level: currentLevel,
                timer: timeLeft,
                eventName: currentEventState.name || "None",
                eventSummary: getEventSummary(currentEventState),
                objectiveSummary: getObjectiveSummary(),
                upgrades: playerUpgrades,
                buffs: currentBuffs.map((buff) => buff.name),
                runState: getRunStateLabel(),
            });

            uiDirty.cash = false;
            uiDirty.level = false;
            uiDirty.timer = false;
            uiDirty.inventory = false;
        }

    };

    

    // Function to mark specific UI elements as dirty

    const markUIDirty = (elements) => {

        if (elements === 'all') {

            Object.keys(uiDirty).forEach(key => uiDirty[key] = true);

        } else if (Array.isArray(elements)) {

            elements.forEach(element => {

                if (uiDirty.hasOwnProperty(element)) {

                    uiDirty[element] = true;

                }

            });

        } else if (uiDirty.hasOwnProperty(elements)) {

            uiDirty[elements] = true;

        }

    };



    // Create persistent feedback text object (initially hidden)

    feedbackTextObject = add([

        text("", { size: 18 }), // Start with empty text

        pos(center().x, 60), // Position near top-center

        anchor("center"),

        z(300), // Ensure feedback is on top

        opacity(0), // Start hidden

        "feedbackText"

    ]);



    // --- Timer Logic ---

    // Use Kaboom's onUpdate for more consistent timing instead of setInterval

    let lastTick = time();

    const timerUpdate = onUpdate(() => {

        // Check if a second has passed

        if (time() - lastTick >= 1) {

            timeLeft--;

            lastTick = time();

            if (currentEventState.arrivalPressure && currentEventState.rushHourCarsRemaining > 0) {
                currentEventState.arrivalSeconds = Math.max((currentEventState.arrivalSeconds || currentEventState.arrivalInterval || 12) - 1, 0);
                if (currentEventState.arrivalSeconds === 0) {
                    spawnRushHourArrival();
                }
            }

            

            // Mark timer as dirty instead of directly updating

            markUIDirty('timer');

            // Update all UI elements

            updateUI();



            if (timeLeft <= 0) {

                // Cancel the update loop

                timerUpdate.cancel();



                // Count how many cars have been serviced

                const completedCars = carsInLevel.filter(car => car.completed).length;

                const totalCars = carsInLevel.length;

                const completionPercentage = totalCars > 0 ? (completedCars / totalCars) * 100 : 0;
                const requiredCompletionRatio = getRequiredCompletionRatio();



                console.log(`Level ${currentLevel} ended. ${completedCars}/${totalCars} cars serviced (${completionPercentage.toFixed(1)}%).`);



                // Level is complete if at least 50% of cars have been serviced

                if (completionPercentage >= requiredCompletionRatio * 100) {

                    console.log(`Level ${currentLevel} complete! Advancing to upgrade screen.`);

                    // Go to the upgrade scene

                    go("upgradeScene", { nextLevel: currentLevel + 1, cash: currentCash });

                } else {

                    console.log(`Level ${currentLevel} failed. Did not reach the objective threshold before timeout.`);

                    // Go to game over, passing all relevant data

                    go("gameOver", {
                        cash: currentCash,
                        level: currentLevel,
                        carsCompleted: completedCars,
                        totalCars: totalCars
                    });

                }

            }

        }

    });



    // Cleanup timer when scene changes

    onSceneLeave(() => {

        // Cancel the timer update loop

        if (timerUpdate) timerUpdate.cancel();

        if (interactionMenu) interactionMenu.destroy(); // Clean up menu if scene changes

        interactionMenu = null;

        targetCar = null;

        isInteracting = false;

        actionInProgress = false;

        if (actionProgressBar) actionProgressBar.destroy();

        actionProgressBar = null;

        resetRunHUD("Menu");

    }); // End of onSceneLeave



    // --- Interaction Logic --- (Correctly placed inside scene)



    // Function to show interaction menu

    function showInteractionMenu(car) {

        isInteracting = true; // Pause player movement

        targetCar = car; // Store the target



        // Destroy previous menu if exists

        if (interactionMenu) interactionMenu.destroy();



        // Menu position relative to car

        const menuX = car.pos.x;

        // Adjust Y position based on whether car is in top or bottom row

        const menuY = car.pos.y < height() / 2 ? car.pos.y + car.height + 10 : car.pos.y - 40;



        // Create a group for menu elements

        interactionMenu = add([

            pos(menuX, menuY),

            z(200), // Ensure menu is on top

            fixed(), // Keep menu fixed relative to screen (might need adjustment if camera moves)

        ]);



        // Menu Background (optional)

        interactionMenu.add([

            rect(200, 90, { radius: 5 }),

            pos(0, 0),

            anchor("center"),

            color(0, 0, 0, 0.7), // Semi-transparent black

            outline(2, rgb(255, 255, 255)),

        ]);



        // Menu Text Options

        const searchTime = Math.round((playerStats.baseSearchTime * playerStats.searchLootMultiplier * car.carData.searchModifier) * 2) / 2;

        const cleanTime = Math.round((playerStats.baseCleanTime * playerStats.cleanSpeedMultiplier * car.carData.cleanModifier) * 2) / 2;

        const vacuumTime = Math.round((playerStats.baseVacuumTime * playerStats.vacuumSpeedMultiplier * car.carData.vacuumModifier) * 2) / 2;



        // Conditionally add actions based on car state
        if (car.isPriorityCustomer && !car.priorityRewardClaimed) {
            interactionMenu.add([
                text(`Priority: +$${currentEventState.priorityCashBonus || EVENT_PRIORITY_CASH_BONUS}, +${currentEventState.priorityTimeBonus || EVENT_PRIORITY_TIME_BONUS}s`, { size: 14 }),
                pos(0, -28),
                anchor("center"),
                color(255, 210, 80),
            ]);
        }

        if (car.needsCleaning) {
            // Only show Clean option
            interactionMenu.add([text(`[2] Clean (${cleanTime}s)`, { size: 16 }), pos(0, car.isPriorityCustomer && !car.priorityRewardClaimed ? 12 : 0), anchor("center")]);
        } else if (car.needsVacuumOrSearch) {
            // Show Search and Vacuum options (adjust Y positions)
            const menuOffset = car.isPriorityCustomer && !car.priorityRewardClaimed ? 12 : 0;
            interactionMenu.add([text(`[1] Search (${searchTime}s)`, { size: 16 }), pos(0, -10 + menuOffset), anchor("center")]);
            interactionMenu.add([text(`[3] Vacuum (${vacuumTime}s)`, { size: 16 }), pos(0, 10 + menuOffset), anchor("center")]);
        }

    }



    // Function to hide interaction menu

    function hideInteractionMenu() {

        if (interactionMenu) interactionMenu.destroy();

        interactionMenu = null;

        targetCar = null;

        isInteracting = false; // Resume player movement

    }



    // Function to perform the chosen interaction



    // Helper function to get color based on action type

    function getActionColor(actionType) {

        switch (actionType) {

            case 'search': return rgb(0, 255, 0);

            case 'clean': return rgb(0, 180, 255);

            case 'vacuum': return rgb(200, 0, 255);

            default: return rgb(255, 255, 255);

        }

    }



    // Buffs are now purchased in the shop, no random buff assignment



    // Function to show action progress bar

    const showActionProgress = (actionType, duration, carName) => {

        // Destroy previous progress bar if exists

        if (actionProgressBar) actionProgressBar.destroy();



        // Create a new progress bar group

        actionProgressBar = add([

            pos(center().x, height() - 100),

            anchor("center"),

            z(300),

        ]);



        // Background bar

        actionProgressBar.add([

            rect(220, 58, { radius: 8 }),

            pos(0, -2),

            color(12, 12, 12, 0.82),

            outline(2, rgb(240, 240, 240)),

            anchor("center"),

        ]);

        actionProgressBar.add([

            rect(180, 20, { radius: 4 }),

            pos(0, 12),

            color(0, 0, 0, 0.78),

            outline(2, rgb(255, 255, 255)),

            anchor("center"),

        ]);



        // Progress fill (starts empty)

        const progressFill = actionProgressBar.add([

            rect(0, 16, { radius: 3 }),

            pos(-88, 12),

            anchor("left"),

            color(getActionColor(actionType)),

        ]);



        // Action label

        actionProgressBar.add([

            text(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)}ing ${carName}...`, { size: 16, width: 190, align: "center" }),

            pos(0, -12),

            anchor("center"),

            color(255, 255, 255),

        ]);



        return {

            progressFill: progressFill,

            duration: duration

        };

    };



    // Function to perform interaction with a car

    const performInteraction = (car, actionType) => {

        if (!car || car.interacted || actionInProgress) return;

        const actionAllowed =
            (actionType === 'clean' && car.needsCleaning) ||
            ((actionType === 'search' || actionType === 'vacuum') && car.needsVacuumOrSearch);

        if (!actionAllowed) {
            showFeedback(`Cannot ${actionType} this car right now.`, rgb(255, 120, 120));
            return;
        }



        // Set action in progress flag

        actionInProgress = true;
        updateRunHUD({
            scene: "In Run",
            inRun: true,
            cash: currentCash,
            level: currentLevel,
            timer: timeLeft,
            eventName: currentEventState.name || "None",
            eventSummary: getEventSummary(currentEventState),
            objectiveSummary: getObjectiveSummary(),
            upgrades: playerUpgrades,
            buffs: currentBuffs.map((buff) => buff.name),
            runState: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} in progress`,
        });

        hideInteractionMenu();



        const modifier = car.carData[`${actionType}Modifier`]; // Get modifier for the action

        // Calculate action duration using helper function
        const actionDuration = calculateActionDuration(actionType, car);



        // Show progress bar

        const progressBar = showActionProgress(actionType, actionDuration, car.carData.name);



        // Show a message that the action is in progress

        showFeedback(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)}ing ${car.carData.name}...`, getActionColor(actionType));



        // Create a timer to track progress

        let elapsedTime = 0;

        const progressFill = progressBar.progressFill;



        // Use Kaboom's onUpdate to animate the progress bar

        const progressTimer = onUpdate(() => {

            if (!actionInProgress) return;



            elapsedTime += dt();

            const progress = Math.min(elapsedTime / actionDuration, 1);

            progressFill.width = progress * 176;



            // When complete

            if (progress >= 1) {

                // Cancel the update loop

                progressTimer.cancel();



                // Action is complete

                actionInProgress = false;



                // Remove progress bar

                if (actionProgressBar) {

                    actionProgressBar.destroy();

                    actionProgressBar = null;

                }



                // Mark car as serviced/completed

                car.completed = true;
                car.interacted = true;
                car.completedAction = actionType;

                car.opacity = 0.5; // Reduce opacity to show the car has been serviced
// Update sprite to show completed state
                const carType = car.carData.spriteName; // 'sedan' or 'sportscar'
                car.use(getCarSpriteComponent(carType, "clean")); // Use clean sprite for completed cars
                
                // Update the state text overlay to show completed (commented out)
                /*
                const stateTextObj = car.children.find(child => child.text &&
                    (child.text.includes("NEEDS CLEANING") || child.text.includes("NEEDS VACUUM/SEARCH")));
                
                if (stateTextObj) {
                    stateTextObj.text = "COMPLETED";
                    stateTextObj.color = rgb(0, 255, 0); // Green for completed
                }
                */

                

                // Update the remaining active cars list

                updateNonInteractedCars();



                // Process the action results

                completeAction(car, actionType, modifier);

            }

        });

    };



    // Function to process action results after completion

    function completeAction(car, actionType, modifier) {

        const awardPriorityCustomerBonus = () => {
            if (!car.isPriorityCustomer || car.priorityRewardClaimed) {
                return;
            }

            const timeBonus = currentEventState.priorityTimeBonus || EVENT_PRIORITY_TIME_BONUS;
            const cashBonus = currentEventState.priorityCashBonus || EVENT_PRIORITY_CASH_BONUS;

            car.priorityRewardClaimed = true;
            currentCash += cashBonus;
            timeLeft += timeBonus;
            currentEventState.priorityCarsRemaining = Math.max((currentEventState.priorityCarsRemaining || 1) - 1, 0);
            markUIDirty(['cash', 'timer']);

            car.children
                .filter(child => child.is("priorityBadge"))
                .forEach(child => child.destroy());

            console.log(`Priority customer completed: +$${cashBonus}, +${timeBonus}s`);
            wait(0.3, () => {
                showFeedback(`Priority Customer! +$${cashBonus} and +${timeBonus}s`, rgb(255, 210, 80));
            });
        };

        const tryGrantSearchBuff = () => {
            let buffChance = 0.12;

            if (car.specialProperty === "Hidden Compartment") {
                buffChance += 0.13;
            } else if (car.specialProperty === "VIP Owner") {
                buffChance += 0.08;
            }

            buffChance *= playerStats.rareItemChanceMultiplier || 1;

            if (Math.random() >= Math.min(buffChance, 0.9)) {
                return;
            }

            const foundBuff = choose(tempBuffs);
            currentBuffs.push(foundBuff);
            foundBuff.apply();
            markUIDirty('inventory');

            console.log(`Found temporary buff: ${foundBuff.name}`);
            wait(0.5, () => {
                showFeedback(`Found ${foundBuff.name}!`, rgb(255, 215, 0));
            });
        };

        // Process action results

        switch (actionType) {

            case 'search':

                {

                    console.log("Performing Search on car:", car.carData.name);

                    let baseLootChance = 0.3;

                    let baseAlarmChance = 0.2;

                    // Apply special property modifiers
                    if (car.specialProperty === "Hidden Compartment") {
                        baseLootChance *= 1.5; // 50% higher chance to find loot
                        console.log("Hidden Compartment bonus applied to search!");
                    } else if (car.specialProperty === "VIP Owner") {
                        baseAlarmChance = 0; // No alarm risk for VIP cars
                        baseLootChance *= 1.3; // 30% better loot
                        console.log("VIP Owner: No alarm risk, better loot!");
                    } else if (car.specialProperty === "Suspicious") {
                        baseAlarmChance *= 1.5; // 50% higher alarm chance
                        baseLootChance *= 1.4; // 40% better loot
                        console.log("Suspicious car: Higher risk, higher reward!");
                    }

                    const lootChance = Math.min(baseLootChance * modifier * (playerStats.rareItemChanceMultiplier || 1), 0.95);

                    const alarmChance = Math.min(baseAlarmChance * modifier, 0.7);

                    const searchOutcome = Math.random();



                    if (searchOutcome < lootChance) {

                        let lootAmount = Math.floor((Math.random() * 20 + 10) * modifier * playerStats.searchLootMultiplier * (car.carData.cashMultiplier || 1)); // Apply loot multiplier and car cash multiplier

                        // Apply special property bonuses
                        if (car.specialProperty === "Hidden Compartment") {
                            lootAmount = Math.floor(lootAmount * 1.5); // 50% more loot
                        } else if (car.specialProperty === "VIP Owner") {
                            lootAmount = Math.floor(lootAmount * 1.3); // 30% more loot
                        } else if (car.specialProperty === "Suspicious") {
                            lootAmount = Math.floor(lootAmount * 1.4); // 40% more loot
                        }

                        if (playerStats.multitaskCashMultiplier) {
                            lootAmount = Math.round(lootAmount * playerStats.multitaskCashMultiplier);
                        }

                        currentCash += lootAmount;

                        markUIDirty('cash');

                        console.log(`Found loot! +$${lootAmount}`);

                        showFeedback(`Found Loot! +$${lootAmount}`, rgb(0, 255, 0)); // Green for loot

                    } else if (searchOutcome < lootChance + alarmChance) {

                        const timePenalty = Math.round(10 * modifier * playerStats.searchAlarmModifier); // Apply alarm modifier

                        timeLeft -= timePenalty;

                        if (timeLeft < 0) timeLeft = 0;

                        markUIDirty(['timer', 'cash']);

                        updateUI();

                        console.log(`Alarm triggered! -${timePenalty} seconds.`);

                        showFeedback(`Alarm! -${timePenalty}s`, rgb(255, 0, 0)); // Red for alarm

                    } else {

                        const baseCash = 5;

                        const cash = Math.round(baseCash * modifier * (car.carData.cashMultiplier || 1));

                        let totalCash = cash;

                        if (playerStats.multitaskCashMultiplier) {
                            totalCash = Math.round(totalCash * playerStats.multitaskCashMultiplier);
                        }

                        currentCash += totalCash;

                        markUIDirty('cash');

                        console.log("Found nothing special.");

                        showFeedback(`Searched. +$${totalCash}`, rgb(200, 200, 200)); // Gray for neutral

                    }

                    tryGrantSearchBuff();

                }

                break;

            case 'clean':

                {

                    console.log("Performing Clean on car:", car.carData.name);

                    let baseCash = 10; // Declare with let



                    // Apply Extra Dirty bonus

                    if (car.specialProperty === "Extra Dirty") {

                        // Apply standard dirty bonus

                        baseCash *= 1.5; // 50% more cash

                        console.log("Extra Dirty bonus applied to clean!");

                        

                        // Apply Rubber Gloves bonus if player has it

                        if (playerStats.dirtyCarBonus) {

                            // Apply the cleaning speed bonus for dirty cars

                            const dirtyBonus = playerStats.dirtyCarBonus;

                            baseCash *= (1 + dirtyBonus * 0.5); // Additional cash bonus

                            console.log(`Rubber Gloves bonus applied: +${dirtyBonus * 100}% efficiency on dirty car!`);

                        }

                    }



                    const cash = Math.round(baseCash * modifier * (car.carData.cashMultiplier || 1)); // Apply car type cash multiplier
                    let totalCash = cash;

                    if (playerStats.multitaskCashMultiplier) {
                        totalCash = Math.round(totalCash * playerStats.multitaskCashMultiplier);
                    }

                    currentCash += totalCash;

                    markUIDirty('cash');



                    console.log(`Cleaned car. +$${totalCash}`);

                    let feedbackMsg = `Cleaned! +$${totalCash}`;

                    if (car.specialProperty === "Extra Dirty") {

                        feedbackMsg += " (Dirty Bonus!)";

                    }

                    showFeedback(feedbackMsg, rgb(0, 180, 255)); // Blue for clean
                    
                    // Steam Cleaner: cleaning gains a bundled interior-service bonus
                    if (playerStats.steamCleanerActive && car.needsVacuumOrSearch) {
                        const vacuumCash = Math.round(15 * modifier * (car.carData.cashMultiplier || 1));
                        currentCash += vacuumCash;
                        markUIDirty('cash');
                        console.log(`Steam Cleaner bonus: +$${vacuumCash} interior-service bonus`);
                        wait(0.5, () => {
                            showFeedback(`Steam Bonus! +$${vacuumCash}`, rgb(150, 200, 255));
                        });
                    }

                }

                break;

            case 'vacuum':

                {

                    console.log("Performing Vacuum on car:", car.carData.name);

                    let baseCash = 15;
                    
                    // Apply Complex Interior penalty/bonus
                    if (car.specialProperty === "Complex Interior") {
                        baseCash *= 1.5; // 50% more cash for complex interior
                        console.log("Complex Interior bonus applied!");
                    }

                    const cash = Math.round(baseCash * modifier * (car.carData.cashMultiplier || 1));
                    let totalCash = cash;

                    if (playerStats.multitaskCashMultiplier) {
                        totalCash = Math.round(totalCash * playerStats.multitaskCashMultiplier);
                    }

                    currentCash += totalCash;

                    markUIDirty('cash');

                    let vacuumMsg = `Vacuumed! +$${totalCash}`;
                    if (car.specialProperty === "Complex Interior") {
                        vacuumMsg += " (Complex!)";
                    }

                    console.log(`Vacuumed car. +$${totalCash}`);

                    showFeedback(vacuumMsg, rgb(200, 0, 255)); // Purple for vacuum
                    
                    // Magnetic Vacuum: vacuuming gains a bundled loose-change bonus
                    if (playerStats.magnetVacActive) {
                        const bonusCash = Math.floor((Math.random() * 10 + 5) * (car.carData.cashMultiplier || 1));
                        currentCash += bonusCash;
                        markUIDirty('cash');
                        console.log(`Magnetic Vacuum found: +$${bonusCash}`);
                        wait(0.5, () => {
                            showFeedback(`Magnet Bonus! +$${bonusCash}`, rgb(255, 215, 0));
                        });
                    }

                }

                break;

        }



        // Update all UI elements

        updateUI();

        console.log("Interaction complete. Cash:", currentCash);

        

        // Helper function to apply bonus effects

        const applyBonusEffects = () => {

            // Apply tip jar effect (chance for small tip)

            if (playerStats.tipChance && Math.random() < playerStats.tipChance) {

                const tipAmount = Math.floor(Math.random() * 10) + 5; // $5-15 tip

                addCashWithFeedback(tipAmount, "Tip Jar", "Tip!", rgb(255, 215, 0));

            }

            

            // Apply customer connections effect (chance for large tip)

            if (playerStats.largeTipChance && Math.random() < playerStats.largeTipChance) {

                const tipAmount = Math.floor(Math.random() * 30) + 20; // $20-50 tip

                addCashWithFeedback(tipAmount, "Customer Connection", "Large Tip!", rgb(255, 165, 0));

            }

            

            // Apply VIP Service effect (bonus every 5th car)

            if (playerStats.vipServiceActive) {

                // Initialize the counter if it doesn't exist

                if (typeof playerStats.carsCompletedCounter === 'undefined') {

                    playerStats.carsCompletedCounter = 0;

                }

                

                // Increment the counter

                playerStats.carsCompletedCounter++;

                

                // Check if this is the 5th car

                if (playerStats.carsCompletedCounter % 5 === 0) {

                    const bonusAmount = 100 + (currentLevel * 20); // $100 base + $20 per level

                    addCashWithFeedback(bonusAmount, "VIP Service", "VIP Bonus!", rgb(255, 50, 50));

                }

            }

        };

        

        // Helper function to add cash with feedback

        const addCashWithFeedback = (amount, source, message, color) => {

            currentCash += amount;

            markUIDirty('cash');

            console.log(`${source}: Received $${amount}!`);

            showFeedback(`${message} +$${amount}`, color);

            updateUI();

        };

        

        // Apply all bonus effects

        applyBonusEffects();

        awardPriorityCustomerBonus();



        // Check if level is complete after interaction

        checkLevelComplete();

    }

    // Function to check if all cars have been serviced and end level if so

    function checkLevelComplete() {

        if (currentLevelObjective && currentLevelObjective.shouldCompleteLevel()) {

            console.log(`Level ${currentLevel} complete! Objective cleared.`);

            if (timerInterval) clearInterval(timerInterval); // Stop timer immediately

            timerInterval = null;

            // Go to the upgrade scene

            go("upgradeScene", { nextLevel: currentLevel + 1, cash: currentCash });

        }

    }





    // --- Input Handling --- (Correctly placed inside scene)



    // Track unserviced cars separately for more efficient searching

    let nonInteractedCars = [];

    

    // Function to update the unserviced cars list

    const updateNonInteractedCars = () => {

        nonInteractedCars = carsInLevel.filter(car => !car.completed);

    };

    

    // Initialize the list

    updateNonInteractedCars();

    currentLevelObjective = createLevelObjective(currentLevel, carsInLevel);

    const spawnRushHourArrival = () => {
        if (!currentEventState.arrivalPressure || currentEventState.rushHourCarsRemaining <= 0) {
            return false;
        }

        const openSpots = parkingSpots.filter((spot) => !spot.occupied);
        if (openSpots.length === 0) {
            currentEventState.arrivalSeconds = currentEventState.arrivalInterval || 12;
            return false;
        }

        const spawnCount = Math.min(currentEventState.rushHourWaveSize || 1, currentEventState.rushHourCarsRemaining, openSpots.length);
        const shuffledOpenSpots = openSpots.slice().sort(() => 0.5 - Math.random());

        for (let i = 0; i < spawnCount; i++) {
            const spot = shuffledOpenSpots[i];
            const arrivingType = getRandomCarType(currentLevel + 1);
            const carWidth = spot.orientation === 'vertical' ? arrivingType.width : arrivingType.height;
            const carHeight = spot.orientation === 'vertical' ? arrivingType.height : arrivingType.width;
            const spotWidth = 120;
            const offsetX = Math.random() * 10 - 5;
            const offsetY = Math.random() * 10 - 5;
            const centerX = spot.x + (spotWidth / 2) + offsetX;
            const centerY = spot.y + 90 + offsetY;
            const scaleX = carWidth / 300;
            const scaleY = carHeight / 450;
            const shouldFlip = Math.random() > 0.5;

            const arrivingCar = add([
                getCarSpriteComponent(arrivingType.spriteName, "base"),
                pos(centerX, centerY),
                anchor("center"),
                scale(scaleX * 1, scaleY * (shouldFlip ? -1 : 1)),
                area({ scale: getCarCollisionScale(arrivingType.spriteName) }),
                body({ isStatic: true }),
                "car",
                {
                    carData: arrivingType,
                    spotId: spot.id,
                    interacted: false,
                    isPriorityCustomer: false,
                    priorityRewardClaimed: false,
                    orientation: spot.orientation,
                    specialProperty: null,
                    arrivedLate: true,
                }
            ]);

            arrivingCar.completed = false;
            arrivingCar.state = 'idle';
            const needsCleaning = Math.random() < 0.5;
            arrivingCar.needsCleaning = needsCleaning;
            arrivingCar.needsVacuumOrSearch = !needsCleaning;
            if (arrivingCar.needsCleaning) {
                arrivingCar.use(getCarSpriteComponent(arrivingType.spriteName, "dirty"));
            } else {
                arrivingCar.use(getCarSpriteComponent(arrivingType.spriteName, "vacuum"));
            }

            carsInLevel.push(arrivingCar);
            spot.occupied = true;
        }

        currentEventState.rushHourCarsRemaining -= spawnCount;
        currentEventState.arrivalSeconds = currentEventState.rushHourCarsRemaining > 0
            ? (currentEventState.arrivalInterval || 12)
            : 0;
        updateNonInteractedCars();
        markUIDirty('timer');
        updateUI(true);
        showFeedback(`Rush Hour! ${spawnCount} new car${spawnCount === 1 ? '' : 's'} rolled in.`, rgb(255, 170, 60));
        announceCanvasStatus(`Rush Hour arrival: ${spawnCount} new car${spawnCount === 1 ? '' : 's'} added.`);
        return true;
    };

    updateRunHUD({
        scene: "In Run",
        inRun: true,
        cash: currentCash,
        level: currentLevel,
        timer: timeLeft,
        eventName: currentEventState.name || "None",
        eventSummary: getEventSummary(currentEventState),
        objectiveSummary: getObjectiveSummary(),
        upgrades: playerUpgrades,
        buffs: currentBuffs.map((buff) => buff.name),
        runState: getRunStateLabel(),
        announce: `${currentLevelObjective.name}. ${getObjectiveSummary()}`,
    });

    

    // Interaction Key

    onKeyPress("e", () => {

        if (isInteracting) return; // Don't trigger if menu already open



        let closestCar = null;

        let minDist = CONFIG.INTERACTION_RANGE;



        // Find the closest unserviced car within range

        // Only search through unserviced cars for better performance

        for (const car of nonInteractedCars) {

            // Use Kaboom's distance method

            const dist = player.pos.dist(car.worldPos()); // Use worldPos for accurate distance

            if (dist < minDist) {

                minDist = dist;

                closestCar = car;

            }

        }



        if (closestCar) {

            showInteractionMenu(closestCar);

        }

    });



    // Menu selection keys

    onKeyPress("1", () => {

        if (isInteracting && targetCar) performInteraction(targetCar, 'search');

    });

    onKeyPress("2", () => {

        if (isInteracting && targetCar) performInteraction(targetCar, 'clean');

    });

    onKeyPress("3", () => {

        if (isInteracting && targetCar) performInteraction(targetCar, 'vacuum');

    });

    onKeyPress("escape", () => { // Allow canceling

        if (isInteracting) hideInteractionMenu();

    });



    // Note: Movement keys and player boundary checks are already correctly placed inside this scene block.

}); // End of scene("main", ...)

// Removed duplicated interaction logic and input handling from here

// Game Over Scene definition starts below



scene("gameOver", ({ cash, level, carsCompleted, totalCars }) => { // Receive data from main scene

    resetRunHUD("Game Over", `Run ended on level ${level}`);

    // Calculate final score
    const finalScore = calculateScore({
        level: level || 1,
        carsCompleted: carsCompleted || 0,
        totalCars: totalCars || 1,
        cashEarned: cash || 0,
        timeRemaining: 0,
        actionsPerformed: carsCompleted || 0
    });
    
    // Calculate meta-currency reward (stars)
    // Award 1 star per level reached + bonus stars for performance
    const baseStars = level || 1;
    const bonusStars = Math.floor(finalScore / 1000); // 1 star per 1000 score
    const totalStars = baseStars + bonusStars;
    
    // Save statistics and award stars
    SaveSystem.updateStatistics({
        level: level || 1,
        carsCompleted: carsCompleted || 0,
        cashEarned: cash || 0,
        score: finalScore
    });
    
    const newMetaCurrency = SaveSystem.addMetaCurrency(totalStars);
    
    console.log(`Game Over - Score: ${finalScore}, Stars Earned: ${totalStars}, Total Stars: ${newMetaCurrency}`);

    // Background
    add([
        rect(width(), height()),
        color(20, 20, 30),
        z(-1)
    ]);

    add([
        text("Game Over!", { size: 64 }),
        pos(center().x, 80),
        anchor("center"),
        color(255, 100, 100)
    ]);

    // Stats display
    add([
        text(`Level Reached: ${level}`, { size: 32 }),
        pos(center().x, 180),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text(`Cars Completed: ${carsCompleted}/${totalCars}`, { size: 28 }),
        pos(center().x, 230),
        anchor("center"),
        color(200, 200, 255)
    ]);

    add([
        text(`Final Cash: $${cash}`, { size: 28 }),
        pos(center().x, 270),
        anchor("center"),
        color(0, 255, 100)
    ]);

    add([
        text(`Score: ${finalScore}`, { size: 36 }),
        pos(center().x, 320),
        anchor("center"),
        color(255, 215, 0)
    ]);

    // Stars earned
    add([
        text(`★ Stars Earned: ${totalStars} ★`, { size: 32 }),
        pos(center().x, 380),
        anchor("center"),
        color(255, 215, 0)
    ]);

    add([
        text(`Total Stars: ${newMetaCurrency}`, { size: 24 }),
        pos(center().x, 420),
        anchor("center"),
        color(200, 200, 100)
    ]);

    // Instructions
    add([
        text("Press SPACE to return to menu", { size: 24 }),
        pos(center().x, 500),
        anchor("center"),
        color(150, 150, 150)
    ]);

    add([
        text("Visit the Upgrades shop to spend your stars!", { size: 20 }),
        pos(center().x, 540),
        anchor("center"),
        color(100, 200, 255)
    ]);

    // Go back to title scene on space press
    onKeyPress("space", () => {
        resetRunState();
        go("title");
    });
    
});



// --- Upgrade Scene ---

scene("upgradeScene", ({ nextLevel, cash }) => {

    updateRunHUD({
        scene: "Upgrade Shop",
        inRun: false,
        cash,
        runState: `Preparing level ${nextLevel}`,
        announce: `Upgrade shop opened for level ${nextLevel}`,
    });



    const uiMargin = 20, uiY = 20;



    add([

        text(`Cash: $${cash}`, { size: 24 }),

        pos(uiMargin, uiY),

        fixed(),

        z(100),

    ]);



    // Add background (optional, could be simpler)

    add([

        rect(width(), height()),

        color(30, 30, 30), // Dark background

        z(-1),

    ]);



    add([

        text("Level Complete!", { size: 48 }),

        pos(center().x, 100),

        anchor("center"),

    ]);

    add([

        text("Choose an Upgrade:", { size: 32 }),

        pos(center().x, 180),

        anchor("center"),

    ]);



    // Display current stats

    add([

        text(`Current Stats:`, { size: 18 }),

        pos(width() - 50, 100),

        anchor("topright"),

        color(150, 150, 255),

    ]);



    // Format stats for display (convert multipliers to percentages)
    const cleanSpeed = formatMultiplierAsPercent(playerStats.cleanSpeedMultiplier, true);
    const vacuumSpeed = formatMultiplierAsPercent(playerStats.vacuumSpeedMultiplier, true);
    const lootBonus = formatMultiplierAsPercent(playerStats.searchLootMultiplier, false);
    const alarmReduction = formatMultiplierAsPercent(playerStats.searchAlarmModifier, true);



    add([

        text(`Clean Speed: +${cleanSpeed}%`, { size: 16 }),

        pos(width() - 50, 130),

        anchor("topright"),

        color(0, 180, 255),

    ]);





    add([

        text(`Vacuum Speed: +${vacuumSpeed}%`, { size: 16 }),

        pos(width() - 50, 155),

        anchor("topright"),

        color(200, 0, 255),

    ]);



    add([

        text(`Loot Bonus: +${lootBonus}%`, { size: 16 }),

        pos(width() - 50, 180),

        anchor("topright"),

        color(0, 255, 0),

    ]);



    add([

        text(`Alarm Reduction: ${alarmReduction}%`, { size: 16 }),

        pos(width() - 50, 205),

        anchor("topright"),

        color(255, 100, 100),

    ]);



    // Select 3 unique random upgrades to offer

    const rarityWeights = {

        common: 60,

        uncommon: 25,

        rare: 10,

        legendary: 5

    };



    const rarityCosts = {

        common: 50,

        uncommon: 100,

        rare: 150,

        legendary: 200

    };



    const buffRarityCosts = {

        common: 20,

        uncommon: 40,

        rare: 60,

        legendary: 80

    };



    const weightedPool = [];



    availableUpgrades.forEach(upg => {

        for (let i = 0; i < rarityWeights[upg.rarity]; i++) {

            weightedPool.push({ type: "upgrade", item: upg });

        }

    });



    tempBuffs.forEach(buff => {

        for (let i = 0; i < rarityWeights[buff.rarity]; i++) {

            weightedPool.push({ type: "buff", item: buff });

        }

    });



    const numOffers = 3;

    const offeredChoices = [];



    for (let i = 0; i < numOffers; i++) {

        const pick = weightedPool[Math.floor(Math.random() * weightedPool.length)];

        // Avoid duplicates

        if (!offeredChoices.includes(pick)) {

            offeredChoices.push(pick);

        } else {

            i--; // Retry

        }

    }



    // Display offered upgrades

    const startY = 250;

    const spacingY = 100;

    offeredChoices.forEach((choice, index) => {

        const yPos = startY + index * spacingY;

        const item = choice.item;

        const isBuff = choice.type === "buff";

        const rarity = item.rarity;

        const cost = isBuff ? buffRarityCosts[rarity] : rarityCosts[rarity];

        const colorVal = isBuff ? rgb(255, 165, 0) : item.color; // Orange for buffs, original color for upgrades



        // Title

        add([

            text(`[${index + 1}] ${item.name} (${isBuff ? "Buff" : "Upgrade"} - $${cost})`, { size: 24 }),

            pos(center().x, yPos),

            anchor("center"),

            color(colorVal)

        ]);



        // Description

        add([

            text(item.description, { size: 18 }),

            pos(center().x, yPos + 30),

            anchor("center"),

            color(200, 200, 200)

        ]);



        // Helper function to apply purchase

        const applyPurchase = (item, isBuff, cost) => {

            cash -= cost;

            console.log(`Purchased ${isBuff ? "buff" : "upgrade"}: ${item.name} for $${cost}`);

            

            if (isBuff) {

                // For buffs, add to activeBuffs if not already there

                if (!activeBuffs.includes(item)) {

                    activeBuffs.push(item);

                }

            } else {

                // For upgrades, track ID and apply effect if not already purchased

                if (!purchasedUpgradeIds.includes(item.id)) {

                    purchasedUpgradeIds.push(item.id);

                    item.effect();

                }

                

                // Add to visible upgrades list if not already there

                if (!playerUpgrades.includes(item.name)) {

                    playerUpgrades.push(item.name);

                }

            }

            

            // Return to main game

            go("main", { level: nextLevel, cash: cash });

        };

        

        // Handle selection

        onKeyPress(String(index + 1), () => {

            if (cash >= cost) {

                applyPurchase(item, isBuff, cost);

            } else {

                showFeedback("Not enough cash!", rgb(255, 0, 0));

            }

        });

    });



    // Check if player can afford any locked character

    const affordableLockedChars = characters.filter(c => !c.unlocked && cash >= c.cost);

    if (affordableLockedChars.length > 0) {

        add([

            text("[U] End run and unlock character", { size: 24 }),

            pos(center().x, startY + numOffers * spacingY + 80),

            anchor("center"),



            color(255, 215, 0)

        ]);



        // Helper function to unlock a character

        const unlockCharacter = (character) => {

            cash -= character.cost;

            character.unlocked = true;
            SaveSystem.unlockCharacter(character.id);

            console.log(`Unlocked character: ${character.name}`);

            showFeedback(`Unlocked ${character.name}!`, rgb(255, 215, 0));

            resetRunState();
            go("title");

        };

        

        onKeyPress("u", () => {

            unlockCharacter(affordableLockedChars[0]);

        });

    }



    // Add a "Skip" option

    add([

        text("[S] Skip Upgrade", { size: 24 }),

        pos(center().x, startY + numOffers * spacingY + 30),

        anchor("center"),

        color(150, 150, 150), // Gray color to indicate it's less important

    ]);





    onKeyPress("s", () => {

        console.log("Skipped upgrade");

        // Go to the next level without applying any upgrade

        go("main", { level: nextLevel, cash: cash });

    });



    // Fallback if no upgrades offered (shouldn't happen with current setup)

    if (numOffers === 0) {

        add([

            text("Press SPACE to Continue", { size: 24 }),

            pos(center().x, center().y + 100),

            anchor("center"),

        ]);

        onKeyPress("space", () => {

            go("main", { level: nextLevel, score: score });

        });

    }

    

});



// --- Start the game ---

go("title"); // Start with the title scene



// Global key handlers removed for now
