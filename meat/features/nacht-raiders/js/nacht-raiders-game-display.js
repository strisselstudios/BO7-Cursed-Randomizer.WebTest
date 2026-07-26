/* ==========================================================
   1. DISPLAY RUNTIME STATE
========================================================== */

let nachtRaidersEncounterPreviewTimeoutId = null;

/* ==========================================================
   2. DISPLAY UTILITIES
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

  const meter =
    fillElement.parentElement;

  meter?.setAttribute(
    "aria-valuenow",
    String(
      Math.round(
        normalizedRatio * 100
      )
    )
  );
}

/* ==========================================================
   3. VISUAL ASSET APPLICATION
========================================================== */

function clearNachtRaidersVisualAsset(visualElement) {
  if (!visualElement) return;

  visualElement.classList.remove("has-sprite");
  visualElement.style.removeProperty("background-image");
  visualElement.style.removeProperty("--nacht-raiders-frame-count");
  visualElement.style.removeProperty("--nacht-raiders-frame-width");
  visualElement.style.removeProperty("--nacht-raiders-frame-height");
}

function applyNachtRaidersVisualAsset(
  visualElement,
  placeholderElement,
  assetId,
  animationName
) {
  if (!visualElement) return false;

  const asset =
    getNachtRaidersAssetDefinition(
      assetId
    );

  const animation =
    getNachtRaidersAnimationDefinition(
      assetId,
      animationName
    );

  visualElement.dataset.assetKey =
    assetId || "";

  visualElement.dataset.animation =
    animationName || "";

  if (placeholderElement) {
    placeholderElement.textContent =
      asset?.placeholder || "?";
  }

  if (!asset || !animation?.src) {
    clearNachtRaidersVisualAsset(
      visualElement
    );

    return false;
  }

  visualElement.style.backgroundImage =
    `url("${animation.src}")`;

  visualElement.style.setProperty(
    "--nacht-raiders-frame-count",
    String(animation.frameCount)
  );

  visualElement.style.setProperty(
    "--nacht-raiders-frame-width",
    String(animation.frameWidth)
  );

  visualElement.style.setProperty(
    "--nacht-raiders-frame-height",
    String(animation.frameHeight)
  );

  visualElement.classList.add(
    "has-sprite"
  );

  return true;
}

/* ==========================================================
   4. EXPEDITION STATE DISPLAY
========================================================== */

function renderNachtRaidersGameState() {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

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
      String(
        nachtRaidersState.expedition
          .zoneId ||
        NACHT_RAIDERS_STARTING_ZONE_ID
      ).toUpperCase();
  }

  if (nachtRaidersGameDepth) {
    nachtRaidersGameDepth.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.expedition
          .zoneDepth
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
        nachtRaidersState.resources
          .salvage
      );
  }

  if (nachtRaidersGameAetherResidue) {
    nachtRaidersGameAetherResidue.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.resources
          .aetherResidue
      );
  }

  if (nachtRaidersGameFieldData) {
    nachtRaidersGameFieldData.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.resources
          .fieldData
      );
  }

  if (nachtRaidersGameRelicFragments) {
    nachtRaidersGameRelicFragments.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.resources
          .relicFragments
      );
  }

  applyNachtRaidersVisualAsset(
    nachtRaidersOperativeVisual,
    nachtRaidersOperativePlaceholder,
    "operative",
    NACHT_RAIDERS_ANIMATION_WALK
  );

  return nachtRaidersState;
}

/* ==========================================================
   5. ENCOUNTER PREVIEW
========================================================== */

function clearNachtRaidersEncounterPreview() {
  if (
    nachtRaidersEncounterPreviewTimeoutId !==
    null
  ) {
    window.clearTimeout(
      nachtRaidersEncounterPreviewTimeoutId
    );

    nachtRaidersEncounterPreviewTimeoutId =
      null;
  }

  if (nachtRaidersEnemyEntity) {
    nachtRaidersEnemyEntity.hidden = true;
  }

  applyNachtRaidersVisualAsset(
    nachtRaidersOperativeVisual,
    nachtRaidersOperativePlaceholder,
    "operative",
    NACHT_RAIDERS_ANIMATION_WALK
  );
}

