/* ==========================================================
   1. HARVESTER BALANCE AND OUTPUT FORMULA
   ----------------------------------------------------------
   Editable balance values for the finite Harvester cycle.

   Full-cycle formula:

   deployed seconds
   × base clicks per second
   × passive MPS snapshot
   × (
       1 +
       owned Spoon-family buildings
       × owned-building bonus
     )
   × global output multiplier
========================================================== */

const HARVESTER_ACTIVE_DURATION_SECONDS =
  30;

const HARVESTER_ACTIVE_DURATION_MS =
  HARVESTER_ACTIVE_DURATION_SECONDS *
  1000;

const HARVESTER_COOLDOWN_DURATION_MS =
  30 * 1000;

const HARVESTER_BASE_CLICKS_PER_SECOND =
  5;

const HARVESTER_OWNED_BONUS_PER_BUILDING =
  0.1;

/*
 * Change this one value later to strengthen or weaken the
 * entire formula without altering its other components.
 *
 * Examples:
 *
 * 1     = 100% of the proposed formula
 * 0.5   = 50%
 * 0.25  = 25%
 * 2     = 200%
 */
const HARVESTER_OUTPUT_MULTIPLIER =
  1;

/*
 * Prevents a zero-MPS player from producing zero Harvester
 * output.
 */
const HARVESTER_MINIMUM_MPS_SNAPSHOT =
  0.1;

/*
 * Final safeguard. The Harvester can never generate less than
 * this amount per active second.
 */
const HARVESTER_MINIMUM_OUTPUT_PER_SECOND =
  1;

function calculateHarvesterOutputPerSecond(
  passiveMpsSnapshot,
  ownedBuildingSnapshot
) {
  const safeMpsSnapshot =
    Math.max(
      HARVESTER_MINIMUM_MPS_SNAPSHOT,
      Number(passiveMpsSnapshot) || 0
    );

  const safeOwnedBuildingSnapshot =
    Math.max(
      0,
      Math.floor(
        Number(ownedBuildingSnapshot) || 0
      )
    );

  const ownedBuildingMultiplier =
    1 +
    (
      safeOwnedBuildingSnapshot *
      HARVESTER_OWNED_BONUS_PER_BUILDING
    );

  const calculatedOutputPerSecond =
    HARVESTER_BASE_CLICKS_PER_SECOND *
    safeMpsSnapshot *
    ownedBuildingMultiplier *
    HARVESTER_OUTPUT_MULTIPLIER;

  return Math.max(
    HARVESTER_MINIMUM_OUTPUT_PER_SECOND,
    calculatedOutputPerSecond
  );
}

function calculateHarvesterFullCycleOutput(
  passiveMpsSnapshot,
  ownedBuildingSnapshot
) {
  return (
    HARVESTER_ACTIVE_DURATION_SECONDS *
    calculateHarvesterOutputPerSecond(
      passiveMpsSnapshot,
      ownedBuildingSnapshot
    )
  );
}

/* ==========================================================
   2. HARVESTER CHARGE DISPLAY
========================================================== */

const HARVESTER_CHARGE_ORANGE_THRESHOLD =
  0.5;

const HARVESTER_CHARGE_RED_THRESHOLD =
  0.25;

const HARVESTER_DUTY_DISPLAY_REFRESH_MS =
  250;
