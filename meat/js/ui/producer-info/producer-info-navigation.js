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

