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

let producerInfoViewportRefreshTimer =
  null;

let producerInfoViewportRecoveryInProgress =
  false;

let producerInfoIgnoreNextCloseEvent =
  false;

let producerInfoStableViewportMode =
  window.innerWidth >= window.innerHeight
    ? "landscape"
    : "portrait";

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

/* ==========================================================
   3. PRODUCER INFO STATISTICS
   ----------------------------------------------------------
   Calculates effective unit output, combined output,
   lifetime share of all producer-generated MEAT, and
   lifetime yield.

   Harvester output is credited to the Silver Spoon family,
   so it is included in that producer's harvest share.
========================================================== */

function getTotalLifetimeProducerHarvest() {
  return producerOrder.reduce(
    (
      totalHarvest,
      producerKey
    ) => {
      const producerHarvest =
        clampMeatAmount(
          gameState
            .producerLifetimeMeat?.[
              producerKey
            ]
        );

      return addClampedMeatValues(
        totalHarvest,
        producerHarvest
      );
    },
    0
  );
}

function formatProducerInfoPercentage(
  percentage
) {
  const normalizedPercentage =
    Math.min(
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
    clampMeatAmount(
      gameState
        .producerLifetimeMeat?.[
          producerKey
        ]
    );

  const totalLifetimeHarvest =
    getTotalLifetimeProducerHarvest();

  const harvestShare =
    totalLifetimeHarvest > 0
      ? (
          lifetimeOutput /
          totalLifetimeHarvest
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
      harvestShare
    )}%`;

  producerInfoLifetime.textContent =
    `${formatMeat(
      lifetimeOutput
    )} MEAT`;
}

/* ==========================================================
   3.1 PRODUCER INFO PURCHASE CONTROL
   ----------------------------------------------------------
   Displays the current purchase quantity and cost inside the
   producer banner.

   The dossier always performs a BUY transaction, regardless
   of the Meat Mart's selected Buy or Sell mode.
========================================================== */

function getProducerInfoPurchaseQuantityLabel(
  transaction
) {
  if (
    selectedStoreTransactionQuantity ===
    STORE_QUANTITY_MAX
  ) {
    if (transaction.amount <= 0) {
      return "MAX";
    }

    return (
      `MAX (${
        transaction.amount.toLocaleString(
          "en-US"
        )
      })`
    );
  }

  return (
    `×${
      transaction.amount.toLocaleString(
        "en-US"
      )
    }`
  );
}

function updateProducerInfoPurchaseControl(
  producerKey,
  displayName
) {
  if (
    !producerInfoPurchaseButton ||
    !producerInfoPurchaseLabel
  ) {
    return;
  }

  const transaction =
    getProducerBuyTransactionPreview(
      producerKey
    );

  const quantityLabel =
    getProducerInfoPurchaseQuantityLabel(
      transaction
    );

  const hasQuotedCost =
    transaction.amount > 0 &&
    Number.isFinite(
      transaction.total
    );

  const costLabel =
    hasQuotedCost
      ? `${formatStoreMeat(
          transaction.total
        )} MEAT`
      : "NOT ENOUGH MEAT";

  producerInfoPurchaseLabel.textContent =
    `BUY ${quantityLabel} · ${costLabel}`;

  producerInfoPurchaseButton
    .classList
    .toggle(
      "producer-info-purchase-unavailable",
      !transaction.canTransact
    );

  producerInfoPurchaseButton
    .setAttribute(
      "aria-disabled",
      String(
        !transaction.canTransact
      )
    );

  const accessibleLabel =
    transaction.canTransact
      ? (
          `Buy ${
            transaction.amount.toLocaleString(
              "en-US"
            )
          } ${displayName} for ${
            formatStoreMeat(
              transaction.total
            )
          } MEAT`
        )
      : (
          `Not enough MEAT to buy the selected amount of ${displayName}`
        );

  producerInfoPurchaseButton
    .setAttribute(
      "aria-label",
      accessibleLabel
    );

  producerInfoPurchaseButton.title =
    accessibleLabel;
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
    !producerInfoPurchaseButton ||
    !producerInfoPurchaseLabel ||
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

  updateProducerInfoPurchaseControl(
    openProducerInfoKey,
    displayName
  );

  updateProducerInfoNavigationButtons();

  if (
    typeof updateHarvesterInfoAvailability ===
    "function"
  ) {
    updateHarvesterInfoAvailability();
  }

  if (
    typeof updateHarvesterInfoView ===
    "function"
  ) {
    updateHarvesterInfoView();
  }
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

  if (
    typeof resetHarvesterInfoSubview ===
    "function"
  ) {
    resetHarvesterInfoSubview(
      false
    );
  }

  openProducerInfoKey =
    producerKey;
   producerInfoStableViewportMode =
  getProducerInfoViewportMode();

cancelProducerInfoViewportRefresh();

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
  if (
    typeof resetHarvesterInfoSubview ===
    "function"
  ) {
    resetHarvesterInfoSubview(
      false
    );
  }

  cancelProducerInfoTransition();

  cancelProducerInfoViewportRefresh();

producerInfoViewportRecoveryInProgress =
  false;

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
   5.1 PRODUCER INFO VIEWPORT RECOVERY
   ----------------------------------------------------------
   Rebuilds the active modal after the browser window crosses
   between landscape and portrait proportions.

   Window resize events are debounced so the dialog is not
   rebuilt while the user is still dragging the window.
========================================================== */

const PRODUCER_INFO_VIEWPORT_SETTLE_DELAY =
  300;

function getProducerInfoViewportMode() {
  return (
    window.innerWidth >=
    window.innerHeight
  )
    ? "landscape"
    : "portrait";
}

function cancelProducerInfoViewportRefresh() {
  window.clearTimeout(
    producerInfoViewportRefreshTimer
  );

  producerInfoViewportRefreshTimer =
    null;
}

function reopenProducerInfoAfterViewportChange() {
  if (
    !producerInfoDialog ||
    !producerInfoDialog.open ||
    !openProducerInfoKey ||
    producerInfoViewportRecoveryInProgress
  ) {
    return;
  }

  const producerKey =
    openProducerInfoKey;

  const preservedScrollTop =
    producerInfoPanel?.scrollTop ?? 0;

  producerInfoViewportRecoveryInProgress =
    true;

  cancelProducerInfoViewportRefresh();
  cancelProducerInfoTransition();

  /*
   * The next close event belongs to this controlled modal
   * rebuild. It must not erase the current producer key.
   */
  producerInfoIgnoreNextCloseEvent =
    true;

  producerInfoDialog.close();

  /*
   * The resize debounce has already waited for the user to
   * stop dragging. Two animation frames allow the browser to
   * apply the final viewport dimensions before showModal().
   */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        const producerStillExists =
          Boolean(
            producerData[producerKey]
          );

        const producerStillRevealed =
          producerStillExists &&
          isProducerRevealed(
            producerKey
          );

        if (!producerStillRevealed) {
          openProducerInfoKey = null;

          updateProducerInfoNavigationButtons();

          return;
        }

        openProducerInfoKey =
          producerKey;

        updateProducerInfoDialog();

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

        if (producerInfoPanel) {
          const maximumScrollTop =
            Math.max(
              0,
              producerInfoPanel.scrollHeight -
                producerInfoPanel.clientHeight
            );

          producerInfoPanel.scrollTop =
            Math.min(
              preservedScrollTop,
              maximumScrollTop
            );
        }

        producerInfoStableViewportMode =
          getProducerInfoViewportMode();

        updateProducerInfoNavigationButtons();

        producerInfoCloseButton
          ?.focus({
            preventScroll: true
          });
      } finally {
        producerInfoViewportRecoveryInProgress =
          false;
      }
    });
  });
}

function scheduleProducerInfoViewportRefresh() {
  if (
    !producerInfoDialog?.open ||
    !openProducerInfoKey
  ) {
    return;
  }

  const currentViewportMode =
    getProducerInfoViewportMode();

  /*
   * Ordinary resizing within the same orientation does not
   * require the native modal to be rebuilt.
   */
  if (
    currentViewportMode ===
    producerInfoStableViewportMode
  ) {
    cancelProducerInfoViewportRefresh();

    return;
  }

  /*
   * Every new resize event resets the timer. Recovery occurs
   * only after window resizing has stopped for 300ms.
   */
  cancelProducerInfoViewportRefresh();

  producerInfoViewportRefreshTimer =
    window.setTimeout(
      reopenProducerInfoAfterViewportChange,
      PRODUCER_INFO_VIEWPORT_SETTLE_DELAY
    );
}

window.addEventListener(
  "resize",
  scheduleProducerInfoViewportRefresh,
  {
    passive: true
  }
);

/*
 * visualViewport catches viewport changes caused by mobile
 * browser controls and device rotation in browsers that
 * expose the API.
 */
window.visualViewport
  ?.addEventListener(
    "resize",
    scheduleProducerInfoViewportRefresh,
    {
      passive: true
    }
  );

const producerInfoOrientationQuery =
  window.matchMedia(
    "(orientation: portrait)"
  );

if (
  typeof producerInfoOrientationQuery
    .addEventListener === "function"
) {
  producerInfoOrientationQuery
    .addEventListener(
      "change",
      scheduleProducerInfoViewportRefresh
    );
} else {
  producerInfoOrientationQuery
    .addListener(
      scheduleProducerInfoViewportRefresh
    );
}

/* ==========================================================
   6. PRODUCER INFO DIALOG INPUT
   ----------------------------------------------------------
   Closes the dossier through its button, backdrop, or Escape.
   Side controls move through known producers.
========================================================== */

   producerInfoPurchaseButton
  ?.addEventListener(
    "click",
    () => {
      if (
        !openProducerInfoKey ||
        producerInfoTransitionInProgress ||
        producerInfoViewportRecoveryInProgress
      ) {
        return;
      }

      const producerKey =
        openProducerInfoKey;

      transactProducer(
        producerKey,
        {
          mode: STORE_MODE_BUY,

          feedbackTarget:
            producerInfoPurchaseButton
        }
      );

      /*
       * Refresh immediately so ownership, cost, output,
       * producer tier, name, and icon update without waiting
       * for the 250ms live-refresh interval.
       */
      updateProducerInfoDialog();
    }
  );
   
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
      /*
       * The viewport recovery system deliberately closes and
       * reopens the dialog. Ignore exactly that one close
       * event without using an unreliable timed flag.
       */
      if (
        producerInfoIgnoreNextCloseEvent
      ) {
        producerInfoIgnoreNextCloseEvent =
          false;

        return;
      }

      cancelProducerInfoTransition();
      cancelProducerInfoViewportRefresh();

      producerInfoViewportRecoveryInProgress =
        false;

      openProducerInfoKey =
        null;

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
