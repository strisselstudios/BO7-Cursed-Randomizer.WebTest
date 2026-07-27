/* ==========================================================
   1. DISPLAY UTILITIES
========================================================== */

function isNachtRaidersGameDisplayVisible() {
  return (
    typeof isNachtRaidersWindowOpen === "function" &&
    isNachtRaidersWindowOpen() &&
    nachtRaidersWindow?.dataset.nachtRaidersScreen ===
      NACHT_RAIDERS_SCREEN_GAME &&
    !nachtRaidersGameScreen?.hidden
  );
}

function formatNachtRaidersGameValue(value) {
  return Math.max(
    0,
    Math.floor(Number(value) || 0)
  ).toLocaleString();
}

function normalizeNachtRaidersGameRatio(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? Math.min(1, Math.max(0, numericValue))
    : 0;
}

function updateNachtRaidersGameMeter(
  fillElement,
  ratio,
  isCritical = false
) {
  if (!fillElement) return;

  const normalizedRatio =
    normalizeNachtRaidersGameRatio(
      ratio
    );

  fillElement.style.width =
    `${normalizedRatio * 100}%`;

  fillElement.classList.toggle(
    "is-critical",
    isCritical
  );

  fillElement.parentElement?.setAttribute(
    "aria-valuenow",
    String(
      Math.round(
        normalizedRatio * 100
      )
    )
  );
}

/* ==========================================================
   2. EXPEDITION STATE DISPLAY
========================================================== */

