/* ==========================================================
   1. ROUND SEQUENCE RUNTIME
========================================================== */

HighSteaks.roundSequenceRunId = 0;

HighSteaks.cancelRoundSequence =
  function cancelRoundSequence() {
    HighSteaks.roundSequenceRunId += 1;
  };

HighSteaks.isRoundSequenceCurrent =
  function isRoundSequenceCurrent(
    runId,
    state
  ) {
    return Boolean(
      runId ===
        HighSteaks.roundSequenceRunId &&
      HighSteaks.prototypeState === state &&
      HighSteaks.isWindowOpen()
    );
  };

/* ==========================================================
   2. ROUND VALUE HELPERS
========================================================== */

HighSteaks.getCardTotal =
  function getCardTotal(
    cards
  ) {
    return (
      Array.isArray(cards)
        ? cards
        : []
    ).reduce(
      (total, card) =>
        total +
        Number(card?.value || 0),
      0
    );
  };

HighSteaks.refreshRoundHud =
  function refreshRoundHud(
    state
  ) {
    HighSteaks.renderScoreboard(
      state
    );

    HighSteaks.renderRoundHistory(
      state
    );

    if (highSteaksPhaseText) {
      highSteaksPhaseText.textContent =
        state.phaseText;
    }

    if (highSteaksScene) {
      highSteaksScene.dataset
        .highSteaksPhase =
        state.phase;
    }
  };

/* ==========================================================
   3. OPPONENT CARD LOOKUP
========================================================== */

HighSteaks.getOpponentPlayedCardById =
  function getOpponentPlayedCardById(
    cardId
  ) {
    return Array.from(
      highSteaksOpponentPlayZone
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
   4. OPPONENT MOVEMENT CAPTURE
========================================================== */

HighSteaks.captureTeddPlacementMotion =
  function captureTeddPlacementMotion(
    selectedCardIds
  ) {
    const selectedIds =
      new Set(selectedCardIds);

    return Array.from(
      highSteaksOpponentHand
        ?.querySelectorAll(
          "[data-high-steaks-card-id]"
        ) || []
    )
      .filter(
        (cardElement) =>
          selectedIds.has(
            cardElement.dataset
              .highSteaksCardId
          )
      )
      .map(
        (cardElement) => {
          const bounds =
            cardElement
              .getBoundingClientRect();

          return {
            cardId:
              cardElement.dataset
                .highSteaksCardId,

            bounds: {
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
            }
          };
        }
      );
  };

HighSteaks.captureTeddHandReflow =
  function captureTeddHandReflow(
    selectedCardIds
  ) {
    const selectedIds =
      new Set(selectedCardIds);

    return Array.from(
      highSteaksOpponentHand
        ?.querySelectorAll(
          "[data-high-steaks-card-id]"
        ) || []
    )
      .filter(
        (cardElement) =>
          !selectedIds.has(
            cardElement.dataset
              .highSteaksCardId
          )
      )
      .map(
        (cardElement) => {
          const bounds =
            cardElement
              .getBoundingClientRect();

          return {
            cardId:
              cardElement.dataset
                .highSteaksCardId,

            bounds: {
              left: bounds.left,
              top: bounds.top
            }
          };
        }
      );
  };

/* ==========================================================
   5. TRANSFORMED ELEMENT SCALE
========================================================== */

HighSteaks.getRenderedElementScale =
  function getRenderedElementScale(
    element
  ) {
    if (!element) {
      return {
        x: 1,
        y: 1
      };
    }

    const bounds =
      element.getBoundingClientRect();

    return {
      x:
        bounds.width /
        Math.max(
          1,
          element.offsetWidth
        ),

      y:
        bounds.height /
        Math.max(
          1,
          element.offsetHeight
        )
    };
  };

/* ==========================================================
   6. T.E.D.D. CARD PLACEMENT
========================================================== */

HighSteaks.animateTeddPlacedCard =
  function animateTeddPlacedCard(
    capturedCard,
    index
  ) {
    const destinationCard =
      HighSteaks.getOpponentPlayedCardById(
        capturedCard.cardId
      );

    if (
      !destinationCard ||
      typeof destinationCard.animate !==
        "function" ||
      !HighSteaks.shouldAnimateCardMotion()
    ) {
      return Promise.resolve(false);
    }

    const destinationBounds =
      destinationCard
        .getBoundingClientRect();

    const destinationCenterX =
      destinationBounds.left +
      destinationBounds.width / 2;

    const destinationCenterY =
      destinationBounds.top +
      destinationBounds.height / 2;

    const playZone =
      destinationCard.closest(
        ".high-steaks-play-zone-opponent"
      );

    const playZoneScale =
      HighSteaks.getRenderedElementScale(
        playZone
      );

    const startingTranslationX =
      (
        capturedCard.bounds.centerX -
        destinationCenterX
      ) /
      Math.max(
        0.001,
        playZoneScale.x
      );

    const startingTranslationY =
      (
        capturedCard.bounds.centerY -
        destinationCenterY
      ) /
      Math.max(
        0.001,
        playZoneScale.y
      );

    const startingScaleX =
      capturedCard.bounds.width /
      destinationBounds.width;

    const startingScaleY =
      capturedCard.bounds.height /
      destinationBounds.height;

    destinationCard.classList.add(
      "is-high-steaks-dealer-moving"
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
              "0deg"
          },

          {
            offset: 0.82,

            translate:
              "0px -3px",

            scale:
              "1.025 1.025",

            rotate:
              index === 0
                ? "-1deg"
                : "1deg"
          },

          {
            offset: 1,

            translate:
              "0px 0px",

            scale:
              "1 1",

            rotate:
              "0deg"
          }
        ],
        {
          duration:
            HighSteaks.ROUND_SETTINGS
              .dealerPlacementDurationMs,

          delay:
            index *
            HighSteaks.ROUND_SETTINGS
              .dealerPlacementStaggerMs,

          easing:
            "cubic-bezier(0.18, 0.84, 0.24, 1)",

          fill:
            "both"
        }
      );

    return animation.finished
      .then(
        () => {
          destinationCard.classList.remove(
            "is-high-steaks-dealer-moving"
          );

          animation.cancel();

          return true;
        },
        () => false
      );
  };

