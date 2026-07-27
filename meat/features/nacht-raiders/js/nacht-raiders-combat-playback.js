/* ==========================================================
   1. COMBAT PLAYBACK RUNTIME
========================================================== */

let nachtRaidersCombatPlaybackRunId = 0;
let nachtRaidersCombatPlaybackActive = false;
let nachtRaidersCombatPlaybackLastAction = 0;

const nachtRaidersCombatPlaybackTimeoutIds = new Set();

/* ==========================================================
   2. PLAYBACK STATUS
========================================================== */

function isNachtRaidersCombatPlaybackActive() {
  return nachtRaidersCombatPlaybackActive;
}

function scheduleNachtRaidersCombatPlayback(
  callback,
  delayMs,
  runId
) {
  const timeoutId = window.setTimeout(
    () => {
      nachtRaidersCombatPlaybackTimeoutIds.delete(timeoutId);

      if (
        runId !==
        nachtRaidersCombatPlaybackRunId
      ) {
        return;
      }

      callback();
    },
    Math.max(
      0,
      Math.floor(Number(delayMs) || 0)
    )
  );

  nachtRaidersCombatPlaybackTimeoutIds.add(timeoutId);

  return timeoutId;
}

/* ==========================================================
   3. ENTITY STATE
========================================================== */

function clearNachtRaidersCombatEntityClasses() {
  nachtRaidersOperativeEntity?.classList.remove(
    "is-attacking",
    "is-hit",
    "is-defeated"
  );

  nachtRaidersEnemyEntity?.classList.remove(
    "is-attacking",
    "is-hit",
    "is-defeated"
  );
}

