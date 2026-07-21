/* ==========================================================
   1. OFFLINE PRODUCTION CONFIGURATION
   ----------------------------------------------------------
   Controls how long players must be absent before receiving
   offline production and how much absence can be credited.
========================================================== */

const MINIMUM_OFFLINE_SECONDS = 60;

const MAXIMUM_OFFLINE_SECONDS =
  24 * 60 * 60;

const OFFLINE_PRODUCTION_EFFICIENCY = 1;

let offlineProductionInitialized = false;

/* ==========================================================
   2. OFFLINE PRODUCTION CALCULATION
   ----------------------------------------------------------
   Calculates MEAT produced since the previous save timestamp.

   Offline production:
   - Uses the current saved Meat Per Second.
   - Awards 100% production.
   - Is currently capped at 24 hours.
   - Counts toward lifetime MEAT.
========================================================== */

function calculateOfflineProduction(
  currentTime = Date.now()
) {
  const previousSaveTime =
    Number(gameState.lastSavedAt);

  gameState.lastSavedAt =
    currentTime;

  if (
    !Number.isFinite(
      previousSaveTime
    ) ||
    previousSaveTime <= 0
  ) {
    return null;
  }

  const millisecondsAway =
    Math.max(
      0,
      currentTime -
      previousSaveTime
    );

  const secondsAway =
    Math.floor(
      millisecondsAway / 1000
    );

  if (
    secondsAway <
      MINIMUM_OFFLINE_SECONDS ||
    gameState.meatPerSecond <= 0
  ) {
    return null;
  }

  const creditedSeconds =
    Math.min(
      secondsAway,
      MAXIMUM_OFFLINE_SECONDS
    );

  const meatEarned =
    harvestProducerMeat(
      creditedSeconds,
      OFFLINE_PRODUCTION_EFFICIENCY
    );

  if (
    !Number.isFinite(meatEarned) ||
    meatEarned <= 0
  ) {
    return null;
  }

  return {
    meatEarned,
    secondsAway,
    creditedSeconds,

    wasCapped:
      secondsAway >
      MAXIMUM_OFFLINE_SECONDS
  };
}

/* ==========================================================
   3. OFFLINE PRODUCTION COLLECTION
   ----------------------------------------------------------
   Rebuilds production, awards offline MEAT, updates the
   interface, and immediately saves the collected amount.
========================================================== */

function collectOfflineProduction() {
  calculateMeatPerSecond();

  const offlineProduction =
    calculateOfflineProduction();

  if (offlineProduction) {
    updateGameDisplay();
  }

  saveGame();

  return offlineProduction;
}

/* ==========================================================
   4. OFFLINE PRODUCTION DIALOG
   ----------------------------------------------------------
   Displays the amount harvested and the credited duration.
========================================================== */

function showOfflineProductionDialog(
  offlineProduction
) {
  if (
    !offlineProduction ||
    !offlineProductionDialog ||
    !offlineProductionAmount ||
    !offlineProductionDuration
  ) {
    return;
  }

  offlineProductionAmount.textContent =
    `${formatMeat(
      offlineProduction.meatEarned
    )} MEAT`;

  const creditedDuration =
    formatRunTime(
      offlineProduction
        .creditedSeconds * 1000
    );

  if (offlineProduction.wasCapped) {
    offlineProductionDuration.textContent =
      `Harvested for ${creditedDuration}. ` +
      "The current 24-hour offline limit was reached.";
  } else {
    offlineProductionDuration.textContent =
      `Harvested over ${creditedDuration}.`;
  }

  if (
    typeof offlineProductionDialog
      .showModal === "function"
  ) {
    if (
      !offlineProductionDialog.open
    ) {
      offlineProductionDialog.showModal();
    }
  } else {
    offlineProductionDialog.setAttribute(
      "open",
      ""
    );
  }
}

function closeOfflineProductionDialog() {
  if (!offlineProductionDialog) {
    return;
  }

  if (
    typeof offlineProductionDialog.close ===
    "function"
  ) {
    offlineProductionDialog.close();
  } else {
    offlineProductionDialog.removeAttribute(
      "open"
    );
  }
}

if (offlineProductionCloseButton) {
  offlineProductionCloseButton
    .addEventListener(
      "click",
      closeOfflineProductionDialog
    );
}

if (offlineProductionDialog) {
  offlineProductionDialog.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        offlineProductionDialog
      ) {
        closeOfflineProductionDialog();
      }
    }
  );
}

/* ==========================================================
   5. MOBILE AND BACKGROUND RETURN HANDLING
   ----------------------------------------------------------
   Awards offline production when a suspended or backgrounded
   browser tab becomes visible again.
========================================================== */

function initializeOfflineProduction() {
  const offlineProduction =
    collectOfflineProduction();

  offlineProductionInitialized = true;

  return offlineProduction;
}

document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.visibilityState !==
        "visible" ||
      !offlineProductionInitialized
    ) {
      return;
    }

    const offlineProduction =
      collectOfflineProduction();

    showOfflineProductionDialog(
      offlineProduction
    );
  }
);
