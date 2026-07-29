/* ==========================================================
   1. STANDARD DECK CREATION
========================================================== */

HighSteaks.createStandardDeck = function createStandardDeck() {
  const deck = [];

  for (const suit of HighSteaks.CARD_SUITS) {
    for (const rank of HighSteaks.CARD_RANKS) {
      deck.push({
        id:
          `${rank.rank.toLowerCase()}-${suit.id}`,

        rank:
          rank.rank,

        value:
          rank.value,

        suit:
          suit.id,

        symbol:
          suit.symbol,

        color:
          suit.color
      });
    }
  }

  return deck;
};

/* ==========================================================
   2. DECK SHUFFLING
========================================================== */

HighSteaks.shuffleCards = function shuffleCards(
  cards
) {
  const shuffledCards = Array.isArray(cards)
    ? cards.map((card) => ({ ...card }))
    : [];

  for (
    let index = shuffledCards.length - 1;
    index > 0;
    index -= 1
  ) {
    const replacementIndex =
      Math.floor(
        Math.random() *
        (index + 1)
      );

    [
      shuffledCards[index],
      shuffledCards[replacementIndex]
    ] = [
      shuffledCards[replacementIndex],
      shuffledCards[index]
    ];
  }

  return shuffledCards;
};

/* ==========================================================
   3. SHARED OPENING HAND
   ----------------------------------------------------------
   One random ten-card spread is created. Both the player and
   T.E.D.D. receive separate copies of the same cards in the
   same order.
========================================================== */

HighSteaks.createSharedOpeningHand =
  function createSharedOpeningHand() {
    return HighSteaks.shuffleCards(
      HighSteaks.createStandardDeck()
    ).slice(
      0,
      HighSteaks.MATCH_SETTINGS
        .openingHandSize
    );
  };

HighSteaks.cloneCardForOwner =
  function cloneCardForOwner(
    card,
    ownerId,
    dealIndex
  ) {
    return {
      ...card,

      id:
        `${ownerId}-${card.id}`,

      sourceCardId:
        card.id,

      ownerId,

      dealIndex
    };
  };

/* ==========================================================
   4. PARTICIPANT STATE
========================================================== */

HighSteaks.createPlayerState =
  function createPlayerState(
    sharedCards = []
  ) {
    return {
      wins: 0,

      matchTotal: 0,

      hand:
        sharedCards.map(
          (card, index) =>
            HighSteaks.cloneCardForOwner(
              card,
              "player",
              index
            )
        ),

      selectedCardIds: [],

      playedCards: []
    };
  };

HighSteaks.createOpponentState =
  function createOpponentState(
    dealerDefinition,
    sharedCards = []
  ) {
    return {
      id:
        dealerDefinition.id,

      name:
        dealerDefinition.name,

      wins: 0,

      matchTotal: 0,

      hand:
        sharedCards.map(
          (card, index) =>
            HighSteaks.cloneCardForOwner(
              card,
              "opponent",
              index
            )
        ),

      handSize:
        sharedCards.length,

      selectedCardIds: [],

      playedCards: [],

      cardsRevealed: false
    };
  };

/* ==========================================================
   5. LOBBY STATE
========================================================== */

HighSteaks.createLobbyState =
  function createLobbyState() {
    const dealerDefinition =
      HighSteaks.DEALER_DEFINITIONS.tedd;

    return {
      screen:
        HighSteaks.SCREEN_LOBBY,

      sceneState:
        "lobby",

      phase:
        HighSteaks.PHASE_IDLE,

      dealerId:
        null,

      difficultyId:
        null,

      round: 1,

      maximumRounds:
        HighSteaks.MATCH_SETTINGS
          .maximumRounds,

      winsRequired:
        HighSteaks.MATCH_SETTINGS
          .winsRequired,

      ruleName:
        "STANDARD DUEL",

      phaseText:
        "SELECT A GAME",

      opponent:
        HighSteaks.createOpponentState(
          dealerDefinition
        ),

      player:
        HighSteaks.createPlayerState(),

      deal: {
        playerVisible: 0,
        opponentVisible: 0,
        complete: false
      },

      history: [],

      lastRound: null,

      matchResult: null,

      locked: true
    };
  };

/* ==========================================================
   6. ACTIVE MATCH STATE
========================================================== */

HighSteaks.createMatchState =
  function createMatchState(
    dealerId,
    difficultyId
  ) {
    const dealerDefinition =
      HighSteaks.DEALER_DEFINITIONS[
        dealerId
      ] ||
      HighSteaks.DEALER_DEFINITIONS.tedd;

    const difficultyDefinition =
      HighSteaks.DIFFICULTY_DEFINITIONS[
        difficultyId
      ] ||
      HighSteaks.DIFFICULTY_DEFINITIONS
        .standard;

    const sharedCards =
      HighSteaks.createSharedOpeningHand();

    return {
      screen:
        HighSteaks.SCREEN_TABLE,

      sceneState:
        "table",

      phase:
        HighSteaks.PHASE_DEALING,

      dealerId:
        dealerDefinition.id,

      difficultyId:
        difficultyDefinition.id,

      round: 1,

      maximumRounds:
        HighSteaks.MATCH_SETTINGS
          .maximumRounds,

      winsRequired:
        HighSteaks.MATCH_SETTINGS
          .winsRequired,

      ruleName:
        `${difficultyDefinition.label} DUEL`,

      phaseText:
        "PREPARING THE TABLE",

      opponent:
        HighSteaks.createOpponentState(
          dealerDefinition,
          sharedCards
        ),

      player:
        HighSteaks.createPlayerState(
          sharedCards
        ),

      deal: {
        playerVisible: 0,
        opponentVisible: 0,
        complete: false
      },

      history: [],

      lastRound: null,

      matchResult: null,

      locked: true
    };
  };

/* ==========================================================
   7. INITIAL RUNTIME STATE
========================================================== */

HighSteaks.prototypeState =
  HighSteaks.createLobbyState();
