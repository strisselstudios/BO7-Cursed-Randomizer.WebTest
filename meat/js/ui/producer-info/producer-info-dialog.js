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

