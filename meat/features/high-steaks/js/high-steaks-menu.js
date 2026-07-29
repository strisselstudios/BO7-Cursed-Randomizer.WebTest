/* ==========================================================
   1. INTERFACE SCREEN DISPLAY
========================================================== */

HighSteaks.applyInterfaceScreen =
  function applyInterfaceScreen(
    screenName
  ) {
    const normalizedScreen =
      HighSteaks.SCREENS.includes(
        screenName
      )
        ? screenName
        : HighSteaks.SCREEN_LOBBY;

    if (highSteaksScene) {
      highSteaksScene.dataset
        .highSteaksScreen =
        normalizedScreen;
    }

    if (highSteaksLobbyScreen) {
      highSteaksLobbyScreen.hidden =
        normalizedScreen !==
        HighSteaks.SCREEN_LOBBY;
    }

    if (
      highSteaksDealerSelectScreen
    ) {
      highSteaksDealerSelectScreen.hidden =
        normalizedScreen !==
        HighSteaks
          .SCREEN_DEALER_SELECT;
    }

    if (highSteaksPerspectiveStage) {
            const tableVisible =
        normalizedScreen ===
          HighSteaks.SCREEN_TABLE ||
        normalizedScreen ===
          HighSteaks.SCREEN_RESULTS;
      highSteaksPerspectiveStage
        .setAttribute(
          "aria-hidden",
          String(!tableVisible)
        );
    }

    return normalizedScreen;
  };

/* ==========================================================
   2. LOBBY NAVIGATION
========================================================== */

HighSteaks.showLobby =
  function showLobby() {
    HighSteaks.cancelOpeningDeal?.();
         HighSteaks.cancelRoundSequence?.();

    HighSteaks.prototypeState =
      HighSteaks.createLobbyState();

    HighSteaks.renderPrototype();

    window.requestAnimationFrame(
      () => {
        highSteaksPlayButton?.focus({
          preventScroll: true
        });
      }
    );

    return true;
  };

HighSteaks.showDealerSelection =
  function showDealerSelection() {
    const state =
      HighSteaks.prototypeState ||
      HighSteaks.createLobbyState();

    state.screen =
      HighSteaks
        .SCREEN_DEALER_SELECT;

    state.sceneState =
      "lobby";

    state.phase =
      HighSteaks.PHASE_IDLE;

    HighSteaks.prototypeState =
      state;

    HighSteaks.renderPrototype();

    window.requestAnimationFrame(
      () => {
        highSteaksTeddStandardButton
          ?.focus({
            preventScroll: true
          });
      }
    );

    return true;
  };

/* ==========================================================
   3. MATCH START
========================================================== */

HighSteaks.startMatch =
  function startMatch(
    dealerId,
    difficultyId
  ) {
    HighSteaks.cancelOpeningDeal?.();
             HighSteaks.cancelRoundSequence?.();

    HighSteaks.prototypeState =
      HighSteaks.createMatchState(
        dealerId,
        difficultyId
      );

    HighSteaks.renderPrototype();

    HighSteaks.startOpeningDeal();

    return true;
  };

/* ==========================================================
   4. MENU INPUT
========================================================== */

highSteaksPlayButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      HighSteaks
        .showDealerSelection();
    }
  );

highSteaksDealerBackButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      HighSteaks.showLobby();
    }
  );

highSteaksTeddStandardButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      HighSteaks.startMatch(
        event.currentTarget.dataset
          .highSteaksDealerId ||
          "tedd",

        event.currentTarget.dataset
          .highSteaksDifficultyId ||
          "standard"
      );
    }
  );
/* ==========================================================
   5. MATCH RESULT INPUT
========================================================== */

highSteaksRematchButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      const state =
        HighSteaks.prototypeState;

      HighSteaks.startMatch(
        state?.dealerId || "tedd",
        state?.difficultyId || "standard"
      );
    }
  );

highSteaksResultsMenuButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      HighSteaks.showLobby();
    }
  );