function showNachtRaidersEncounterPreview(
  combatResult
) {
  if (!combatResult) return false;

  clearNachtRaidersEncounterPreview();

  const enemy =
    combatResult.enemy;

  if (!enemy) return false;

  if (nachtRaidersEnemyEntity) {
    nachtRaidersEnemyEntity.hidden = false;
  }

  if (nachtRaidersEnemyName) {
    nachtRaidersEnemyName.textContent =
      enemy.name ||
      enemy.id ||
      "HOSTILE";
  }

  if (nachtRaidersEnemyHealthText) {
    nachtRaidersEnemyHealthText.textContent =
      `${formatNachtRaidersGameValue(
        enemy.endingHealth
      )} / ${formatNachtRaidersGameValue(
        enemy.maxHealth
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersEnemyHealthFill,
    enemy.maxHealth > 0
      ? enemy.endingHealth /
        enemy.maxHealth
      : 0
  );

  const enemyAnimation =
    combatResult.outcome ===
      NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY
      ? NACHT_RAIDERS_ANIMATION_DEATH
      : NACHT_RAIDERS_ANIMATION_ATTACK;

  const operativeAnimation =
    combatResult.outcome ===
      NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH
      ? NACHT_RAIDERS_ANIMATION_DEATH
      : NACHT_RAIDERS_ANIMATION_ATTACK;

  applyNachtRaidersVisualAsset(
    nachtRaidersEnemyVisual,
    nachtRaidersEnemyPlaceholder,
    enemy.assetKey || enemy.id,
    enemyAnimation
  );

  applyNachtRaidersVisualAsset(
    nachtRaidersOperativeVisual,
    nachtRaidersOperativePlaceholder,
    "operative",
    operativeAnimation
  );

  if (
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY
  ) {
    nachtRaidersGameEventType.textContent =
      "HOSTILE CONTACT";

    nachtRaidersGameEventText.textContent =
      `${String(
        enemy.name ||
        enemy.id
      ).toUpperCase()} TERMINATED`;
  } else if (
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH
  ) {
    nachtRaidersGameEventType.textContent =
      "TEMPORAL FAILURE";

    nachtRaidersGameEventText.textContent =
      "OPERATIVE RECONSTRUCTED // CYCLE CONTINUES";
  } else {
    nachtRaidersGameEventType.textContent =
      "HOSTILE CONTACT";

    nachtRaidersGameEventText.textContent =
      "ENGAGEMENT TERMINATED WITHOUT RESOLUTION";
  }

  nachtRaidersEncounterPreviewTimeoutId =
    window.setTimeout(
      () => {
        clearNachtRaidersEncounterPreview();

        if (nachtRaidersGameEventType) {
          nachtRaidersGameEventType.textContent =
            "TRAVEL";
        }

        if (nachtRaidersGameEventText) {
          nachtRaidersGameEventText.textContent =
            "OPERATIVE ADVANCING";
        }
      },
      4500
    );

  return true;
}

/* ==========================================================
   6. SIMULATION STATUS
========================================================== */

function updateNachtRaidersGameSimulationStatus(
  summary
) {
  if (!summary) return;

  if (summary.lastEncounter) {
    showNachtRaidersEncounterPreview(
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
   7. COMPLETE DISPLAY UPDATE
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
   8. DISPLAY EVENTS
========================================================== */

document.addEventListener(
  "nacht-raiders:game-stage-entered",
  () => {
    clearNachtRaidersEncounterPreview();
    renderNachtRaidersGameDisplay();

    if (nachtRaidersGameEventType) {
      nachtRaidersGameEventType.textContent =
        "TRAVEL";
    }

    if (nachtRaidersGameEventText) {
      nachtRaidersGameEventText.textContent =
        "EXPEDITION LINK ACTIVE";
    }
  }
);

document.addEventListener(
  "nacht-raiders:simulation-completed",
  (event) => {
    if (!isNachtRaidersGameDisplayVisible()) {
      return;
    }

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
      event.detail?.screen !==
      NACHT_RAIDERS_SCREEN_GAME
    ) {
      clearNachtRaidersEncounterPreview();
    }
  }
);

document.addEventListener(
  "nacht-raiders:closed",
  clearNachtRaidersEncounterPreview
);
