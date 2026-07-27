/* ==========================================================
   1. BOOT-SEQUENCE STATE
========================================================== */

let nachtRaidersBootRunId =
  0;

let nachtRaidersBootIsRunning =
  false;

let nachtRaidersBootIsComplete =
  false;

let nachtRaidersBootTimerId =
  null;

let nachtRaidersBootDelayResolver =
  null;

/* ==========================================================
   2. BOOT-SCREEN SETTING
========================================================== */

function isNachtRaidersBootScreenEnabled() {
  return (
    gameState.settings
      .nachtRaidersBootScreen !==
    false
  );
}

function shouldBypassNachtRaidersBootScreen() {
  const animationsAreDisabled =
    gameState.settings.animations ===
      false ||
    document.body.classList.contains(
      "animations-disabled"
    );

  const reducedMotionIsRequested =
    typeof window.matchMedia ===
      "function" &&
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  return (
    !isNachtRaidersBootScreenEnabled() ||
    animationsAreDisabled ||
    reducedMotionIsRequested
  );
}

function updateNachtRaidersBootSettingControl() {
  if (
    !nachtRaidersBootSettingRow ||
    !nachtRaidersBootToggle
  ) {
    return;
  }

  const nachtRaidersIsUnlocked =
    typeof isNachtRaidersUnlocked ===
      "function" &&
    isNachtRaidersUnlocked();

  nachtRaidersBootSettingRow.hidden =
    !nachtRaidersIsUnlocked;

  nachtRaidersBootToggle.disabled =
    !nachtRaidersIsUnlocked;

  nachtRaidersBootToggle.checked =
    isNachtRaidersBootScreenEnabled();
}

nachtRaidersBootToggle
  ?.addEventListener(
    "change",
    () => {
      const nachtRaidersIsUnlocked =
        typeof isNachtRaidersUnlocked ===
          "function" &&
        isNachtRaidersUnlocked();

      if (!nachtRaidersIsUnlocked) {
        updateNachtRaidersBootSettingControl();

        return;
      }

      gameState.settings
        .nachtRaidersBootScreen =
          nachtRaidersBootToggle.checked;

      saveGame();
    }
  );

/* ==========================================================
   3. BOOT-SEQUENCE CANCELLABLE DELAY
========================================================== */

function clearNachtRaidersBootDelay() {
  if (
    nachtRaidersBootTimerId !==
    null
  ) {
    window.clearTimeout(
      nachtRaidersBootTimerId
    );

    nachtRaidersBootTimerId =
      null;
  }

  if (
    typeof nachtRaidersBootDelayResolver ===
      "function"
  ) {
    const resolvePendingDelay =
      nachtRaidersBootDelayResolver;

    nachtRaidersBootDelayResolver =
      null;

    resolvePendingDelay(
      false
    );
  }
}

function invalidateNachtRaidersBootRun() {
  nachtRaidersBootRunId +=
    1;

  nachtRaidersBootIsRunning =
    false;

  clearNachtRaidersBootDelay();
  removeNachtRaidersActiveCursor();

  return nachtRaidersBootRunId;
}

function waitForNachtRaidersBootDelay(
  durationMs,
  runId
) {
  if (
    runId !== nachtRaidersBootRunId
  ) {
    return Promise.resolve(
      false
    );
  }

  const normalizedDuration =
    Math.max(
      0,
      Number(durationMs) || 0
    );

  if (normalizedDuration === 0) {
    return Promise.resolve(
      runId ===
        nachtRaidersBootRunId
    );
  }

  return new Promise(
    (resolve) => {
      nachtRaidersBootDelayResolver =
        resolve;

      nachtRaidersBootTimerId =
        window.setTimeout(
          () => {
            const sequenceIsStillCurrent =
              runId ===
              nachtRaidersBootRunId;

            nachtRaidersBootTimerId =
              null;

            nachtRaidersBootDelayResolver =
              null;

            resolve(
              sequenceIsStillCurrent
            );
          },
          normalizedDuration
        );
    }
  );
}

