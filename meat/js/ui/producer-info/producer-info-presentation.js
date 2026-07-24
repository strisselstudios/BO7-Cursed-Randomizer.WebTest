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

