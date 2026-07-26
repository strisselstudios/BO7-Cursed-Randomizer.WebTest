/* ==========================================================
   1. CORE ENEMY DEFINITIONS
   ----------------------------------------------------------
   Establishes the initial enemy pool used by the future combat
   resolver. Visual assets will be connected through assetKey.
========================================================== */

registerNachtRaidersEnemies([
  {
    id: "shambling-dead",
    name: "Shambling Dead",
    designation: "REANIMATED CORPSE",
    assetKey: "shambling-dead",
    weight: 55,

    stats: {
      maxHealth: 22,
      attack: 4,
      defense: 0,
      speed: 0.8
    },

    rewards: {
      xp: {
        minimum: 4,
        maximum: 7
      }
    },

    contactLines: [
      "Detected movement within the fog.",
      "Reanimated biological contact approaching."
    ],

    victoryLines: [
      "Target neutralized.",
      "No meaningful equipment recovered."
    ],

    operativeDeathLines: [
      "Operative overwhelmed by reanimated contact."
    ],

    tags: [
      "undead",
      "common"
    ]
  },

  {
    id: "armored-corpse",
    name: "Armored Corpse",
    designation: "ARMORED REANIMATED CONTACT",
    assetKey: "armored-corpse",
    weight: 25,
    minimumDepth: 4,

    stats: {
      maxHealth: 40,
      attack: 6,
      defense: 2,
      speed: 0.65
    },

    rewards: {
      xp: {
        minimum: 8,
        maximum: 12
      },

      salvage: {
        minimum: 1,
        maximum: 3
      }
    },

    contactLines: [
      "Located a reanimated combatant wearing damaged protective equipment.",
      "Armor remains partially functional."
    ],

    victoryLines: [
      "Armored target terminated.",
      "Usable components removed from protective shell."
    ],

    operativeDeathLines: [
      "Operative failed to penetrate target armor."
    ],

    tags: [
      "undead",
      "armored"
    ]
  },

  {
    id: "hellhound",
    name: "Hellhound",
    designation: "INCENDIARY CANINE",
    assetKey: "hellhound",
    weight: 15,
    minimumDepth: 7,

    stats: {
      maxHealth: 28,
      attack: 9,
      defense: 0,
      speed: 1.6
    },

    rewards: {
      xp: {
        minimum: 10,
        maximum: 16
      },

      aetherResidue: {
        minimum: 0,
        maximum: 1
      }
    },

    contactLines: [
      "Thermal signature closing rapidly.",
      "Incendiary canine contact confirmed."
    ],

    victoryLines: [
      "Target extinguished.",
      "Residual aetheric material detected."
    ],

    operativeDeathLines: [
      "Operative suffered catastrophic thermal exposure."
    ],

    tags: [
      "aether",
      "fast"
    ]
  },

  {
    id: "oscar",
    name: "O.S.C.A.R.",
    designation: "ORGANIC SYNCHRONICITY COLLAPSE AND RECONSTRUCTION",
    assetKey: "oscar",
    weight: 5,
    minimumDepth: 12,
    minimumCycle: 3,

    stats: {
      maxHealth: 90,
      attack: 14,
      defense: 4,
      speed: 0.9
    },

    rewards: {
      xp: {
        minimum: 30,
        maximum: 50
      },

      fieldData: {
        minimum: 3,
        maximum: 6
      },

      aetherResidue: {
        minimum: 1,
        maximum: 2
      }
    },

    contactLines: [
      "Stumbled upon an organism designated O.S.C.A.R.",
      "Temporal profile does not correspond with local chronology."
    ],

    victoryLines: [
      "O.S.C.A.R. terminated.",
      "Temporal residue secured for analysis."
    ],

    operativeDeathLines: [
      "Echo integrity lost during O.S.C.A.R. engagement."
    ],

    tags: [
      "anomaly",
      "elite",
      "temporal"
    ]
  }
]);
