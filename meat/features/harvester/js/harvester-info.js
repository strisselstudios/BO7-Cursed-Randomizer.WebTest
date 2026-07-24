/* ==========================================================
   1. HARVESTER INFO INTERFACE STATE
========================================================== */

const HARVESTER_COLLECTION_NOTICE_DURATION_MS =
  2800;

let harvesterInfoSubviewIsActive =
  false;

let harvesterCollectionNoticeTimer =
  null;

/* ==========================================================
   2. HARVESTER INFO FORMATTING
========================================================== */

function formatHarvesterInfoDuration(
  milliseconds
) {
  if (
    typeof formatHarvesterDuration ===
    "function"
  ) {
    return formatHarvesterDuration(
      milliseconds
    );
  }

  const totalSeconds =
    Math.max(
      0,
      Math.ceil(
        milliseconds / 1000
      )
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return (
    `${minutes}:` +
    String(seconds)
      .padStart(2, "0")
  );
}

function formatHarvesterInfoMultiplier(
  multiplier
) {
  const normalizedMultiplier =
    Math.max(
      0,
      Number(multiplier) || 0
    );

  return (
    `×${normalizedMultiplier
      .toFixed(2)
      .replace(/\.?0+$/, "")}`
  );
}

/* ==========================================================
   3. HARVESTER INFO SNAPSHOT
   ----------------------------------------------------------
   Uses the frozen active or previous-cycle snapshot when one
   exists. Before the first deployment, it displays an estimate
   based on the player's current passive MPS and Spork count.
========================================================== */

function getHarvesterInfoSnapshot() {
  const harvesterState =
    ensureHarvesterState();

  const savedPassiveMps =
    Number(
      harvesterState
        .passiveMpsSnapshot
    );

  const savedOwnedBuildings =
    Number(
      harvesterState
        .ownedBuildingSnapshot
    );

  const savedOutputPerSecond =
    Number(
      harvesterState
        .outputPerSecondSnapshot
    );

  const hasSavedSnapshot =
    Number.isFinite(
      savedPassiveMps
    ) &&
    savedPassiveMps > 0 &&
    Number.isFinite(
      savedOutputPerSecond
    ) &&
    savedOutputPerSecond > 0;

  if (hasSavedSnapshot) {
    return {
      isEstimate: false,

      passiveMps:
        savedPassiveMps,

      ownedBuildings:
        Math.max(
          0,
          Math.floor(
            savedOwnedBuildings || 0
          )
        ),

      outputPerSecond:
        savedOutputPerSecond
    };
  }

  const estimatedPassiveMps =
    typeof getCurrentHarvesterPassiveMps ===
      "function"
      ? getCurrentHarvesterPassiveMps()
      : Math.max(
          HARVESTER_MINIMUM_MPS_SNAPSHOT,
          Number(
            gameState.meatPerSecond
          ) || 0
        );

  const estimatedOwnedBuildings =
    Math.max(
      0,
      Math.floor(
        Number(
          gameState.producers?.[
            HARVESTER_SOURCE_PRODUCER_KEY
          ]
        ) || 0
      )
    );

  return {
    isEstimate: true,

    passiveMps:
      estimatedPassiveMps,

    ownedBuildings:
      estimatedOwnedBuildings,

    outputPerSecond:
      calculateHarvesterOutputPerSecond(
        estimatedPassiveMps,
        estimatedOwnedBuildings
      )
  };
}

/* ==========================================================
   4. HARVESTER DUTY STATUS PRESENTATION
========================================================== */

function getHarvesterInfoStatusData(
  currentTime
) {
  const dutyState =
    getHarvesterDutyState(
      currentTime
    );

  if (
    dutyState ===
    HARVESTER_DUTY_STATE_ACTIVE
  ) {
    return {
      label: "ACTIVE",

      timeLabel:
        formatHarvesterInfoDuration(
          getHarvesterActiveRemainingMs(
            currentTime
          )
        )
    };
  }

  if (
    dutyState ===
    HARVESTER_DUTY_STATE_DEPLETED
  ) {
    return {
      label: "DEPLETED",
      timeLabel: "0:00"
    };
  }

  if (
    dutyState ===
    HARVESTER_DUTY_STATE_COOLDOWN
  ) {
    return {
      label: "RECHARGING",

      timeLabel:
        formatHarvesterInfoDuration(
          getHarvesterCooldownRemainingMs(
            currentTime
          )
        )
    };
  }

  if (
    dutyState ===
    HARVESTER_DUTY_STATE_LOCKED
  ) {
    return {
      label: "LOCKED",
      timeLabel: "UNAVAILABLE"
    };
  }

  return {
    label: "READY",
    timeLabel: "FULL CHARGE"
  };
}

/* ==========================================================
   5. HARVESTER INFO AVAILABILITY
========================================================== */

function shouldShowHarvesterInfoButton() {
  return (
    openProducerInfoKey ===
      HARVESTER_SOURCE_PRODUCER_KEY &&
    typeof isHarvesterUnlocked ===
      "function" &&
    isHarvesterUnlocked()
  );
}

function updateHarvesterInfoAvailability() {
  if (!producerInfoHarvesterButton) {
    return;
  }

  const shouldShowButton =
    shouldShowHarvesterInfoButton();

  producerInfoHarvesterButton.hidden =
    !shouldShowButton ||
    harvesterInfoSubviewIsActive;

  if (
    !shouldShowButton &&
    harvesterInfoSubviewIsActive
  ) {
    resetHarvesterInfoSubview(
      false
    );
  }
}

/* ==========================================================
   6. HARVESTER INFO LIVE DISPLAY
========================================================== */

function updateHarvesterInfoView(
  currentTime = Date.now()
) {
  if (
    !harvesterInfoSubviewIsActive ||
    !harvesterInfoView ||
    !harvesterInfoStatus ||
    !harvesterInfoTimeRemaining ||
    !harvesterInfoPassiveMps ||
    !harvesterInfoOwnedSnapshot ||
    !harvesterInfoClickRate ||
    !harvesterInfoOwnershipMultiplier ||
    !harvesterInfoOutputRate ||
    !harvesterInfoStoredMeat ||
    !harvesterInfoProjectedYield ||
    !harvesterInfoLifetimeMeat ||
    !harvesterInfoFormulaHeading ||
    !harvesterInfoFormulaText
  ) {
    return;
  }

  if (
    typeof processHarvesterProduction ===
    "function"
  ) {
    processHarvesterProduction(
      currentTime
    );
  }

  const harvesterState =
    ensureHarvesterState();

  const dutyState =
    getHarvesterDutyState(
      currentTime
    );

  const statusData =
    getHarvesterInfoStatusData(
      currentTime
    );

  const snapshot =
    getHarvesterInfoSnapshot();

  const ownershipMultiplier =
    1 +
    (
      snapshot.ownedBuildings *
      HARVESTER_OWNED_BONUS_PER_BUILDING
    );

  const projectedFullCycleYield =
    snapshot.outputPerSecond *
    HARVESTER_ACTIVE_DURATION_SECONDS;

  harvesterInfoStatus.textContent =
    statusData.label;

  harvesterInfoStatus.classList.remove(
    "harvester-info-status-ready",
    "harvester-info-status-active",
    "harvester-info-status-depleted",
    "harvester-info-status-cooldown",
    "harvester-info-status-locked"
  );

  harvesterInfoStatus.classList.add(
    `harvester-info-status-${dutyState}`
  );

  harvesterInfoTimeRemaining
    .textContent =
      statusData.timeLabel;

  harvesterInfoPassiveMps.textContent =
    `${formatMeatPerSecond(
      snapshot.passiveMps
    )} MEAT / SECOND`;

  harvesterInfoOwnedSnapshot.textContent =
    snapshot.ownedBuildings
      .toLocaleString(
        "en-US"
      );

  harvesterInfoClickRate.textContent =
    (
      `${HARVESTER_BASE_CLICKS_PER_SECOND}` +
      " / SECOND"
    );

  harvesterInfoOwnershipMultiplier
    .textContent =
      formatHarvesterInfoMultiplier(
        ownershipMultiplier
      );

  harvesterInfoOutputRate.textContent =
    `${formatMeatPerSecond(
      snapshot.outputPerSecond
    )} MEAT / SECOND`;

  harvesterInfoStoredMeat.textContent =
    `${formatMeat(
      harvesterState.storedMeat
    )} MEAT`;

  harvesterInfoProjectedYield.textContent =
    `${formatMeat(
      projectedFullCycleYield
    )} MEAT`;

  harvesterInfoLifetimeMeat.textContent =
    `${formatMeat(
      harvesterState.lifetimeMeat
    )} MEAT`;

  if (snapshot.isEstimate) {
    harvesterInfoFormulaHeading
      .textContent =
        "NEXT DEPLOYMENT ESTIMATE";
  } else if (
    dutyState ===
      HARVESTER_DUTY_STATE_ACTIVE ||
    dutyState ===
      HARVESTER_DUTY_STATE_DEPLETED
  ) {
    harvesterInfoFormulaHeading
      .textContent =
        "ACTIVE DEPLOYMENT FORMULA";
  } else {
    harvesterInfoFormulaHeading
      .textContent =
        "LAST DEPLOYMENT FORMULA";
  }

  harvesterInfoFormulaText.textContent =
    (
      `${HARVESTER_BASE_CLICKS_PER_SECOND}` +
      " CLICKS/SEC × " +
      `${formatMeatPerSecond(
        snapshot.passiveMps
      )} PASSIVE MPS × ` +
      `(1 + ${snapshot.ownedBuildings}` +
      ` × ${HARVESTER_OWNED_BONUS_PER_BUILDING})` +
      ` × ${HARVESTER_OUTPUT_MULTIPLIER}` +
      " = " +
      `${formatMeatPerSecond(
        snapshot.outputPerSecond
      )} MEAT/SEC`
    );

  if (harvesterInfoRetractButton) {
    const canRetract =
      dutyState ===
        HARVESTER_DUTY_STATE_ACTIVE ||
      dutyState ===
        HARVESTER_DUTY_STATE_DEPLETED;

    harvesterInfoRetractButton.hidden =
      !canRetract;
  }
}

/* ==========================================================
   7. HARVESTER DOSSIER VIEW SWITCHING
========================================================== */

function openHarvesterInfoSubview() {
  if (
    !shouldShowHarvesterInfoButton() ||
    !producerInfoPanel ||
    !harvesterInfoView
  ) {
    return;
  }

  harvesterInfoSubviewIsActive =
    true;

  producerInfoPanel.classList.add(
    "harvester-info-view-active"
  );

  harvesterInfoView.hidden =
    false;

  if (producerInfoPreviousButton) {
    producerInfoPreviousButton.hidden =
      true;
  }

  if (producerInfoNextButton) {
    producerInfoNextButton.hidden =
      true;
  }

  updateHarvesterInfoAvailability();
  updateHarvesterInfoView();

  producerInfoPanel.scrollTop = 0;

  harvesterInfoBackButton?.focus({
    preventScroll: true
  });
}

function resetHarvesterInfoSubview(
  restoreFocus = true
) {
  harvesterInfoSubviewIsActive =
    false;

  producerInfoPanel?.classList.remove(
    "harvester-info-view-active"
  );

  if (harvesterInfoView) {
    harvesterInfoView.hidden =
      true;
  }

  if (producerInfoPreviousButton) {
    producerInfoPreviousButton.hidden =
      false;
  }

  if (producerInfoNextButton) {
    producerInfoNextButton.hidden =
      false;
  }

  if (
    typeof updateProducerInfoNavigationButtons ===
    "function"
  ) {
    updateProducerInfoNavigationButtons();
  }

  updateHarvesterInfoAvailability();

  if (
    restoreFocus &&
    !producerInfoHarvesterButton?.hidden
  ) {
    producerInfoHarvesterButton.focus({
      preventScroll: true
    });
  }
}

/* ==========================================================
   8. COLLECTION FEEDBACK
========================================================== */

function showHarvesterCollectionFeedback(
  meatCollected
) {
  const normalizedAmount =
    Math.max(
      0,
      Number(meatCollected) || 0
    );

  if (normalizedAmount <= 0) {
    return;
  }

  const formattedAmount =
    `${formatMeat(
      normalizedAmount
    )} MEAT COLLECTED`;

  if (
    harvesterCollectionNotice &&
    harvesterCollectionAmount
  ) {
    window.clearTimeout(
      harvesterCollectionNoticeTimer
    );

    harvesterCollectionAmount
      .textContent =
        formattedAmount;

    harvesterCollectionNotice.hidden =
      false;

    harvesterCollectionNotice.classList
      .remove(
        "harvester-collection-notice-visible"
      );

    void harvesterCollectionNotice
      .offsetWidth;

    harvesterCollectionNotice.classList
      .add(
        "harvester-collection-notice-visible"
      );

    harvesterCollectionNoticeTimer =
      window.setTimeout(
        () => {
          harvesterCollectionNotice
            .classList
            .remove(
              "harvester-collection-notice-visible"
            );

          harvesterCollectionNotice.hidden =
            true;
        },
        HARVESTER_COLLECTION_NOTICE_DURATION_MS
      );
  }

  if (
    harvesterInfoCollectionResult &&
    harvesterInfoSubviewIsActive
  ) {
    harvesterInfoCollectionResult
      .textContent =
        formattedAmount;

    harvesterInfoCollectionResult.hidden =
      false;
  }
}

/* ==========================================================
   9. HARVESTER INFO INPUT
========================================================== */

producerInfoHarvesterButton
  ?.addEventListener(
    "click",
    openHarvesterInfoSubview
  );

harvesterInfoBackButton
  ?.addEventListener(
    "click",
    () => {
      resetHarvesterInfoSubview();
    }
  );

harvesterInfoRetractButton
  ?.addEventListener(
    "click",
    () => {
      document.dispatchEvent(
        new CustomEvent(
          "harvester:retract-requested"
        )
      );

      updateHarvesterInfoView();
    }
  );

document.addEventListener(
  "harvester:deployed",
  () => {
    if (harvesterInfoCollectionResult) {
      harvesterInfoCollectionResult.hidden =
        true;
    }

    updateHarvesterInfoView();
  }
);

document.addEventListener(
  "harvester:retracted",
  (event) => {
    showHarvesterCollectionFeedback(
      event.detail?.meatCollected
    );

    updateHarvesterInfoView();
  }
);

document.addEventListener(
  "harvester:depleted",
  () => {
    updateHarvesterInfoView();
  }
);

producerInfoDialog
  ?.addEventListener(
    "close",
    () => {
      resetHarvesterInfoSubview(
        false
      );

      if (harvesterInfoCollectionResult) {
        harvesterInfoCollectionResult.hidden =
          true;
      }
    }
  );

/* ==========================================================
   10. HARVESTER INFO LIVE REFRESH
========================================================== */

window.setInterval(
  () => {
    if (
      producerInfoDialog?.open &&
      harvesterInfoSubviewIsActive
    ) {
      updateHarvesterInfoView();
    }
  },
  PRODUCER_INFO_REFRESH_RATE
);
