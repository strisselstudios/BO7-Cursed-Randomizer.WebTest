/* ==========================================================
   1. DATE FORMATTING
========================================================== */

const NACHT_RAIDERS_REPORT_DATE_FORMATTER = new Intl.DateTimeFormat(
  undefined,
  {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }
);

function formatNachtRaidersReportDate(timestamp) {
  const date = new Date(Number(timestamp));

  return Number.isFinite(date.getTime())
    ? NACHT_RAIDERS_REPORT_DATE_FORMATTER.format(date)
    : "UNKNOWN DATE";
}

/* ==========================================================
   2. VALUE FORMATTING
========================================================== */

function formatNachtRaidersReportRange(startingValue, endingValue) {
  const start = Math.max(0, Math.floor(Number(startingValue) || 0));
  const end = Math.max(start, Math.floor(Number(endingValue) || start));

  return start === end ? String(start) : `${start}-${end}`;
}

function formatNachtRaidersReportAmount(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString();
}

/* ==========================================================
   3. REWARD FORMATTING
========================================================== */

function getNachtRaidersPositiveRewards(rewards) {
  return NACHT_RAIDERS_REWARD_KEYS.map((rewardKey) => {
    const definition = getNachtRaidersRewardDefinition(rewardKey);
    const amount = Math.max(0, Math.floor(Number(rewards?.[rewardKey]) || 0));

    return {
      rewardKey,
      label: definition?.label || rewardKey.toUpperCase(),
      amount
    };
  }).filter((reward) => reward.amount > 0);
}

/* ==========================================================
   4. ELEMENT CREATION
========================================================== */

function createNachtRaidersRecordElement(tagName, className, textContent = "") {
  const element = document.createElement(tagName);

  element.className = className;
  element.textContent = textContent;

  return element;
}
