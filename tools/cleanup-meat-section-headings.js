#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2] || "meat.html";
const outputPath = process.argv[3] || inputPath;

function cleanSectionHeadingNumbers(source) {
  return source.replace(/<!--[\s\S]*?-->/g, (comment) => {
    return comment.replace(
      /^(\s*)(\d+(?:\.\d+){2,})\s+(.+)$/gm,
      "$1$3"
    );
  });
}

function removeComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, "");
}

function countDeepHeadings(source) {
  let count = 0;

  source.replace(/<!--[\s\S]*?-->/g, (comment) => {
    const matches = comment.match(
      /^(\s*)(\d+(?:\.\d+){2,})\s+(.+)$/gm
    );

    count += matches ? matches.length : 0;
    return comment;
  });

  return count;
}

const original = fs.readFileSync(inputPath, "utf8");
const cleaned = cleanSectionHeadingNumbers(original);

if (removeComments(original) !== removeComments(cleaned)) {
  throw new Error(
    "Validation failed: content outside HTML comments changed."
  );
}

const remainingDeepHeadings = countDeepHeadings(cleaned);

if (remainingDeepHeadings !== 0) {
  throw new Error(
    `Validation failed: ${remainingDeepHeadings} deeply nested heading numbers remain.`
  );
}

fs.mkdirSync(path.dirname(path.resolve(outputPath)), {
  recursive: true
});

fs.writeFileSync(outputPath, cleaned, "utf8");

const changed = original !== cleaned;

console.log(
  changed
    ? `Updated section headings in ${outputPath}.`
    : `No deeply nested section headings were found in ${inputPath}.`
);

console.log(
  "Validation passed: all non-comment HTML remained byte-for-byte identical."
);
