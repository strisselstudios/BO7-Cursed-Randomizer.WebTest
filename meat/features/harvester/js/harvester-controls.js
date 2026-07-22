/* ==========================================================
   1. HARVESTER STORE CONTROL STATE
   ----------------------------------------------------------
   Controls the Tier III action attached to the Silver Spoon
   producer entry.
========================================================== */

const HARVESTER_STORE_ACTION_DEPLOY =
  "deploy";

const HARVESTER_STORE_ACTION_RETRACT =
  "retract";

const HARVESTER_STORE_ACTION_PRESS_DURATION =
  160;

let harvesterStoreActionFeedbackTimer =
  null;

/* ==========================================================
   2. HARVESTER STORE CONTROL VISIBILITY
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
   3. HARVESTER STORE CONTROL ACTION
========================================================== */

function getHarvesterStoreAction() {
  const harvesterIsDeployed =
    typeof isHarvesterDeployed ===
      "function" &&
    isHarvesterDeployed();

  return harvesterIsDeployed
    ? HARVESTER_STORE_ACTION_RETRACT
    : HARVESTER_STORE_ACTION_DEPLOY;
}

/* ==========================================================
   4. HARVESTER STORE CONTROL DISPLAY
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

  const selectedAction =
    getHarvesterStoreAction();

  const actionIsRetract =
    selectedAction ===
    HARVESTER_STORE_ACTION_RETRACT;

  const actionText =
    actionIsRetract
      ? "RETRACT HARVESTER"
      : "DEPLOY HARVESTER";

  const accessibleText =
    actionIsRetract
      ? "Retract Golden Spork Harvester"
      : "Deploy Golden Spork Harvester";

  harvesterStoreActionButton.dataset
    .harvesterAction =
      selectedAction;

  const actionLabel =
    harvesterStoreActionButton
      .querySelector(
        ".harvester-store-action-label"
      );

  if (actionLabel) {
    actionLabel.textContent =
      actionText;
  }

  harvesterStoreActionButton
    .setAttribute(
      "aria-label",
      accessibleText
    );

  harvesterStoreActionButton.title =
    accessibleText;
}

/* ==========================================================
   5. HARVESTER BUTTON FEEDBACK
========================================================== */

function showHarvesterStoreActionFeedback() {
  if (!harvesterStoreActionButton) {
    return;
  }

  window.clearTimeout(
    harvesterStoreActionFeedbackTimer
  );

  harvesterStoreActionButton
    .classList
    .remove(
      "harvester-store-action-button-pressed"
    );

  void harvesterStoreActionButton
    .offsetWidth;

  harvesterStoreActionButton
    .classList
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
   6. HARVESTER ACTION REQUEST
========================================================== */

function requestHarvesterStoreAction() {
  if (
    !shouldShowHarvesterStoreControl()
  ) {
    return;
  }

  showHarvesterStoreActionFeedback();

  const requestedAction =
    getHarvesterStoreAction();

  if (
    requestedAction ===
    HARVESTER_STORE_ACTION_RETRACT
  ) {
    document.dispatchEvent(
      new CustomEvent(
        "harvester:retract-requested"
      )
    );

    return;
  }

  document.dispatchEvent(
    new CustomEvent(
      "harvester:deploy-requested"
    )
  );
}

/* ==========================================================
   7. HARVESTER STORE INPUT
========================================================== */

if (harvesterStoreActionButton) {
  harvesterStoreActionButton
    .addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        requestHarvesterStoreAction();
      }
    );
}
