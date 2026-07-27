#!/usr/bin/env node
"use strict";

/* ==========================================================
   1. DEPENDENCIES AND PATHS
========================================================== */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repositoryRoot = path.resolve(__dirname, "../..");
const errors = [];

/* ==========================================================
   2. FILE HELPERS
========================================================== */

function walkDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath, {
      withFileTypes: true
    })
    .flatMap((entry) => {
      const entryPath = path.join(
        directoryPath,
        entry.name
      );

      return entry.isDirectory()
        ? walkDirectory(entryPath)
        : [entryPath];
    });
}

function isExternalReference(reference) {
  return (
    !reference ||
    reference.startsWith("#") ||
    reference.startsWith("data:") ||
    reference.startsWith("blob:") ||
    reference.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(reference)
  );
}

function stripReferenceSuffix(reference) {
  return reference
    .split("#")[0]
    .split("?")[0];
}

/* ==========================================================
   3. HTML VALIDATION
========================================================== */

function validateHtmlDocument(documentName, source) {
  if (
    !/<head\b[^>]*>[\s\S]*?<\/head>\s*<body\b/i.test(source)
  ) {
    errors.push(
      `${documentName}: </head> must appear before <body>.`
    );
  }

  const encounteredIds = new Set();
  const idPattern = /\bid\s*=\s*(["'])(.*?)\1/g;
  let idMatch;

  while (
    (
      idMatch = idPattern.exec(source)
    )
  ) {
    const id = idMatch[2];

    if (encounteredIds.has(id)) {
      errors.push(
        `${documentName}: duplicate id "${id}".`
      );
    }

    encounteredIds.add(id);
  }

  const referencePattern =
    /\b(?:src|href)\s*=\s*(["'])(.*?)\1/g;

  let referenceMatch;

  while (
    (
      referenceMatch =
        referencePattern.exec(source)
    )
  ) {
    const reference =
      referenceMatch[2];

    if (
      isExternalReference(reference)
    ) {
      continue;
    }

    const normalizedReference =
      stripReferenceSuffix(reference);

    if (!normalizedReference) {
      continue;
    }

    const resolvedPath = path.resolve(
      repositoryRoot,
      normalizedReference
    );

    if (!fs.existsSync(resolvedPath)) {
      errors.push(
        `${documentName}: missing local reference "${reference}".`
      );
    }
  }
}

/* ==========================================================
   4. CSS REFERENCE VALIDATION
========================================================== */

function validateCssFile(filePath) {
  const source = fs.readFileSync(
    filePath,
    "utf8"
  );

  const referencePattern =
    /url\(\s*(["']?)([^"')]+)\1\s*\)/g;

  let referenceMatch;

  while (
    (
      referenceMatch =
        referencePattern.exec(source)
    )
  ) {
    const reference =
      referenceMatch[2].trim();

    if (
      isExternalReference(reference) ||
      reference.startsWith("var(")
    ) {
      continue;
    }

    const normalizedReference =
      stripReferenceSuffix(reference);

    const resolvedPath = path.resolve(
      path.dirname(filePath),
      normalizedReference
    );

    if (!fs.existsSync(resolvedPath)) {
      errors.push(
        `${path.relative(repositoryRoot, filePath)}: missing CSS reference "${reference}".`
      );
    }
  }
}

/* ==========================================================
   5. BUILD AND VALIDATE SOURCE DOCUMENTS
========================================================== */

const indexSource = fs.readFileSync(
  path.join(
    repositoryRoot,
    "index.html"
  ),
  "utf8"
);

const assembledMeatSource =
  execFileSync(
    process.execPath,
    [
      path.join(
        repositoryRoot,
        "tools/reorganization/meat-html-build.js"
      )
    ],
    {
      cwd: repositoryRoot,
      encoding: "utf8"
    }
  );

validateHtmlDocument(
  "index.html",
  indexSource
);

validateHtmlDocument(
  "assembled meat.html",
  assembledMeatSource
);

/* ==========================================================
   6. VALIDATE CSS REFERENCES
========================================================== */

walkDirectory(
  path.join(
    repositoryRoot,
    "randomizer"
  )
)
  .concat(
    walkDirectory(
      path.join(
        repositoryRoot,
        "meat"
      )
    )
  )
  .filter(
    (filePath) =>
      filePath.endsWith(".css")
  )
  .forEach(
    validateCssFile
  );

/* ==========================================================
   7. REPORT RESULT
========================================================== */

if (errors.length > 0) {
  errors.forEach(
    (error) => {
      console.error(error);
    }
  );

  process.exit(1);
}

console.log(
  "Repository validation passed."
);
