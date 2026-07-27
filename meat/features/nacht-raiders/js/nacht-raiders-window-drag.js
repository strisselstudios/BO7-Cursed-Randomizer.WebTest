/* ==========================================================
   1. FLOATING WINDOW DRAG STATE
========================================================== */

const NACHT_RAIDERS_WINDOW_DRAG_THRESHOLD = 5;
const NACHT_RAIDERS_WINDOW_DOUBLE_TAP_MS = 360;

let nachtRaidersWindowDragIsActive = false;
let nachtRaidersWindowDragPointerId = null;
let nachtRaidersWindowDragStartX = 0;
let nachtRaidersWindowDragStartY = 0;
let nachtRaidersWindowDragOffsetX = 0;
let nachtRaidersWindowDragOffsetY = 0;
let nachtRaidersWindowDragHasMoved = false;
let nachtRaidersWindowDragPosition = null;
let nachtRaidersWindowLastTitleTapAt = 0;
let nachtRaidersWindowLayoutFrame = null;

/* ==========================================================
   2. DRAG BOUNDARY AND POSITION
========================================================== */

function getNachtRaidersWindowDragBoundary() {
  return (
    gameShell ||
    document.documentElement
  );
}

function getNachtRaidersSavedWindowPosition() {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  return {
    x:
      normalizeNachtRaidersUnitValue(
        nachtRaidersState
          .window
          .position
          ?.x
      ),

    y:
      normalizeNachtRaidersUnitValue(
        nachtRaidersState
          .window
          .position
          ?.y
      )
  };
}

function clampNachtRaidersWindowPosition(
  position
) {
  const boundary =
    getNachtRaidersWindowDragBoundary();

  const boundaryBounds =
    boundary.getBoundingClientRect();

  const windowBounds =
    nachtRaidersWindow
      ?.getBoundingClientRect();

  const normalizedPosition = {
    x:
      normalizeNachtRaidersUnitValue(
        position?.x
      ),

    y:
      normalizeNachtRaidersUnitValue(
        position?.y
      )
  };

  if (
    !windowBounds ||
    boundaryBounds.width <= 0 ||
    boundaryBounds.height <= 0
  ) {
    return normalizedPosition;
  }

  const horizontalMargin =
    Math.min(
      0.5,
      (
        windowBounds.width /
        2 /
        boundaryBounds.width
      )
    );

  const verticalMargin =
    Math.min(
      0.5,
      (
        windowBounds.height /
        2 /
        boundaryBounds.height
      )
    );

  return {
    x:
      Math.min(
        1 - horizontalMargin,
        Math.max(
          horizontalMargin,
          normalizedPosition.x
        )
      ),

    y:
      Math.min(
        1 - verticalMargin,
        Math.max(
          verticalMargin,
          normalizedPosition.y
        )
      )
  };
}

function getNachtRaidersWindowPositionFromClient(
  clientX,
  clientY
) {
  const boundaryBounds =
    getNachtRaidersWindowDragBoundary()
      .getBoundingClientRect();

  return clampNachtRaidersWindowPosition({
    x:
      (
        clientX -
        boundaryBounds.left
      ) /
      Math.max(
        1,
        boundaryBounds.width
      ),

    y:
      (
        clientY -
        boundaryBounds.top
      ) /
      Math.max(
        1,
        boundaryBounds.height
      )
  });
}

function positionNachtRaidersFloatingWindow(
  position,
  options = {}
) {
  if (
    !nachtRaidersWindow ||
    !isNachtRaidersFloatingWindowMode()
  ) {
    return false;
  }

  const boundaryBounds =
    getNachtRaidersWindowDragBoundary()
      .getBoundingClientRect();

  const visiblePosition =
    clampNachtRaidersWindowPosition(
      position
    );

  nachtRaidersWindow.style.left =
    `${
      boundaryBounds.left +
      visiblePosition.x *
      boundaryBounds.width
    }px`;

  nachtRaidersWindow.style.top =
    `${
      boundaryBounds.top +
      visiblePosition.y *
      boundaryBounds.height
    }px`;

  if (options.updateState !== false) {
    const nachtRaidersState =
      gameState.features?.nachtRaiders ||
      ensureNachtRaidersFeatureState();

    nachtRaidersState.window.position = {
      ...visiblePosition
    };
  }

  return visiblePosition;
}

