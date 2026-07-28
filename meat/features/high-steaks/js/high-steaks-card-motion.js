/* ==========================================================
   1. CARD MOTION SETTINGS
========================================================== */

const HIGH_STEAKS_CARD_PLACEMENT_DURATION_MS =
  480;

const HIGH_STEAKS_CARD_PLACEMENT_STAGGER_MS =
  70;

/* ==========================================================
   2. MOTION AVAILABILITY
========================================================== */

HighSteaks.shouldAnimateCardMotion =
  function shouldAnimateCardMotion() {
    if (
      document.body.classList.contains(
        "animations-disabled"
      )
    ) {
      return false;
    }

    return !window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  };

/* ==========================================================
   3. SOURCE CARD CAPTURE
   ----------------------------------------------------------
   Captures the selected cards before the hand is rerendered
   and those cards are moved into the table state.
========================================================== */

HighSteaks.capturePlayerCardPlacementMotion =
  function capturePlayerCardPlacementMotion(
    cardIds
  ) {
    if (
      !highSteaksPlayerHand ||
      !Array.isArray(cardIds)
    ) {
      return [];
    }

    const requestedCardIds =
      new Set(cardIds);

    const capturedCards = [];

    for (
      const cardElement of
      highSteaksPlayerHand.children
    ) {
      const cardId =
        cardElement.dataset
          ?.highSteaksCardId;

      if (
        !cardId ||
        !requestedCardIds.has(cardId)
      ) {
        continue;
      }

      const bounds =
        cardElement.getBoundingClientRect();

      const motionClone =
        cardElement.cloneNode(true);

      if (
        motionClone instanceof
        HTMLButtonElement
      ) {
        motionClone.disabled = true;
      }

      motionClone.removeAttribute(
        "role"
      );

      motionClone.removeAttribute(
        "aria-pressed"
      );

      motionClone.setAttribute(
        "aria-hidden",
        "true"
      );

      motionClone.classList.add(
        "high-steaks-card-motion-clone"
      );

      capturedCards.push({
        cardId,
        bounds: {
          left:
            bounds.left,

          top:
            bounds.top,

          width:
            bounds.width,

          height:
            bounds.height
        },

        clone:
          motionClone
      });
    }

    return capturedCards;
  };

/* ==========================================================
   4. DESTINATION CARD LOOKUP
========================================================== */

HighSteaks.getPlacedPlayerCardElement =
  function getPlacedPlayerCardElement(
    cardId
  ) {
    if (!highSteaksPlayerPlayZone) {
      return null;
    }

    return Array.from(
      highSteaksPlayerPlayZone
        .querySelectorAll(
          "[data-high-steaks-card-id]"
        )
    ).find(
      (cardElement) =>
        cardElement.dataset
          .highSteaksCardId ===
        cardId
    ) || null;
  };

/* ==========================================================
   5. SINGLE-CARD PLACEMENT ANIMATION
========================================================== */

HighSteaks.animatePlacedCard =
  function animatePlacedCard(
    capturedCard,
    delayMs = 0
  ) {
    const destinationCard =
      HighSteaks
        .getPlacedPlayerCardElement(
          capturedCard?.cardId
        );

    const motionClone =
      capturedCard?.clone;

    const sourceBounds =
      capturedCard?.bounds;

    if (
      !destinationCard ||
      !motionClone ||
      !sourceBounds ||
      typeof motionClone.animate !==
        "function"
    ) {
      return false;
    }

    const destinationBounds =
      destinationCard
        .getBoundingClientRect();

    if (
      sourceBounds.width <= 0 ||
      sourceBounds.height <= 0 ||
      destinationBounds.width <= 0 ||
      destinationBounds.height <= 0
    ) {
      return false;
    }

    const translationX =
      destinationBounds.left -
      sourceBounds.left;

    const translationY =
      destinationBounds.top -
      sourceBounds.top;

    const scaleX =
      destinationBounds.width /
      sourceBounds.width;

    const scaleY =
      destinationBounds.height /
      sourceBounds.height;

    motionClone.style.left =
      `${sourceBounds.left}px`;

    motionClone.style.top =
      `${sourceBounds.top}px`;

    motionClone.style.width =
      `${sourceBounds.width}px`;

    motionClone.style.height =
      `${sourceBounds.height}px`;

    destinationCard.classList.add(
      "is-high-steaks-placement-target"
    );

    document.body.append(
      motionClone
    );

    const cleanup = () => {
      destinationCard.classList.remove(
        "is-high-steaks-placement-target"
      );

      motionClone.remove();
    };

    const animation =
      motionClone.animate(
        [
          {
            transform:
              "translate3d(0, 0, 0) scale(1, 1)",

            opacity:
              1
          },

          {
            transform:
              `translate3d(${translationX}px, ${translationY}px, 0) scale(${scaleX}, ${scaleY})`,

            opacity:
              1
          }
        ],
        {
          duration:
            HIGH_STEAKS_CARD_PLACEMENT_DURATION_MS,

          delay:
            Math.max(
              0,
              Math.floor(
                Number(delayMs) || 0
              )
            ),

          easing:
            "cubic-bezier(0.2, 0.82, 0.22, 1)",

          fill:
            "both"
        }
      );

    animation.finished.then(
      cleanup,
      cleanup
    );

    return true;
  };

/* ==========================================================
   6. COMPLETE PAIR PLACEMENT
========================================================== */

HighSteaks.animatePlacedCards =
  function animatePlacedCards(
    capturedCards
  ) {
    if (
      !Array.isArray(capturedCards) ||
      capturedCards.length === 0 ||
      !HighSteaks
        .shouldAnimateCardMotion()
    ) {
      return 0;
    }

    let animatedCount = 0;

    capturedCards.forEach(
      (
        capturedCard,
        index
      ) => {
        const animated =
          HighSteaks.animatePlacedCard(
            capturedCard,
            index *
              HIGH_STEAKS_CARD_PLACEMENT_STAGGER_MS
          );

        if (animated) {
          animatedCount += 1;
        }
      }
    );

    return animatedCount;
  };
