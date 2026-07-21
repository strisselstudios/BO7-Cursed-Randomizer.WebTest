/* ==========================================================
   1. PRODUCER INFO STATE
   ----------------------------------------------------------
   Tracks which producer is currently displayed. This is
   temporary interface state and is not saved.
========================================================== */

let openProducerInfoKey = null;

const PRODUCER_INFO_REFRESH_RATE = 250;

const PRODUCER_INFO_SLIDE_OUT_DURATION =
  180;

const PRODUCER_INFO_SLIDE_IN_DURATION =
  220;

const PRODUCER_INFO_SLIDE_DISTANCE =
  "110%";

const PRODUCER_INFO_TIER_LABELS = {
  1: "TIER I",
  2: "TIER II",
  3: "TIER III"
};

let producerInfoTransitionInProgress =
  false;

let producerInfoTransitionToken = 0;

let producerInfoActiveAnimation = null;

/* ==========================================================
   2. PRODUCER INFO PRESENTATION
   ----------------------------------------------------------
   Reads the name and icon already displayed by the producer
   card so temporary and future tier systems remain the
   source of truth.
========================================================== */

function getProducerInfoCard(
  producerKey
) {
  return document.querySelector(
    `.producer-card[data-producer="${producerKey}"]`
  );
}

function getProducerInfoDisplayName(
  producerKey,
  card
) {
  const displayedName = card
    ?.querySelector(
      ".producer-information strong"
    )
    ?.textContent
    ?.trim();

  if (
    displayedName &&
    displayedName !== "?"
  ) {
    return displayedName;
  }

  return (
    producerData[producerKey]?.name ??
    "Unknown Producer"
  );
}

function getProducerInfoTierLabel(
  producerKey
) {
  const currentTier =
    getTemporaryProducerTier(
      producerKey
    );

  return (
    PRODUCER_INFO_TIER_LABELS[
      currentTier
    ] ??
    `TIER ${currentTier}`
  );
}

function synchronizeProducerInfoIcon(
  sourceImage
) {
  if (!producerInfoIconSlot) {
    return;
  }

  const sourcePath =
    sourceImage?.getAttribute("src") ??
    "";

  if (
    !sourceImage ||
    !sourcePath
  ) {
    if (
      producerInfoIconSlot
        .dataset
        .iconSource !== "missing"
    ) {
      producerInfoIconSlot
        .replaceChildren();

      producerInfoIconSlot.textContent =
        "?";

      producerInfoIconSlot
        .dataset
        .iconSource = "missing";
    }

    producerInfoIconSlot
      .classList
      .add(
        "producer-info-icon-missing"
      );

    return;
  }

  producerInfoIconSlot
    .classList
    .remove(
      "producer-info-icon-missing"
    );

  if (
    producerInfoIconSlot
      .dataset
      .iconSource === sourcePath
  ) {
    return;
  }

  const clonedImage =
    sourceImage.cloneNode(true);

  /*
   * Remove the original image ID. Keeping it would create
   * duplicate IDs when the card icon is cloned into the
   * dialog.
   */
  clonedImage.removeAttribute("id");
  clonedImage.alt = "";

  clonedImage.setAttribute(
    "aria-hidden",
    "true"
  );

  producerInfoIconSlot
    .replaceChildren(clonedImage);

  producerInfoIconSlot
    .dataset
    .iconSource = sourcePath;
}

/* ==========================================================
   3. PRODUCER INFO STATISTICS
   ----------------------------------------------------------
   Calculates effective unit output, combined output, share
   of total producer output, and lifetime yield.
========================================================== */

function getTotalEffectiveProducerOutput() {
  return producerOrder.reduce(
    (
      totalOutput,
      producerKey
    ) => {
      return (
        totalOutput +
        getProducerTotalMeatPerSecond(
          producerKey
        )
      );
    },
    0
  );
}

function formatProducerInfoPercentage(
  percentage
) {
  const normalizedPercentage = Math.min(
    100,
    Math.max(
      0,
      Number(percentage) || 0
    )
  );

  if (
    normalizedPercentage === 0 ||
    normalizedPercentage === 100
  ) {
    return String(
      normalizedPercentage
    );
  }

  const decimalPlaces =
    normalizedPercentage >= 10
      ? 1
      : 2;

  return normalizedPercentage
    .toFixed(decimalPlaces)
    .replace(/\.?0+$/, "");
}

