/* ==========================================================
   1. NACHT RAIDERS UNLOCK CONFIGURATION
   ----------------------------------------------------------
   Nacht Raiders belongs to the Aether Repairmen producer
   family and permanently unlocks after Tier III is reached.
========================================================== */

const NACHT_RAIDERS_SOURCE_PRODUCER_KEY =
  "aetherRepairmen";

const NACHT_RAIDERS_REQUIRED_PRODUCER_TIER =
  3;

/* ==========================================================
   2. NACHT RAIDERS UNLOCK ACCESS
   ----------------------------------------------------------
   Accepts either the current producer tier or the permanently
   recorded highest historical tier.
========================================================== */

function isNachtRaidersUnlocked() {
  const currentProducerTier =
    typeof getTemporaryProducerTier ===
      "function"
      ? getTemporaryProducerTier(
          NACHT_RAIDERS_SOURCE_PRODUCER_KEY
        )
      : 0;

  const highestRecordedTier =
    typeof getProducerHighestTier ===
      "function"
      ? getProducerHighestTier(
          NACHT_RAIDERS_SOURCE_PRODUCER_KEY
        )
      : 0;

  return (
    Math.max(
      currentProducerTier,
      highestRecordedTier
    ) >=
    NACHT_RAIDERS_REQUIRED_PRODUCER_TIER
  );
}

/* ==========================================================
   3. NACHT RAIDERS LAUNCHER VISIBILITY
========================================================== */

function shouldShowNachtRaidersLauncher() {
  const aetherRepairmenIsRevealed =
    typeof isProducerRevealed !==
      "function" ||
    isProducerRevealed(
      NACHT_RAIDERS_SOURCE_PRODUCER_KEY
    );

  return (
    isNachtRaidersUnlocked() &&
    aetherRepairmenIsRevealed
  );
}

function updateNachtRaidersLauncher() {
  if (
    !aetherRepairmenCardGroup ||
    !nachtRaidersLauncherButton
  ) {
    return;
  }

  const shouldShowLauncher =
    shouldShowNachtRaidersLauncher();

  nachtRaidersLauncherButton.hidden =
    !shouldShowLauncher;

  aetherRepairmenCardGroup.classList
    .toggle(
      "nacht-raiders-card-group-has-launcher",
      shouldShowLauncher
    );
}

/* ==========================================================
   4. NACHT RAIDERS OPEN REQUEST
   ----------------------------------------------------------
   The window controller added in the next section will listen
   for this event.
========================================================== */

function requestNachtRaidersOpen() {
  if (
    !shouldShowNachtRaidersLauncher()
  ) {
    return;
  }

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:open-requested"
    )
  );
}

/* ==========================================================
   5. NACHT RAIDERS LAUNCHER INPUT
========================================================== */

nachtRaidersLauncherButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      requestNachtRaidersOpen();
    }
  );
