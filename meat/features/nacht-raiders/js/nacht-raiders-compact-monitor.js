/* ==========================================================
   1. COMPACT MONITOR STATE DISPLAY
========================================================== */

function updateNachtRaidersCompactOperativeHealth(
  currentHealth,
  maximumHealth
) {
  const normalizedMaximum =
    Math.max(
      1,
      Math.floor(
        Number(maximumHealth) || 1
      )
    );

  const normalizedCurrent =
    Math.min(
      normalizedMaximum,
      Math.max(
        0,
        Math.floor(
          Number(currentHealth) || 0
        )
      )
    );

  if (nachtRaidersCompactHealthText) {
    nachtRaidersCompactHealthText.textContent =
      `${formatNachtRaidersGameValue(
        normalizedCurrent
      )} / ${formatNachtRaidersGameValue(
        normalizedMaximum
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersCompactHealthFill,
    normalizedCurrent /
      normalizedMaximum,
    normalizedCurrent /
      normalizedMaximum <= 0.25
  );
}

function renderNachtRaidersCompactMonitorState(
  nachtRaidersState =
    ensureNachtRaidersFeatureState()
) {
  if (!nachtRaidersState) {
    return false;
  }

  const operative =
    nachtRaidersState.operative;

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

  updateNachtRaidersCompactOperativeHealth(
    operative.health,
    operative.maxHealth
  );

  if (nachtRaidersCompactXpText) {
    nachtRaidersCompactXpText.textContent =
      levelProgress.isMaximumLevel
        ? "MAXIMUM LEVEL"
        : `${formatNachtRaidersGameValue(
            levelProgress.xpIntoLevel
          )} / ${formatNachtRaidersGameValue(
            levelProgress.xpRequired
          )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersCompactXpFill,
    levelProgress.progress
  );

  if (nachtRaidersCompactTravelText) {
    nachtRaidersCompactTravelText.textContent =
      `${formatNachtRaidersGameValue(
        travelProgress
      )} / ${formatNachtRaidersGameValue(
        travelUnits
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersCompactTravelFill,
    travelUnits > 0
      ? travelProgress /
        travelUnits
      : 0
  );

  return true;
}

/* ==========================================================
   2. COMPACT FEEDBACK ACCESS
========================================================== */

function isNachtRaidersCompactMonitorVisible() {
  return Boolean(
    isNachtRaidersWindowOpen() &&
    getNachtRaidersWindowMode() ===
      NACHT_RAIDERS_WINDOW_MODE_COMPACT &&
    nachtRaidersWindow?.dataset
      .nachtRaidersScreen ===
      NACHT_RAIDERS_SCREEN_GAME
  );
}

function clearNachtRaidersCompactFeedback() {
  nachtRaidersCompactFeedback
    ?.replaceChildren();
}

/* ==========================================================
   3. COMPACT FEEDBACK CREATION
========================================================== */

function showNachtRaidersCompactFeedback(
  text,
  feedbackType = "reward"
) {
  if (
    !nachtRaidersCompactFeedback ||
    !isNachtRaidersCompactMonitorVisible() ||
    typeof text !== "string" ||
    !text.trim()
  ) {
    return false;
  }

  const feedbackElement =
    document.createElement(
      "span"
    );

  feedbackElement.className =
    "nacht-raiders-compact-feedback-item";

  if (feedbackType === "level") {
    feedbackElement.classList.add(
      "is-level"
    );
  }

  if (feedbackType === "rare") {
    feedbackElement.classList.add(
      "is-rare"
    );
  }

  feedbackElement.textContent =
    text.trim();

  nachtRaidersCompactFeedback.append(
    feedbackElement
  );

  while (
    nachtRaidersCompactFeedback
      .childElementCount > 4
  ) {
    nachtRaidersCompactFeedback
      .firstElementChild
      ?.remove();
  }

  window.setTimeout(
    () => {
      feedbackElement.remove();
    },
    1600
  );

  return true;
}

/* ==========================================================
   4. REWARD FEEDBACK
========================================================== */

function showNachtRaidersCompactRewardFeedback(
  rewards,
  levelsGained = 0
) {
  if (!isNachtRaidersCompactMonitorVisible()) {
    return 0;
  }

  let displayedCount = 0;

  if (
    Math.max(
      0,
      Math.floor(
        Number(levelsGained) || 0
      )
    ) > 0
  ) {
    showNachtRaidersCompactFeedback(
      "LEVEL UP",
      "level"
    );

    displayedCount += 1;
  }

  for (
    const rewardKey of
    NACHT_RAIDERS_REWARD_KEYS
  ) {
    const amount =
      Math.max(
        0,
        Math.floor(
          Number(
            rewards?.[rewardKey]
          ) || 0
        )
      );

    if (amount <= 0) {
      continue;
    }

    const definition =
      getNachtRaidersRewardDefinition(
        rewardKey
      );

    const label =
      definition?.label ||
      rewardKey.toUpperCase();

    const feedbackType =
      rewardKey === "relicFragments" ||
      rewardKey === "aetherResidue"
        ? "rare"
        : "reward";

    window.setTimeout(
      () => {
        showNachtRaidersCompactFeedback(
          `+${formatNachtRaidersGameValue(
            amount
          )} ${label}`,
          feedbackType
        );
      },
      displayedCount * 170
    );

    displayedCount += 1;
  }

  return displayedCount;
}

/* ==========================================================
   5. PRESENTATION EVENT FEEDBACK
========================================================== */

function handleNachtRaidersCompactPresentationCompletion(
  event
) {
  const presentationEvent =
    event.detail?.presentationEvent;

  if (!presentationEvent) {
    return;
  }

  if (
    presentationEvent.type ===
    NACHT_RAIDERS_PRESENTATION_EVENT_INCIDENT
  ) {
    showNachtRaidersCompactRewardFeedback(
      presentationEvent.record?.rewards,
      0
    );

    return;
  }

  if (
    presentationEvent.type ===
    NACHT_RAIDERS_PRESENTATION_EVENT_COMBAT
  ) {
    showNachtRaidersCompactRewardFeedback(
      presentationEvent.combatResult
        ?.rewards,

      presentationEvent.combatResult
        ?.levelsGained
    );
  }
}

/* ==========================================================
   6. COMPACT MONITOR EVENTS
========================================================== */

document.addEventListener(
  "nacht-raiders:presentation-event-completed",
  handleNachtRaidersCompactPresentationCompletion
);

document.addEventListener(
  "nacht-raiders:window-mode-changed",
  (event) => {
    if (
      event.detail?.mode ===
      NACHT_RAIDERS_WINDOW_MODE_COMPACT
    ) {
      renderNachtRaidersCompactMonitorState();

      return;
    }

    clearNachtRaidersCompactFeedback();
  }
);

document.addEventListener(
  "nacht-raiders:closed",
  clearNachtRaidersCompactFeedback
);
