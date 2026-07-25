#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const repositoryRoot = path.resolve(__dirname, "../..");
const defaultTemplate = path.join(
  repositoryRoot,
  "meat/html/meat.template.html"
);

function usage() {
  return [
    "Usage: node tools/reorganization/meat-html-build.js [options]",
    "",
    "Options:",
    "  --template <path>       Assembly template (defaults to meat/html/meat.template.html)",
    "  --output <path>         Write assembled HTML to this path",
    "  --check-against <path>  Require assembled HTML to exactly match this file",
    "  --help                  Show this help"
  ].join("\n");
}

function parseArguments(argumentsToParse) {
  const options = {
    template: defaultTemplate,
    output: null,
    checkAgainst: null
  };

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index];

    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }

    const optionNames = {
      "--template": "template",
      "--output": "output",
      "--check-against": "checkAgainst"
    };
    const optionName = optionNames[argument];

    if (!optionName) {
      throw new Error(`Unknown option: ${argument}\n\n${usage()}`);
    }

    const value = argumentsToParse[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing path after ${argument}.`);
    }

    options[optionName] = path.resolve(process.cwd(), value);
    index += 1;
  }

  return options;
}

function assembleTemplate(filePath, ancestors = []) {
  const resolvedPath = path.resolve(filePath);

  if (ancestors.includes(resolvedPath)) {
    const includeChain = [...ancestors, resolvedPath]
      .map((includedPath) => path.relative(repositoryRoot, includedPath))
      .join(" -> ");
    throw new Error(`Circular HTML include detected: ${includeChain}`);
  }

  const source = fs.readFileSync(resolvedPath, "utf8");
  const includePattern = /<!--\s*@include\s+"([^"]+)"\s*-->/g;

  return source.replace(includePattern, (_directive, relativeIncludePath) => {
    const includePath = path.resolve(
      path.dirname(resolvedPath),
      relativeIncludePath
    );

    return assembleTemplate(includePath, [...ancestors, resolvedPath]);
  });
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const assembledHtml = assembleTemplate(options.template);

  if (options.checkAgainst) {
    const expectedHtml = fs.readFileSync(options.checkAgainst, "utf8");

    if (assembledHtml !== expectedHtml) {
      throw new Error(
        `Assembled template does not exactly match ${path.relative(
          repositoryRoot,
          options.checkAgainst
        )}.`
      );
    }

    console.log(
      `Validation passed: assembled HTML exactly matches ${path.relative(
        repositoryRoot,
        options.checkAgainst
      )}.`
    );
  }

  if (options.output) {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, assembledHtml, "utf8");
    console.log(
      `Wrote assembled HTML to ${path.relative(repositoryRoot, options.output)}.`
    );
  }

  if (!options.checkAgainst && !options.output) {
    process.stdout.write(assembledHtml);
  }
}

main();
