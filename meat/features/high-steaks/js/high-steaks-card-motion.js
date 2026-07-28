/* ==========================================================
   1. CARD MOTION SETTINGS
========================================================== */

const HIGH_STEAKS_CARD_PLACEMENT_DURATION_MS = 760;
const HIGH_STEAKS_CARD_PLACEMENT_STAGGER_MS = 90;

const HIGH_STEAKS_HAND_REFLOW_DURATION_MS = 720;
const HIGH_STEAKS_HAND_REFLOW_STAGGER_MS = 18;

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
   3. SELECTED CARD CAPTURE
   ----------------------------------------------------------
   The moving copies are mounted immediately at the selected
   cards' current screen positions. The real cards can then be
   removed from the hand without producing a visible gap.
========================================================== */

HighSteaks.capturePlayerCardPlacementMotion =
  function capturePlayerCardPlacementMotion(
    cardIds
  ) {
    if (
      !highSteaksPlayerHand ||
      !highSteaksCardMotionLayer ||
      !Array.isArray(cardIds) ||
      !HighSteaks.shouldAnimateCardMotion()
    ) {
      return [];
    }

    const requestedCardIds =
      new Set(cardIds);

    const capturedCards = [];

    const motionLayerBounds =
      highSteaksCardMotionLayer
        .getBoundingClientRect();

    highSteaksCardMotionLayer
      .replaceChildren();

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

      if (
        bounds.width <= 0 ||
        bounds.height <= 0
      ) {
        continue;
      }

      const motionClone =
        cardElement.cloneNode(true);

      motionClone.removeAttribute(
        "disabled"
      );

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

      motionClone.tabIndex = -1;

      motionClone.classList.add(
        "high-steaks-card-motion-clone"
      );

      motionClone.style.left =
        `${
          bounds.left -
          motionLayerBounds.left
        }px`;

      motionClone.style.top =
        `${
          bounds.top -
          motionLayerBounds.top
        }px`;

      motionClone.style.width =
        `${bounds.width}px`;

      motionClone.style.height =
        `${bounds.height}px`;

      const sourceZIndex =
        Number.parseInt(
          window
            .getComputedStyle(
              cardElement
            )
            .zIndex,
          10
        );

      motionClone.style.zIndex =
        Number.isFinite(sourceZIndex)
          ? String(sourceZIndex)
          : String(
              capturedCards.length + 1
            );

      highSteaksCardMotionLayer.append(
        motionClone
      );

      capturedCards.push({
        cardId,

        bounds: {
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height
        },

        clone: motionClone
      });
    }

    return capturedCards;
  };

/* ==========================================================
   4. REMAINING HAND CAPTURE
   ----------------------------------------------------------
   Records every card that will remain in the hand so its old
   position can be animated into its new compact fan position.
========================================================== */

HighSteaks.capturePlayerHandReflowMotion =
  function capturePlayerHandReflowMotion(
    excludedCardIds = []
  ) {
    if (
      !highSteaksPlayerHand ||
      !HighSteaks.shouldAnimateCardMotion()
    ) {
      return [];
    }

    const excludedIds =
      new Set(excludedCardIds);

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
        excludedIds.has(cardId)
      ) {
        continue;
      }

      const bounds =
        cardElement.getBoundingClientRect();

      capturedCards.push({
        cardId,

        bounds: {
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height
        }
      });
    }

    return capturedCards;
  };

/* ==========================================================
   5. CARD ELEMENT LOOKUP
========================================================== */

HighSteaks.getPlacedPlayerCardElement =
  function getPlacedPlayerCardElement(
    cardId
  ) {
    if (!highSteaksPlayerPlayZone) {
      return null;
    }

    return Array.from(
      highSteaksPlayerPlayZone.querySelectorAll(
        "[data-high-steaks-card-id]"
      )
    ).find(
      (cardElement) =>
        cardElement.dataset
          .highSteaksCardId ===
        cardId
    ) || null;
  };

