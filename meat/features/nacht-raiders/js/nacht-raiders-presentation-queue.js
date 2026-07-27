/* ==========================================================
   1. PRESENTATION QUEUE RUNTIME
========================================================== */

const nachtRaidersPresentationQueue = [];
const nachtRaidersPresentationEventKeys = new Set();

let nachtRaidersCurrentPresentationEvent = null;
let nachtRaidersPresentationQueueTimeoutId = null;

/* ==========================================================
   2. PRESENTATION QUEUE STATUS
========================================================== */

function isNachtRaidersPresentationQueueActive() {
  return Boolean(
    nachtRaidersCurrentPresentationEvent ||
    nachtRaidersPresentationQueue.length > 0
  );
}

/* ==========================================================
   3. PRESENTATION QUEUE MANAGEMENT
========================================================== */

function clearNachtRaidersPresentationQueue() {
  if (nachtRaidersPresentationQueueTimeoutId !== null) {
    window.clearTimeout(nachtRaidersPresentationQueueTimeoutId);
    nachtRaidersPresentationQueueTimeoutId = null;
  }

  nachtRaidersPresentationQueue.length = 0;
  nachtRaidersPresentationEventKeys.clear();
  nachtRaidersCurrentPresentationEvent = null;

  cancelNachtRaidersIncidentPlayback();
  cancelNachtRaidersCombatPlayback(true);
  setNachtRaidersPresentationState(NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL);
}

function enqueueNachtRaidersPresentationEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return 0;

  let addedCount = 0;

  for (const presentationEvent of events) {
    if (!presentationEvent?.eventKey || nachtRaidersPresentationEventKeys.has(presentationEvent.eventKey)) {
      continue;
    }

    nachtRaidersPresentationQueue.push(presentationEvent);
    nachtRaidersPresentationEventKeys.add(presentationEvent.eventKey);
    addedCount += 1;
  }

  while (
    nachtRaidersPresentationQueue.length >
    NACHT_RAIDERS_PRESENTATION_SETTINGS.maximumQueuedEvents
  ) {
    const removedEvent = nachtRaidersPresentationQueue.shift();

    if (removedEvent?.eventKey) {
      nachtRaidersPresentationEventKeys.delete(removedEvent.eventKey);
    }
  }

  startNextNachtRaidersPresentationEvent();

  return addedCount;
}

/* ==========================================================
   4. PRESENTATION EVENT COMPLETION
========================================================== */

function finishNachtRaidersPresentationEvent() {
  const completedEvent = nachtRaidersCurrentPresentationEvent;

  if (completedEvent?.eventKey) {
    nachtRaidersPresentationEventKeys.delete(completedEvent.eventKey);
  }

  nachtRaidersCurrentPresentationEvent = null;

  if (nachtRaidersPresentationQueue.length === 0) {
    setNachtRaidersPresentationState(NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL);

    if (nachtRaidersGameEventType) {
      nachtRaidersGameEventType.textContent = "TRAVEL";
    }

    if (nachtRaidersGameEventText) {
      nachtRaidersGameEventText.textContent = "OPERATIVE ADVANCING";
    }

    renderNachtRaidersGameState();
    return;
  }

  nachtRaidersPresentationQueueTimeoutId = window.setTimeout(
    () => {
      nachtRaidersPresentationQueueTimeoutId = null;
      startNextNachtRaidersPresentationEvent();
    },
    NACHT_RAIDERS_PRESENTATION_SETTINGS.queueGapMs
  );
}

/* ==========================================================
   5. PRESENTATION EVENT PLAYBACK
========================================================== */

function startNextNachtRaidersPresentationEvent() {
  if (
    nachtRaidersCurrentPresentationEvent ||
    nachtRaidersPresentationQueueTimeoutId !== null ||
    !isNachtRaidersGameDisplayVisible()
  ) {
    return false;
  }

  const presentationEvent = nachtRaidersPresentationQueue.shift() || null;

  if (!presentationEvent) {
    setNachtRaidersPresentationState(NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL);
    return false;
  }

  nachtRaidersCurrentPresentationEvent = presentationEvent;

  if (presentationEvent.type === NACHT_RAIDERS_PRESENTATION_EVENT_INCIDENT) {
    setNachtRaidersPresentationState(NACHT_RAIDERS_PRESENTATION_STATE_INCIDENT);

    const started = playNachtRaidersIncidentPresentation(
      presentationEvent.record,
      finishNachtRaidersPresentationEvent
    );

    if (!started) finishNachtRaidersPresentationEvent();

    return started;
  }

  if (presentationEvent.type === NACHT_RAIDERS_PRESENTATION_EVENT_COMBAT) {
    setNachtRaidersPresentationState(NACHT_RAIDERS_PRESENTATION_STATE_COMBAT);

    const started = playNachtRaidersCombatTimeline(
      presentationEvent.combatResult,
      finishNachtRaidersPresentationEvent
    );

    if (!started) finishNachtRaidersPresentationEvent();

    return started;
  }

  finishNachtRaidersPresentationEvent();

  return false;
}

/* ==========================================================
   6. PRESENTATION QUEUE EVENTS
========================================================== */

document.addEventListener("nacht-raiders:game-stage-entered", () => {
  clearNachtRaidersPresentationQueue();
});

document.addEventListener("nacht-raiders:screen-changed", (event) => {
  if (event.detail?.screen === NACHT_RAIDERS_SCREEN_GAME) {
    startNextNachtRaidersPresentationEvent();
    return;
  }

  clearNachtRaidersPresentationQueue();
});

document.addEventListener("nacht-raiders:closed", clearNachtRaidersPresentationQueue);
