/* ==========================================================
   1. HARVESTER STORE CONTROL STATE
========================================================== */

const HARVESTER_STORE_ACTION_DEPLOY =
  "deploy";

const HARVESTER_STORE_ACTION_RETRACT =
  "retract";

const HARVESTER_STORE_ACTION_COOLDOWN =
  "cooldown";

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

function getHarvesterStoreAction(
  currentTime = Date.now()
) {
  const dutyState =
    getHarvesterDutyState(
      currentTime
    );

  if (
    dutyState ===
      HARVESTER_DUTY_STATE_ACTIVE ||
    dutyState ===
      HARVESTER_DUTY_STATE_DEPLETED
  ) {
    return HARVESTER_STORE_ACTION_RETRACT;
  }

  if (
    dutyState ===
    HARVESTER_DUTY_STATE_COOLDOWN
  ) {
    return HARVESTER_STORE_ACTION_COOLDOWN;
  }

  return HARVESTER_STORE_ACTION_DEPLOY;
}

/* ==========================================================
   4. HARVESTER STORE CONTROL DISPLAY
========================================================== */

function updateHarvesterStoreControl(
  currentTime = Date.now()
) {
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

  const dutyState =
    getHarvesterDutyState(
      currentTime
    );

  const selectedAction =
    getHarvesterStoreAction(
      currentTime
    );

  const actionLabel =
    harvesterStoreActionButton
      .querySelector(
        ".harvester-store-action-label"
      );

  harvesterStoreActionButton.classList
    .remove(
      "harvester-store-action-ready",
      "harvester-store-action-active",
      "harvester-store-action-depleted",
      "harvester-store-action-cooldown"
    );

  harvesterStoreActionButton.classList
    .add(
      `harvester-store-action-${dutyState}`
    );

  harvesterStoreActionButton.dataset
    .harvesterAction =
      selectedAction;

  if (
    selectedAction ===
    HARVESTER_STORE_ACTION_COOLDOWN
  ) {
    const cooldownRemaining =
      getHarvesterCooldownRemainingMs(
        currentTime
      );

    const cooldownProgress =
      getHarvesterCooldownRatio(
        currentTime
      );

    const formattedCooldown =
      typeof formatHarvesterDuration ===
        "function"
        ? formatHarvesterDuration(
            cooldownRemaining
          )
        : "";

    if (actionLabel) {
      actionLabel.textContent =
        `RECHARGING ${formattedCooldown}`;
    }

    harvesterStoreActionButton.disabled =
      true;

    harvesterStoreActionButton
      .setAttribute(
        "aria-label",
        `Harvester recharging. ${formattedCooldown} remaining.`
      );

    harvesterStoreActionButton.title =
      "Harvester recharging";

    harvesterStoreActionButton.style
      .setProperty(
        "--harvester-cooldown-progress",
        `${cooldownProgress * 100}%`
      );

    return;
  }

  harvesterStoreActionButton.disabled =
    false;

  harvesterStoreActionButton.style
    .setProperty(
      "--harvester-cooldown-progress",
      "0%"
    );

  if (
    selectedAction ===
    HARVESTER_STORE_ACTION_RETRACT
  ) {
    if (actionLabel) {
      actionLabel.textContent =
        "RETRACT HARVESTER";
    }

    const accessibleText =
      dutyState ===
      HARVESTER_DUTY_STATE_DEPLETED
        ? "Retract depleted Golden Spork Harvester"
        : "Retract Golden Spork Harvester";

    harvesterStoreActionButton
      .setAttribute(
        "aria-label",
        accessibleText
      );

    harvesterStoreActionButton.title =
      accessibleText;

    return;
  }

  if (actionLabel) {
    actionLabel.textContent =
      "DEPLOY HARVESTER";
  }

  harvesterStoreActionButton
    .setAttribute(
      "aria-label",
      "Deploy Golden Spork Harvester"
    );

  harvesterStoreActionButton.title =
    "Deploy Golden Spork Harvester";
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

  const requestedAction =
    getHarvesterStoreAction();

  if (
    requestedAction ===
    HARVESTER_STORE_ACTION_COOLDOWN
  ) {
    return;
  }

  showHarvesterStoreActionFeedback();

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
