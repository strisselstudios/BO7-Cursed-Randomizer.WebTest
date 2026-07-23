/* ==========================================================
   1. SAVE CONFIGURATION
   ----------------------------------------------------------
   Defines the localStorage key and current save-data version.
========================================================== */

const MEAT_SAVE_KEY = "meatExeSave";
const CURRENT_SAVE_VERSION = 9;

/* ==========================================================
   2. DEFAULT GAME STATE
   ----------------------------------------------------------
   Defines the starting values used for new players.
========================================================== */

function createDefaultGameState() {
  return {
    saveVersion: CURRENT_SAVE_VERSION,

    meat: 0,
    totalMeat: 0,
    totalClicks: 0,

    meatPerClick: 1,
    meatPerSecond: 0,

    highestRevealedProducerIndex: -1,

    producers: {
      silverSpoon: 0,
      aetherRepairmen: 0,
      vandornCrops: 0,
      sunkenMiningTown: 0,
      giantFactory: 0,
      libertySavingsBonds: 0,
      marsShrine: 0,
      ominousLighthouse: 0,
      cccpMissile: 0,
      newIndustriesLaboratory: 0,
      darkAetherRift: 0,
      mpd: 0,
      shemsSpacetimeMacGuffin: 0
    },

    producerHighestTier: {
      silverSpoon: 0,
      aetherRepairmen: 0,
      vandornCrops: 0,
      sunkenMiningTown: 0,
      giantFactory: 0,
      libertySavingsBonds: 0,
      marsShrine: 0,
      ominousLighthouse: 0,
      cccpMissile: 0,
      newIndustriesLaboratory: 0,
      darkAetherRift: 0,
      mpd: 0,
      shemsSpacetimeMacGuffin: 0
    },

    producerLifetimeMeat: {
      silverSpoon: 0,
      aetherRepairmen: 0,
      vandornCrops: 0,
      sunkenMiningTown: 0,
      giantFactory: 0,
      libertySavingsBonds: 0,
      marsShrine: 0,
      ominousLighthouse: 0,
      cccpMissile: 0,
      newIndustriesLaboratory: 0,
      darkAetherRift: 0,
      mpd: 0,
      shemsSpacetimeMacGuffin: 0
    },

    features: {
  harvester: {
    unlocked: false,
    legacyGrandfathered: false,

    deployed: false,

    position: {
      x: 0.5,
      y: 0.5
    },

    activeStartedAt: 0,
    lastProcessedAt: 0,

    passiveMpsSnapshot: 0,
    ownedBuildingSnapshot: 0,
    outputPerSecondSnapshot: 0,

    cooldownStartedAt: 0,
    cooldownEndsAt: 0,

    storedMeat: 0,
    lifetimeMeat: 0
  }
},

    settings: {
      sound: true,
      animations: true
    },

    runStartedAt: Date.now(),
    lastSavedAt: Date.now()
  };
}

let gameState = createDefaultGameState();

/* ==========================================================
   3. PRODUCER DATABASE
   ----------------------------------------------------------
   Defines every producer's base production and cost.
========================================================== */

const producerData = {
  silverSpoon: {
    name: "Silver Spoon",
    baseCost: 15,
    meatPerSecond: 0.1,

    descriptions: {
      1: "Simple. Classic. Perfect for eating stew.",
      2: "Solid gold. Ineffective at digging through concrete.",
      3: "The real deal. Reanimates cower in the face of this kitchen utensil."
    }
  },

  aetherRepairmen: {
    name: "Aether Repairmen",
    baseCost: 100,
    meatPerSecond: 1,

    descriptions: {
      1: "What’d you think? T.E.D.D changes his own tires? Someone's gotta die to do it.",
      2: "Life expectancy slightly higher than the last. Comes with experience.",
      3: "These unspoken heroes have seen horrors beyond comprehension. They fear NOTHING."
    }
  },

  vandornCrops: {
    name: "Vandorn Crops",
    baseCost: 1100,
    meatPerSecond: 8
  },

  sunkenMiningTown: {
    name: "Sunken Mining Town",
    baseCost: 12000,
    meatPerSecond: 47
  },

  giantFactory: {
    name: "Giant Factory",
    baseCost: 130000,
    meatPerSecond: 260
  },

  libertySavingsBonds: {
    name: "Liberty Savings Bonds",
    baseCost: 1400000,
    meatPerSecond: 1400
  },

  marsShrine: {
    name: "Mars Shrine",
    baseCost: 20000000,
    meatPerSecond: 7800
  },

  ominousLighthouse: {
    name: "Ominous Lighthouse",
    baseCost: 330000000,
    meatPerSecond: 44000
  },

  cccpMissile: {
    name: "CCCP Missile",
    baseCost: 5100000000,
    meatPerSecond: 260000
  },

  newIndustriesLaboratory: {
    name: "New Industries Laboratory",
    baseCost: 75000000000,
    meatPerSecond: 1600000
  },

  darkAetherRift: {
    name: "Dark Aether Rift",
    baseCost: 1000000000000,
    meatPerSecond: 10000000
  },

  mpd: {
    name: "M.P.D.",
    baseCost: 14000000000000,
    meatPerSecond: 65000000
  },

  shemsSpacetimeMacGuffin: {
    name: "Shem's Spacetime MacGuffin",
    baseCost: 170000000000000,
    meatPerSecond: 430000000
  }
};

const PRODUCER_COST_MULTIPLIER = 1.15;
const LOCKED_PRODUCER_PREVIEW_COUNT = 2;

const producerOrder =
  Object.keys(producerData);