function updateProducerInfoStatistics(
  producerKey,
  displayName
) {
  const owned =
    gameState.producers[
      producerKey
    ] ?? 0;

  const unitOutput =
    getProducerUnitMeatPerSecond(
      producerKey
    );

  const combinedOutput =
    getProducerTotalMeatPerSecond(
      producerKey
    );

  const lifetimeOutput =
    gameState
      .producerLifetimeMeat?.[
        producerKey
      ] ?? 0;

  const totalOutput =
    getTotalEffectiveProducerOutput();

  const outputShare =
    totalOutput > 0
      ? (
          combinedOutput /
          totalOutput
        ) * 100
      : 0;

  producerInfoUnitLabel.textContent =
    `EACH ${displayName}`;

  producerInfoUnitOutput.textContent =
    `${formatMeatPerSecond(
      unitOutput
    )} MEAT / SECOND`;

  producerInfoCombinedLabel.textContent =
    `ALL ${owned.toLocaleString(
      "en-US"
    )} OWNED`;

  producerInfoCombinedOutput.textContent =
    `${formatMeatPerSecond(
      combinedOutput
    )} MEAT / SECOND`;

  producerInfoShare.textContent =
    `${formatProducerInfoPercentage(
      outputShare
    )}%`;

  producerInfoLifetime.textContent =
    `${formatMeat(
      lifetimeOutput
    )} MEAT`;
}

/* ==========================================================
   4. PRODUCER INFO NAVIGATION
   ----------------------------------------------------------
   Moves only through producers whose normal INFO button is
   available. Locked unknown producers are excluded.
========================================================== */

function getNavigableProducerInfoKeys() {
  return producerOrder.filter(
    (producerKey) => {
      return (
        Boolean(
          producerData[producerKey]
        ) &&
        isProducerRevealed(
          producerKey
        )
      );
    }
  );
}

function getAdjacentProducerInfoKey(
  direction
) {
  if (!openProducerInfoKey) {
    return null;
  }

  const navigableProducerKeys =
    getNavigableProducerInfoKeys();

  const currentIndex =
    navigableProducerKeys.indexOf(
      openProducerInfoKey
    );

  if (currentIndex === -1) {
    return null;
  }

  const targetIndex =
    currentIndex + direction;

  if (
    targetIndex < 0 ||
    targetIndex >=
      navigableProducerKeys.length
  ) {
    return null;
  }

  return navigableProducerKeys[
    targetIndex
  ];
}

function getProducerInfoNavigationName(
  producerKey
) {
  if (!producerKey) {
    return "";
  }

  const card = getProducerInfoCard(
    producerKey
  );

  return getProducerInfoDisplayName(
    producerKey,
    card
  );
}

function updateProducerInfoNavigationButtons() {
  const previousProducerKey =
    getAdjacentProducerInfoKey(-1);

  const nextProducerKey =
    getAdjacentProducerInfoKey(1);

  const controlsLocked =
    producerInfoTransitionInProgress ||
    !openProducerInfoKey;

  if (producerInfoPreviousButton) {
    const previousProducerName =
      getProducerInfoNavigationName(
        previousProducerKey
      );

    const previousLabel =
      previousProducerKey
        ? `View previous known building: ${previousProducerName}`
        : "No previous known building";

    producerInfoPreviousButton.disabled =
      controlsLocked ||
      !previousProducerKey;

    producerInfoPreviousButton
      .setAttribute(
        "aria-label",
        previousLabel
      );

    producerInfoPreviousButton.title =
      previousLabel;
  }

  if (producerInfoNextButton) {
    const nextProducerName =
      getProducerInfoNavigationName(
        nextProducerKey
      );

    const nextLabel =
      nextProducerKey
        ? `View next known building: ${nextProducerName}`
        : "No next known building";

    producerInfoNextButton.disabled =
      controlsLocked ||
      !nextProducerKey;

    producerInfoNextButton
      .setAttribute(
        "aria-label",
        nextLabel
      );

    producerInfoNextButton.title =
      nextLabel;
  }
}

function producerInfoAnimationsAreEnabled() {
  const animationSettingIsEnabled =
    !document.body.classList.contains(
      "animations-disabled"
    );

  const reducedMotionIsRequested =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  return (
    animationSettingIsEnabled &&
    !reducedMotionIsRequested &&
    Boolean(
      producerInfoPanel?.animate
    )
  );
}