HighSteaks.animateTeddPlacedCards =
  function animateTeddPlacedCards(
    capturedCards
  ) {
    return Promise.all(
      capturedCards.map(
        (
          capturedCard,
          index
        ) =>
          HighSteaks.animateTeddPlacedCard(
            capturedCard,
            index
          )
      )
    );
  };

/* ==========================================================
   7. OPPONENT HAND REFLOW
========================================================== */

HighSteaks.animateTeddHandReflow =
  function animateTeddHandReflow(
    capturedCards
  ) {
    if (
      !HighSteaks.shouldAnimateCardMotion()
    ) {
      return;
    }

    const handScale =
      HighSteaks.getRenderedElementScale(
        highSteaksOpponentHand
      );

    capturedCards.forEach(
      (
        capturedCard,
        index
      ) => {
        const cardElement =
          HighSteaks
            .getOpponentHandCardById(
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
          cardElement
            .getBoundingClientRect();

        const translationX =
          (
            capturedCard.bounds.left -
            newBounds.left
          ) /
          Math.max(
            0.001,
            handScale.x
          );

        const translationY =
          (
            capturedCard.bounds.top -
            newBounds.top
          ) /
          Math.max(
            0.001,
            handScale.y
          );

        const animation =
          cardElement.animate(
            [
              {
                translate:
                  `${translationX}px ${translationY}px`
              },

              {
                offset: 0.84,

                translate:
                  `${translationX * -0.04}px ${translationY * -0.04}px`
              },

              {
                translate:
                  "0px 0px"
              }
            ],
            {
              duration:
                HIGH_STEAKS_HAND_REFLOW_DURATION_MS,

              delay:
                index * 14,

              easing:
                "cubic-bezier(0.16, 0.86, 0.26, 1)",

              fill:
                "both"
            }
          );

        animation.finished.then(
          () => animation.cancel(),
          () => {}
        );
      }
    );
  };

/* ==========================================================
   8. T.E.D.D. CARD REVEAL
========================================================== */

HighSteaks.flipTeddCard =
  async function flipTeddCard(
    card,
    index
  ) {
    await HighSteaks.wait(
      index *
      HighSteaks.ROUND_SETTINGS
        .dealerFlipStaggerMs
    );

    const cardBack =
      HighSteaks.getOpponentPlayedCardById(
        card.id
      );

    if (!cardBack) {
      return false;
    }

    cardBack.classList.add(
      "is-high-steaks-dealer-flipping"
    );

    if (
      typeof cardBack.animate ===
        "function" &&
      HighSteaks.shouldAnimateCardMotion()
    ) {
      const firstHalf =
        cardBack.animate(
          [
            {
              transform:
                "rotateY(0deg)"
            },

            {
              transform:
                "rotateY(90deg)"
            }
          ],
          {
            duration:
              HighSteaks.ROUND_SETTINGS
                .dealerFlipHalfDurationMs,

            easing:
              "ease-in",

            fill:
              "both"
          }
        );

      await firstHalf.finished.catch(
        () => {}
      );

      firstHalf.cancel();
    }

    const cardFace =
      HighSteaks.createCardFaceElement(
        card
      );

    cardFace.classList.add(
      "high-steaks-opponent-played-card",
      "is-high-steaks-dealer-flipping"
    );

    cardBack.replaceWith(
      cardFace
    );

    if (
      typeof cardFace.animate ===
        "function" &&
      HighSteaks.shouldAnimateCardMotion()
    ) {
      const secondHalf =
        cardFace.animate(
          [
            {
              transform:
                "rotateY(-90deg)"
            },

            {
              transform:
                "rotateY(0deg)"
            }
          ],
          {
            duration:
              HighSteaks.ROUND_SETTINGS
                .dealerFlipHalfDurationMs,

            easing:
              "ease-out",

            fill:
              "both"
          }
        );

      await secondHalf.finished.catch(
        () => {}
      );

      secondHalf.cancel();
    }

    cardFace.classList.remove(
      "is-high-steaks-dealer-flipping"
    );

    return true;
  };

HighSteaks.flipTeddCards =
  function flipTeddCards(
    cards
  ) {
    return Promise.all(
      cards.map(
        (
          card,
          index
        ) =>
          HighSteaks.flipTeddCard(
            card,
            index
          )
      )
    );
  };

/* ==========================================================
   9. ROUND RESOLUTION
========================================================== */

HighSteaks.resolveRound =
  async function resolveRound(
    state,
    runId
  ) {
    if (
      !HighSteaks.isRoundSequenceCurrent(
        runId,
        state
      )
    ) {
      return false;
    }

    const playerTotal =
      HighSteaks.getCardTotal(
        state.player.playedCards
      );

    const opponentTotal =
      HighSteaks.getCardTotal(
        state.opponent.playedCards
      );

    state.player.matchTotal +=
      playerTotal;

    state.opponent.matchTotal +=
      opponentTotal;

    let result = "tie";

    if (playerTotal > opponentTotal) {
      result = "player";
      state.player.wins += 1;
    } else if (
      opponentTotal > playerTotal
    ) {
      result = "opponent";
      state.opponent.wins += 1;
    }

    state.history.push(
      result
    );

    state.lastRound = {
      round:
        state.round,

      suddenDeath:
        state.suddenDeath,

      playerTotal,

      opponentTotal,

      result
    };

    state.phase =
      HighSteaks.PHASE_ROUND_RESULT;

    state.phaseText =
      result === "player"
        ? `YOU WIN ${playerTotal} TO ${opponentTotal}`
        : result === "opponent"
          ? `T.E.D.D. WINS ${opponentTotal} TO ${playerTotal}`
          : `ROUND TIED AT ${playerTotal}`;

    HighSteaks.refreshRoundHud(
      state
    );

    await HighSteaks.wait(
      HighSteaks.ROUND_SETTINGS
        .roundResultDurationMs
    );

    if (
      !HighSteaks.isRoundSequenceCurrent(
        runId,
        state
      )
    ) {
      return false;
    }

    if (
      state.player.wins >=
        state.winsRequired ||
      state.opponent.wins >=
        state.winsRequired
    ) {
      HighSteaks.finishMatch(
        state,
        state.player.wins >
          state.opponent.wins
          ? "player"
          : "opponent"
      );

      return true;
    }

    if (state.suddenDeath) {
      if (result === "tie") {
        HighSteaks.startSuddenDeath(
          state
        );
      } else {
        HighSteaks.finishMatch(
          state,
          result
        );
      }

      return true;
    }

    if (
      state.round >=
      state.maximumRounds
    ) {
      if (
        state.player.wins ===
        state.opponent.wins
      ) {
        HighSteaks.startSuddenDeath(
          state
        );
      } else {
        HighSteaks.finishMatch(
          state,
          state.player.wins >
            state.opponent.wins
            ? "player"
            : "opponent"
        );
      }

      return true;
    }

    HighSteaks.startNextRound(
      state
    );

    return true;
  };

/* ==========================================================
   10. NEXT ROUND
========================================================== */

HighSteaks.startNextRound =
  async function startNextRound(
    state
  ) {
    await HighSteaks.wait(
      HighSteaks.ROUND_SETTINGS
        .nextRoundDelayMs
    );

    state.player.playedCards = [];
    state.player.selectedCardIds = [];

    state.opponent.playedCards = [];
    state.opponent.selectedCardIds = [];
    state.opponent.cardsRevealed = false;

    state.round += 1;

    state.phase =
      HighSteaks.PHASE_PLAYER_TURN;

    state.sceneState =
      "table";

    state.locked = false;

    state.phaseText =
      "CHOOSE EXACTLY TWO CARDS";

    HighSteaks.renderPrototype();
  };

/* ==========================================================
   11. SUDDEN DEATH
========================================================== */

HighSteaks.startSuddenDeath =
  async function startSuddenDeath(
    state
  ) {
    await HighSteaks.wait(
      HighSteaks.ROUND_SETTINGS
        .nextRoundDelayMs
    );

    const dealerDefinition =
      HighSteaks.DEALER_DEFINITIONS[
        state.dealerId
      ] ||
      HighSteaks.DEALER_DEFINITIONS.tedd;

    const sharedCards =
      HighSteaks.shuffleCards(
        HighSteaks.createStandardDeck()
      ).slice(
        0,
        HighSteaks.ROUND_SETTINGS
          .suddenDeathHandSize
      );

    const playerOrder =
      HighSteaks.createParticipantHandOrder(
        sharedCards
      );

    const opponentOrder =
      HighSteaks.createParticipantHandOrder(
        sharedCards,
        playerOrder
      );

    const nextPlayer =
      HighSteaks.createPlayerState(
        playerOrder
      );

    const nextOpponent =
      HighSteaks.createOpponentState(
        dealerDefinition,
        opponentOrder
      );

    nextPlayer.wins =
      state.player.wins;

    nextPlayer.matchTotal =
      state.player.matchTotal;

    nextOpponent.wins =
      state.opponent.wins;

    nextOpponent.matchTotal =
      state.opponent.matchTotal;

    state.player =
      nextPlayer;

    state.opponent =
      nextOpponent;

    state.suddenDeath = true;
    state.suddenDeathRound += 1;

    state.round =
      state.maximumRounds +
      state.suddenDeathRound;

    state.screen =
      HighSteaks.SCREEN_TABLE;

    state.sceneState =
      "table";

    state.phase =
      HighSteaks.PHASE_DEALING;

    state.locked = true;

    state.phaseText =
      "SUDDEN DEATH";

    state.deal = {
      playerVisible: 0,
      opponentVisible: 0,
      complete: false
    };

    HighSteaks.renderPrototype();

    HighSteaks.startOpeningDeal({
      openingDelayMs:
        HighSteaks.ROUND_SETTINGS
          .suddenDeathOpeningDelayMs,

      phaseText:
        "T.E.D.D. DEALS SUDDEN DEATH"
    });
  };

/* ==========================================================
   12. MATCH RESULT
========================================================== */

HighSteaks.finishMatch =
  function finishMatch(
    state,
    winner
  ) {
    state.phase =
      HighSteaks.PHASE_MATCH_RESULT;

    state.screen =
      HighSteaks.SCREEN_RESULTS;

    state.sceneState =
      "results";

    state.locked = true;

    const playerWon =
      winner === "player";

    const opponentWon =
      winner === "opponent";

    state.matchResult = {
      winner,

      suddenDeath:
        state.suddenDeath,

      heading:
        playerWon
          ? "YOU WIN"
          : opponentWon
            ? "T.E.D.D. WINS"
            : "MATCH DRAWN",

      summary:
        `Final score: ${
          state.player.wins
        }–${
          state.opponent.wins
        }${
          state.suddenDeath
            ? " after sudden death."
            : "."
        }`
    };

    HighSteaks.renderPrototype();

    window.requestAnimationFrame(
      () => {
        highSteaksRematchButton?.focus({
          preventScroll: true
        });
      }
    );
  };

/* ==========================================================
   13. T.E.D.D. TURN
========================================================== */

HighSteaks.startTeddTurn =
  async function startTeddTurn(
    state
  ) {
    const runId =
      HighSteaks.roundSequenceRunId + 1;

    HighSteaks.roundSequenceRunId =
      runId;

    await HighSteaks.wait(
      HighSteaks.ROUND_SETTINGS
        .playerPlacementLeadMs +
      HighSteaks.ROUND_SETTINGS
        .dealerThinkMs
    );

    if (
      !HighSteaks.isRoundSequenceCurrent(
        runId,
        state
      )
    ) {
      return false;
    }

    const selectedCards =
      HighSteaks.chooseTeddCards(
        state
      );

    if (
      selectedCards.length !==
      HighSteaks.MATCH_SETTINGS
        .cardsPerPlay
    ) {
      return false;
    }

    const selectedCardIds =
      selectedCards.map(
        (card) => card.id
      );

    const selectedIds =
      new Set(selectedCardIds);

    const placementMotion =
      HighSteaks.captureTeddPlacementMotion(
        selectedCardIds
      );

    const handReflow =
      HighSteaks.captureTeddHandReflow(
        selectedCardIds
      );

    state.opponent.selectedCardIds =
      selectedCardIds;

    state.opponent.playedCards =
      selectedCards;

    state.opponent.hand =
      state.opponent.hand.filter(
        (card) =>
          !selectedIds.has(
            card.id
          )
      );

    state.opponent.handSize =
      state.opponent.hand.length;

    state.opponent.cardsRevealed =
      false;

    state.phase =
      HighSteaks.PHASE_DEALER_TURN;

    state.phaseText =
      "T.E.D.D. PLACES HIS CARDS";

    HighSteaks.renderOpponentHand(
      state
    );

    HighSteaks.renderOpponentPlayZone(
      state
    );

    HighSteaks.refreshRoundHud(
      state
    );

    HighSteaks.animateTeddHandReflow(
      handReflow
    );

    await HighSteaks.animateTeddPlacedCards(
      placementMotion
    );

    if (
      !HighSteaks.isRoundSequenceCurrent(
        runId,
        state
      )
    ) {
      return false;
    }

    await HighSteaks.wait(
      HighSteaks.ROUND_SETTINGS
        .dealerRevealPauseMs
    );

    state.phase =
      HighSteaks.PHASE_REVEAL;

    state.phaseText =
      "T.E.D.D. REVEALS";

    HighSteaks.refreshRoundHud(
      state
    );

    await HighSteaks.flipTeddCards(
      selectedCards
    );

    state.opponent.cardsRevealed =
      true;

    return HighSteaks.resolveRound(
      state,
      runId
    );
  };

/* ==========================================================
   14. ROUND LIFECYCLE
========================================================== */

document.addEventListener(
  "high-steaks:closed",
  HighSteaks.cancelRoundSequence
);
