/* ==========================================================
   1. RANDOMIZER NAVIGATION CONFIRMATION
   ----------------------------------------------------------
   Intercepts the header return link and asks the player to
   confirm before leaving MEAT.exe.
========================================================== */

let randomizerNavigationPreviouslyFocusedElement =
  null;


/* ==========================================================
   1.1 OPEN CONFIRMATION
   ----------------------------------------------------------
   Displays the confirmation interface and moves keyboard
   focus to the safer option: remaining in MEAT.exe.
========================================================== */

function openRandomizerNavigationConfirmation() {
  if (
    !randomizerNavigationOverlay ||
    !cancelRandomizerNavigationButton
  ) {
    return;
  }

  randomizerNavigationPreviouslyFocusedElement =
    document.activeElement;

  randomizerNavigationOverlay.hidden = false;

  document.body.classList.add(
    "randomizer-navigation-open"
  );

  cancelRandomizerNavigationButton.focus();
}


/* ==========================================================
   1.2 CLOSE CONFIRMATION
   ----------------------------------------------------------
   Hides the confirmation interface and restores focus to the
   back-arrow control.
========================================================== */

function closeRandomizerNavigationConfirmation() {
  if (!randomizerNavigationOverlay) {
    return;
  }

  randomizerNavigationOverlay.hidden = true;

  document.body.classList.remove(
    "randomizer-navigation-open"
  );

  if (
    randomizerNavigationPreviouslyFocusedElement
    instanceof HTMLElement
  ) {
    randomizerNavigationPreviouslyFocusedElement.focus();
  }
}


/* ==========================================================
   1.3 CONFIRM NAVIGATION
   ----------------------------------------------------------
   Saves the current game when possible and then follows the
   original return-link destination.
========================================================== */

function confirmRandomizerNavigation() {
  if (!randomizerReturnButton) {
    return;
  }

  if (typeof saveGame === "function") {
    saveGame();
  }

  window.location.assign(
    randomizerReturnButton.href
  );
}


/* ==========================================================
   1.4 NAVIGATION EVENT LISTENERS
   ----------------------------------------------------------
   Supports mouse, touch, keyboard, Escape, and clicking the
   darkened area outside the confirmation box.
========================================================== */

if (
  randomizerReturnButton &&
  randomizerNavigationOverlay &&
  confirmRandomizerNavigationButton &&
  cancelRandomizerNavigationButton
) {
  randomizerReturnButton.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      openRandomizerNavigationConfirmation();
    }
  );

  confirmRandomizerNavigationButton.addEventListener(
    "click",
    confirmRandomizerNavigation
  );

  cancelRandomizerNavigationButton.addEventListener(
    "click",
    closeRandomizerNavigationConfirmation
  );

  randomizerNavigationOverlay.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        randomizerNavigationOverlay
      ) {
        closeRandomizerNavigationConfirmation();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !randomizerNavigationOverlay.hidden
      ) {
        closeRandomizerNavigationConfirmation();
      }
    }
  );
}
