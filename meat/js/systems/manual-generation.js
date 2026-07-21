/* ==========================================================
   1. MANUAL MEAT GENERATION
   ----------------------------------------------------------
   Awards meat from pointer and keyboard input, triggers click
   feedback, and updates the visible game state immediately.
========================================================== */

function generateMeatFromClick(event) {
  const amount = gameState.meatPerClick;

  gameState.meat += amount;
  gameState.totalMeat += amount;
  gameState.totalClicks += 1;

  createMeatParticles(event);
  createFloatingMeatText(event, amount);

  updateGameDisplay();
}

meatButton.addEventListener(
  "dblclick",
  (event) => {
    event.preventDefault();
  }
);

meatButton.addEventListener(
  "contextmenu",
  (event) => {
    event.preventDefault();
  }
);

let keyboardMeatPressActive = false;

function createCenteredMeatEvent() {
  const bounds =
    meatButton.getBoundingClientRect();

  return {
    clientX:
      bounds.left + bounds.width / 2,

    clientY:
      bounds.top + bounds.height / 2
  };
}

function finishKeyboardMeatInteraction() {
  if (!keyboardMeatPressActive) {
    return;
  }

  keyboardMeatPressActive = false;

  meatButton.parentElement.classList.remove(
    "meat-interacting"
  );

  resetMeatFollowTarget();
  playMeatReleaseSound();
  releaseMeatImpact();
}

meatButton.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();

    if (
      event.repeat ||
      keyboardMeatPressActive
    ) {
      return;
    }

    keyboardMeatPressActive = true;

    const centerEvent =
      createCenteredMeatEvent();

    meatButton.parentElement.classList.add(
      "meat-interacting"
    );

    setMeatFollowTarget(centerEvent);
    updateHeldMeatImpact(centerEvent);

    playMeatPressSound();
    generateMeatFromClick(centerEvent);

    startMeatHitStop();
    startMeatFollowMotion();
  }
);

meatButton.addEventListener(
  "keyup",
  (event) => {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();

    finishKeyboardMeatInteraction();
  }
);

window.addEventListener(
  "blur",
  finishKeyboardMeatInteraction
);