function cancelProducerInfoTransition() {
  producerInfoTransitionToken += 1;

  producerInfoActiveAnimation
    ?.cancel();

  producerInfoActiveAnimation = null;

  producerInfoTransitionInProgress =
    false;

  producerInfoPanel
    ?.getAnimations?.()
    .forEach((animation) => {
      animation.cancel();
    });
}

async function showAdjacentProducerInfo(
  direction
) {
  if (
    producerInfoTransitionInProgress ||
    !producerInfoDialog?.open ||
    !producerInfoPanel ||
    !openProducerInfoKey
  ) {
    return;
  }

  const normalizedDirection =
    direction < 0 ? -1 : 1;

  const targetProducerKey =
    getAdjacentProducerInfoKey(
      normalizedDirection
    );

  if (!targetProducerKey) {
    updateProducerInfoNavigationButtons();
    return;
  }

  producerInfoTransitionInProgress =
    true;

  const transitionToken =
    ++producerInfoTransitionToken;

  updateProducerInfoNavigationButtons();

  const exitPosition =
    normalizedDirection > 0
      ? `-${PRODUCER_INFO_SLIDE_DISTANCE}`
      : PRODUCER_INFO_SLIDE_DISTANCE;

  const entryPosition =
    normalizedDirection > 0
      ? PRODUCER_INFO_SLIDE_DISTANCE
      : `-${PRODUCER_INFO_SLIDE_DISTANCE}`;

  try {
    if (
      !producerInfoAnimationsAreEnabled()
    ) {
      openProducerInfoKey =
        targetProducerKey;

      producerInfoPanel.scrollTop = 0;

      updateProducerInfoDialog();

      return;
    }

    const exitAnimation =
      producerInfoPanel.animate(
        [
          {
            transform:
              "translateX(0)"
          },
          {
            transform:
              `translateX(${exitPosition})`
          }
        ],
        {
          duration:
            PRODUCER_INFO_SLIDE_OUT_DURATION,

          easing:
            "cubic-bezier(0.4, 0, 1, 1)",

          fill:
            "forwards"
        }
      );

    producerInfoActiveAnimation =
      exitAnimation;

    await exitAnimation.finished.catch(
      () => {}
    );

    if (
      transitionToken !==
        producerInfoTransitionToken ||
      !producerInfoDialog.open
    ) {
      return;
    }

    openProducerInfoKey =
      targetProducerKey;

    producerInfoPanel.scrollTop = 0;

    updateProducerInfoDialog();

    const entryAnimation =
      producerInfoPanel.animate(
        [
          {
            transform:
              `translateX(${entryPosition})`
          },
          {
            transform:
              "translateX(0)"
          }
        ],
        {
          duration:
            PRODUCER_INFO_SLIDE_IN_DURATION,

          easing:
            "cubic-bezier(0, 0, 0.2, 1)",

          fill:
            "both"
        }
      );

    producerInfoActiveAnimation =
      entryAnimation;

    /*
     * The entering animation is already active before the
     * completed exit animation is removed. This prevents a
     * one-frame flash in the center.
     */
    exitAnimation.cancel();

    await entryAnimation.finished.catch(
      () => {}
    );
  } finally {
    if (
      transitionToken ===
      producerInfoTransitionToken
    ) {
      producerInfoActiveAnimation
        ?.cancel();

      producerInfoActiveAnimation = null;

      producerInfoTransitionInProgress =
        false;

      updateProducerInfoNavigationButtons();
    }
  }
}

/* ==========================================================
   5. PRODUCER INFO OPEN AND CLOSE
   ----------------------------------------------------------
   Populates, opens, updates, and closes the shared producer
   dossier.
========================================================== */

