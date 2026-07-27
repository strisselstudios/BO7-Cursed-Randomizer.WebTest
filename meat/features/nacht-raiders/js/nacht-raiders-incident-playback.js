/* ==========================================================
   1. INCIDENT PLAYBACK RUNTIME
========================================================== */

let nachtRaidersIncidentPlaybackRunId = 0;
let nachtRaidersIncidentPlaybackActive = false;

const nachtRaidersIncidentPlaybackTimeoutIds = new Set();

/* ==========================================================
   2. INCIDENT PLAYBACK STATUS
========================================================== */

function isNachtRaidersIncidentPlaybackActive() {
  return nachtRaidersIncidentPlaybackActive;
}

function scheduleNachtRaidersIncidentPlayback(callback, delayMs, runId) {
  const timeoutId = window.setTimeout(
    () => {
      nachtRaidersIncidentPlaybackTimeoutIds.delete(timeoutId);

      if (runId !== nachtRaidersIncidentPlaybackRunId) return;

      callback();
    },
    Math.max(0, Math.floor(Number(delayMs) || 0))
  );

  nachtRaidersIncidentPlaybackTimeoutIds.add(timeoutId);

  return timeoutId;
}

/* ==========================================================
   3. INCIDENT REWARD SUMMARY
========================================================== */

function formatNachtRaidersIncidentRewardSummary(rewards) {
  const rewardParts = [];

  for (const rewardKey of NACHT_RAIDERS_REWARD_KEYS) {
    const amount = Math.max(0, Math.floor(Number(rewards?.[rewardKey]) || 0));

    if (amount <= 0) continue;

    const definition = getNachtRaidersRewardDefinition(rewardKey);
    const label = definition?.label || rewardKey.toUpperCase();

    rewardParts.push(`+${formatNachtRaidersGameValue(amount)} ${label}`);
  }

  return rewardParts.join(" // ");
}

/* ==========================================================
   4. INCIDENT OBJECT DISPLAY
========================================================== */

function hideNachtRaidersIncidentObject() {
  if (nachtRaidersEventObject) {
    nachtRaidersEventObject.hidden = true;
  }

  clearNachtRaidersVisualAsset(nachtRaidersEventObjectVisual);
}

function showNachtRaidersIncidentObject(presentation) {
  const objectAssetKey =
    typeof presentation?.objectAssetKey === "string"
      ? presentation.objectAssetKey
      : "";

  if (!objectAssetKey) {
    hideNachtRaidersIncidentObject();
    return false;
  }

  const asset = getNachtRaidersAssetDefinition(objectAssetKey);

  if (nachtRaidersEventObject) {
    nachtRaidersEventObject.hidden = false;
  }

  if (nachtRaidersEventObjectName) {
    nachtRaidersEventObjectName.textContent =
      presentation.objectLabel ||
      asset?.label ||
      objectAssetKey.toUpperCase();
  }

  applyNachtRaidersVisualAsset(
    nachtRaidersEventObjectVisual,
    nachtRaidersEventObjectPlaceholder,
    objectAssetKey,
    NACHT_RAIDERS_ANIMATION_IDLE
  );

  return true;
}

/* ==========================================================
   5. INCIDENT PLAYBACK CANCELLATION
========================================================== */

function cancelNachtRaidersIncidentPlayback() {
  nachtRaidersIncidentPlaybackRunId += 1;
  nachtRaidersIncidentPlaybackActive = false;

  for (const timeoutId of nachtRaidersIncidentPlaybackTimeoutIds) {
    window.clearTimeout(timeoutId);
  }

  nachtRaidersIncidentPlaybackTimeoutIds.clear();
  hideNachtRaidersIncidentObject();

  if (nachtRaidersGameEventDetail) {
    nachtRaidersGameEventDetail.hidden = true;
    nachtRaidersGameEventDetail.textContent = "";
  }
}

/* ==========================================================
   6. COMPLETE INCIDENT PLAYBACK
========================================================== */

function playNachtRaidersIncidentPresentation(record, onComplete = null) {
  if (!record || record.presentation?.visualize === false) return false;

  cancelNachtRaidersIncidentPlayback();

  const runId = nachtRaidersIncidentPlaybackRunId;
  const presentation = record.presentation || {};
  const lines = Array.isArray(presentation.lines) ? presentation.lines : [];
  const durationMs = Math.max(
    NACHT_RAIDERS_PRESENTATION_SETTINGS.minimumIncidentDurationMs,
    Math.floor(
      Number(presentation.durationMs) ||
      NACHT_RAIDERS_PRESENTATION_SETTINGS.defaultIncidentDurationMs
    )
  );

  nachtRaidersIncidentPlaybackActive = true;
  setNachtRaidersPresentationState(NACHT_RAIDERS_PRESENTATION_STATE_INCIDENT);

  if (nachtRaidersEnemyEntity) {
    nachtRaidersEnemyEntity.hidden = true;
  }

  showNachtRaidersIncidentObject(presentation);

  if (nachtRaidersGameEventType) {
    nachtRaidersGameEventType.textContent =
      presentation.eventLabel || "FIELD INCIDENT";
  }

  if (nachtRaidersGameEventText) {
    nachtRaidersGameEventText.textContent =
      presentation.title || record.eventId || "FIELD INCIDENT";
  }

  if (nachtRaidersGameEventDetail) {
    nachtRaidersGameEventDetail.hidden = lines.length === 0;
    nachtRaidersGameEventDetail.textContent = lines[0] || "";
  }

  if (lines.length > 1) {
    scheduleNachtRaidersIncidentPlayback(
      () => {
        nachtRaidersGameEventDetail.textContent = lines[1];
      },
      Math.floor(durationMs * 0.45),
      runId
    );
  }

  const rewardSummary = formatNachtRaidersIncidentRewardSummary(record.rewards);

  if (rewardSummary) {
    scheduleNachtRaidersIncidentPlayback(
      () => {
        nachtRaidersGameEventDetail.hidden = false;
        nachtRaidersGameEventDetail.textContent = rewardSummary;
      },
      Math.floor(durationMs * 0.72),
      runId
    );
  }

  scheduleNachtRaidersIncidentPlayback(
    () => {
      nachtRaidersIncidentPlaybackActive = false;
      hideNachtRaidersIncidentObject();

      if (nachtRaidersGameEventDetail) {
        nachtRaidersGameEventDetail.hidden = true;
        nachtRaidersGameEventDetail.textContent = "";
      }

      if (typeof onComplete === "function") {
        onComplete(record);
      }

      document.dispatchEvent(
        new CustomEvent("nacht-raiders:incident-playback-completed", {
          detail: {
            record
          }
        })
      );
    },
    durationMs,
    runId
  );

  return true;
}
