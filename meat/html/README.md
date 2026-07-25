# MEAT.exe HTML Source

`meat.html` is the complete deployed document.

`meat/html/meat.template.html` and the files under `partials/` are the
build-time assembly source. Recursive include directives are resolved relative
to the file containing each directive.

Complete sections in the template use directives such as:

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

Do not edit deployed and source copies independently. Edit the template or the
relevant partial, rebuild the root document, and run the verification command.
