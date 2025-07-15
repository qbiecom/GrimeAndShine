// Initialize Kaboom

kaboom({

    width: 1280, // Match background image

    height: 720, // Match background image

    canvas: document.querySelector("#game-canvas"), // Optional: if you want to use a specific canvas element

    background: [50, 50, 50], // Dark gray background fallback

    font: "arcadia", // Use custom font

});



// Load custom font

loadFont("arcadia", "Art/Arcadia-Regular.woff");



// --- Game Data ---



// Car Type Definitions (Adjusted for Kaboom - size might need tweaking)

const carTypes = [

    // Only using Sedan and Sports Car for now while new art is being created
    { name: 'Sedan', spriteName: 'sedan', width: 80, height: 120, searchModifier: 1, cleanModifier: 1, vacuumModifier: 1 },

    { name: 'Sports Car', spriteName: 'sportscar', width: 85, height: 115, searchModifier: 1.2, cleanModifier: 0.8, vacuumModifier: 0.9 }

];



// Parking Spot Definitions based on Art/backgroundv1.png (1280x720)

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



// Function to reset spot occupancy for a new level

function resetParkingSpots() {

    parkingSpots.forEach(spot => spot.occupied = false);

}



// --- Load Assets ---

loadSprite("background", "Art/backgroundv1.png"); // Use absolute path

// Load sedan sprites for different states
loadSprite("sedan", "Art/sedan.png"); // Neutral state
loadSprite("sedan_clean", "Art/sedan_clean.png");
loadSprite("sedan_dirty", "Art/sedan_dirty.png");
loadSprite("sedan_vacuum", "Art/sedan_vacuum.png");

// Load sportscar sprites for different states
loadSprite("sportscar", "Art/sportscar.png"); // Neutral state
loadSprite("sportscar_clean", "Art/sportscar_clean.png");
loadSprite("sportscar_dirty", "Art/sportscar_dirty.png");
loadSprite("sportscar_vacuum", "Art/sportscar_vacuum.png");

loadSprite("van", "Art/van.png");

loadSprite("junker", "Art/junker.png");

loadSprite("luxury", "Art/luxury.png");

loadSprite("suv", "Art/suv.png");

loadSprite("pickup", "Art/pickup.png");

loadSprite("compact", "Art/compact.png");

loadSprite("player", "Art/player_temp.png");

loadSprite("titleLogo", "Art/title.png"); // Load the title logo



// --- Define Scenes ---



// Title Scene

