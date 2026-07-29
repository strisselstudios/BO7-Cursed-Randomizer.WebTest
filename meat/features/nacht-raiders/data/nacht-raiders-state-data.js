/* ==========================================================
   1. NACHT RAIDERS STATE CONSTANTS
   ----------------------------------------------------------
   Defines persistent expedition, doctrine, status, record,
   and window-state values.
========================================================== */

const NACHT_RAIDERS_STATE_VERSION = 6;

const NACHT_RAIDERS_STATUS_INACTIVE = "inactive";
const NACHT_RAIDERS_STATUS_RUNNING = "running";

const NACHT_RAIDERS_STARTING_ZONE_ID = "nacht";
const NACHT_RAIDERS_DEFAULT_DOCTRINE = "balanced";

const NACHT_RAIDERS_DOCTRINES = Object.freeze([
  "cautious",
  "balanced",
  "aggressive",
  "salvage",
  "exploration"
]);

const NACHT_RAIDERS_WINDOW_MODE_FULL = "full";
const NACHT_RAIDERS_WINDOW_MODE_COMPACT = "compact";
const NACHT_RAIDERS_WINDOW_MODE_TERMINAL = "terminal";
const NACHT_RAIDERS_LEGACY_WINDOW_MODE_MINIMIZED = "minimized";

const NACHT_RAIDERS_WINDOW_MODES = Object.freeze([
  NACHT_RAIDERS_WINDOW_MODE_FULL,
  NACHT_RAIDERS_WINDOW_MODE_COMPACT,
  NACHT_RAIDERS_WINDOW_MODE_TERMINAL
]);

const NACHT_RAIDERS_LEGACY_WINDOW_MODES = Object.freeze([
  NACHT_RAIDERS_LEGACY_WINDOW_MODE_MINIMIZED
]);

const NACHT_RAIDERS_PENDING_RECORD_LIMIT = 500;
const NACHT_RAIDERS_REPORT_ARCHIVE_LIMIT = 50;

/* ==========================================================
   2. STATE VALIDATION HELPERS
========================================================== */

function isNachtRaidersPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeNachtRaidersNumber(
  value,
  fallback = 0
) {
  const numericValue = Number(value);

  return (
    Number.isFinite(numericValue) &&
    numericValue >= 0
  )
    ? numericValue
    : fallback;
}

function normalizeNachtRaidersInteger(
  value,
  fallback = 0
) {
  return Math.floor(
    normalizeNachtRaidersNumber(
      value,
      fallback
    )
  );
}

function normalizeNachtRaidersUnitValue(
  value,
  fallback = 0.5
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(
    1,
    Math.max(
      0,
      numericValue
    )
  );
}

function normalizeNachtRaidersWindowMode(value) {
  if (value === NACHT_RAIDERS_LEGACY_WINDOW_MODE_MINIMIZED) {
    return NACHT_RAIDERS_WINDOW_MODE_TERMINAL;
  }

  return NACHT_RAIDERS_WINDOW_MODES.includes(value)
    ? value
    : NACHT_RAIDERS_WINDOW_MODE_FULL;
}

function normalizeNachtRaidersRecordArray(
  value,
  maximumLength
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isNachtRaidersPlainObject)
    .slice(-maximumLength)
    .map((record) => ({
      ...record
    }));
}
/* ==========================================================
   2.1 FIELD-RECORD COMPACTION
   ----------------------------------------------------------
   Removes malformed flavor records and retains only the newest
   supported entries before the active game is serialized.
========================================================== */

function compactNachtRaidersFieldRecords(
  nachtRaidersState
) {
  if (
    !isNachtRaidersPlainObject(
      nachtRaidersState
    )
  ) {
    return false;
  }

  const fieldRecords =
    nachtRaidersState.fieldRecords;

  if (
    !isNachtRaidersPlainObject(
      fieldRecords
    )
  ) {
    return false;
  }

  const previousPendingEntries =
    Array.isArray(
      fieldRecords.pendingEntries
    )
      ? fieldRecords.pendingEntries
      : [];

  const previousReports =
    Array.isArray(
      fieldRecords.reports
    )
      ? fieldRecords.reports
      : [];

  const compactedPendingEntries =
    normalizeNachtRaidersRecordArray(
      previousPendingEntries,
      NACHT_RAIDERS_PENDING_RECORD_LIMIT
    );

  const compactedReports =
    normalizeNachtRaidersRecordArray(
      previousReports,
      NACHT_RAIDERS_REPORT_ARCHIVE_LIMIT
    );

  const recordsChanged =
    compactedPendingEntries.length !==
      previousPendingEntries.length ||
    compactedReports.length !==
      previousReports.length;

  fieldRecords.pendingEntries =
    compactedPendingEntries;

  fieldRecords.reports =
    compactedReports;

  return recordsChanged;
}