/* ==========================================================
   4. TERMINAL OUTPUT HELPERS
========================================================== */

function clearNachtRaidersTerminalOutput() {
  if (!nachtRaidersTerminalOutput) {
    return;
  }

  nachtRaidersTerminalOutput
    .replaceChildren();

  nachtRaidersTerminalOutput.scrollTop =
    0;
}

function scrollNachtRaidersTerminalToBottom() {
  if (!nachtRaidersTerminalOutput) {
    return;
  }

  nachtRaidersTerminalOutput.scrollTop =
    nachtRaidersTerminalOutput
      .scrollHeight;
}

function createNachtRaidersBootLine(
  bootLine
) {
  const lineElement =
    document.createElement(
      "p"
    );

  const lineTone =
    typeof bootLine?.tone ===
      "string"
      ? bootLine.tone
      : NACHT_RAIDERS_BOOT_TONE_DEFAULT;

  lineElement.className =
    (
      "nacht-raiders-boot-line " +
      `nacht-raiders-boot-line-${lineTone}`
    );

  lineElement.textContent =
    "";

  nachtRaidersTerminalOutput
    ?.appendChild(
      lineElement
    );

  scrollNachtRaidersTerminalToBottom();

  return lineElement;
}

function removeNachtRaidersActiveCursor() {
  nachtRaidersTerminalOutput
    ?.querySelectorAll(
      ".nacht-raiders-boot-line-active"
    )
    .forEach(
      (lineElement) => {
        lineElement.classList.remove(
          "nacht-raiders-boot-line-active"
        );
      }
    );
}

function removeNachtRaidersProceedPrompt() {
  nachtRaidersTerminalOutput
    ?.querySelector(
      ".nacht-raiders-boot-proceed"
    )
    ?.remove();
}

function appendNachtRaidersProceedPrompt() {
  if (!nachtRaidersTerminalOutput) {
    return;
  }

  removeNachtRaidersProceedPrompt();

  const promptElement =
    document.createElement(
      "p"
    );

  promptElement.className =
    "nacht-raiders-boot-proceed";

  promptElement.textContent =
    NACHT_RAIDERS_BOOT_PROCEED_TEXT;

  nachtRaidersTerminalOutput
    .appendChild(
      promptElement
    );

  scrollNachtRaidersTerminalToBottom();
}

/* ==========================================================
   5. BOOT-LINE PRESENTATION
========================================================== */

function getNachtRaidersCharacterDelay(
  character
) {
  const baseDelay =
    Math.max(
      0,
      Number(
        NACHT_RAIDERS_BOOT_SETTINGS
          .characterDelayMs
      ) || 0
    );

  const jitterLimit =
    Math.max(
      0,
      Math.floor(
        Number(
          NACHT_RAIDERS_BOOT_SETTINGS
            .characterJitterMs
        ) || 0
      )
    );

  const randomJitter =
    jitterLimit > 0
      ? Math.floor(
          Math.random() *
          (
            jitterLimit + 1
          )
        )
      : 0;

  const punctuationDelay =
    /[.,:;!?]/.test(
      character
    )
      ? Math.max(
          0,
          Number(
            NACHT_RAIDERS_BOOT_SETTINGS
              .punctuationDelayMs
          ) || 0
        )
      : 0;

  return (
    baseDelay +
    randomJitter +
    punctuationDelay
  );
}

