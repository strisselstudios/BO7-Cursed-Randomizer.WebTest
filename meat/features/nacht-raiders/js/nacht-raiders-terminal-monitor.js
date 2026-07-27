/* ==========================================================
   1. TERMINAL MONITOR SETTINGS
========================================================== */

const NACHT_RAIDERS_TERMINAL_RECORD_LIMIT = 14;
const NACHT_RAIDERS_TERMINAL_LINE_LIMIT = 3;

/* ==========================================================
   2. TERMINAL MONITOR ACCESS
========================================================== */

function isNachtRaidersTerminalMonitorVisible() {
  return Boolean(
    isNachtRaidersWindowOpen() &&
    getNachtRaidersWindowMode() ===
      NACHT_RAIDERS_WINDOW_MODE_TERMINAL &&
    nachtRaidersTerminalMonitor &&
    !nachtRaidersTerminalMonitor.hidden
  );
}

function formatNachtRaidersTerminalZoneLabel(
  zoneId
) {
  const label =
    getNachtRaidersZoneDisplayLabel(
      zoneId
    );

  if (!label) {
    return "Unknown";
  }

  return label
    .toLowerCase()
    .replace(
      /\b[a-z]/g,
      (character) =>
        character.toUpperCase()
    );
}

/* ==========================================================
   3. RECENT FIELD RECORD COLLECTION
========================================================== */

function getNachtRaidersTerminalFieldRecords() {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  const recordsById =
    new Map();

  for (
    const report of
    nachtRaidersState.fieldRecords
      .reports
  ) {
    for (
      const record of
      report.entries || []
    ) {
      if (record?.recordId) {
        recordsById.set(
          record.recordId,
          record
        );
      }
    }
  }

  for (
    const record of
    nachtRaidersState.fieldRecords
      .pendingEntries
  ) {
    if (record?.recordId) {
      recordsById.set(
        record.recordId,
        record
      );
    }
  }

  return [
    ...recordsById.values()
  ]
    .sort(
      (
        firstRecord,
        secondRecord
      ) => {
        const sequenceDifference =
          (
            Number(
              firstRecord.sequence
            ) || 0
          ) -
          (
            Number(
              secondRecord.sequence
            ) || 0
          );

        if (sequenceDifference !== 0) {
          return sequenceDifference;
        }

        return (
          Number(
            firstRecord.occurredAt
          ) || 0
        ) -
        (
          Number(
            secondRecord.occurredAt
          ) || 0
        );
      }
    )
    .slice(
      -NACHT_RAIDERS_TERMINAL_RECORD_LIMIT
    );
}

/* ==========================================================
   4. TERMINAL RECORD FORMATTING
========================================================== */

function getNachtRaidersTerminalRecordLines(
  record
) {
  const presentationLines =
    Array.isArray(
      record?.presentation?.lines
    )
      ? record.presentation.lines
      : [];

  const meaningfulLines =
    presentationLines
      .filter(
        (line) =>
          typeof line === "string" &&
          line.trim()
      )
      .map(
        (line) =>
          line.trim()
      )
      .filter(
        (line) => {
          if (line.startsWith(">>")) {
            return false;
          }

          return (
            line.toLowerCase() !==
            "engaged in combat."
          );
        }
      );

  if (meaningfulLines.length > 0) {
    return meaningfulLines.slice(
      0,
      NACHT_RAIDERS_TERMINAL_LINE_LIMIT
    );
  }

  const fallbackTitle =
    typeof record?.presentation?.title ===
      "string"
      ? record.presentation.title.trim()
      : "";

  return fallbackTitle
    ? [fallbackTitle]
    : ["Unclassified field activity recorded."];
}

function formatNachtRaidersTerminalRewardLine(
  rewards
) {
  const rewardParts = [];

  for (
    const rewardKey of
    NACHT_RAIDERS_REWARD_KEYS
  ) {
    const amount =
      Math.max(
        0,
        Math.floor(
          Number(
            rewards?.[rewardKey]
          ) || 0
        )
      );

    if (amount <= 0) {
      continue;
    }

    const definition =
      getNachtRaidersRewardDefinition(
        rewardKey
      );

    const label =
      (
        definition?.label ||
        rewardKey
      ).toLowerCase();

    rewardParts.push(
      `+${formatNachtRaidersGameValue(
        amount
      )} ${label}`
    );
  }

  return rewardParts.join(", ");
}

/* ==========================================================
   5. TERMINAL RECORD ELEMENTS
========================================================== */

function createNachtRaidersTerminalRecordElement(
  record
) {
  const recordElement =
    document.createElement(
      "article"
    );

  recordElement.className =
    "nacht-raiders-field-link-record";

  const lines =
    getNachtRaidersTerminalRecordLines(
      record
    );

  for (const line of lines) {
    const lineElement =
      document.createElement(
        "p"
      );

    lineElement.textContent =
      `> ${line}`;

    recordElement.append(
      lineElement
    );
  }

  const rewardLine =
    formatNachtRaidersTerminalRewardLine(
      record?.rewards
    );

  if (rewardLine) {
    const rewardElement =
      document.createElement(
        "p"
      );

    rewardElement.className =
      "nacht-raiders-field-link-record-reward";

    rewardElement.textContent =
      rewardLine;

    recordElement.append(
      rewardElement
    );
  }

  return recordElement;
}