function updateProducerInfoDialog() {
  if (
    !producerInfoDialog ||
    !producerInfoIconSlot ||
    !producerInfoName ||
    !producerInfoTier ||
    !producerInfoOwned ||
    !producerInfoUnitLabel ||
    !producerInfoUnitOutput ||
    !producerInfoCombinedLabel ||
    !producerInfoCombinedOutput ||
    !producerInfoShare ||
    !producerInfoLifetime ||
    !producerInfoDescription
  ) {
    return;
  }

  if (!openProducerInfoKey) {
    return;
  }

  const producer =
    producerData[
      openProducerInfoKey
    ];

  if (
    !producer ||
    !isProducerRevealed(
      openProducerInfoKey
    )
  ) {
    closeProducerInfo();
    return;
  }

  const card = getProducerInfoCard(
    openProducerInfoKey
  );

  const displayName =
    getProducerInfoDisplayName(
      openProducerInfoKey,
      card
    );

  const owned =
    gameState.producers[
      openProducerInfoKey
    ] ?? 0;

  const sourceImage = card
    ?.querySelector(
      ".producer-icon-slot img"
    );

  const description =
    getProducerDescriptionForCurrentTier(
      openProducerInfoKey
    );

  producerInfoName.textContent =
    displayName;

  producerInfoTier.textContent =
    getProducerInfoTierLabel(
      openProducerInfoKey
    );

  producerInfoOwned.textContent =
    `${owned.toLocaleString(
      "en-US"
    )} OWNED`;

  producerInfoDescription.textContent =
    description;

  synchronizeProducerInfoIcon(
    sourceImage
  );

  updateProducerInfoStatistics(
    openProducerInfoKey,
    displayName
  );

  updateProducerInfoNavigationButtons();
}

function openProducerInfo(
  producerKey
) {
  if (
    !producerInfoDialog ||
    !producerData[producerKey] ||
    !isProducerRevealed(
      producerKey
    )
  ) {
    return;
  }

  cancelProducerInfoTransition();

  openProducerInfoKey =
    producerKey;

  if (producerInfoPanel) {
    producerInfoPanel.scrollTop = 0;
  }

  updateProducerInfoDialog();

  if (!producerInfoDialog.open) {
    if (
      typeof producerInfoDialog
        .showModal === "function"
    ) {
      producerInfoDialog.showModal();
    } else {
      producerInfoDialog.setAttribute(
        "open",
        ""
      );
    }
  }

  updateProducerInfoNavigationButtons();

  producerInfoCloseButton
    ?.focus({
      preventScroll: true
    });
}

function closeProducerInfo() {
  cancelProducerInfoTransition();

  if (!producerInfoDialog) {
    openProducerInfoKey = null;

    updateProducerInfoNavigationButtons();

    return;
  }

  if (
    producerInfoDialog.open &&
    typeof producerInfoDialog
      .close === "function"
  ) {
    producerInfoDialog.close();
  } else {
    producerInfoDialog.removeAttribute(
      "open"
    );
  }

  openProducerInfoKey = null;

  updateProducerInfoNavigationButtons();
}

/* ==========================================================
   6. PRODUCER INFO DIALOG INPUT
   ----------------------------------------------------------
   Closes the dossier through its button, backdrop, or Escape.
   Side controls move through known producers.
========================================================== */

producerInfoPreviousButton
  ?.addEventListener(
    "click",
    () => {
      showAdjacentProducerInfo(-1);
    }
  );

producerInfoNextButton
  ?.addEventListener(
    "click",
    () => {
      showAdjacentProducerInfo(1);
    }
  );

producerInfoCloseButton
  ?.addEventListener(
    "click",
    closeProducerInfo
  );

producerInfoDialog
  ?.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();

      closeProducerInfo();
    }
  );

producerInfoDialog
  ?.addEventListener(
    "close",
    () => {
      cancelProducerInfoTransition();

      openProducerInfoKey = null;

      updateProducerInfoNavigationButtons();
    }
  );

producerInfoDialog
  ?.addEventListener(
    "click",
    (event) => {
      if (
        event.target !==
        producerInfoDialog
      ) {
        return;
      }

      const dialogBounds =
        producerInfoDialog
          .getBoundingClientRect();

      const clickedInsideDialog =
        event.clientX >=
          dialogBounds.left &&
        event.clientX <=
          dialogBounds.right &&
        event.clientY >=
          dialogBounds.top &&
        event.clientY <=
          dialogBounds.bottom;

      if (!clickedInsideDialog) {
        closeProducerInfo();
      }
    }
  );

/* ==========================================================
   7. PRODUCER INFO LIVE REFRESH
   ----------------------------------------------------------
   Keeps ownership, production, tier, output share, lifetime
   yield, and navigation availability current while open.
========================================================== */

window.setInterval(
  () => {
    if (
      producerInfoDialog?.open &&
      openProducerInfoKey &&
      !producerInfoTransitionInProgress
    ) {
      updateProducerInfoDialog();
    }
  },
  PRODUCER_INFO_REFRESH_RATE
);
