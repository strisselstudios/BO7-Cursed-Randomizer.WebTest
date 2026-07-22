/* ==========================================================
   1. HARVESTER PLACEMENT STATE
========================================================== */

let harvesterPlacementIsActive =
  false;

/* ==========================================================
   2. POINTER TYPE
========================================================== */

function harvesterUsesPointerPreview() {
  return window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
}

/* ==========================================================
   3. NORMALIZED POSITION
   ----------------------------------------------------------
   Converts pointer coordinates into percentages of the full
   MEAT-side panel.
========================================================== */

function getNormalizedHarvesterPosition(
  clientX,
  clientY
) {
  const bounds =
    meatView.getBoundingClientRect();

  const normalizedX =
    (
      clientX -
      bounds.left
    ) /
    Math.max(
      1,
      bounds.width
    );

  const normalizedY =
    (
      clientY -
      bounds.top
    ) /
    Math.max(
      1,
      bounds.height
    );

  return {
    x:
      Math.min(
        1,
        Math.max(
          0,
          normalizedX
        )
      ),

    y:
      Math.min(
        1,
        Math.max(
          0,
          normalizedY
        )
      )
  };
}

/* ==========================================================
   4. POSITION DISPLAY
========================================================== */

function positionHarvesterElement(
  element,
  normalizedPosition
) {
  if (!element) {
    return;
  }

  element.style.left =
    `${normalizedPosition.x * 100}%`;

  element.style.top =
    `${normalizedPosition.y * 100}%`;
}

/* ==========================================================
   5. DEPLOYMENT DISPLAY
   ----------------------------------------------------------
   Synchronizes the placed Harvester element with saved state.
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

  const savedPosition =
    getHarvesterSavedPosition();

  positionHarvesterElement(
    placedHarvester,
    savedPosition
  );

  placedHarvester.hidden =
    false;
}

/* ==========================================================
   6. PLACEMENT MODE
========================================================== */

function beginHarvesterPlacement() {
  if (
    harvesterPlacementIsActive ||
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
   7. PREVIEW MOVEMENT
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
      event.clientY
    );

  positionHarvesterElement(
    harvesterCursorPreview,
    normalizedPosition
  );
}

/* ==========================================================
   8. PERSISTENT DEPLOYMENT
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
      event.clientY
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
   9. HARVESTER RETRACTION
========================================================== */

function retractDeployedHarvester() {
  if (
    typeof setHarvesterRetracted !==
      "function"
  ) {
    return;
  }

  cancelHarvesterPlacement();

  setHarvesterRetracted();

  updateHarvesterDeploymentDisplay();

  if (
    typeof updateHarvesterStoreControl ===
    "function"
  ) {
    updateHarvesterStoreControl();
  }

  document.dispatchEvent(
    new CustomEvent(
      "harvester:retracted"
    )
  );
}

/* ==========================================================
   10. PLACEMENT INPUT
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
