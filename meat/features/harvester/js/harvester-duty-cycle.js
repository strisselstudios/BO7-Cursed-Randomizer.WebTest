/* ==========================================================
   1. HARVESTER TIMER FORMATTING
========================================================== */

function formatHarvesterDuration(
  milliseconds
) {
  const totalSeconds =
    Math.max(
      0,
      Math.ceil(
        milliseconds / 1000
      )
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (
        totalSeconds % 3600
      ) /
      60
    );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {
    return [
      hours,
      String(minutes)
        .padStart(2, "0"),
      String(seconds)
        .padStart(2, "0")
    ].join(":");
  }

  return [
    minutes,
    String(seconds)
      .padStart(2, "0")
  ].join(":");
}

/* ==========================================================
   2. HARVESTER CHARGE COLOR
========================================================== */

function getHarvesterChargeColorClass(
  chargeRatio
) {
  if (
    chargeRatio >
    HARVESTER_CHARGE_ORANGE_THRESHOLD
  ) {
    return "harvester-charge-fill-green";
  }

  if (
    chargeRatio >
    HARVESTER_CHARGE_RED_THRESHOLD
  ) {
    return "harvester-charge-fill-orange";
  }

  return "harvester-charge-fill-red";
}

/* ==========================================================
   3. HARVESTER CHARGE GAUGE
========================================================== */

function updateHarvesterChargeDisplay(
  currentTime = Date.now()
) {
  if (
    !placedHarvester ||
    !harvesterChargeGauge ||
    !harvesterChargeGaugeFill ||
    !harvesterChargeTime
  ) {
    return;
  }

  const dutyState =
    getHarvesterDutyState(
      currentTime
    );

  const harvesterIsVisible =
    dutyState ===
      HARVESTER_DUTY_STATE_ACTIVE ||
    dutyState ===
      HARVESTER_DUTY_STATE_DEPLETED;

  harvesterChargeGauge.hidden =
    !harvesterIsVisible;

  placedHarvester.classList.toggle(
    "harvester-depleted",
    dutyState ===
      HARVESTER_DUTY_STATE_DEPLETED
  );

  if (!harvesterIsVisible) {
    return;
  }

  harvesterChargeGaugeFill.classList
    .remove(
      "harvester-charge-fill-green",
      "harvester-charge-fill-orange",
      "harvester-charge-fill-red"
    );

  if (
    dutyState ===
    HARVESTER_DUTY_STATE_DEPLETED
  ) {
    harvesterChargeGaugeFill.classList
      .add(
        "harvester-charge-fill-red"
      );

    harvesterChargeGaugeFill.style.width =
      "0%";

    harvesterChargeTime.textContent =
      "DEPLETED";

    return;
  }

  const chargeRatio =
    getHarvesterChargeRatio(
      currentTime
    );

  const remainingTime =
    getHarvesterActiveRemainingMs(
      currentTime
    );

  harvesterChargeGaugeFill.classList
    .add(
      getHarvesterChargeColorClass(
        chargeRatio
      )
    );

  harvesterChargeGaugeFill.style.width =
    `${chargeRatio * 100}%`;

  harvesterChargeTime.textContent =
    formatHarvesterDuration(
      remainingTime
    );
}

/* ==========================================================
   4. DUTY-CYCLE AND PRODUCTION REFRESH
   ----------------------------------------------------------
   Processes timestamp-based Harvester output before drawing
   the current timer and gauge state.
========================================================== */

let previousHarvesterDutyState =
  null;

function updateHarvesterDutyCycleDisplay(
  currentTime = Date.now()
) {
  if (
    typeof processHarvesterProduction ===
    "function"
  ) {
    processHarvesterProduction(
      currentTime
    );
  }

  clearCompletedHarvesterCooldown(
    currentTime
  );

  const currentDutyState =
    getHarvesterDutyState(
      currentTime
    );

  updateHarvesterChargeDisplay(
    currentTime
  );

  if (
    typeof updateHarvesterStoreControl ===
    "function"
  ) {
    updateHarvesterStoreControl(
      currentTime
    );
  }

  const harvesterJustDepleted =
    currentDutyState ===
      HARVESTER_DUTY_STATE_DEPLETED &&
    previousHarvesterDutyState !==
      HARVESTER_DUTY_STATE_DEPLETED;

  if (harvesterJustDepleted) {
    saveGame();

    document.dispatchEvent(
      new CustomEvent(
        "harvester:depleted"
      )
    );
  }

  previousHarvesterDutyState =
    currentDutyState;
}


/* ==========================================================
   5. DUTY-CYCLE TIMER AND SAVE SAFETY
========================================================== */

window.setInterval(
  () => {
    updateHarvesterDutyCycleDisplay();
  },
  HARVESTER_DUTY_DISPLAY_REFRESH_MS
);

document.addEventListener(
  "harvester:deployed",
  () => {
    updateHarvesterDutyCycleDisplay();
  }
);

document.addEventListener(
  "harvester:retracted",
  () => {
    updateHarvesterDutyCycleDisplay();
  }
);

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      if (
        typeof processHarvesterProduction ===
        "function"
      ) {
        processHarvesterProduction();
      }

      saveGame();

      return;
    }

    updateHarvesterDutyCycleDisplay();
  }
);

window.addEventListener(
  "pagehide",
  () => {
    if (
      typeof processHarvesterProduction ===
      "function"
    ) {
      processHarvesterProduction();
    }

    saveGame();
  }
);
