/* ==========================================================
   1. PRODUCER INFO STATE
   ----------------------------------------------------------
   Tracks which producer is currently displayed. This is
   temporary interface state and is not saved.
========================================================== */

let openProducerInfoKey =
  null;

const PRODUCER_INFO_REFRESH_RATE =
  250;

const PRODUCER_INFO_TIER_LABELS = {
  1: "TIER I",
  2: "TIER II",
  3: "TIER III"
};


/* ==========================================================
   2. PRODUCER INFO PRESENTATION
   ----------------------------------------------------------
   Reads the name and icon already displayed by the producer
   card so temporary and future tier systems remain the source
   of truth.
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
  const displayedName =
    card
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
    sourceImage?.getAttribute(
      "src"
    ) ?? "";

  if (
    !sourceImage ||
    !sourcePath
  ) {
    if (
      producerInfoIconSlot
        .dataset.iconSource !==
      "missing"
    ) {
      producerInfoIconSlot
        .replaceChildren();

      producerInfoIconSlot
        .textContent =
        "?";

      producerInfoIconSlot
        .dataset.iconSource =
        "missing";
    }

    producerInfoIconSlot
      .classList.add(
        "producer-info-icon-missing"
      );

    return;
  }

  producerInfoIconSlot
    .classList.remove(
      "producer-info-icon-missing"
    );

  if (
    producerInfoIconSlot
      .dataset.iconSource ===
    sourcePath
  ) {
    return;
  }

  const clonedImage =
    sourceImage.cloneNode(true);

  /*
   * Remove the original image ID. Keeping it would create
   * duplicate IDs when the card icon is cloned into the dialog.
   */
  clonedImage.removeAttribute(
    "id"
  );

  clonedImage.alt =
    "";

  clonedImage.setAttribute(
    "aria-hidden",
    "true"
  );

  producerInfoIconSlot
    .replaceChildren(
      clonedImage
    );

  producerInfoIconSlot
    .dataset.iconSource =
    sourcePath;
}


/* ==========================================================
   3. PRODUCER INFO STATISTICS
   ----------------------------------------------------------
   Calculates the selected producer's effective unit output,
   combined output, share of total output, and lifetime yield.
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
    .replace(
      /\.?0+$/,
      ""
    );
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
   4. PRODUCER INFO OPEN AND CLOSE
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

  const card =
    getProducerInfoCard(
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

  const sourceImage =
    card?.querySelector(
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

  openProducerInfoKey =
    producerKey;

  updateProducerInfoDialog();

  if (!producerInfoDialog.open) {
    if (
      typeof producerInfoDialog
        .showModal === "function"
    ) {
      producerInfoDialog
        .showModal();
    } else {
      producerInfoDialog
        .setAttribute(
          "open",
          ""
        );
    }
  }

  producerInfoCloseButton
    ?.focus({
      preventScroll: true
    });
}

function closeProducerInfo() {
  if (!producerInfoDialog) {
    openProducerInfoKey =
      null;

    return;
  }

  if (
    producerInfoDialog.open &&
    typeof producerInfoDialog
      .close === "function"
  ) {
    producerInfoDialog.close();
  } else {
    producerInfoDialog
      .removeAttribute(
        "open"
      );
  }

  openProducerInfoKey =
    null;
}


/* ==========================================================
   5. PRODUCER INFO DIALOG INPUT
   ----------------------------------------------------------
   Closes the dossier through its button, the backdrop, or the
   Escape key.
========================================================== */

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
      openProducerInfoKey =
        null;
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
   6. PRODUCER INFO LIVE REFRESH
   ----------------------------------------------------------
   Keeps ownership, production, tier, output share, and
   lifetime yield current while the dossier remains open.
========================================================== */

window.setInterval(
  () => {
    if (
      producerInfoDialog?.open &&
      openProducerInfoKey
    ) {
      updateProducerInfoDialog();
    }
  },
  PRODUCER_INFO_REFRESH_RATE
);