function setNachtRaidersPlaybackOperativeHealth(
  currentHealth,
  maximumHealth
) {
  const normalizedMaximum =
    Math.max(
      1,
      Math.floor(Number(maximumHealth) || 1)
    );

  const normalizedCurrent =
    Math.min(
      normalizedMaximum,
      Math.max(
        0,
        Math.floor(Number(currentHealth) || 0)
      )
    );

  if (nachtRaidersGameHealthText) {
    nachtRaidersGameHealthText.textContent =
      `${formatNachtRaidersGameValue(
        normalizedCurrent
      )} / ${formatNachtRaidersGameValue(
        normalizedMaximum
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersGameHealthFill,
    normalizedCurrent /
      normalizedMaximum,
    normalizedCurrent /
      normalizedMaximum <= 0.25
  );
}

function setNachtRaidersPlaybackEnemyHealth(
  currentHealth,
  maximumHealth
) {
  const normalizedMaximum =
    Math.max(
      1,
      Math.floor(Number(maximumHealth) || 1)
    );

  const normalizedCurrent =
    Math.min(
      normalizedMaximum,
      Math.max(
        0,
        Math.floor(Number(currentHealth) || 0)
      )
    );

  if (nachtRaidersEnemyHealthText) {
    nachtRaidersEnemyHealthText.textContent =
      `${formatNachtRaidersGameValue(
        normalizedCurrent
      )} / ${formatNachtRaidersGameValue(
        normalizedMaximum
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersEnemyHealthFill,
    normalizedCurrent /
      normalizedMaximum
  );
}

/* ==========================================================
   4. PLAYBACK CANCELLATION
========================================================== */

function cancelNachtRaidersCombatPlayback(
  restoreTravelState = true
) {
  nachtRaidersCombatPlaybackRunId += 1;
  nachtRaidersCombatPlaybackActive = false;
  nachtRaidersCombatPlaybackLastAction = 0;

  for (
    const timeoutId of
    nachtRaidersCombatPlaybackTimeoutIds
  ) {
    window.clearTimeout(timeoutId);
  }

  nachtRaidersCombatPlaybackTimeoutIds.clear();

  nachtRaidersGameScreen?.classList.remove(
    "is-combat-active"
  );

  clearNachtRaidersCombatEntityClasses();

  if (nachtRaidersEnemyEntity) {
    nachtRaidersEnemyEntity.hidden = true;
  }

  if (restoreTravelState) {
    applyNachtRaidersVisualAsset(
      nachtRaidersOperativeVisual,
      nachtRaidersOperativePlaceholder,
      "operative",
      NACHT_RAIDERS_ANIMATION_WALK
    );
  }
}

/* ==========================================================
   5. ACTION FEEDBACK
========================================================== */

function resetNachtRaidersCombatActionVisuals(
  actionSequence,
  runId,
  enemyAssetKey
) {
  if (
    runId !==
      nachtRaidersCombatPlaybackRunId ||
    actionSequence !==
      nachtRaidersCombatPlaybackLastAction
  ) {
    return;
  }

  nachtRaidersOperativeEntity?.classList.remove(
    "is-attacking",
    "is-hit"
  );

  nachtRaidersEnemyEntity?.classList.remove(
    "is-attacking",
    "is-hit"
  );

  applyNachtRaidersVisualAsset(
    nachtRaidersOperativeVisual,
    nachtRaidersOperativePlaceholder,
    "operative",
    NACHT_RAIDERS_ANIMATION_WALK
  );

  applyNachtRaidersVisualAsset(
    nachtRaidersEnemyVisual,
    nachtRaidersEnemyPlaceholder,
    enemyAssetKey,
    NACHT_RAIDERS_ANIMATION_IDLE
  );
}

function applyNachtRaidersCombatPlaybackAction(
  action,
  combatResult,
  runId
) {
  if (
    runId !==
    nachtRaidersCombatPlaybackRunId
  ) {
    return;
  }

  nachtRaidersCombatPlaybackLastAction =
    action.sequence;

  clearNachtRaidersCombatEntityClasses();

  const operativeIsAttacking =
    action.actor ===
    NACHT_RAIDERS_COMBAT_ACTOR_OPERATIVE;

  if (operativeIsAttacking) {
    nachtRaidersOperativeEntity?.classList.add(
      "is-attacking"
    );

    nachtRaidersEnemyEntity?.classList.add(
      "is-hit"
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersOperativeVisual,
      nachtRaidersOperativePlaceholder,
      "operative",
      NACHT_RAIDERS_ANIMATION_ATTACK
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersEnemyVisual,
      nachtRaidersEnemyPlaceholder,
      combatResult.enemy.assetKey,
      NACHT_RAIDERS_ANIMATION_HURT
    );

    setNachtRaidersPlaybackEnemyHealth(
      action.targetHealth,
      combatResult.enemy.maxHealth
    );

    nachtRaidersGameEventText.textContent =
      `OPERATIVE DEALT ${formatNachtRaidersGameValue(
        action.damage
      )} DAMAGE`;
  } else {
    nachtRaidersEnemyEntity?.classList.add(
      "is-attacking"
    );

    nachtRaidersOperativeEntity?.classList.add(
      "is-hit"
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersEnemyVisual,
      nachtRaidersEnemyPlaceholder,
      combatResult.enemy.assetKey,
      NACHT_RAIDERS_ANIMATION_ATTACK
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersOperativeVisual,
      nachtRaidersOperativePlaceholder,
      "operative",
      NACHT_RAIDERS_ANIMATION_HURT
    );

    setNachtRaidersPlaybackOperativeHealth(
      action.targetHealth,
      combatResult.operative.maxHealth
    );

    nachtRaidersGameEventText.textContent =
      `${String(
        combatResult.enemy.name
      ).toUpperCase()} DEALT ${formatNachtRaidersGameValue(
        action.damage
      )} DAMAGE`;
  }

  scheduleNachtRaidersCombatPlayback(
    () => {
      resetNachtRaidersCombatActionVisuals(
        action.sequence,
        runId,
        combatResult.enemy.assetKey
      );
    },
    NACHT_RAIDERS_COMBAT_PLAYBACK_SETTINGS
      .actionCueMs,
    runId
  );
}

/* ==========================================================
   6. COMBAT OUTCOME
========================================================== */

function showNachtRaidersCombatPlaybackOutcome(
  combatResult,
  runId
) {
  if (
    runId !==
    nachtRaidersCombatPlaybackRunId
  ) {
    return;
  }

  clearNachtRaidersCombatEntityClasses();

  if (
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_VICTORY
  ) {
    nachtRaidersEnemyEntity?.classList.add(
      "is-defeated"
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersEnemyVisual,
      nachtRaidersEnemyPlaceholder,
      combatResult.enemy.assetKey,
      NACHT_RAIDERS_ANIMATION_DEATH
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersOperativeVisual,
      nachtRaidersOperativePlaceholder,
      "operative",
      NACHT_RAIDERS_ANIMATION_WALK
    );

    nachtRaidersGameEventType.textContent =
      "HOSTILE CONTACT";

    nachtRaidersGameEventText.textContent =
      `${String(
        combatResult.enemy.name
      ).toUpperCase()} TERMINATED`;

    return;
  }

  if (
    combatResult.outcome ===
    NACHT_RAIDERS_COMBAT_OUTCOME_OPERATIVE_DEATH
  ) {
    nachtRaidersOperativeEntity?.classList.add(
      "is-defeated"
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersOperativeVisual,
      nachtRaidersOperativePlaceholder,
      "operative",
      NACHT_RAIDERS_ANIMATION_DEATH
    );

    applyNachtRaidersVisualAsset(
      nachtRaidersEnemyVisual,
      nachtRaidersEnemyPlaceholder,
      combatResult.enemy.assetKey,
      NACHT_RAIDERS_ANIMATION_IDLE
    );

    nachtRaidersGameEventType.textContent =
      "TEMPORAL FAILURE";

    nachtRaidersGameEventText.textContent =
      "ECHO LOST // OPERATIVE RECONSTRUCTING";

    return;
  }

  nachtRaidersGameEventType.textContent =
    "HOSTILE CONTACT";

  nachtRaidersGameEventText.textContent =
    "ENGAGEMENT TERMINATED WITHOUT RESOLUTION";
}

/* ==========================================================
   7. COMPLETE TIMELINE PLAYBACK
========================================================== */

function playNachtRaidersCombatTimeline(
  combatResult,
  onComplete = null
) {
   
  if (
    !combatResult ||
    !Array.isArray(combatResult.actions)
  ) {
    return false;
  }

  cancelNachtRaidersCombatPlayback(false);

  const runId =
    nachtRaidersCombatPlaybackRunId;

  nachtRaidersCombatPlaybackActive = true;

  nachtRaidersGameScreen?.classList.add(
    "is-combat-active"
  );

  if (nachtRaidersEnemyEntity) {
    nachtRaidersEnemyEntity.hidden = false;
  }

  if (nachtRaidersEnemyName) {
    nachtRaidersEnemyName.textContent =
      combatResult.enemy.name ||
      combatResult.enemy.id ||
      "HOSTILE";
  }

  setNachtRaidersPlaybackOperativeHealth(
    combatResult.operative.startingHealth,
    combatResult.operative.maxHealth
  );

  setNachtRaidersPlaybackEnemyHealth(
    combatResult.enemy.startingHealth,
    combatResult.enemy.maxHealth
  );

  applyNachtRaidersVisualAsset(
    nachtRaidersOperativeVisual,
    nachtRaidersOperativePlaceholder,
    "operative",
    NACHT_RAIDERS_ANIMATION_WALK
  );

  applyNachtRaidersVisualAsset(
    nachtRaidersEnemyVisual,
    nachtRaidersEnemyPlaceholder,
    combatResult.enemy.assetKey,
    NACHT_RAIDERS_ANIMATION_IDLE
  );

  nachtRaidersGameEventType.textContent =
    "HOSTILE CONTACT";

  nachtRaidersGameEventText.textContent =
    `${String(
      combatResult.enemy.name
    ).toUpperCase()} ENGAGED`;

  for (
    const action of
    combatResult.actions
  ) {
    scheduleNachtRaidersCombatPlayback(
      () => {
        applyNachtRaidersCombatPlaybackAction(
          action,
          combatResult,
          runId
        );
      },
      action.occurredAtMs *
        NACHT_RAIDERS_COMBAT_PLAYBACK_SETTINGS
          .timeScale,
      runId
    );
  }

  const outcomeDelayMs =
    combatResult.durationMs *
      NACHT_RAIDERS_COMBAT_PLAYBACK_SETTINGS
        .timeScale +
    NACHT_RAIDERS_COMBAT_PLAYBACK_SETTINGS
      .actionCueMs;

  scheduleNachtRaidersCombatPlayback(
    () => {
      showNachtRaidersCombatPlaybackOutcome(
        combatResult,
        runId
      );
    },
    outcomeDelayMs,
    runId
  );

    scheduleNachtRaidersCombatPlayback(
    () => {
      cancelNachtRaidersCombatPlayback(true);
      renderNachtRaidersGameState();

      nachtRaidersGameEventType.textContent =
        "TRAVEL";

      nachtRaidersGameEventText.textContent =
        "OPERATIVE ADVANCING";

      if (typeof onComplete === "function") {
        onComplete(combatResult);
      }

      document.dispatchEvent(
        new CustomEvent("nacht-raiders:combat-playback-completed", {
          detail: {
            combatResult
          }
        })
      );
    },
    outcomeDelayMs +
      NACHT_RAIDERS_COMBAT_PLAYBACK_SETTINGS
        .outcomeHoldMs,
    runId
  );

  return true;
}
