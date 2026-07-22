/* ==========================================================
   1. HARVESTER PLACEMENT AND DRAG STATE
========================================================== */

const HARVESTER_DRAG_START_THRESHOLD =
  5;

let harvesterPlacementIsActive =
  false;

let harvesterDragIsActive =
  false;

let harvesterDragPointerId =
  null;

let harvesterDragStartClientX =
  0;

let harvesterDragStartClientY =
  0;

let harvesterDragOffsetX =
  0;

let harvesterDragOffsetY =
  0;

let harvesterDragHasMoved =
  false;

let harvesterDragPosition =
  null;

let harvesterLayoutRefreshFrame =
  null;

/* ==========================================================
   2. POINTER TYPE
========================================================== */

function harvesterUsesPointerPreview() {
  return window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
}

/* ==========================================================
   3. HARVESTER SIZE MEASUREMENT
   ----------------------------------------------------------
   Returns the rendered sprite dimensions used to keep the
   complete Harvester inside the MEAT side.
========================================================== */

function getHarvesterElementSize(
  element
) {
  if (!element) {
    return {
      width: 0,
      height: 0
    };
  }

  const elementBounds =
    element.getBoundingClientRect();

  if (
    elementBounds.width > 0 &&
    elementBounds.height > 0
  ) {
    return {
      width:
        elementBounds.width,

      height:
        elementBounds.height
    };
  }

  const computedStyles =
    window.getComputedStyle(
      element
    );

  const computedWidth =
    Number.parseFloat(
      computedStyles.width
    );

  const computedHeight =
    Number.parseFloat(
      computedStyles.height
    );

  return {
    width:
      Number.isFinite(
        computedWidth
      )
        ? computedWidth
        : 96,

    height:
      Number.isFinite(
        computedHeight
      )
        ? computedHeight
        : 96
  };
}

/* ==========================================================
   4. NORMALIZED POSITION
   ----------------------------------------------------------
   Converts pointer coordinates into percentages of the full
   MEAT side and keeps the entire Harvester visible.
========================================================== */