/* ==========================================================
   3. EXPEDITION SEED
   ----------------------------------------------------------
   Creates a nonzero integer used by future deterministic
   expedition and encounter simulation.
========================================================== */

function createNachtRaidersExpeditionSeed() {
  return (
    Math.floor(
      Math.random() *
      2147483646
    ) + 1
  );
}

/* ==========================================================
   4. DEFAULT NACHT RAIDERS STATE
========================================================== */

function createDefaultNachtRaidersState() {
  return {
    stateVersion:
      NACHT_RAIDERS_STATE_VERSION,

    hasStarted: false,
    status:
      NACHT_RAIDERS_STATUS_INACTIVE,

    doctrine:
      NACHT_RAIDERS_DEFAULT_DOCTRINE,

    cycleCount: 0,

   expedition: {
      seed: 0,
      rngState: 0,
      eventSequence: 0,

      zoneId:
        NACHT_RAIDERS_STARTING_ZONE_ID,

      zoneDepth: 0,
      travelProgress: 0,

      lastSimulationAt: 0,
      currentEncounter: null
    },

        operative: {
      level: 1,
      xp: 0,

      health: 100,
      maxHealth: 100,

      attack: 10,
      defense: 2,
      speed: 1
    },

    resources:
      createDefaultNachtRaidersResourceState(),

        statistics: {
      totalSimulationMs: 0,
      distanceTravelled: 0,

      encounters: 0,
      victories: 0,
      stalemates: 0,

      deaths: 0,
      reconstructions: 0,

      damageDealt: 0,
      damageTaken: 0
    },

        fieldRecords: {
      reportSequence: 0,
      pendingEntries: [],
      reports: []
    },

    window: {
      mode: NACHT_RAIDERS_WINDOW_MODE_FULL,

      position: {
        x: 0.5,
        y: 0.5
      }
    }
  };
}

/* ==========================================================
   5. NACHT RAIDERS STATE MIGRATION
   ----------------------------------------------------------
   Repairs old, incomplete, malformed, or partially imported
   Nacht Raiders state without deleting valid progress.
========================================================== */

