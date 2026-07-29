/* ==========================================================
   1. OPENING DEAL RUNTIME
========================================================== */

HighSteaks.openingDealRunId = 0;

/* ==========================================================
   2. TIMING
========================================================== */

HighSteaks.wait =
  function wait(
    durationMs
  ) {
    return new Promise(
      (resolve) => {
        window.setTimeout(
          resolve,
          Math.max(
            0,
            Math.floor(
              Number(durationMs) || 0
            )
          )
        );
      }
    );
  };

/* ==========================================================
   3. DEAL CARD LOOKUP
========================================================== */

HighSteaks.getPlayerHandCardById =
  function getPlayerHandCardById(
    cardId
  ) {
    return Array.from(
      highSteaksPlayerHand
        ?.querySelectorAll(
          "[data-high-steaks-card-id]"
        ) || []
    ).find(
      (cardElement) =>
        cardElement.dataset
          .highSteaksCardId ===
        cardId
    ) || null;
  };

HighSteaks.getOpponentHandCardById =
  function getOpponentHandCardById(
    cardId
  ) {
    return Array.from(
      highSteaksOpponentHand
        ?.querySelectorAll(
          "[data-high-steaks-card-id]"
        ) || []
    ).find(
      (cardElement) =>
        cardElement.dataset
          .highSteaksCardId ===
        cardId
    ) || null;
  };

/* ==========================================================
   4. SINGLE DEAL ANIMATION
========================================================== */

HighSteaks.animateCardDeal =
  function animateCardDeal(
    cardElement
  ) {
    if (!cardElement) {
      return false;
    }

    if (
      typeof HighSteaks
        .shouldAnimateCardMotion ===
        "function" &&
      !HighSteaks
        .shouldAnimateCardMotion()
    ) {
      return false;
    }

    if (
      typeof cardElement.animate !==
        "function"
    ) {
      return false;
    }

    const stageBounds =
      highSteaksPerspectiveStage
        ?.getBoundingClientRect();

    const cardBounds =
      cardElement
        .getBoundingClientRect();

    const travelDistance =
      stageBounds
        ? (
            cardBounds.right -
            stageBounds.left +
            HighSteaks.DEAL_SETTINGS
              .offscreenPaddingPx
          )
        : (
            cardBounds.width +
            500
          );

    cardElement.classList.add(
      "is-high-steaks-being-dealt"
    );

    const animation =
      cardElement.animate(
        [
          {
            translate:
              `${-travelDistance}px 0px`,

            opacity: 0.88
          },

          {
            offset: 0.82,

            translate:
              "4px -2px",

            opacity: 1
          },

          {
            translate:
              "0px 0px",

            opacity: 1
          }
        ],
        {
          duration:
            HighSteaks.DEAL_SETTINGS
              .cardDurationMs,

          easing:
            "cubic-bezier(0.16, 0.88, 0.26, 1)",

          fill:
            "both"
        }
      );

    const cleanup = () => {
      cardElement.classList.remove(
        "is-high-steaks-being-dealt"
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
   5. OPENING DEAL SEQUENCE
========================================================== */

HighSteaks.startOpeningDeal =
  async function startOpeningDeal(
    options = {}
  ) {
    const state =
      HighSteaks.prototypeState;

    if (
      !state ||
      state.screen !==
        HighSteaks.SCREEN_TABLE
    ) {
      return false;
    }

         const dealCount =
      Math.min(
        state.player.hand.length,
        state.opponent.hand.length
      );

    const openingDelayMs =
      Number.isFinite(
        Number(options.openingDelayMs)
      )
        ? Math.max(
            0,
            Math.floor(
              Number(options.openingDelayMs)
            )
          )
        : HighSteaks.DEAL_SETTINGS
            .openingDelayMs;

    const dealingPhaseText =
      typeof options.phaseText === "string" &&
      options.phaseText.trim()
        ? options.phaseText.trim()
        : "T.E.D.D. IS DEALING";

    const runId =
      HighSteaks.openingDealRunId + 1;

    HighSteaks.openingDealRunId =
      runId;

    state.phase =
      HighSteaks.PHASE_DEALING;

    state.locked = true;

        state.phaseText =
      dealingPhaseText;

    state.deal.playerVisible = 0;
    state.deal.opponentVisible = 0;
    state.deal.complete = false;

    HighSteaks.renderPrototype();

        await HighSteaks.wait(
      openingDelayMs
    );

    for (
      let index = 0;
            index < dealCount;
      index += 1
    ) {
      if (
        runId !==
          HighSteaks.openingDealRunId ||
        HighSteaks.prototypeState !==
          state ||
        !HighSteaks.isWindowOpen()
      ) {
        return false;
      }

      state.deal.opponentVisible =
        index + 1;

      HighSteaks.renderOpponentHand(
        state
      );

      HighSteaks.animateCardDeal(
        HighSteaks
          .getOpponentHandCardById(
            state.opponent
              .hand[index]
              .id
          )
      );

      await HighSteaks.wait(
        HighSteaks.DEAL_SETTINGS
          .intervalMs
      );

      state.deal.playerVisible =
        index + 1;

      HighSteaks.renderPlayerHand(
        state
      );

      HighSteaks.animateCardDeal(
        HighSteaks
          .getPlayerHandCardById(
            state.player
              .hand[index]
              .id
          )
      );

      await HighSteaks.wait(
        HighSteaks.DEAL_SETTINGS
          .intervalMs
      );
    }

    if (
      runId !==
        HighSteaks.openingDealRunId ||
      HighSteaks.prototypeState !==
        state
    ) {
      return false;
    }

    state.deal.complete = true;

    state.phase =
      HighSteaks.PHASE_PLAYER_TURN;

    state.locked = false;

    state.phaseText =
      "CHOOSE EXACTLY TWO CARDS";

    HighSteaks.renderPrototype();

    document.dispatchEvent(
      new CustomEvent(
        "high-steaks:opening-deal-completed",
        {
          detail: {
            dealerId:
              state.dealerId,

            difficultyId:
              state.difficultyId
          }
        }
      )
    );

    return true;
  };

/* ==========================================================
   6. DEAL CANCELLATION
========================================================== */

HighSteaks.cancelOpeningDeal =
  function cancelOpeningDeal() {
    HighSteaks.openingDealRunId += 1;
  };

document.addEventListener(
  "high-steaks:closed",
  HighSteaks.cancelOpeningDeal
);
