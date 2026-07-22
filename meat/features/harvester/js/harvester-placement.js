/* ==========================================================
   1. HARVESTER PLACEMENT STATE
========================================================== */

let harvesterPlacementIsActive =
  false;

let temporaryHarvesterPosition = {
  x: 0.5,
  y: 0.5
};

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
   5. PLACEMENT MODE
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

  /*
   * Portrait navigation normally displays one major view at a
   * time. Restore the complete MEAT side before placement.
   */
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

  harvesterPlacementLayer.setAttribute(
    "aria-hidden",
    "false"
  );

  harvesterPlacementBanner.hidden =
    false;

  if (harvesterUsesPointerPreview()) {
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

    harvesterPlacementLayer.setAttribute(
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
   6. PREVIEW MOVEMENT
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
   7. TEMPORARY PLACEMENT
   ----------------------------------------------------------
   This places the visual object but does not save deployment
   state yet. Persistent state is the next implementation step.
========================================================== */

function placeTemporaryHarvester(
  event
) {
  if (
    !harvesterPlacementIsActive ||
    !placedHarvester
  ) {
    return;
  }

  temporaryHarvesterPosition =
    getNormalizedHarvesterPosition(
      event.clientX,
      event.clientY
    );

  positionHarvesterElement(
    placedHarvester,
    temporaryHarvesterPosition
  );

  placedHarvester.hidden = false;

  cancelHarvesterPlacement();

  document.dispatchEvent(
    new CustomEvent(
      "harvester:placement-selected",
      {
        detail: {
          position: {
            ...temporaryHarvesterPosition
          }
        }
      }
    )
  );
}

/* ==========================================================
   8. PLACEMENT INPUT
========================================================== */

document.addEventListener(
  "harvester:deploy-requested",
  beginHarvesterPlacement
);

harvesterPlacementLayer
  ?.addEventListener(
    "pointermove",
    updateHarvesterCursorPreview
  );

harvesterPlacementLayer
  ?.addEventListener(
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

      placeTemporaryHarvester(
        event
      );
    }
  );

harvesterPlacementCancelButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      cancelHarvesterPlacement();
    }
  );

/*
 * Clicking anywhere outside the complete MEAT side cancels
 * placement and consumes the click.
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
