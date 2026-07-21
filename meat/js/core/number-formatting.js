/* ==========================================================
   1. NUMBER FORMATTING
   ----------------------------------------------------------
   Displays exact comma-separated values below one million.

   Values from one million upward display three decimal places
   so large totals visibly continue increasing.

   Store prices use a separate formatter so trailing zeros are
   removed only inside the shop interface.
========================================================== */

function formatMeat(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }

  if (value < 1_000_000) {
    return Math.floor(value).toLocaleString("en-US");
  }

  const numberGroups = [
    { value: 1e33, name: "decillion" },
    { value: 1e30, name: "nonillion" },
    { value: 1e27, name: "octillion" },
    { value: 1e24, name: "septillion" },
    { value: 1e21, name: "sextillion" },
    { value: 1e18, name: "quintillion" },
    { value: 1e15, name: "quadrillion" },
    { value: 1e12, name: "trillion" },
    { value: 1e9, name: "billion" },
    { value: 1e6, name: "million" }
  ];

  const group = numberGroups.find((entry) => {
    return value >= entry.value;
  });

  if (!group) {
    return Math.floor(value).toLocaleString("en-US");
  }

  const shortenedValue =
    value / group.value;

  /*
   * Truncate instead of rounding.
   *
   * This prevents 329,999,999 from displaying as
   * 330.000 million before the player actually reaches
   * 330 million.
   */

  const truncatedValue =
    Math.floor(shortenedValue * 1000) / 1000;

  const formattedValue =
    truncatedValue.toLocaleString("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    });

  return `${formattedValue} ${group.name}`;
}

function formatMeatPerSecond(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }

  if (value < 1_000_000) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });
  }

  return formatMeat(value);
}

function formatStoreMeat(value) {
  const formattedValue =
    formatMeat(value);

  const firstSpaceIndex =
    formattedValue.indexOf(" ");

  /*
   * Values below one million have no suffix and already use
   * normal comma formatting.
   */

  if (firstSpaceIndex === -1) {
    return formattedValue;
  }

  const numberPart =
    formattedValue.slice(
      0,
      firstSpaceIndex
    );

  const suffixPart =
    formattedValue.slice(
      firstSpaceIndex + 1
    );

  /*
   * Only remove zeros after an existing decimal point.
   * This prevents 330 becoming 33.
   */

  if (!numberPart.includes(".")) {
    return formattedValue;
  }

  const trimmedNumber =
    numberPart
      .replace(/0+$/, "")
      .replace(/\.$/, "");

  return `${trimmedNumber} ${suffixPart}`;
}