function clearNachtRaidersFloatingWindowPosition() {
  if (!nachtRaidersWindow) {
    return;
  }

  nachtRaidersWindow.style.removeProperty(
    "left"
  );

  nachtRaidersWindow.style.removeProperty(
    "top"
  );

  nachtRaidersWindow.classList.remove(
    "is-dragging"
  );
}

function refreshNachtRaidersFloatingWindowPosition() {
  if (
    !isNachtRaidersWindowOpen() ||
    !isNachtRaidersFloatingWindowMode()
  ) {
    return false;
  }

  return positionNachtRaidersFloatingWindow(
    getNachtRaidersSavedWindowPosition()
  );
}

/* ==========================================================
   3. DRAG START
========================================================== */

function beginNachtRaidersWindowDrag(
  event
) {
  const primaryPointer =
    event.button === undefined ||
    event.button === 0;

  const controlWasPressed =
    event.target.closest(
      "[data-nacht-raiders-window-control]"
    );

  if (
    !primaryPointer ||
    controlWasPressed ||
    !isNachtRaidersWindowOpen() ||
    !isNachtRaidersFloatingWindowMode() ||
    nachtRaidersWindowDragIsActive ||
    !nachtRaidersWindow ||
    !nachtRaidersTitleBar
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const windowBounds =
    nachtRaidersWindow
      .getBoundingClientRect();

  nachtRaidersWindowDragIsActive =
    true;

  nachtRaidersWindowDragPointerId =
    event.pointerId;

  nachtRaidersWindowDragStartX =
    event.clientX;

  nachtRaidersWindowDragStartY =
    event.clientY;

  nachtRaidersWindowDragOffsetX =
    event.clientX -
    (
      windowBounds.left +
      windowBounds.width / 2
    );

  nachtRaidersWindowDragOffsetY =
    event.clientY -
    (
      windowBounds.top +
      windowBounds.height / 2
    );

  nachtRaidersWindowDragHasMoved =
    false;

  nachtRaidersWindowDragPosition =
    getNachtRaidersSavedWindowPosition();

  nachtRaidersWindow.classList.add(
    "is-dragging"
  );

  nachtRaidersWindow.focus({
    preventScroll: true
  });

  try {
    nachtRaidersTitleBar.setPointerCapture(
      event.pointerId
    );
  } catch (error) {
    /*
     * Pointer capture is an enhancement. Document listeners
     * remain active if the browser rejects capture.
     */
  }
}

/* ==========================================================
   4. DRAG MOVEMENT
========================================================== */

function updateNachtRaidersWindowDrag(
  event
) {
  if (
    !nachtRaidersWindowDragIsActive ||
    event.pointerId !==
      nachtRaidersWindowDragPointerId
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const distance =
    Math.hypot(
      event.clientX -
        nachtRaidersWindowDragStartX,

      event.clientY -
        nachtRaidersWindowDragStartY
    );

  if (
    !nachtRaidersWindowDragHasMoved &&
    distance <
      NACHT_RAIDERS_WINDOW_DRAG_THRESHOLD
  ) {
    return;
  }

  nachtRaidersWindowDragHasMoved =
    true;

  nachtRaidersWindowDragPosition =
    getNachtRaidersWindowPositionFromClient(
      event.clientX -
        nachtRaidersWindowDragOffsetX,

      event.clientY -
        nachtRaidersWindowDragOffsetY
    );

  positionNachtRaidersFloatingWindow(
    nachtRaidersWindowDragPosition
  );
}

/* ==========================================================
   5. DRAG COMPLETION
========================================================== */

function finishNachtRaidersWindowDrag(
  event,
  cancelled = false
) {
  if (
    !nachtRaidersWindowDragIsActive ||
    (
      event?.pointerId !== undefined &&
      event.pointerId !==
        nachtRaidersWindowDragPointerId
    )
  ) {
    return;
  }

  event?.preventDefault();
  event?.stopPropagation();

  const pointerId =
    nachtRaidersWindowDragPointerId;

  const moved =
    nachtRaidersWindowDragHasMoved;

  const finalPosition =
    nachtRaidersWindowDragPosition;

  nachtRaidersWindowDragIsActive =
    false;

  nachtRaidersWindowDragPointerId =
    null;

  nachtRaidersWindowDragHasMoved =
    false;

  nachtRaidersWindowDragPosition =
    null;

  nachtRaidersWindow
    ?.classList.remove(
      "is-dragging"
    );

  try {
    if (
      pointerId !== null &&
      nachtRaidersTitleBar
        ?.hasPointerCapture(
          pointerId
        )
    ) {
      nachtRaidersTitleBar
        .releasePointerCapture(
          pointerId
        );
    }
  } catch (error) {
    /*
     * The browser may already have released pointer capture.
     */
  }

  if (cancelled) {
    refreshNachtRaidersFloatingWindowPosition();

    return;
  }

  if (
    moved &&
    finalPosition
  ) {
    positionNachtRaidersFloatingWindow(
      finalPosition
    );

    saveGame();

    document.dispatchEvent(
      new CustomEvent(
        "nacht-raiders:window-moved",
        {
          detail: {
            position: {
              ...finalPosition
            }
          }
        }
      )
    );

    nachtRaidersWindowLastTitleTapAt =
      0;

    return;
  }

  const currentTime =
    Date.now();

  if (
    currentTime -
      nachtRaidersWindowLastTitleTapAt <=
    NACHT_RAIDERS_WINDOW_DOUBLE_TAP_MS
  ) {
    nachtRaidersWindowLastTitleTapAt =
      0;

    setNachtRaidersWindowMode(
      NACHT_RAIDERS_WINDOW_MODE_FULL
    );

    return;
  }

  nachtRaidersWindowLastTitleTapAt =
    currentTime;
}

function cancelNachtRaidersWindowDrag() {
  finishNachtRaidersWindowDrag(
    null,
    true
  );
}

/* ==========================================================
   6. RESPONSIVE POSITION REFRESH
========================================================== */

function scheduleNachtRaidersWindowLayoutRefresh() {
  if (
    nachtRaidersWindowLayoutFrame !==
    null
  ) {
    window.cancelAnimationFrame(
      nachtRaidersWindowLayoutFrame
    );
  }

  nachtRaidersWindowLayoutFrame =
    window.requestAnimationFrame(
      () => {
        nachtRaidersWindowLayoutFrame =
          null;

        refreshNachtRaidersFloatingWindowPosition();
      }
    );
}

/* ==========================================================
   7. DRAG INPUT
========================================================== */

nachtRaidersTitleBar
  ?.addEventListener(
    "pointerdown",
    beginNachtRaidersWindowDrag
  );

document.addEventListener(
  "pointermove",
  updateNachtRaidersWindowDrag,
  {
    passive: false
  }
);

document.addEventListener(
  "pointerup",
  (event) => {
    finishNachtRaidersWindowDrag(
      event
    );
  }
);

document.addEventListener(
  "pointercancel",
  (event) => {
    finishNachtRaidersWindowDrag(
      event,
      true
    );
  }
);

window.addEventListener(
  "resize",
  scheduleNachtRaidersWindowLayoutRefresh
);

window.addEventListener(
  "orientationchange",
  scheduleNachtRaidersWindowLayoutRefresh
);

window.visualViewport
  ?.addEventListener(
    "resize",
    scheduleNachtRaidersWindowLayoutRefresh
  );

/* ==========================================================
   8. WINDOW EVENT INTEGRATION
========================================================== */

document.addEventListener(
  "nacht-raiders:opened",
  scheduleNachtRaidersWindowLayoutRefresh
);

document.addEventListener(
  "nacht-raiders:window-mode-changed",
  () => {
    cancelNachtRaidersWindowDrag();

    if (
      isNachtRaidersFloatingWindowMode()
    ) {
      scheduleNachtRaidersWindowLayoutRefresh();
    } else {
      clearNachtRaidersFloatingWindowPosition();
    }
  }
);

document.addEventListener(
  "nacht-raiders:closed",
  cancelNachtRaidersWindowDrag
);
