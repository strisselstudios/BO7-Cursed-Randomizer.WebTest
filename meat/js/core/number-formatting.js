/* ==========================================================
   1. NUMBER FORMATTING
   ----------------------------------------------------------
   Displays:
   - Exact comma-separated values below one million
   - Named suffixes through decillion
   - Scientific notation from 10^36 onward
   - INFINITE instead of falsely displaying zero
========================================================== */

const MEAT_NUMBER_GROUPS = [
  {
    value: 1e33,
    name: "decillion"
  },
  {
    value: 1e30,
    name: "nonillion"
  },
  {
    value: 1e27,
    name: "octillion"
  },
  {
    value: 1e24,
    name: "septillion"
  },
  {
    value: 1e21,
    name: "sextillion"
  },
  {
    value: 1e18,
    name: "quintillion"
  },
  {
    value: 1e15,
    name: "quadrillion"
  },
  {
    value: 1e12,
    name: "trillion"
  },
  {
    value: 1e9,
    name: "billion"
  },
  {
    value: 1e6,
    name: "million"
  }
];

const MEAT_SUPERSCRIPT_CHARACTERS = {
  "-": "⁻",
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹"
};

function formatSuperscriptInteger(
  value
) {
  return String(
    Math.trunc(value)
  )
    .split("")
    .map((character) => {
      return (
        MEAT_SUPERSCRIPT_CHARACTERS[
          character
        ] ?? character
      );
    })
    .join("");
}

function truncateMeatDecimal(
  value,
  decimalPlaces = 3
) {
  const factor =
    10 ** decimalPlaces;

  return (
    Math.floor(value * factor) /
    factor
  );
}

function formatScientificMeat(
  value
) {
  const exponent =
    Math.floor(
      Math.log10(value)
    );

  const mantissa =
    value / (10 ** exponent);

  const truncatedMantissa =
    truncateMeatDecimal(
      mantissa,
      3
    );

  const formattedMantissa =
    truncatedMantissa
      .toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3
        }
      );

  return (
    `${formattedMantissa} × ` +
    `10${formatSuperscriptInteger(
      exponent
    )}`
  );
}

function formatMeat(value) {
  const numericValue =
    Number(value);

  if (
    Number.isNaN(numericValue) ||
    numericValue < 0
  ) {
    return "0";
  }

  if (
    !Number.isFinite(numericValue)
  ) {
    return "INFINITE";
  }

  const normalizedValue =
    Math.min(
      numericValue,
      MEAT_DISPLAY_LIMIT
    );

  if (
    normalizedValue <
    1_000_000
  ) {
    return Math.floor(
      normalizedValue
    ).toLocaleString("en-US");
  }

  if (
    normalizedValue >= 1e36
  ) {
    return formatScientificMeat(
      normalizedValue
    );
  }

  const group =
    MEAT_NUMBER_GROUPS.find(
      (entry) => {
        return (
          normalizedValue >=
          entry.value
        );
      }
    );

  if (!group) {
    return Math.floor(
      normalizedValue
    ).toLocaleString("en-US");
  }

  const shortenedValue =
    normalizedValue /
    group.value;

  const truncatedValue =
    truncateMeatDecimal(
      shortenedValue,
      3
    );

  const formattedValue =
    truncatedValue
      .toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3
        }
      );

  return (
    `${formattedValue} ` +
    `${group.name}`
  );
}

function formatMeatPerSecond(
  value
) {
  const numericValue =
    Number(value);

  if (
    Number.isNaN(numericValue) ||
    numericValue < 0
  ) {
    return "0";
  }

  if (
    !Number.isFinite(numericValue)
  ) {
    return "INFINITE";
  }

  if (
    numericValue < 1_000_000
  ) {
    return numericValue
      .toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 1
        }
      );
  }

  return formatMeat(
    numericValue
  );
}

function formatStoreMeat(value) {
  const formattedValue =
    formatMeat(value);

  const firstSpaceIndex =
    formattedValue.indexOf(" ");

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

  if (
    !numberPart.includes(".")
  ) {
    return formattedValue;
  }

  const trimmedNumber =
    numberPart
      .replace(/0+$/, "")
      .replace(/\.$/, "");

  return (
    `${trimmedNumber} ` +
    `${suffixPart}`
  );
}