function renderNachtRaidersGameState() {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();
  const zoneId =
    nachtRaidersState.expedition.zoneId ||
    NACHT_RAIDERS_STARTING_ZONE_ID;

  renderNachtRaidersEnvironment(zoneId);

  const operative =
    nachtRaidersState.operative;

  const healthRatio =
    operative.maxHealth > 0
      ? operative.health /
        operative.maxHealth
      : 0;

  const levelProgress =
    getNachtRaidersLevelProgress(
      operative.xp
    );

  const travelUnits =
    NACHT_RAIDERS_TRAVEL_SETTINGS
      .unitsPerDepth;

  const travelProgress =
    nachtRaidersState.expedition
      .travelProgress;

  const travelRatio =
    travelUnits > 0
      ? travelProgress /
        travelUnits
      : 0;

    if (nachtRaidersGameZone) {
    nachtRaidersGameZone.textContent =
      getNachtRaidersZoneDisplayLabel(zoneId);
  }
   
  if (nachtRaidersGameDepth) {
    nachtRaidersGameDepth.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.expedition.zoneDepth
      );
  }

  if (nachtRaidersGameCycle) {
    nachtRaidersGameCycle.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.cycleCount
      );
  }

  if (nachtRaidersGameLevel) {
    nachtRaidersGameLevel.textContent =
      formatNachtRaidersGameValue(
        operative.level
      );
  }

  if (nachtRaidersGameHealthText) {
    nachtRaidersGameHealthText.textContent =
      `${formatNachtRaidersGameValue(
        operative.health
      )} / ${formatNachtRaidersGameValue(
        operative.maxHealth
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersGameHealthFill,
    healthRatio,
    healthRatio <= 0.25
  );

  if (nachtRaidersGameXpText) {
    nachtRaidersGameXpText.textContent =
      levelProgress.isMaximumLevel
        ? "MAXIMUM LEVEL"
        : `${formatNachtRaidersGameValue(
            levelProgress.xpIntoLevel
          )} / ${formatNachtRaidersGameValue(
            levelProgress.xpRequired
          )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersGameXpFill,
    levelProgress.progress
  );

  if (nachtRaidersGameTravelText) {
    nachtRaidersGameTravelText.textContent =
      `${formatNachtRaidersGameValue(
        travelProgress
      )} / ${formatNachtRaidersGameValue(
        travelUnits
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersGameTravelFill,
    travelRatio
  );

  if (nachtRaidersGameSalvage) {
    nachtRaidersGameSalvage.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.resources.salvage
      );
  }

  if (nachtRaidersGameAetherResidue) {
    nachtRaidersGameAetherResidue.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.resources.aetherResidue
      );
  }

  if (nachtRaidersGameFieldData) {
    nachtRaidersGameFieldData.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.resources.fieldData
      );
  }

  if (nachtRaidersGameRelicFragments) {
    nachtRaidersGameRelicFragments.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.resources.relicFragments
      );
  }

    const combatPlaybackActive =
    typeof isNachtRaidersCombatPlaybackActive ===
      "function" &&
    isNachtRaidersCombatPlaybackActive();

  const presentationBusy =
    typeof isNachtRaidersPresentationBusy ===
      "function" &&
    isNachtRaidersPresentationBusy();

    if (!combatPlaybackActive && !presentationBusy) {
    applyNachtRaidersVisualAsset(
      nachtRaidersOperativeVisual,
      nachtRaidersOperativePlaceholder,
      "operative",
      NACHT_RAIDERS_ANIMATION_WALK
    );
  }

  if (
    typeof renderNachtRaidersCompactMonitorState ===
      "function"
  ) {
    renderNachtRaidersCompactMonitorState(
      nachtRaidersState
    );
  }

  if (
    typeof renderNachtRaidersTerminalState ===
      "function"
  ) {
    renderNachtRaidersTerminalState();
  }

  return nachtRaidersState;
}

/* ==========================================================
   3. SIMULATION STATUS
========================================================== */

function updateNachtRaidersGameSimulationStatus(
  summary
) {
  if (!summary) return;

  if (
    Array.isArray(summary.presentationEvents) &&
    summary.presentationEvents.length > 0 &&
    typeof enqueueNachtRaidersPresentationEvents === "function"
  ) {
    enqueueNachtRaidersPresentationEvents(
      summary.presentationEvents
    );

    return;
  }

  if (
    summary.lastEncounter &&
    typeof playNachtRaidersCombatTimeline ===
      "function"
  ) {
    playNachtRaidersCombatTimeline(
      summary.lastEncounter
    );

    return;
  }

  if (summary.incidentsGenerated > 0) {
    nachtRaidersGameEventType.textContent =
      "FIELD INCIDENT";

    nachtRaidersGameEventText.textContent =
      `${summary.incidentsGenerated} INCIDENT${
        summary.incidentsGenerated === 1
          ? ""
          : "S"
      } RECORDED`;

    return;
  }

  if (summary.depthGained > 0) {
    nachtRaidersGameEventType.textContent =
      "TRAVEL";

    nachtRaidersGameEventText.textContent =
      `DEPTH ${formatNachtRaidersGameValue(
        summary.endingZoneDepth
      )} REACHED`;

    return;
  }

  nachtRaidersGameEventType.textContent =
    "TRAVEL";

  nachtRaidersGameEventText.textContent =
    "OPERATIVE ADVANCING";
}

/* ==========================================================
   4. COMPLETE DISPLAY UPDATE
========================================================== */

function renderNachtRaidersGameDisplay(
  summary = null
) {
  renderNachtRaidersGameState();

  if (summary) {
    updateNachtRaidersGameSimulationStatus(
      summary
    );
  }

  return true;
}

/* ==========================================================
   5. DISPLAY EVENTS
========================================================== */

document.addEventListener(
  "nacht-raiders:game-stage-entered",
  () => {
    if (
      typeof cancelNachtRaidersCombatPlayback ===
      "function"
    ) {
      cancelNachtRaidersCombatPlayback(true);
    }

    renderNachtRaidersGameDisplay();

    nachtRaidersGameEventType.textContent =
      "TRAVEL";

    nachtRaidersGameEventText.textContent =
      "EXPEDITION LINK ACTIVE";
  }
);

document.addEventListener(
  "nacht-raiders:simulation-completed",
  (event) => {
    if (!isNachtRaidersGameDisplayVisible()) return;

    renderNachtRaidersGameDisplay(
      event.detail
    );
  }
);

document.addEventListener(
  "nacht-raiders:screen-changed",
  (event) => {
    if (
      event.detail?.screen ===
      NACHT_RAIDERS_SCREEN_GAME
    ) {
      renderNachtRaidersGameDisplay();

      return;
    }

    if (
      typeof cancelNachtRaidersCombatPlayback ===
      "function"
    ) {
      cancelNachtRaidersCombatPlayback(true);
    }
  }
);

document.addEventListener(
  "nacht-raiders:closed",
  () => {
    if (
      typeof cancelNachtRaidersCombatPlayback ===
      "function"
    ) {
      cancelNachtRaidersCombatPlayback(true);
    }
  }
);