/* ==========================================================
   6. TERMINAL STATE DISPLAY
========================================================== */

function updateNachtRaidersTerminalHealth(
  currentHealth,
  maximumHealth
) {
  const normalizedMaximum =
    Math.max(
      1,
      Math.floor(
        Number(maximumHealth) || 1
      )
    );

  const normalizedCurrent =
    Math.min(
      normalizedMaximum,
      Math.max(
        0,
        Math.floor(
          Number(currentHealth) || 0
        )
      )
    );

  if (nachtRaidersTerminalHealthText) {
    nachtRaidersTerminalHealthText.textContent =
      `${formatNachtRaidersGameValue(
        normalizedCurrent
      )} / ${formatNachtRaidersGameValue(
        normalizedMaximum
      )}`;
  }

  updateNachtRaidersGameMeter(
    nachtRaidersTerminalHealthFill,
    normalizedCurrent /
      normalizedMaximum,
    normalizedCurrent /
      normalizedMaximum <= 0.25
  );
}

function renderNachtRaidersTerminalState() {
  const nachtRaidersState =
    ensureNachtRaidersFeatureState();

  const zoneId =
    nachtRaidersState.expedition.zoneId ||
    NACHT_RAIDERS_STARTING_ZONE_ID;

  if (nachtRaidersTerminalZone) {
    nachtRaidersTerminalZone.textContent =
      formatNachtRaidersTerminalZoneLabel(
        zoneId
      );
  }

  if (nachtRaidersTerminalDepth) {
    nachtRaidersTerminalDepth.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.expedition
          .zoneDepth
      );
  }

  if (nachtRaidersTerminalCycle) {
    nachtRaidersTerminalCycle.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.cycleCount
      );
  }

  if (nachtRaidersTerminalLevel) {
    nachtRaidersTerminalLevel.textContent =
      formatNachtRaidersGameValue(
        nachtRaidersState.operative.level
      );
  }

  updateNachtRaidersTerminalHealth(
    nachtRaidersState.operative.health,
    nachtRaidersState.operative.maxHealth
  );

  return nachtRaidersState;
}

/* ==========================================================
   7. TERMINAL LOG RENDERING
========================================================== */

function renderNachtRaidersTerminalLog() {
  if (!nachtRaidersTerminalLog) {
    return false;
  }

  const records =
    getNachtRaidersTerminalFieldRecords();

  nachtRaidersTerminalLog
    .replaceChildren();

  if (records.length === 0) {
    const emptyElement =
      document.createElement(
        "p"
      );

    emptyElement.className =
      "nacht-raiders-field-link-empty";

    emptyElement.textContent =
      "> AWAITING FIELD ACTIVITY_";

    nachtRaidersTerminalLog.append(
      emptyElement
    );
  } else {
    const recordFragment =
      document.createDocumentFragment();

    for (const record of records) {
      recordFragment.append(
        createNachtRaidersTerminalRecordElement(
          record
        )
      );
    }

    nachtRaidersTerminalLog.append(
      recordFragment
    );
  }

  window.requestAnimationFrame(
    () => {
      nachtRaidersTerminalLog.scrollTop =
        nachtRaidersTerminalLog.scrollHeight;
    }
  );

  return true;
}

function renderNachtRaidersTerminalMonitor() {
  renderNachtRaidersTerminalState();
  renderNachtRaidersTerminalLog();

  return true;
}

/* ==========================================================
   8. TERMINAL MONITOR EVENTS
========================================================== */

document.addEventListener(
  "nacht-raiders:window-mode-changed",
  (event) => {
    if (
      event.detail?.mode ===
      NACHT_RAIDERS_WINDOW_MODE_TERMINAL
    ) {
      renderNachtRaidersTerminalMonitor();
    }
  }
);

document.addEventListener(
  "nacht-raiders:simulation-completed",
  () => {
    if (
      isNachtRaidersTerminalMonitorVisible()
    ) {
      renderNachtRaidersTerminalMonitor();
    }
  }
);

document.addEventListener(
  "nacht-raiders:presentation-event-completed",
  () => {
    if (
      isNachtRaidersTerminalMonitorVisible()
    ) {
      renderNachtRaidersTerminalMonitor();
    }
  }
);

document.addEventListener(
  "nacht-raiders:game-stage-entered",
  () => {
    if (
      isNachtRaidersTerminalMonitorVisible()
    ) {
      renderNachtRaidersTerminalMonitor();
    }
  }
);

document.addEventListener(
  "nacht-raiders:opened",
  (event) => {
    if (
      event.detail?.mode ===
      NACHT_RAIDERS_WINDOW_MODE_TERMINAL
    ) {
      renderNachtRaidersTerminalMonitor();
    }
  }
);