function clampHarvesterPositionToMeatView(
  position,
  element
) {
  const normalizedPosition = {
    x:
      Math.min(
        1,
        Math.max(
          0,
          Number(position?.x) || 0
        )
      ),

    y:
      Math.min(
        1,
        Math.max(
          0,
          Number(position?.y) || 0
        )
      )
  };

  if (!meatView) {
    return normalizedPosition;
  }

  const meatViewBounds =
    meatView.getBoundingClientRect();

  if (
    meatViewBounds.width <= 0 ||
    meatViewBounds.height <= 0
  ) {
    return normalizedPosition;
  }

  const elementSize =
    getHarvesterElementSize(
      element
    );

  const horizontalMargin =
    Math.min(
      0.5,
      (
        elementSize.width / 2
      ) /
      meatViewBounds.width
    );

  const verticalMargin =
    Math.min(
      0.5,
      (
        elementSize.height / 2
      ) /
      meatViewBounds.height
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

function getNormalizedHarvesterPosition(
  clientX,
  clientY,
  element = placedHarvester
) {
  const meatViewBounds =
    meatView.getBoundingClientRect();

  const normalizedPosition = {
    x:
      (
        clientX -
        meatViewBounds.left
      ) /
      Math.max(
        1,
        meatViewBounds.width
      ),

    y:
      (
        clientY -
        meatViewBounds.top
      ) /
      Math.max(
        1,
        meatViewBounds.height
      )
  };

  return clampHarvesterPositionToMeatView(
    normalizedPosition,
    element
  );
}

/* ==========================================================
   5. POSITION DISPLAY
========================================================== */

function positionHarvesterElement(
  element,
  normalizedPosition
) {
  if (!element) {
    return;
  }

  const visiblePosition =
    clampHarvesterPositionToMeatView(
      normalizedPosition,
      element
    );

  element.style.left =
    `${visiblePosition.x * 100}%`;

  element.style.top =
    `${visiblePosition.y * 100}%`;
}

/* ==========================================================
   6. DEPLOYMENT DISPLAY
   ----------------------------------------------------------
   Synchronizes the deployed element with saved state.
========================================================== */

function updateHarvesterDeploymentDisplay() {
  if (!placedHarvester) {
    return;
  }

  const harvesterIsDeployed =
    typeof isHarvesterDeployed ===
      "function" &&
    isHarvesterDeployed();

  if (!harvesterIsDeployed) {
    placedHarvester.hidden =
      true;

    return;
  }

  /*
   * Reveal synchronously before measuring. The browser does
   * not paint until this function finishes.
   */
  placedHarvester.hidden =
    false;

  const savedPosition =
    getHarvesterSavedPosition();

  positionHarvesterElement(
    placedHarvester,
    savedPosition
  );
}

/* ==========================================================
   7. PLACEMENT MODE
========================================================== */

function beginHarvesterPlacement() {
  if (
    harvesterPlacementIsActive ||
    harvesterDragIsActive ||
    !meatView ||
    !harvesterPlacementLayer ||
    !harvesterPlacementBanner
  ) {
    return;
  }

  if (
    typeof isHarvesterUnlocked ===
      "function" &&
    !isHarvesterUnlocked()
  ) {
    return;
  }

  if (
    typeof isHarvesterDeployed ===
      "function" &&
    isHarvesterDeployed()
  ) {
    return;
  }

  if (
    typeof showMobileMeatView ===
    "function"
  ) {
    showMobileMeatView();
  }

  harvesterPlacementIsActive =
    true;

  meatView.classList.add(
    "harvester-placement-active"
  );

  harvesterPlacementLayer.hidden =
    false;

  harvesterPlacementLayer
    .setAttribute(
      "aria-hidden",
      "false"
    );

  harvesterPlacementBanner.hidden =
    false;

  if (
    harvesterUsesPointerPreview() &&
    harvesterCursorPreview
  ) {
    harvesterCursorPreview.hidden =
      false;
  }

  document.body.classList.add(
    "harvester-placement-mode"
  );
}

function cancelHarvesterPlacement() {
  if (!harvesterPlacementIsActive) {
    return;
  }

  harvesterPlacementIsActive =
    false;

  meatView?.classList.remove(
    "harvester-placement-active"
  );

  if (harvesterPlacementLayer) {
    harvesterPlacementLayer.hidden =
      true;

    harvesterPlacementLayer
      .setAttribute(
        "aria-hidden",
        "true"
      );
  }

  if (harvesterCursorPreview) {
    harvesterCursorPreview.hidden =
      true;
  }

  if (harvesterPlacementBanner) {
    harvesterPlacementBanner.hidden =
      true;
  }

  document.body.classList.remove(
    "harvester-placement-mode"
  );
}

/* ==========================================================
   8. PLACEMENT PREVIEW
========================================================== */

function updateHarvesterCursorPreview(
  event
) {
  if (
    !harvesterPlacementIsActive ||
    !harvesterUsesPointerPreview() ||
    !harvesterCursorPreview
  ) {
    return;
  }

  const normalizedPosition =
    getNormalizedHarvesterPosition(
      event.clientX,
      event.clientY,
      harvesterCursorPreview
    );

  positionHarvesterElement(
    harvesterCursorPreview,
    normalizedPosition
  );
}

/* ==========================================================
   9. PERSISTENT DEPLOYMENT
========================================================== */

function placePersistentHarvester(
  event
) {
  if (
    !harvesterPlacementIsActive ||
    !placedHarvester ||
    typeof deployHarvesterAtPosition !==
      "function"
  ) {
    return;
  }

  const selectedPosition =
    getNormalizedHarvesterPosition(
      event.clientX,
      event.clientY,
      placedHarvester
    );

  const deploymentSucceeded =
    deployHarvesterAtPosition(
      selectedPosition
    );

  if (!deploymentSucceeded) {
    cancelHarvesterPlacement();

    return;
  }

  updateHarvesterDeploymentDisplay();

  cancelHarvesterPlacement();

  if (
    typeof updateHarvesterStoreControl ===
    "function"
  ) {
    updateHarvesterStoreControl();
  }

if (
  typeof updateHarvesterDutyCycleDisplay ===
  "function"
) {
  updateHarvesterDutyCycleDisplay();
}

  document.dispatchEvent(
    new CustomEvent(
      "harvester:deployed",
      {
        detail: {
          position: {
            ...selectedPosition
          }
        }
      }
    )
  );
}

/* ==========================================================
   10. HARVESTER RETRACTION
========================================================== */

function retractDeployedHarvester() {
  if (
    typeof setHarvesterRetracted !==
      "function"
  ) {
    return;
  }

  cancelHarvesterPlacement();
  cancelHarvesterDrag();

  const retractionSucceeded =
    setHarvesterRetracted();

  if (!retractionSucceeded) {
    return;
  }
   
  updateHarvesterDeploymentDisplay();

  if (
    typeof updateHarvesterStoreControl ===
    "function"
  ) {
    updateHarvesterStoreControl();
  }
   if (
  typeof updateHarvesterDutyCycleDisplay ===
  "function"
) {
  updateHarvesterDutyCycleDisplay();
}

  document.dispatchEvent(
    new CustomEvent(
      "harvester:retracted"
    )
  );
}

/* ==========================================================
   11. DEPLOYED HARVESTER DRAGGING
   ----------------------------------------------------------
   Drag input is consumed by the Harvester and never reaches
   the normal meat-click controls.
========================================================== */

function beginHarvesterDrag(
  event
) {
  const primaryPointerWasUsed =
    event.button === undefined ||
    event.button === 0;

  const harvesterIsDeployed =
    typeof isHarvesterDeployed ===
      "function" &&
    isHarvesterDeployed();

  if (
    !primaryPointerWasUsed ||
    !harvesterIsDeployed ||
    harvesterPlacementIsActive ||
    harvesterDragIsActive ||
    !placedHarvester
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const harvesterBounds =
    placedHarvester
      .getBoundingClientRect();

  harvesterDragIsActive =
    true;

  harvesterDragPointerId =
    event.pointerId;

  harvesterDragStartClientX =
    event.clientX;

  harvesterDragStartClientY =
    event.clientY;

  harvesterDragOffsetX =
    event.clientX -
    (
      harvesterBounds.left +
      harvesterBounds.width / 2
    );

  harvesterDragOffsetY =
    event.clientY -
    (
      harvesterBounds.top +
      harvesterBounds.height / 2
    );

  harvesterDragHasMoved =
    false;

  harvesterDragPosition =
    getHarvesterSavedPosition();

  placedHarvester.classList.add(
    "harvester-dragging"
  );

  document.body.classList.add(
    "harvester-drag-mode"
  );

  try {
    placedHarvester.setPointerCapture(
      event.pointerId
    );
  } catch (error) {
    /*
     * Pointer capture is an enhancement. Dragging can still
     * continue in browsers that reject the capture request.
     */
  }
}

function updateHarvesterDrag(
  event
) {
  if (
    !harvesterDragIsActive ||
    event.pointerId !==
      harvesterDragPointerId ||
    !placedHarvester
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const horizontalDistance =
    event.clientX -
    harvesterDragStartClientX;

  const verticalDistance =
    event.clientY -
    harvesterDragStartClientY;

  const totalDistance =
    Math.hypot(
      horizontalDistance,
      verticalDistance
    );

  if (
    !harvesterDragHasMoved &&
    totalDistance <
      HARVESTER_DRAG_START_THRESHOLD
  ) {
    return;
  }

  harvesterDragHasMoved =
    true;

  harvesterDragPosition =
    getNormalizedHarvesterPosition(
      event.clientX -
        harvesterDragOffsetX,

      event.clientY -
        harvesterDragOffsetY,

      placedHarvester
    );

  positionHarvesterElement(
    placedHarvester,
    harvesterDragPosition
  );
}

function finishHarvesterDrag(
  event
) {
  if (
    !harvesterDragIsActive ||
    event.pointerId !==
      harvesterDragPointerId
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const completedPosition =
    harvesterDragPosition
      ? {
          ...harvesterDragPosition
        }
      : null;

  const positionShouldBeSaved =
    harvesterDragHasMoved &&
    completedPosition &&
    typeof setHarvesterPosition ===
      "function";

  if (positionShouldBeSaved) {
    setHarvesterPosition(
      completedPosition
    );
  }

  cancelHarvesterDrag();

  updateHarvesterDeploymentDisplay();

  if (positionShouldBeSaved) {
    document.dispatchEvent(
      new CustomEvent(
        "harvester:moved",
        {
          detail: {
            position:
              completedPosition
          }
        }
      )
    );
  }
}

function cancelHarvesterDrag() {
  if (!harvesterDragIsActive) {
    return;
  }

  const capturedPointerId =
    harvesterDragPointerId;

  harvesterDragIsActive =
    false;

  harvesterDragPointerId =
    null;

  harvesterDragHasMoved =
    false;

  harvesterDragPosition =
    null;

  placedHarvester?.classList.remove(
    "harvester-dragging"
  );

  document.body.classList.remove(
    "harvester-drag-mode"
  );

  if (
    placedHarvester &&
    capturedPointerId !== null
  ) {
    try {
      if (
        placedHarvester.hasPointerCapture(
          capturedPointerId
        )
      ) {
        placedHarvester
          .releasePointerCapture(
            capturedPointerId
          );
      }
    } catch (error) {
      /*
       * The browser may have already released capture.
       */
    }
  }
}

/* ==========================================================
   12. INPUT REGISTRATION
========================================================== */

document.addEventListener(
  "harvester:deploy-requested",
  beginHarvesterPlacement
);

document.addEventListener(
  "harvester:retract-requested",
  retractDeployedHarvester
);

if (harvesterPlacementLayer) {
  harvesterPlacementLayer
    .addEventListener(
      "pointermove",
      updateHarvesterCursorPreview
    );

  harvesterPlacementLayer
    .addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.button !== undefined &&
          event.button !== 0
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        placePersistentHarvester(
          event
        );
      }
    );
}

if (harvesterPlacementCancelButton) {
  harvesterPlacementCancelButton
    .addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        cancelHarvesterPlacement();
      }
    );
}

if (placedHarvester) {
  placedHarvester.addEventListener(
    "pointerdown",
    beginHarvesterDrag
  );

  placedHarvester.addEventListener(
    "pointermove",
    updateHarvesterDrag
  );

  placedHarvester.addEventListener(
    "pointerup",
    finishHarvesterDrag
  );

  placedHarvester.addEventListener(
    "pointercancel",
    () => {
      cancelHarvesterDrag();
      updateHarvesterDeploymentDisplay();
    }
  );

  placedHarvester.addEventListener(
    "lostpointercapture",
    () => {
      if (!harvesterDragIsActive) {
        return;
      }

      cancelHarvesterDrag();
      updateHarvesterDeploymentDisplay();
    }
  );

  /*
   * Prevent the synthesized click after pointer input from
   * reaching the meat-click system.
   */
  placedHarvester.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
    }
  );

  placedHarvester.addEventListener(
    "dragstart",
    (event) => {
      event.preventDefault();
    }
  );

  placedHarvester.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
    }
  );
}

