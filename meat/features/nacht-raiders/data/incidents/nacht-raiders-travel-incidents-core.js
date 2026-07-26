/* ==========================================================
   1. CORE TRAVEL INCIDENTS
   ----------------------------------------------------------
   General incidents available throughout the starting zone.
   Future content should be divided into additional themed
   incident-pack files rather than extending this file forever.
========================================================== */

registerNachtRaidersIncidents([
  {
    id: "quiet-sector",
    pool: NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,
    type: NACHT_RAIDERS_RECORD_TYPE_TRAVEL,
    weight: 30,
    title: "QUIET SECTOR",

    lines: [
      "No meaningful movement detected beyond the fog.",
      "Operative advanced without contact."
    ],

    rewards: {
      xp: {
        minimum: 2,
        maximum: 4
      }
    }
  },

  {
    id: "abandoned-field-pack",
    pool: NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,
    type: NACHT_RAIDERS_RECORD_TYPE_SALVAGE,
    weight: 22,
    title: "ABANDONED FIELD PACK",

    lines: [
      "Located a discarded field pack beneath collapsed masonry.",
      "Usable components recovered."
    ],

    rewards: {
      xp: {
        minimum: 4,
        maximum: 8
      },

      salvage: {
        minimum: 3,
        maximum: 7
      }
    }
  },

  {
    id: "broken-perk-machine",
    pool: NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,
    type: NACHT_RAIDERS_RECORD_TYPE_DISCOVERY,
    weight: 18,
    title: "DAMAGED PERK MACHINE",

    lines: [
      "Found a broken-down perk machine.",
      "Repaired the coin mechanism and recovered one intact bottle."
    ],

    rewards: {
      xp: {
        minimum: 10,
        maximum: 18
      },

      fieldData: {
        minimum: 1,
        maximum: 2
      }
    }
  },

  {
    id: "encrypted-field-signal",
    pool: NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,
    type: NACHT_RAIDERS_RECORD_TYPE_DISCOVERY,
    weight: 14,
    title: "ENCRYPTED FIELD SIGNAL",

    lines: [
      "Intercepted a fragmented transmission.",
      "Signal origin could not be determined."
    ],

    rewards: {
      xp: {
        minimum: 6,
        maximum: 12
      },

      fieldData: {
        minimum: 1,
        maximum: 3
      }
    }
  },

  {
    id: "aether-contamination",
    pool: NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,
    type: NACHT_RAIDERS_RECORD_TYPE_ANOMALY,
    weight: 10,
    title: "AETHER CONTAMINATION",

    lines: [
      "Detected crystallized residue surrounding a temporal fracture.",
      "Sample isolated and secured."
    ],

    rewards: {
      xp: {
        minimum: 8,
        maximum: 14
      },

      aetherResidue: {
        minimum: 1,
        maximum: 2
      }
    }
  },

  {
    id: "temporal-echo",
    pool: NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,
    type: NACHT_RAIDERS_RECORD_TYPE_ANOMALY,
    weight: 5,
    title: "TEMPORAL ECHO",

    lines: [
      "Operative encountered a residual image of a previous cycle.",
      "Echo terminated before synchronization occurred."
    ],

    rewards: {
      xp: {
        minimum: 12,
        maximum: 20
      },

      fieldData: {
        minimum: 2,
        maximum: 4
      }
    }
  },

  {
    id: "sealed-relic-fragment",
    pool: NACHT_RAIDERS_INCIDENT_POOL_TRAVEL,
    type: NACHT_RAIDERS_RECORD_TYPE_ANOMALY,
    weight: 1,
    minimumDepth: 10,
    title: "SEALED RELIC FRAGMENT",

    lines: [
      "Recovered an unidentified fragment from a sealed containment case.",
      "Material remains temporally unstable."
    ],

    rewards: {
      xp: {
        minimum: 20,
        maximum: 30
      },

      relicFragments: {
        minimum: 1,
        maximum: 1
      }
    }
  }
]);