function migrateNachtRaidersState(
  savedState
) {
  const defaultState =
    createDefaultNachtRaidersState();

  const sourceState =
    isNachtRaidersPlainObject(
      savedState
    )
      ? savedState
      : {};

  const savedExpedition =
    isNachtRaidersPlainObject(
      sourceState.expedition
    )
      ? sourceState.expedition
      : {};

  const savedOperative =
    isNachtRaidersPlainObject(
      sourceState.operative
    )
      ? sourceState.operative
      : {};

  const savedResources =
    isNachtRaidersPlainObject(
      sourceState.resources
    )
      ? sourceState.resources
      : {};

  const savedStatistics =
    isNachtRaidersPlainObject(
      sourceState.statistics
    )
      ? sourceState.statistics
      : {};

  const savedFieldRecords =
    isNachtRaidersPlainObject(
      sourceState.fieldRecords
    )
      ? sourceState.fieldRecords
      : {};

   const reportSequence =
    normalizeNachtRaidersInteger(
      savedFieldRecords.reportSequence
    );

  const savedWindow =
    isNachtRaidersPlainObject(
      sourceState.window
    )
      ? sourceState.window
      : {};

  const savedWindowPosition =
    isNachtRaidersPlainObject(
      savedWindow.position
    )
      ? savedWindow.position
      : {};

  const hasStarted =
    sourceState.hasStarted === true;

  const doctrine =
    NACHT_RAIDERS_DOCTRINES.includes(
      sourceState.doctrine
    )
      ? sourceState.doctrine
      : NACHT_RAIDERS_DEFAULT_DOCTRINE;

  const status =
    hasStarted
      ? NACHT_RAIDERS_STATUS_RUNNING
      : NACHT_RAIDERS_STATUS_INACTIVE;

  const savedSeed =
    normalizeNachtRaidersInteger(
      savedExpedition.seed
    );

  const expeditionSeed =
    (
      hasStarted &&
      savedSeed === 0
    )
      ? createNachtRaidersExpeditionSeed()
      : savedSeed;
  const savedRngState =
    normalizeNachtRaidersInteger(
      savedExpedition.rngState
    );

  const rngState =
    hasStarted
      ? (
          savedRngState > 0
            ? savedRngState
            : expeditionSeed
        )
      : 0;

  const eventSequence =
    normalizeNachtRaidersInteger(
      savedExpedition.eventSequence
    );
   
  const savedLastSimulationAt =
    normalizeNachtRaidersInteger(
      savedExpedition.lastSimulationAt
    );

  const lastSimulationAt =
    hasStarted
      ? (
          savedLastSimulationAt > 0
            ? savedLastSimulationAt
            : Date.now()
        )
      : 0;

  const maximumHealth =
    Math.max(
      1,
      normalizeNachtRaidersNumber(
        savedOperative.maxHealth,
        defaultState.operative.maxHealth
      )
    );

  const savedOperativeXp =
    normalizeNachtRaidersNumber(
      savedOperative.xp
    );

  const savedOperativeLevel =
    Math.max(
      1,
      normalizeNachtRaidersInteger(
        savedOperative.level,
        defaultState.operative.level
      )
    );

  const operativeXp =
    Math.max(
      savedOperativeXp,
      getNachtRaidersCumulativeXpForLevel(
        savedOperativeLevel
      )
    );

  const operativeLevel =
    getNachtRaidersLevelFromXp(
      operativeXp
    );
   
  const currentHealth =
    Math.min(
      maximumHealth,
      normalizeNachtRaidersNumber(
        savedOperative.health,
        maximumHealth
      )
    );

  const operativeAttack = Math.max(
    1,
    normalizeNachtRaidersNumber(
      savedOperative.attack,
      defaultState.operative.attack
    )
  );

  const operativeDefense = normalizeNachtRaidersNumber(
    savedOperative.defense,
    defaultState.operative.defense
  );

  const operativeSpeed = Math.max(
    0.1,
    normalizeNachtRaidersNumber(
      savedOperative.speed,
      defaultState.operative.speed
    )
  );

  const currentEncounter =
    isNachtRaidersPlainObject(
      savedExpedition.currentEncounter
    )
      ? {
          ...savedExpedition.currentEncounter
        }
      : null;

  const windowMode =
  normalizeNachtRaidersWindowMode(
    savedWindow.mode
  );

  return {
    stateVersion:
      NACHT_RAIDERS_STATE_VERSION,

    hasStarted,
    status,
    doctrine,

    cycleCount:
      normalizeNachtRaidersInteger(
        sourceState.cycleCount
      ),

   expedition: {
      seed:
        expeditionSeed,

      rngState,
      eventSequence,

      zoneId:
         
        typeof savedExpedition.zoneId ===
          "string" &&
        savedExpedition.zoneId.trim()
          ? savedExpedition.zoneId
          : NACHT_RAIDERS_STARTING_ZONE_ID,

      zoneDepth:
        normalizeNachtRaidersInteger(
          savedExpedition.zoneDepth
        ),

      travelProgress:
        normalizeNachtRaidersNumber(
          savedExpedition.travelProgress
        ),

      lastSimulationAt,
      currentEncounter
    },

    operative: {
            level:
        operativeLevel,

      xp:
        operativeXp,

      health:
        currentHealth,

      maxHealth:
        maximumHealth,

      attack:
        operativeAttack,

      defense:
        operativeDefense,

      speed:
        operativeSpeed
    },

   resources:
      normalizeNachtRaidersResourceState(
        savedResources
      ),

    statistics: {
      totalSimulationMs:
        normalizeNachtRaidersNumber(
          savedStatistics.totalSimulationMs
        ),

      distanceTravelled:
        normalizeNachtRaidersNumber(
          savedStatistics.distanceTravelled
        ),

      encounters:
        normalizeNachtRaidersInteger(
          savedStatistics.encounters
        ),

      victories:
        normalizeNachtRaidersInteger(
          savedStatistics.victories
        ),

      stalemates:
        normalizeNachtRaidersInteger(
          savedStatistics.stalemates
        ),

      deaths:
        normalizeNachtRaidersInteger(
          savedStatistics.deaths
        ),

      reconstructions:
        normalizeNachtRaidersInteger(
          savedStatistics.reconstructions
        ),

      damageDealt:
        normalizeNachtRaidersNumber(
          savedStatistics.damageDealt
        ),

      damageTaken:
        normalizeNachtRaidersNumber(
          savedStatistics.damageTaken
        )
    },

   fieldRecords: {
      reportSequence,

      pendingEntries:
        normalizeNachtRaidersRecordArray(
          savedFieldRecords.pendingEntries,
          NACHT_RAIDERS_PENDING_RECORD_LIMIT
        ),

      reports:
        normalizeNachtRaidersRecordArray(
          savedFieldRecords.reports,
          NACHT_RAIDERS_REPORT_ARCHIVE_LIMIT
        )
    },
    window: {
      mode:
        windowMode,

      position: {
        x:
          normalizeNachtRaidersUnitValue(
            savedWindowPosition.x
          ),

        y:
          normalizeNachtRaidersUnitValue(
            savedWindowPosition.y
          )
      }
    }
  };
}