async function typeNachtRaidersBootLine(
  bootLine,
  runId
) {
  if (
    runId !== nachtRaidersBootRunId ||
    !nachtRaidersTerminalOutput
  ) {
    return false;
  }

  const lineElement =
    createNachtRaidersBootLine(
      bootLine
    );

  const lineText =
    typeof bootLine?.text ===
      "string"
      ? bootLine.text
      : "";

  const lineMode =
    bootLine?.mode ===
      NACHT_RAIDERS_BOOT_MODE_LINE
      ? NACHT_RAIDERS_BOOT_MODE_LINE
      : NACHT_RAIDERS_BOOT_MODE_CHARACTER;

  if (
    lineMode ===
    NACHT_RAIDERS_BOOT_MODE_LINE
  ) {
    lineElement.textContent =
      lineText || "\u00A0";

    scrollNachtRaidersTerminalToBottom();

    const lineDelayCompleted =
      await waitForNachtRaidersBootDelay(
        NACHT_RAIDERS_BOOT_SETTINGS
          .lineDelayMs,
        runId
      );

    if (!lineDelayCompleted) {
      return false;
    }
  } else {
    lineElement.classList.add(
      "nacht-raiders-boot-line-active"
    );

    if (lineText.length === 0) {
      lineElement.textContent =
        "\u00A0";
    }

    for (
      const character of lineText
    ) {
      if (
        runId !==
        nachtRaidersBootRunId
      ) {
        lineElement.classList.remove(
          "nacht-raiders-boot-line-active"
        );

        return false;
      }

      lineElement.textContent +=
        character;

      scrollNachtRaidersTerminalToBottom();

      const characterDelayCompleted =
        await waitForNachtRaidersBootDelay(
          getNachtRaidersCharacterDelay(
            character
          ),
          runId
        );

      if (!characterDelayCompleted) {
        lineElement.classList.remove(
          "nacht-raiders-boot-line-active"
        );

        return false;
      }
    }

    lineElement.classList.remove(
      "nacht-raiders-boot-line-active"
    );
  }

  const customPause =
    Number(
      bootLine?.pauseAfterMs
    );

  const pauseAfterLine =
    Number.isFinite(
      customPause
    )
      ? Math.max(
          0,
          customPause
        )
      : Math.max(
          0,
          Number(
            NACHT_RAIDERS_BOOT_SETTINGS
              .defaultPauseAfterLineMs
          ) || 0
        );

  return await waitForNachtRaidersBootDelay(
    pauseAfterLine,
    runId
  );
}

function renderNachtRaidersBootLineImmediately(
  bootLine
) {
  const lineElement =
    createNachtRaidersBootLine(
      bootLine
    );

  lineElement.textContent =
    bootLine.text ||
    "\u00A0";

  return lineElement;
}

function renderNachtRaidersBootImmediately() {
  clearNachtRaidersTerminalOutput();

  NACHT_RAIDERS_BOOT_LINES.forEach(
    (bootLine) => {
      renderNachtRaidersBootLineImmediately(
        bootLine
      );
    }
  );

  scrollNachtRaidersTerminalToBottom();
}

/* ==========================================================
   6. READY STATE AND MENU PROGRESSION
========================================================== */

function setNachtRaidersBootReady() {
  removeNachtRaidersActiveCursor();
  appendNachtRaidersProceedPrompt();

  nachtRaidersBootIsRunning =
    false;

  nachtRaidersBootIsComplete =
    true;

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:boot-ready"
    )
  );
}

function completeNachtRaidersBootImmediately() {
  if (
    typeof isNachtRaidersWindowOpen !==
      "function" ||
    !isNachtRaidersWindowOpen() ||
    nachtRaidersLoadingScreen?.hidden
  ) {
    return false;
  }

  invalidateNachtRaidersBootRun();

  renderNachtRaidersBootImmediately();

  renderNachtRaidersBootLineImmediately(
    NACHT_RAIDERS_BOOT_READY_LINE
  );

  setNachtRaidersBootReady();

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:boot-skipped"
    )
  );

  return true;
}

function proceedFromNachtRaidersBootToTitle() {
  if (
    !nachtRaidersBootIsComplete ||
    typeof showNachtRaidersScreen !==
      "function"
  ) {
    return false;
  }

  nachtRaidersBootIsComplete =
    false;

  showNachtRaidersScreen(
  NACHT_RAIDERS_SCREEN_TITLE
);

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:boot-proceeded"
    )
  );

  return true;
}

