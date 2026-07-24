/* ==========================================================
   1. BOOT-SEQUENCE STATE
========================================================== */

let nachtRaidersBootRunId =
  0;

let nachtRaidersBootIsRunning =
  false;

let nachtRaidersBootTimerId =
  null;

let nachtRaidersBootDelayResolver =
  null;

/* ==========================================================
   2. BOOT-SEQUENCE CANCELLABLE DELAY
   ----------------------------------------------------------
   Allows the active boot sequence to stop immediately when
   the DOS window closes.

   The run ID also prevents an older sequence from changing
   screens after a newer sequence has begun.
========================================================== */

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
   3. TERMINAL OUTPUT HELPERS
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

/* ==========================================================
   4. BOOT-LINE PRESENTATION
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

/* ==========================================================
   5. REDUCED-MOTION PRESENTATION
========================================================== */

function shouldSkipNachtRaidersBootTyping() {
  const animationsAreDisabled =
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
    animationsAreDisabled ||
    reducedMotionIsRequested
  );
}

function renderNachtRaidersBootImmediately() {
  clearNachtRaidersTerminalOutput();

  NACHT_RAIDERS_BOOT_LINES.forEach(
    (bootLine) => {
      const lineElement =
        createNachtRaidersBootLine(
          bootLine
        );

      lineElement.textContent =
        bootLine.text ||
        "\u00A0";
    }
  );

  scrollNachtRaidersTerminalToBottom();
}

/* ==========================================================
   6. START AND COMPLETE BOOT SEQUENCE
========================================================== */

async function startNachtRaidersBootSequence() {
  cancelNachtRaidersBootSequence(
    true
  );

  if (
    !nachtRaidersTerminalOutput ||
    typeof showNachtRaidersScreen !==
      "function" ||
    typeof isNachtRaidersWindowOpen !==
      "function" ||
    !isNachtRaidersWindowOpen()
  ) {
    return false;
  }

  const runId =
    nachtRaidersBootRunId;

  nachtRaidersBootIsRunning =
    true;

  showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_LOADING
  );

  clearNachtRaidersTerminalOutput();

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:boot-started"
    )
  );

  if (
    shouldSkipNachtRaidersBootTyping()
  ) {
    renderNachtRaidersBootImmediately();

    const reducedMotionDelayCompleted =
      await waitForNachtRaidersBootDelay(
        NACHT_RAIDERS_BOOT_SETTINGS
          .reducedMotionDelayMs,
        runId
      );

    if (!reducedMotionDelayCompleted) {
      return false;
    }
  } else {
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
  }

  const finalDelayCompleted =
    await waitForNachtRaidersBootDelay(
      NACHT_RAIDERS_BOOT_SETTINGS
        .finalDelayMs,
      runId
    );

  if (
    !finalDelayCompleted ||
    runId !== nachtRaidersBootRunId ||
    !isNachtRaidersWindowOpen()
  ) {
    return false;
  }

  removeNachtRaidersActiveCursor();

  nachtRaidersBootIsRunning =
    false;

  showNachtRaidersScreen(
    NACHT_RAIDERS_SCREEN_MENU
  );

  document.dispatchEvent(
    new CustomEvent(
      "nacht-raiders:boot-completed"
    )
  );

  return true;
}

/* ==========================================================
   7. CANCEL BOOT SEQUENCE
========================================================== */

function cancelNachtRaidersBootSequence(
  clearOutput = false
) {
  nachtRaidersBootRunId +=
    1;

  nachtRaidersBootIsRunning =
    false;

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

  removeNachtRaidersActiveCursor();

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
   8. WINDOW EVENT INTEGRATION
========================================================== */

document.addEventListener(
  "nacht-raiders:opened",
  () => {
    startNachtRaidersBootSequence();
  }
);

document.addEventListener(
  "nacht-raiders:closed",
  () => {
    cancelNachtRaidersBootSequence(
      true
    );
  }
);
