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
   3. SELECTED CARD GEOMETRY CAPTURE
   ----------------------------------------------------------
   Captures the selected cards' visible screen geometry before
   the state moves them into the table. No clone is created.
========================================================== */

HighSteaks.capturePlayerCardPlacementMotion =
  function capturePlayerCardPlacementMotion(
    cardIds
  ) {
    if (
      !highSteaksPlayerHand ||
      !Array.isArray(cardIds) ||
      !HighSteaks.shouldAnimateCardMotion()
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

      if (
        bounds.width <= 0 ||
        bounds.height <= 0
      ) {
        continue;
      }

      const computedStyle =
        window.getComputedStyle(
          cardElement
        );

      capturedCards.push({
        cardId,

        sourceBounds: {
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          centerX:
            bounds.left +
            bounds.width / 2,
          centerY:
            bounds.top +
            bounds.height / 2
        },

        sourceRotation:
          Number.parseFloat(
            computedStyle.getPropertyValue(
              "--high-steaks-card-rotation"
            )
          ) || 0,

        sourceFilter:
          computedStyle.filter,

        sourceBoxShadow:
          computedStyle.boxShadow
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
   5.1 TABLE-SPACE COORDINATE CONVERSION
   ----------------------------------------------------------
   The player play zone is scaled and rotated in perspective.
   Screen-space movement must be converted into that zone's
   local coordinate system before animating the real card.
========================================================== */

HighSteaks.getPlayerPlayZoneScreenScale =
  function getPlayerPlayZoneScreenScale() {
    const playZone =
      highSteaksPlayerPlayZone
        ?.closest(
          ".high-steaks-play-zone-player"
        );

    if (!playZone) {
      return {
        x: 1,
        y: 1
      };
    }

    const bounds =
      playZone.getBoundingClientRect();

    return {
      x:
        bounds.width /
        Math.max(
          1,
          playZone.offsetWidth
        ),

      y:
        bounds.height /
        Math.max(
          1,
          playZone.offsetHeight
        )
    };
  };

/* ==========================================================
   6. SINGLE-CARD TABLE PLACEMENT
   ----------------------------------------------------------
   Animates the actual final table card. There is no clone,
   destination reveal, opacity transition, or element swap.
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

    const sourceBounds =
      capturedCard?.sourceBounds;

    if (
      !destinationCard ||
      !sourceBounds ||
      typeof destinationCard.animate !==
        "function"
    ) {
      return false;
    }

    const destinationBounds =
      destinationCard
        .getBoundingClientRect();

    if (
      destinationBounds.width <= 0 ||
      destinationBounds.height <= 0
    ) {
      return false;
    }

    const destinationCenterX =
      destinationBounds.left +
      destinationBounds.width / 2;

    const destinationCenterY =
      destinationBounds.top +
      destinationBounds.height / 2;

    const playZoneScale =
      HighSteaks
        .getPlayerPlayZoneScreenScale();

    const startingTranslationX =
      (
        sourceBounds.centerX -
        destinationCenterX
      ) /
      Math.max(
        0.001,
        playZoneScale.x
      );

    const startingTranslationY =
      (
        sourceBounds.centerY -
        destinationCenterY
      ) /
      Math.max(
        0.001,
        playZoneScale.y
      );

    const startingScaleX =
      sourceBounds.width /
      destinationBounds.width;

    const startingScaleY =
      sourceBounds.height /
      destinationBounds.height;

    const arcHeight =
      Math.max(
        8,
        destinationBounds.height * 0.14
      ) /
      Math.max(
        0.001,
        playZoneScale.y
      );

    const delay =
      index *
      HIGH_STEAKS_CARD_PLACEMENT_STAGGER_MS;

    const destinationStyle =
      window.getComputedStyle(
        destinationCard
      );

    const destinationFilter =
      destinationStyle.filter;

    const destinationBoxShadow =
      destinationStyle.boxShadow;

    destinationCard.classList.add(
      "is-high-steaks-card-moving"
    );

    const animation =
      destinationCard.animate(
        [
          {
            offset: 0,

            translate:
              `${startingTranslationX}px ${startingTranslationY}px`,

            scale:
              `${startingScaleX} ${startingScaleY}`,

            rotate:
              `${capturedCard.sourceRotation || 0}deg`,

            filter:
              capturedCard.sourceFilter ||
              destinationFilter,

            boxShadow:
              capturedCard.sourceBoxShadow ||
              destinationBoxShadow
          },

          {
            offset: 0.7,

            translate:
              `${
                startingTranslationX * 0.28
              }px ${
                startingTranslationY * 0.3 -
                arcHeight
              }px`,

            scale:
              `${
                1 +
                (
                  startingScaleX -
                  1
                ) *
                0.28
              } ${
                1 +
                (
                  startingScaleY -
                  1
                ) *
                0.28
              }`,

            rotate:
              `${
                (
                  capturedCard.sourceRotation ||
                  0
                ) *
                0.2
              }deg`,

            filter:
              destinationFilter,

            boxShadow:
              destinationBoxShadow
          },

          {
            offset: 0.9,

            translate:
              "0px -3px",

            scale:
              "1.025 1.025",

            rotate:
              "0deg",

            filter:
              destinationFilter,

            boxShadow:
              destinationBoxShadow
          },

          {
            offset: 1,

            translate:
              "0px 0px",

            scale:
              "1 1",

            rotate:
              "0deg",

            filter:
              destinationFilter,

            boxShadow:
              destinationBoxShadow
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

    const cleanup = () => {
      /*
       * This is already the real table card. Cancelling the
       * finished animation exposes its identical base state.
       */

      destinationCard.classList.remove(
        "is-high-steaks-card-moving"
      );

      animation.cancel();
    };

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
