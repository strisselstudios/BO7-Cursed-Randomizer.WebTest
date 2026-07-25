# MEAT.exe HTML Source

`meat.html` is currently the deployed document.

`meat/html/meat.template.html` is the assembly source introduced during the
HTML reorganization. At the end of Batch 11 it must be an exact copy of the
current root-level `meat.html`.

Future batches replace complete sections inside the template with directives:

```html
<!-- @include "./partials/example.html" -->
```

The build command expands those directives without changing the included
content:

```bash
node tools/reorganization/meat-html-build.js \
  --output build/meat.html
```

The verification command requires the template and partials to assemble
byte-for-byte to the committed root document:

```bash
node tools/reorganization/meat-html-build.js \
  --check-against meat.html
```

Do not edit generated and source copies independently. After the first partial
is extracted, edit the template or the relevant partial, rebuild, then replace
the root `meat.html` with the generated output until deployment is moved to a
build artifact.
