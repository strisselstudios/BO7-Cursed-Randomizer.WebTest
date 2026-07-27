/* ==========================================================
   1. TITLE SCREEN PROGRESSION
========================================================== */

function proceedFromNachtRaidersTitleScreen() {
  if (
    typeof isNachtRaidersWindowOpen !==
      "function" ||
    !isNachtRaidersWindowOpen() ||
    nachtRaidersTitleScreen?.hidden
  ) {
    return false;
  }

  if (
    typeof updateNachtRaidersMenu ===
    "function"
  ) {
    updateNachtRaidersMenu();
  }

  const screenChanged =
    showNachtRaidersMenuScreen();

  if (!screenChanged) {
    return false;
  }

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:title-proceeded"
    )
  );

  window.requestAnimationFrame(
    () => {
      nachtRaidersPrimaryButton?.focus({
        preventScroll: true
      });
    }
  );

  return true;
}

/* ==========================================================
   2. TITLE SCREEN INPUT
========================================================== */

nachtRaidersTitleButton
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      proceedFromNachtRaidersTitleScreen();
    }
  );

nachtRaidersTitleButton
  ?.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      proceedFromNachtRaidersTitleScreen();
    }
  );

/* ==========================================================
   3. TITLE SCREEN FOCUS
========================================================== */

document.addEventListener(
  "nacht-raiders:screen-changed",
  (event) => {
    if (
      event.detail?.screen !==
      NACHT_RAIDERS_SCREEN_TITLE
    ) {
      return;
    }

    window.requestAnimationFrame(
      () => {
        nachtRaidersTitleButton?.focus({
          preventScroll: true
        });
      }
    );
  }
);