scene("title", () => {

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

        pos(center().x, center().y + 280),

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



    // Handle button clicks

    onClick("button", (btn) => {

        if (btn.action === "start") {

            go("main", { level: 1, cash: 0 });

        } else if (btn.action === "rules") {

            go("rules");

        } else if (btn.action === "characters") {

            go("characters");

        }

    });



    // Character Unlock Scene

    scene("characters", () => {

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



        characters.forEach((char, index) => {

            const yPos = 140 + index * 100;

            add([

                text(`${char.name} (${char.rarity})`, { size: 24 }),

                pos(200, yPos),

                color(char.unlocked ? rgb(0, 255, 0) : rgb(255, 255, 255))

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

                    text("Selected", { size: 18 }),

                    pos(width() - 200, yPos + 15),

                    anchor("right"),

                    color(0, 255, 0)

                ]);

            } else {

                add([

                    text("Unlocked", { size: 18 }),

                    pos(width() - 200, yPos + 15),

                    anchor("right"),

                    color(0, 200, 255)

                ]);

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



        onClick("button", () => {

            go("title");

        });

        

        // Cleanup when leaving scene

        onSceneLeave(() => {

            // Clean up event handlers

            onKeyPress("escape", () => {});

        });



        onKeyPress("escape", () => {

            go("title");

        });

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

});



// Rules Scene

scene("rules", () => {

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

        "• Interact with cars to search, clean, or vacuum them.",

        "• Each action earns you cash.",

        "• Complete a level by interacting with all cars or when time runs out.",

        "• If time runs out, you need to have interacted with at least 50% of cars.",

        "• After each level, choose an upgrade to improve your skills.",

        "• The time limit decreases with each level, making the game more challenging."

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

    

    // Cleanup when leaving scene

    onSceneLeave(() => {

        // Clean up event handlers

        onKeyPress("escape", () => {});

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

});



// --- Global Game State & UI ---

let currentLevel = 1;

let currentCash = 0; // Changed from score to cash

let timeLeft = 60; // Initial time

let timerInterval = null;

let carsInLevel = []; // Keep track of car game objects

let scoreText;

let timerText;

let levelText;

let interactionMenu = null; // Reference to the interaction menu group

let targetCar = null; // Car currently targeted for interaction

let isInteracting = false; // Flag to pause player movement during interaction

let feedbackTextObject = null; // Reference to the persistent feedback text object

let actionInProgress = false; // Flag to track if an action is currently in progress

let actionProgressBar = null; // Reference to the action progress bar



// --- Player Upgrade Stats ---

let playerStats = {

    cleanSpeedMultiplier: 1.0, // Lower is faster (e.g., 0.8 means 20% faster)

    vacuumSpeedMultiplier: 1.0,

    searchLootMultiplier: 1.0, // Higher is better

    searchAlarmModifier: 1.0, // Lower is better



    // Base action times (in seconds)

    baseCleanTime: 5,

    baseVacuumTime: 5,

    baseSearchTime: 5,

    timeBonus: 0

// End of playerStats

};

let playerUpgrades = [];



// Temporary buffs active for the current level

let activeBuffs = [];

let purchasedUpgradeIds = [];

let currentBuffs = [];



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

        description: "It's raining! Cleaning is 30% faster.",

        apply: () => { playerStats.cleanSpeedMultiplier *= 0.7; }

    },

    {

        name: "Rush Hour",

        description: "Rush hour! More cars appear this level.",

        apply: () => { extraCarsThisLevel += 3; }

    },

    {

        name: "Customer Demands",

        description: "Some customers demand priority service! Prioritize their cars.",

        apply: () => { /* For now, just a message */ }

    }

];



// Current event for this level

let currentEvent = null;



// Extra cars added by events

let extraCarsThisLevel = 0;





// --- Available Upgrades ---

const availableUpgrades = [

    // ===== COMMON UPGRADES (GREEN) =====

    { id: "clean1", name: "Faster Cleaning", description: "Clean cars 15% faster.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.cleanSpeedMultiplier *= 0.85; } },

    { id: "vacuum1", name: "Faster Vacuuming", description: "Vacuum cars 15% faster.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.85; } },

    { id: "search1", name: "Better Loot Sense", description: "Slightly increase loot found.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.searchLootMultiplier *= 1.1; } },

    { id: "search2", name: "Quieter Search", description: "Slightly reduce alarm chance.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.searchAlarmModifier *= 0.9; } },

    { id: "move1", name: "Running Shoes", description: "Move 5% faster.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerSpeed *= 1.05; } },

    { id: "tipjar", name: "Tip Jar", description: "5% chance to receive a small tip after completing a car.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.tipChance = (playerStats.tipChance || 0) + 0.05; } },

    { id: "gloves", name: "Rubber Gloves", description: "20% faster cleaning on dirty cars.", rarity: "common", color: rgb(0, 255, 0), effect: () => { playerStats.dirtyCarBonus = (playerStats.dirtyCarBonus || 0) + 0.2; } },

    

    // ===== UNCOMMON UPGRADES (BLUE) =====

    { id: "clean2", name: "Power Washer", description: "Clean cars 25% faster.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.cleanSpeedMultiplier *= 0.75; } },

    { id: "vacuum2", name: "Turbo Vacuum", description: "Vacuum cars 25% faster.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.75; } },

    { id: "search3", name: "Lucky Find", description: "Increase loot found by 20%.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.searchLootMultiplier *= 1.2; } },

    { id: "search4", name: "Silent Search", description: "Reduce alarm chance by 25%.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerStats.searchAlarmModifier *= 0.75; } },

    { id: "move2", name: "Sprint Sneakers", description: "Move 10% faster.", rarity: "uncommon", color: rgb(0, 128, 255), effect: () => { playerSpeed *= 1.10; } },

    

    // ===== RARE UPGRADES (PURPLE) =====

    { id: "clean3", name: "Nano Cleaner", description: "Clean cars 40% faster.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.cleanSpeedMultiplier *= 0.6; } },

    { id: "vacuum3", name: "Hyper Vacuum", description: "Vacuum cars 40% faster.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.6; } },

    { id: "search5", name: "Treasure Hunter", description: "Increase loot found by 30%.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.searchLootMultiplier *= 1.3; } },

    { id: "search6", name: "Ghost Touch", description: "Reduce alarm chance by 35%.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.searchAlarmModifier *= 0.65; } },

    { id: "move3", name: "Jet Boots", description: "Move 15% faster.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerSpeed *= 1.15; } },

    { id: "connections", name: "Customer Connections", description: "15% chance to receive a large tip after completing a car.", rarity: "rare", color: rgb(128, 0, 255), effect: () => { playerStats.largeTipChance = (playerStats.largeTipChance || 0) + 0.15; } },

    

    // ===== LEGENDARY UPGRADES (GOLD) =====

    { id: "clean4", name: "Instant Wash", description: "Clean cars instantly!", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.cleanSpeedMultiplier *= 0.1; } },

    { id: "vacuum4", name: "Black Hole Vacuum", description: "Vacuum cars instantly!", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.vacuumSpeedMultiplier *= 0.1; } },

    { id: "search7", name: "Master Thief", description: "Double loot found.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.searchLootMultiplier *= 2.0; } },

    { id: "search8", name: "Phantom Hands", description: "No alarm chance at all.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.searchAlarmModifier = 0; } },

    { id: "timewarp", name: "Time Warp Watch", description: "Permanently adds 5 seconds to your timer.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.timeBonus += 5; } },

    { id: "move4", name: "Quantum Dash", description: "Move 20% faster.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerSpeed *= 1.20; } },

    { id: "vipservice", name: "VIP Service", description: "Every 5th car completed gives a significant cash bonus.", rarity: "legendary", color: rgb(255, 215, 0), effect: () => { playerStats.vipServiceActive = true; } }

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



// Currently selected character id

let selectedCharacterId = "base";



// Main Game Scene

scene("main", (levelData = { level: 1, cash: 0 }) => {

    // --- Level Setup ---

    currentLevel = levelData.level;

    currentCash = levelData.cash;

    // Time decreases by 5 seconds per level, with a minimum of 30 seconds

    timeLeft = Math.max(60 + playerStats.timeBonus - (currentLevel - 1) * 5, 30);

    carsInLevel = [];

    resetParkingSpots();



    // Apply temporary buffs purchased in shop

    currentBuffs = activeBuffs.slice();

    currentBuffs.forEach(buff => buff.apply());

    activeBuffs = [];



    // Add the background

    add([

        sprite("background", { width: width(), height: height() }), // Scale sprite to canvas size

        pos(0, 0),

        area(), // Add area component for collisions if needed later

        z(-1), // Draw background behind other layers

    ]);



    // Player Setup

    const playerSpeed = 300;

    // Player size (scaled down from 1024x1024)

    const playerSize = 100; // Doubled from 50 to make player larger

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

    onKeyDown("left", () => {

        if (!isInteracting && !actionInProgress) player.pos.x -= playerSpeed * dt();

    });

    onKeyDown("right", () => {

        if (!isInteracting && !actionInProgress) player.pos.x += playerSpeed * dt();

    });

    onKeyDown("up", () => {

        if (!isInteracting && !actionInProgress) player.pos.y -= playerSpeed * dt();

    });

    onKeyDown("down", () => {

        if (!isInteracting && !actionInProgress) player.pos.y += playerSpeed * dt();

    });



    // Also add arrow key support

    onKeyDown("arrow-left", () => {

        if (!isInteracting && !actionInProgress) player.pos.x -= playerSpeed * dt();

    });

    onKeyDown("arrow-right", () => {

        if (!isInteracting && !actionInProgress) player.pos.x += playerSpeed * dt();

    });

    onKeyDown("arrow-up", () => {

        if (!isInteracting && !actionInProgress) player.pos.y -= playerSpeed * dt();

    });

    onKeyDown("arrow-down", () => {

        if (!isInteracting && !actionInProgress) player.pos.y += playerSpeed * dt();

    });



    // Remove custom onUpdate collision handling, let physics engine handle it



    // Debug flag to check if player is interacting

    let debugText = add([

        text("Movement: Active", { size: 16 }),

        pos(20, height() - 20),

        fixed(),

        z(100)

    ]);



    player.onUpdate(() => {

        // Update debug text

        let movementStatus = "Active";

        if (isInteracting) movementStatus = "Menu Open";

        if (actionInProgress) movementStatus = "Action in Progress";

        debugText.text = `Movement: ${movementStatus} | Pos: ${Math.floor(player.pos.x)},${Math.floor(player.pos.y)}`;



        // Keep player within screen bounds (simple clamp using center anchor)

        // Use fixed values for screen bounds to ensure player can move throughout the entire screen

        if (player.pos.x < 50) player.pos.x = 50;

        if (player.pos.x > width() - 50) player.pos.x = width() - 50;

        if (player.pos.y < 50) player.pos.y = 50;

        if (player.pos.y > height() - 50) player.pos.y = height() - 50;



        // Update inventory panel text

        inventoryText.text =

            "Upgrades:\n" + (playerUpgrades.length > 0 ? playerUpgrades.join("\n") : "None") +

            "\n\nBuffs:\n" + (currentBuffs.length > 0 ? currentBuffs.map(b => b.name).join("\n") : "None");

    });



    // --- Car Spawning ---

    const requestedCars = 5 + currentLevel * 2; // Increase cars per level

    const availableSpots = parkingSpots.filter(spot => !spot.occupied);

    const numberOfCars = Math.min(requestedCars, availableSpots.length);



    if (requestedCars > availableSpots.length) {

        console.warn(`Level ${currentLevel}: Requested ${requestedCars} cars, but only ${availableSpots.length} spots available. Placing ${numberOfCars} cars.`);

    }



    // Shuffle available spots to randomize placement

    const shuffledSpots = availableSpots.sort(() => 0.5 - Math.random());



    for (let i = 0; i < numberOfCars; i++) {

        const spot = shuffledSpots[i];



        // Select a random car type

        const typeIndex = Math.floor(Math.random() * carTypes.length);

        const selectedType = carTypes[typeIndex];



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

            sprite(selectedType.spriteName), // Use the car's sprite

            pos(centerX, centerY),

            anchor("center"), // Center the car in the parking spot

            scale(scaleX * 1, scaleY * (shouldFlip ? -1 : 1)), // Flip by using negative scale for Y

            area({ scale: 0.9 }), // Collision area for the car

            body({ isStatic: true }), // Make cars static physics bodies

            "car", // Tag for identifying cars

            { // Custom properties stored on the car game object

                carData: selectedType,

                spotId: spot.id,

                interacted: false,

                orientation: spot.orientation,

                specialProperty: null, // Initialize special property

            }

        ]);
// --- Initialize Car State Properties ---
        car.completed = false; // Track if all tasks for this car are done
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
            car.use(sprite(`${carType}_dirty`));
        } else if (car.needsVacuumOrSearch) {
            // Use vacuum/search sprite
            car.use(sprite(`${carType}_vacuum`));
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

        const specialChance = 0.1 + (currentLevel * 0.05); // Base 10% + 5% per level

        if (Math.random() < specialChance) {

            const possibleProperties = ["Extra Dirty", "Hidden Compartment"];

            // Add more properties here later, e.g., "Complex Interior"



            car.specialProperty = choose(possibleProperties);

            console.log(`Car in spot ${spot.id} is special: ${car.specialProperty}`);



            // Optional: Add a visual indicator for special cars (e.g., tint)

            if (car.specialProperty === "Extra Dirty") {
                // Use a lighter brown hue with some transparency for a more subtle effect
                car.color = rgb(165, 113, 78, 0.4); // Lighter brown with transparency

            } else if (car.specialProperty === "Hidden Compartment") {

                car.color = rgb(255, 215, 0); // Gold tint for hidden compartment cars

            }

        }

    }

    console.log(`Level ${currentLevel}: Spawned ${carsInLevel.length} cars.`);



    // --- UI Setup ---

    const uiMargin = 20;

    const uiY = 20;



    // UI dirty flags to track which elements need updating

    const uiDirty = {

        cash: true,

        level: true,

        timer: true,

        inventory: true

    };

    

    // Helper function to update UI elements

    const updateUI = (forceUpdate = false) => {

        // Only update elements that are dirty or if forceUpdate is true

        if ((uiDirty.cash || forceUpdate) && scoreText) {

            scoreText.text = `Cash: $${currentCash}`;

            uiDirty.cash = false;

        }

        

        if ((uiDirty.level || forceUpdate) && levelText) {

            levelText.text = `Level: ${currentLevel}`;

            uiDirty.level = false;

        }

        

        if ((uiDirty.timer || forceUpdate) && timerText) {

            timerText.text = `Time: ${timeLeft}s`;

            uiDirty.timer = false;

        }

        

        if ((uiDirty.inventory || forceUpdate) && inventoryText) {

            inventoryText.text =

                "Upgrades:\n" + (playerUpgrades.length > 0 ? playerUpgrades.join("\n") : "None") +

                "\n\nBuffs:\n" + (currentBuffs.length > 0 ? currentBuffs.map(b => b.name).join("\n") : "None");

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



    // Create UI elements

    scoreText = add([

        text(`Cash: $${currentCash}`, { size: 24 }),

        pos(uiMargin, uiY),

        fixed(), // Keep UI fixed on screen

        z(100), // Ensure UI is drawn on top

        "scoreText"

    ]);



    levelText = add([

        text(`Level: ${currentLevel}`, { size: 24 }),

        pos(width() / 2, uiY), // Center horizontally

        anchor("top"), // Anchor to top-center

        fixed(),

        z(100),

        "levelText"

    ]);



    timerText = add([

        text(`Time: ${timeLeft}s`, { size: 24 }),

        pos(width() - uiMargin, uiY), // Right side

        anchor("topright"), // Anchor to top-right

        fixed(),

        z(100),

        "timerText"

    ]);



    // Inventory panel (bottom right)

    const inventoryText = add([

        text(

            "Upgrades:\n" + (playerUpgrades.length > 0 ? playerUpgrades.join("\n") : "None") +

            "\n\nBuffs:\n" + (currentBuffs.length > 0 ? currentBuffs.map(b => b.name).join("\n") : "None"),

            { size: 16 }

        ),

        pos(width() - 10, height() - 10),

        anchor("botright"),

        fixed(),

        z(100),

        "inventoryText"

    ]);



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

            

            // Mark timer as dirty instead of directly updating

            markUIDirty('timer');

            // Update all UI elements

            updateUI();



            if (timeLeft <= 0) {

                // Cancel the update loop

                timerUpdate.cancel();



                // Count how many cars have been interacted with

                const interactedCars = carsInLevel.filter(car => car.interacted).length;

                const totalCars = carsInLevel.length;

                const interactionPercentage = totalCars > 0 ? (interactedCars / totalCars) * 100 : 0;



                console.log(`Level ${currentLevel} ended. ${interactedCars}/${totalCars} cars interacted (${interactionPercentage.toFixed(1)}%).`);



                // Level is complete if at least 50% of cars have been interacted with

                if (interactionPercentage >= 50) {

                    console.log(`Level ${currentLevel} complete! Advancing to upgrade screen.`);

                    // Go to the upgrade scene

                    go("upgradeScene", { nextLevel: currentLevel + 1, cash: currentCash });

                } else {

                    console.log(`Level ${currentLevel} failed. Less than 50% of cars interacted.`);

                    // Go to game over, passing the final cash

                    go("gameOver", { cash: currentCash });

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
        if (car.needsCleaning) {
            // Only show Clean option
            interactionMenu.add([text(`[2] Clean (${cleanTime}s)`, { size: 16 }), pos(0, 0), anchor("center")]);
        } else if (car.needsVacuumOrSearch) {
            // Show Search and Vacuum options (adjust Y positions)
            interactionMenu.add([text(`[1] Search (${searchTime}s)`, { size: 16 }), pos(0, -10), anchor("center")]);
            interactionMenu.add([text(`[3] Vacuum (${vacuumTime}s)`, { size: 16 }), pos(0, 10), anchor("center")]);
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

            rect(100, 20, { radius: 4 }),

            color(0, 0, 0, 0.7),

            outline(2, rgb(255, 255, 255)),

            anchor("center"),

        ]);



        // Progress fill (starts empty)

        const progressFill = actionProgressBar.add([

            rect(0, 16, { radius: 3 }),

            pos(-48, 0), // Position at left edge of background (-50 + 2 for padding)

            anchor("left"),

            color(getActionColor(actionType)),

        ]);



        // Action label

        actionProgressBar.add([

            text(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)}ing...`, { size: 16 }),

            pos(0, -25),

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



        // Set action in progress flag

        actionInProgress = true;

        hideInteractionMenu();



        const modifier = car.carData[`${actionType}Modifier`]; // Get modifier for the action



        // Calculate action duration based on action type and modifiers

        let actionDuration;

        switch (actionType) {

            case 'search':

                actionDuration = playerStats.baseSearchTime * playerStats.searchLootMultiplier;

                break;

            case 'clean':

                actionDuration = playerStats.baseCleanTime * playerStats.cleanSpeedMultiplier;

                // Apply Extra Dirty penalty

                if (car.specialProperty === "Extra Dirty") {

                    actionDuration *= 1.5; // 50% longer to clean

                }

                break;

            case 'vacuum':

                actionDuration = playerStats.baseVacuumTime * playerStats.vacuumSpeedMultiplier;

                break;

            default:

                actionDuration = 5;

        }



        // Apply car type modifier

        actionDuration *= modifier;



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

            progressFill.width = progress * 96; // 96 is the full width



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



                // Mark car as interacted

                car.interacted = true;

                car.opacity = 0.5; // Reduce opacity to show the car has been interacted with
// Update sprite to show completed state
                const carType = car.carData.spriteName; // 'sedan' or 'sportscar'
                car.use(sprite(`${carType}_clean`)); // Use clean sprite for completed cars
                
                // Update the state text overlay to show completed (commented out)
                /*
                const stateTextObj = car.children.find(child => child.text &&
                    (child.text.includes("NEEDS CLEANING") || child.text.includes("NEEDS VACUUM/SEARCH")));
                
                if (stateTextObj) {
                    stateTextObj.text = "COMPLETED";
                    stateTextObj.color = rgb(0, 255, 0); // Green for completed
                }
                */

                

                // Update the non-interacted cars list

                updateNonInteractedCars();



                // Process the action results

                completeAction(car, actionType, modifier);

            }

        });

    };



    // Function to process action results after completion

    function completeAction(car, actionType, modifier) {

        // Process action results

        switch (actionType) {

            case 'search':

                {

                    console.log("Performing Search on car:", car.carData.name);

                    let baseLootChance = 0.3;

                    const baseAlarmChance = 0.2;



                    // Apply Hidden Compartment bonus

                    if (car.specialProperty === "Hidden Compartment") {

                        baseLootChance *= 1.5; // 50% higher chance to find loot

                        console.log("Hidden Compartment bonus applied to search!");

                    }



                    const lootChance = Math.min(baseLootChance * modifier, 0.9);

                    const alarmChance = Math.min(baseAlarmChance * modifier, 0.7);

                    const searchOutcome = Math.random();



                    if (searchOutcome < lootChance) {

                        let lootAmount = Math.floor((Math.random() * 20 + 10) * modifier * playerStats.searchLootMultiplier); // Apply loot multiplier

                        // Apply Hidden Compartment bonus

                        if (car.specialProperty === "Hidden Compartment") {

                            lootAmount = Math.floor(lootAmount * 1.5); // 50% more loot

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

                        const cash = Math.round(baseCash * modifier);

                        currentCash += cash;

                        markUIDirty('cash');

                        console.log("Found nothing special.");

                        showFeedback(`Searched. +$${cash}`, rgb(200, 200, 200)); // Gray for neutral

                    }

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



                    const cash = Math.round(baseCash * modifier); // Use the potentially modified baseCash

                    currentCash += cash;

                    markUIDirty('cash');



                    console.log(`Cleaned car. +$${cash}`);

                    let feedbackMsg = `Cleaned! +$${cash}`;

                    if (car.specialProperty === "Extra Dirty") {

                        feedbackMsg += " (Dirty Bonus!)";

                    }

                    showFeedback(feedbackMsg, rgb(0, 180, 255)); // Blue for clean

                }

                break;

            case 'vacuum':

                {

                    console.log("Performing Vacuum on car:", car.carData.name);

                    const baseCash = 15;

                    const cash = Math.round(baseCash * modifier);

                    currentCash += cash;

                    markUIDirty('cash');



                    console.log(`Vacuumed car. +$${cash}`);

                    showFeedback(`Vacuumed! +$${cash}`, rgb(200, 0, 255)); // Purple for vacuum

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



        // Check if level is complete after interaction

        checkLevelComplete();

    }

    // Function to check if all cars have been interacted with and end level if so

    function checkLevelComplete() {

        // Count how many cars have been interacted with

        const interactedCars = carsInLevel.filter(car => car.interacted).length;

        const totalCars = carsInLevel.length;

        const interactionPercentage = totalCars > 0 ? (interactedCars / totalCars) * 100 : 0;



        // Level is complete when ALL cars have been interacted with

        if (interactedCars === totalCars) {

            console.log(`Level ${currentLevel} complete! All cars interacted with.`);

            if (timerInterval) clearInterval(timerInterval); // Stop timer immediately

            timerInterval = null;

            // Go to the upgrade scene

            go("upgradeScene", { nextLevel: currentLevel + 1, cash: currentCash });

        }

    }





    // --- Input Handling --- (Correctly placed inside scene)



    // Track non-interacted cars separately for more efficient searching

    let nonInteractedCars = [];

    

    // Function to update the non-interacted cars list

    const updateNonInteractedCars = () => {

        nonInteractedCars = carsInLevel.filter(car => !car.interacted);

    };

    

    // Initialize the list

    updateNonInteractedCars();

    

    // Interaction Key

    onKeyPress("e", () => {

        if (isInteracting) return; // Don't trigger if menu already open



        let closestCar = null;

        let minDist = 120; // Increased from 80 to allow interaction from further away



        // Find the closest non-interacted car within range

        // Only search through non-interacted cars for better performance

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



    // Function to display temporary feedback using the persistent text object

    function showFeedback(message, color = rgb(255, 255, 255)) {

        if (!feedbackTextObject) return; // Safety check



        // Update the persistent text object

        feedbackTextObject.text = message;

        feedbackTextObject.color = color;

        feedbackTextObject.opacity = 1; // Make it visible



        // Hide the text after a delay

        wait(1.5, () => {

            if (feedbackTextObject) {

                // Optional: Add a fade-out effect if desired, otherwise just hide

                // tween(feedbackTextObject.opacity, 0, 0.5, (val) => feedbackTextObject.opacity = val);

                feedbackTextObject.opacity = 0; // Hide instantly for now

            }

        });

    }



    // Note: Movement keys and player boundary checks are already correctly placed inside this scene block.

}); // End of scene("main", ...)

// Removed duplicated interaction logic and input handling from here

// Game Over Scene definition starts below



scene("gameOver", ({ cash }) => { // Receive cash from main scene

    add([

        text("Game Over!", { size: 64 }),

        pos(center().x, center().y - 100),

        anchor("center"),

    ]);



    add([

        text(`Final Cash: $${cash}`, { size: 40 }),

        pos(center().x, center().y),

        anchor("center"),

    ]);



    add([

        text("Press SPACE to Restart", { size: 32 }),

        pos(center().x, center().y + 100),

        anchor("center"),

    ]);



    // Go back to title scene on space press

    onKeyPress("space", () => {

        go("title");

    });

    

    // Cleanup when leaving scene

    onSceneLeave(() => {

        // Clean up event handlers

        onKeyPress("space", () => {});

    });

});



// --- Upgrade Scene ---

scene("upgradeScene", ({ nextLevel, cash }) => {



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

    const cleanSpeed = Math.round((1 - playerStats.cleanSpeedMultiplier) * 100);

    const vacuumSpeed = Math.round((1 - playerStats.vacuumSpeedMultiplier) * 100);

    const lootBonus = Math.round((playerStats.searchLootMultiplier - 1) * 100);

    const alarmReduction = Math.round((1 - playerStats.searchAlarmModifier) * 100);



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

            console.log(`Unlocked character: ${character.name}`);

            showFeedback(`Unlocked ${character.name}!`, rgb(255, 215, 0));

            // End run: return to title or restart game

            go("main", { level: 1, cash: cash });

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

    

    // Cleanup when leaving scene

    onSceneLeave(() => {

        // Clean up event handlers

        offeredChoices.forEach((_, index) => {

            onKeyPress(String(index + 1), () => {});

        });

        onKeyPress("u", () => {});

        onKeyPress("s", () => {});

        onKeyPress("space", () => {});

    });

});



// --- Start the game ---

go("title"); // Start with the title scene



// Global key handlers removed for now
