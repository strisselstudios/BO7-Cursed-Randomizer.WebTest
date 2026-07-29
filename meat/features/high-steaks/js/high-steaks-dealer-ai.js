/* ==========================================================
   1. PAIR OPTION GENERATION
========================================================== */

HighSteaks.createCardPairOptions =
  function createCardPairOptions(
    hand
  ) {
    const cards =
      Array.isArray(hand)
        ? hand
        : [];

    const options = [];

    for (
      let firstIndex = 0;
      firstIndex < cards.length - 1;
      firstIndex += 1
    ) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < cards.length;
        secondIndex += 1
      ) {
        const firstCard =
          cards[firstIndex];

        const secondCard =
          cards[secondIndex];

        options.push({
          cards: [
            firstCard,
            secondCard
          ],

          total:
            Number(firstCard.value) +
            Number(secondCard.value),

          highCard:
            Math.max(
              Number(firstCard.value),
              Number(secondCard.value)
            )
        });
      }
    }

    return options;
  };

/* ==========================================================
   2. STANDARD AI TARGET
   ----------------------------------------------------------
   T.E.D.D. considers only his own remaining cards and match
   score. The player's selected cards are never inspected.
========================================================== */

HighSteaks.getTeddStandardTarget =
  function getTeddStandardTarget(
    state,
    pairOptions
  ) {
    const totals =
      pairOptions.map(
        (option) => option.total
      );

    const minimumTotal =
      Math.min(...totals);

    const maximumTotal =
      Math.max(...totals);

    const totalRange =
      Math.max(
        0,
        maximumTotal -
        minimumTotal
      );

    const remainingPlays =
      Math.max(
        1,
        Math.ceil(
          state.opponent.hand.length /
          HighSteaks.MATCH_SETTINGS
            .cardsPerPlay
        )
      );

    const remainingCardTotal =
      state.opponent.hand.reduce(
        (total, card) =>
          total +
          Number(card.value || 0),
        0
      );

    let target =
      remainingCardTotal /
      remainingPlays;

    const scoreDifference =
      state.player.wins -
      state.opponent.wins;

    if (state.suddenDeath) {
      return maximumTotal;
    }

    if (scoreDifference > 0) {
      target +=
        totalRange *
        HighSteaks
          .TEDD_STANDARD_AI_SETTINGS
          .trailingTargetAdjustment;
    } else if (scoreDifference < 0) {
      target +=
        totalRange *
        HighSteaks
          .TEDD_STANDARD_AI_SETTINGS
          .leadingTargetAdjustment;
    } else if (state.round >= 4) {
      target +=
        totalRange *
        HighSteaks
          .TEDD_STANDARD_AI_SETTINGS
          .lateRoundTargetAdjustment;
    }

    return Math.min(
      maximumTotal,
      Math.max(
        minimumTotal,
        target
      )
    );
  };

/* ==========================================================
   3. STANDARD T.E.D.D. SELECTION
========================================================== */

HighSteaks.chooseTeddCards =
  function chooseTeddCards(
    state
  ) {
    const pairOptions =
      HighSteaks.createCardPairOptions(
        state?.opponent?.hand
      );

    if (pairOptions.length === 0) {
      return [];
    }

    if (pairOptions.length === 1) {
      return [
        ...pairOptions[0].cards
      ];
    }

    const target =
      HighSteaks.getTeddStandardTarget(
        state,
        pairOptions
      );

    const scoredOptions =
      pairOptions
        .map(
          (option) => ({
            ...option,

            distance:
              Math.abs(
                option.total -
                target
              )
          })
        )
        .sort(
          (
            firstOption,
            secondOption
          ) =>
            firstOption.distance -
              secondOption.distance ||
            secondOption.highCard -
              firstOption.highCard
        );

    const bestDistance =
      scoredOptions[0].distance;

    const candidates =
      scoredOptions.filter(
        (option) =>
          option.distance <=
          bestDistance +
          HighSteaks
            .TEDD_STANDARD_AI_SETTINGS
            .candidateTolerance
      );

    const selectedOption =
      candidates[
        Math.floor(
          Math.random() *
          candidates.length
        )
      ] ||
      scoredOptions[0];

    return [
      ...selectedOption.cards
    ];
  };
