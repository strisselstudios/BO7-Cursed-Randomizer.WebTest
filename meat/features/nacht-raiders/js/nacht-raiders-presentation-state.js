/* ==========================================================
   1. PRESENTATION RUNTIME STATE
========================================================== */

let nachtRaidersPresentationState = NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL;

/* ==========================================================
   2. PRESENTATION STATE ACCESS
========================================================== */

function getNachtRaidersPresentationState() {
  return nachtRaidersPresentationState;
}

function isNachtRaidersPresentationBusy() {
  return nachtRaidersPresentationState !== NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL;
}

/* ==========================================================
   3. PRESENTATION STATE CHANGES
========================================================== */

function setNachtRaidersPresentationState(stateName) {
  const allowedStates = new Set([
    NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL,
    NACHT_RAIDERS_PRESENTATION_STATE_INCIDENT,
    NACHT_RAIDERS_PRESENTATION_STATE_COMBAT
  ]);

  const normalizedState = allowedStates.has(stateName)
    ? stateName
    : NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL;

  nachtRaidersPresentationState = normalizedState;

  if (nachtRaidersGameScreen) {
    nachtRaidersGameScreen.dataset.presentationState = normalizedState;
    nachtRaidersGameScreen.classList.toggle(
      "is-presentation-paused",
      normalizedState !== NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL
    );
  }

  if (normalizedState === NACHT_RAIDERS_PRESENTATION_STATE_INCIDENT) {
    stopNachtRaidersVisualAnimation(nachtRaidersOperativeVisual);
  }

  if (
    normalizedState === NACHT_RAIDERS_PRESENTATION_STATE_TRAVEL &&
    isNachtRaidersGameDisplayVisible()
  ) {
    restartNachtRaidersVisualAsset(
      nachtRaidersOperativeVisual,
      nachtRaidersOperativePlaceholder,
      "operative",
      NACHT_RAIDERS_ANIMATION_WALK
    );
  }

  document.dispatchEvent(
    new CustomEvent("nacht-raiders:presentation-state-changed", {
      detail: {
        state: normalizedState
      }
    })
  );

  return normalizedState;
}
