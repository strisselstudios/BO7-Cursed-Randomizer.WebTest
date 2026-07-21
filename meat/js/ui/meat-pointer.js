/* ==========================================================
   1. CONTINUOUS MEAT POINTER REACTION
   ----------------------------------------------------------
   Uses eased pointer tracking so the meat follows the active
   mouse or touch position with weight instead of snapping.
   Pauses idle breathing while the meat is being manipulated.
========================================================== */

let activeMeatPointerId = null;

let targetFollowX = 0;
let targetFollowY = 0;
let targetFollowRotation = 0;

let currentFollowX = 0;
let currentFollowY = 0;
let currentFollowRotation = 0;

let meatFollowAnimationFrame = null;
let meatHitStopActive = false;
let meatHitStopTimer = null;

const MEAT_HIT_STOP_DURATION = 24;

const MAX_MEAT_FOLLOW_X = 18;
const MAX_MEAT_FOLLOW_Y = 14;
const MAX_MEAT_FOLLOW_ROTATION = 4.5;

const MEAT_FOLLOW_EASING = 0.18;

function setMeatFollowTarget(event) {
  const bounds =
    meatButton.getBoundingClientRect();

  if (
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return;
  }

  const normalizedX = Math.max(
    -1,
    Math.min(
      1,
      (
        event.clientX -
        (
          bounds.left +
          bounds.width / 2
        )
      ) /
      (bounds.width / 2)
    )
  );

  const normalizedY = Math.max(
    -1,
    Math.min(
      1,
      (
        event.clientY -
        (
          bounds.top +
          bounds.height / 2
        )
      ) /
      (bounds.height / 2)
    )
  );

  targetFollowX =
    normalizedX *
    MAX_MEAT_FOLLOW_X;

  targetFollowY =
    normalizedY *
    MAX_MEAT_FOLLOW_Y;

  targetFollowRotation =
    normalizedX *
    MAX_MEAT_FOLLOW_ROTATION;
}

function startMeatHitStop() {
  meatHitStopActive = true;

  if (meatHitStopTimer !== null) {
    clearTimeout(
      meatHitStopTimer
    );
  }

  meatHitStopTimer = setTimeout(
    () => {
      meatHitStopActive = false;
      meatHitStopTimer = null;

      startMeatFollowMotion();
    },
    MEAT_HIT_STOP_DURATION
  );
}

function updateMeatFollowMotion() {
  if (meatHitStopActive) {
    meatFollowAnimationFrame =
      requestAnimationFrame(
        updateMeatFollowMotion
      );

    return;
  }

  currentFollowX +=
    (
      targetFollowX -
      currentFollowX
    ) *
    MEAT_FOLLOW_EASING;

  currentFollowY +=
    (
      targetFollowY -
      currentFollowY
    ) *
    MEAT_FOLLOW_EASING;

  currentFollowRotation +=
    (
      targetFollowRotation -
      currentFollowRotation
    ) *
    MEAT_FOLLOW_EASING;

  meatButton.style.setProperty(
    "--follow-x",
    `${currentFollowX.toFixed(2)}px`
  );

  meatButton.style.setProperty(
    "--follow-y",
    `${currentFollowY.toFixed(2)}px`
  );

  meatButton.style.setProperty(
    "--follow-rotation",
    `${currentFollowRotation.toFixed(2)}deg`
  );

  const stillMoving =
    Math.abs(
      targetFollowX -
      currentFollowX
    ) > 0.05 ||
    Math.abs(
      targetFollowY -
      currentFollowY
    ) > 0.05 ||
    Math.abs(
      targetFollowRotation -
      currentFollowRotation
    ) > 0.05;

  if (stillMoving) {
    meatFollowAnimationFrame =
      requestAnimationFrame(
        updateMeatFollowMotion
      );
  } else {
    meatFollowAnimationFrame = null;
  }
}

function startMeatFollowMotion() {
  if (
    meatFollowAnimationFrame !== null
  ) {
    return;
  }

  meatFollowAnimationFrame =
    requestAnimationFrame(
      updateMeatFollowMotion
    );
}

function resetMeatFollowTarget() {
  targetFollowX = 0;
  targetFollowY = 0;
  targetFollowRotation = 0;

  startMeatFollowMotion();
}

function finishMeatPointerInteraction(
  event
) {
  if (
    activeMeatPointerId !==
    event.pointerId
  ) {
    return;
  }

  if (
    meatButton.hasPointerCapture(
      event.pointerId
    )
  ) {
    meatButton.releasePointerCapture(
      event.pointerId
    );
  }

  activeMeatPointerId = null;

  meatButton.parentElement.classList.remove(
    "meat-interacting"
  );

  resetMeatFollowTarget();

  playMeatReleaseSound();

  releaseMeatImpact();
}

meatButton.addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();

    if (
      activeMeatPointerId !== null
    ) {
      return;
    }

    activeMeatPointerId =
      event.pointerId;

    meatButton.parentElement.classList.add(
      "meat-interacting"
    );

    meatButton.setPointerCapture(
      event.pointerId
    );

    setMeatFollowTarget(event);

    updateHeldMeatImpact(event);

    playMeatPressSound();

    generateMeatFromClick(event);

    startMeatHitStop();

    startMeatFollowMotion();
  }
);

meatButton.addEventListener(
  "pointermove",
  (event) => {
    if (
      activeMeatPointerId !==
      event.pointerId
    ) {
      return;
    }

    event.preventDefault();

    setMeatFollowTarget(event);

    startMeatFollowMotion();

    updateHeldMeatImpact(event);
  }
);

meatButton.addEventListener(
  "pointerup",
  finishMeatPointerInteraction
);

meatButton.addEventListener(
  "pointercancel",
  finishMeatPointerInteraction
);
