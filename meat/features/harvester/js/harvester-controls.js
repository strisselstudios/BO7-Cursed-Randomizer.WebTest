/* ==========================================================
   1. HARVESTER STORE CONTROL STATE
   ----------------------------------------------------------
   Controls the Tier III feature action attached to the Silver
   Spoon producer entry.

   Actual placement begins in the next implementation step.
========================================================== */

const HARVESTER_STORE_ACTION_DEPLOY =
  "deploy";

const HARVESTER_STORE_ACTION_PRESS_DURATION =
  160;

let harvesterStoreActionFeedbackTimer =
  null;

/* ==========================================================
   2. HARVESTER STORE CONTROL VISIBILITY
   ----------------------------------------------------------
   Displays the control only when:

   1. The Harvester has been permanently unlocked.
   2. The Silver Spoon producer is normally revealed.
========================================================== */

function shouldShowHarvesterStoreControl() {
  const harvesterIsUnlocked =
    typeof isHarvesterUnlocked ===
      "function" &&
    isHarvesterUnlocked();

  const silverSpoonIsRevealed =
    typeof isProducerRevealed !==
      "function" ||
    isProducerRevealed(
      HARVESTER_SOURCE_PRODUCER_KEY
    );

  return (
    harvesterIsUnlocked &&
    silverSpoonIsRevealed
  );
}

/* ==========================================================
   3. HARVESTER STORE CONTROL DISPLAY
========================================================== */

function updateHarvesterStoreControl() {
  if (
    !silverSpoonCardGroup ||
    !harvesterStoreActionButton
  ) {
    return;
  }

  const shouldShowControl =
    shouldShowHarvesterStoreControl();

  harvesterStoreActionButton.hidden =
    !shouldShowControl;

  silverSpoonCardGroup.classList.toggle(
    "producer-card-group-has-harvester",
    shouldShowControl
  );

  if (!shouldShowControl) {
    return;
  }

  harvesterStoreActionButton.dataset
    .harvesterAction =
      HARVESTER_STORE_ACTION_DEPLOY;

  harvesterStoreActionButton
    .setAttribute(
      "aria-label",
      "Deploy Golden Spork Harvester"
    );

  harvesterStoreActionButton.title =
    "Deploy Golden Spork Harvester";
}

/* ==========================================================
   4. HARVESTER BUTTON FEEDBACK
   ----------------------------------------------------------
   Produces visible touch, mouse, and keyboard confirmation.

   This does not use the producer transaction animation
   because deploying the Harvester is not a purchase.
========================================================== */

function showHarvesterStoreActionFeedback() {
  if (!harvesterStoreActionButton) {
    return;
  }

  window.clearTimeout(
    harvesterStoreActionFeedbackTimer
  );

  harvesterStoreActionButton.classList
    .remove(
      "harvester-store-action-button-pressed"
    );

  void harvesterStoreActionButton
    .offsetWidth;

  harvesterStoreActionButton.classList
    .add(
      "harvester-store-action-button-pressed"
    );

  harvesterStoreActionFeedbackTimer =
    window.setTimeout(
      () => {
        harvesterStoreActionButton
          .classList
          .remove(
            "harvester-store-action-button-pressed"
          );
      },
      HARVESTER_STORE_ACTION_PRESS_DURATION
    );
}

/* ==========================================================
   5. DEPLOYMENT REQUEST
   ----------------------------------------------------------
   Dispatches a dedicated feature event.

   The placement controller added in the next step will handle
   this event and enter placement mode.
========================================================== */

function requestHarvesterDeployment() {
  if (
    !shouldShowHarvesterStoreControl()
  ) {
    return;
  }

  showHarvesterStoreActionFeedback();

  document.dispatchEvent(
    new CustomEvent(
      "harvester:deploy-requested"
    )
  );
}

/* ==========================================================
   6. HARVESTER STORE INPUT
========================================================== */

harvesterStoreActionButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      requestHarvesterDeployment();
    }
  );