/*
 * Clicking outside the complete MEAT side cancels only active
 * placement mode.
 */
document.addEventListener(
  "pointerdown",
  (event) => {
    if (
      !harvesterPlacementIsActive ||
      meatView?.contains(
        event.target
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    cancelHarvesterPlacement();
  },
  true
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      !harvesterPlacementIsActive ||
      event.key !== "Escape"
    ) {
      return;
    }

    event.preventDefault();

    cancelHarvesterPlacement();
  }
);

window.addEventListener(
  "blur",
  () => {
    if (!harvesterDragIsActive) {
      return;
    }

    cancelHarvesterDrag();
    updateHarvesterDeploymentDisplay();
  }
);

/* ==========================================================
   13. VIEWPORT POSITION REFRESH
   ----------------------------------------------------------
   Re-clamps the Harvester after window resizing, mobile
   rotation, or dynamic browser viewport changes.
========================================================== */

function scheduleHarvesterLayoutRefresh() {
  window.cancelAnimationFrame(
    harvesterLayoutRefreshFrame
  );

  harvesterLayoutRefreshFrame =
    window.requestAnimationFrame(
      () => {
        if (!harvesterDragIsActive) {
          updateHarvesterDeploymentDisplay();
        }
      }
    );
}

window.addEventListener(
  "resize",
  scheduleHarvesterLayoutRefresh,
  {
    passive: true
  }
);

window.visualViewport
  ?.addEventListener(
    "resize",
    scheduleHarvesterLayoutRefresh,
    {
      passive: true
    }
  );