HighSteaks.getPlayerHandCardElement =
  function getPlayerHandCardElement(
    cardId
  ) {
    if (!highSteaksPlayerHand) {
      return null;
    }

    return Array.from(
      highSteaksPlayerHand.querySelectorAll(
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
   6. SINGLE-CARD TABLE PLACEMENT
========================================================== */

HighSteaks.animatePlacedCard =
  function animatePlacedCard(
    capturedCard,
    index = 0
  ) {
    const destinationCard =
      HighSteaks.getPlacedPlayerCardElement(
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
      motionClone?.remove();

      return false;
    }

    const destinationBounds =
      destinationCard
        .getBoundingClientRect();

    if (
      destinationBounds.width <= 0 ||
      destinationBounds.height <= 0
    ) {
      motionClone.remove();

      return false;
    }

    /*
     * The clone uses top-left transform origin. These coordinate
     * differences therefore place its final top-left corner at
     * the destination card's exact rendered top-left corner.
     */

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

    const middleScaleX =
      1 +
      (
        scaleX -
        1
      ) *
      0.72;

    const middleScaleY =
      1 +
      (
        scaleY -
        1
      ) *
      0.72;

    const arcHeight =
      Math.max(
        10,
        sourceBounds.height * 0.12
      );

    const middleTranslationX =
      translationX * 0.7;

    const middleTranslationY =
      translationY * 0.68 -
      arcHeight;

    const rotationDirection =
      index % 2 === 0
        ? -2.5
        : 2.5;

    const delay =
      index *
      HIGH_STEAKS_CARD_PLACEMENT_STAGGER_MS;

    destinationCard.classList.add(
      "is-high-steaks-placement-target"
    );

    const destinationRevealAnimation =
      typeof destinationCard.animate ===
        "function"
        ? destinationCard.animate(
            [
              {
                offset: 0,
                opacity: 0
              },

              {
                offset: 0.84,
                opacity: 0
              },

              {
                offset: 1,
                opacity: 1
              }
            ],
            {
              duration:
                HIGH_STEAKS_CARD_PLACEMENT_DURATION_MS,

              delay,

              easing:
                "linear",

              fill:
                "both"
            }
          )
        : null;

    const cleanup = () => {
      destinationCard.classList.remove(
        "is-high-steaks-placement-target"
      );

      destinationRevealAnimation
        ?.cancel();

      motionClone.remove();
    };

    const animation =
      motionClone.animate(
        [
          {
            offset: 0,

            transform:
              "translate3d(0, 0, 0) scale(1, 1) rotate(0deg)",

            opacity: 1
          },

          {
            offset: 0.7,

            transform:
              [
                `translate3d(${middleTranslationX}px,`,
                `${middleTranslationY}px, 0)`,
                `scale(${middleScaleX}, ${middleScaleY})`,
                `rotate(${rotationDirection}deg)`
              ].join(" "),

            opacity: 1
          },

          {
            offset: 0.88,

            transform:
              [
                `translate3d(${translationX}px,`,
                `${translationY - 3}px, 0)`,
                `scale(${scaleX * 1.02}, ${scaleY * 1.02})`,
                "rotate(0deg)"
              ].join(" "),

            opacity: 1
          },

          {
            offset: 0.94,

            transform:
              [
                `translate3d(${translationX}px,`,
                `${translationY}px, 0)`,
                `scale(${scaleX}, ${scaleY})`,
                "rotate(0deg)"
              ].join(" "),

            opacity: 1
          },

          {
            offset: 1,

            transform:
              [
                `translate3d(${translationX}px,`,
                `${translationY}px, 0)`,
                `scale(${scaleX}, ${scaleY})`,
                "rotate(0deg)"
              ].join(" "),

            opacity: 0
          }
        ],
        {
          duration:
            HIGH_STEAKS_CARD_PLACEMENT_DURATION_MS,

          delay,

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
   7. COMPLETE PAIR PLACEMENT
========================================================== */

HighSteaks.animatePlacedCards =
  function animatePlacedCards(
    capturedCards
  ) {
    if (
      !Array.isArray(capturedCards) ||
      capturedCards.length === 0
    ) {
      return 0;
    }

    if (
      !HighSteaks.shouldAnimateCardMotion()
    ) {
      for (const capturedCard of capturedCards) {
        capturedCard.clone?.remove();
      }

      return 0;
    }

    let animatedCount = 0;

    capturedCards.forEach(
      (
        capturedCard,
        index
      ) => {
        if (
          HighSteaks.animatePlacedCard(
            capturedCard,
            index
          )
        ) {
          animatedCount += 1;
        }
      }
    );

    return animatedCount;
  };

/* ==========================================================
   8. REMAINING HAND REFLOW
========================================================== */

HighSteaks.animatePlayerHandReflow =
  function animatePlayerHandReflow(
    capturedCards
  ) {
    if (
      !Array.isArray(capturedCards) ||
      capturedCards.length === 0 ||
      !HighSteaks.shouldAnimateCardMotion()
    ) {
      return 0;
    }

    let animatedCount = 0;

    capturedCards.forEach(
      (
        capturedCard,
        index
      ) => {
        const cardElement =
          HighSteaks.getPlayerHandCardElement(
            capturedCard.cardId
          );

        if (
          !cardElement ||
          typeof cardElement.animate !==
            "function"
        ) {
          return;
        }

        const newBounds =
          cardElement.getBoundingClientRect();

        const translationX =
          capturedCard.bounds.left -
          newBounds.left;

        const translationY =
          capturedCard.bounds.top -
          newBounds.top;

        if (
          Math.abs(translationX) < 0.5 &&
          Math.abs(translationY) < 0.5
        ) {
          return;
        }

        const overshootX =
          translationX * -0.045;

        const overshootY =
          translationY * -0.045;

        const animation =
          cardElement.animate(
            [
              {
                offset: 0,

                translate:
                  `${translationX}px ${translationY}px`
              },

              {
                offset: 0.82,

                translate:
                  `${overshootX}px ${overshootY}px`
              },

              {
                offset: 1,

                translate:
                  "0px 0px"
              }
            ],
            {
              duration:
                HIGH_STEAKS_HAND_REFLOW_DURATION_MS,

              delay:
                index *
                HIGH_STEAKS_HAND_REFLOW_STAGGER_MS,

              easing:
                "cubic-bezier(0.16, 0.86, 0.26, 1)",

              fill:
                "both"
            }
          );

        const cleanup = () => {
          animation.cancel();
        };

        animation.finished.then(
          cleanup,
          cleanup
        );

        animatedCount += 1;
      }
    );

    return animatedCount;
  };