function handleNachtRaidersBootActivation() {
  if (
    typeof isNachtRaidersWindowOpen !==
      "function" ||
    !isNachtRaidersWindowOpen() ||
    nachtRaidersLoadingScreen?.hidden
  ) {
    return;
  }

  if (nachtRaidersBootIsRunning) {
    completeNachtRaidersBootImmediately();

    return;
  }

  if (nachtRaidersBootIsComplete) {
    proceedFromNachtRaidersBootToTitle();
  }
}

/* ==========================================================
   7. START BOOT SEQUENCE
========================================================== */

async function startNachtRaidersBootSequence() {
  invalidateNachtRaidersBootRun();

  nachtRaidersBootIsComplete =
    false;

  clearNachtRaidersTerminalOutput();

  if (
    typeof showNachtRaidersScreen !==
      "function" ||
    typeof isNachtRaidersWindowOpen !==
      "function" ||
    !isNachtRaidersWindowOpen()
  ) {
    return false;
  }

  if (
  shouldBypassNachtRaidersBootScreen()
) {
  showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_TITLE
  );

    document.dispatchEvent(
      new CustomEvent(
        "nacht-raiders:boot-bypassed"
      )
    );

    return true;
  }

  showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_LOADING
  );

  const runId =
    nachtRaidersBootRunId;

  nachtRaidersBootIsRunning =
    true;

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:boot-started"
    )
  );

  for (
    const bootLine of
    NACHT_RAIDERS_BOOT_LINES
  ) {
    const lineCompleted =
      await typeNachtRaidersBootLine(
        bootLine,
        runId
      );

    if (!lineCompleted) {
      return false;
    }
  }

  const readyLineCompleted =
    await typeNachtRaidersBootLine(
      NACHT_RAIDERS_BOOT_READY_LINE,
      runId
    );

  if (
    !readyLineCompleted ||
    runId !== nachtRaidersBootRunId ||
    !isNachtRaidersWindowOpen()
  ) {
    return false;
  }

  const promptDelayCompleted =
    await waitForNachtRaidersBootDelay(
      NACHT_RAIDERS_BOOT_SETTINGS
        .readyPromptDelayMs,
      runId
    );

  if (
    !promptDelayCompleted ||
    runId !== nachtRaidersBootRunId ||
    !isNachtRaidersWindowOpen()
  ) {
    return false;
  }

  setNachtRaidersBootReady();

  return true;
}

/* ==========================================================
   8. CANCEL BOOT SEQUENCE
========================================================== */

function cancelNachtRaidersBootSequence(
  clearOutput = false
) {
  invalidateNachtRaidersBootRun();

  nachtRaidersBootIsComplete =
    false;

  if (clearOutput) {
    clearNachtRaidersTerminalOutput();
  }

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:boot-cancelled"
    )
  );

  return true;
}

/* ==========================================================
   9. BOOT-SCREEN INPUT
========================================================== */

nachtRaidersLoadingScreen
  ?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();

      handleNachtRaidersBootActivation();
    }
  );

nachtRaidersLoadingScreen
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

      handleNachtRaidersBootActivation();
    }
  );

/* ==========================================================
   10. WINDOW EVENT INTEGRATION
========================================================== */

document.addEventListener(
  "nacht-raiders:opened",
  () => {
    startNachtRaidersBootSequence();
  }
);

document.addEventListener(
  "nacht-raiders:opened",
  (event) => {
    const windowMode =
      normalizeNachtRaidersWindowMode(
        event.detail?.mode ??
        getNachtRaidersWindowMode()
      );

    if (
      windowMode !==
      NACHT_RAIDERS_WINDOW_MODE_FULL
    ) {
      cancelNachtRaidersBootSequence(
        false
      );

      return;
    }

    startNachtRaidersBootSequence();
  }
);
);
