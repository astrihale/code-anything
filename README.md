# CODE ANYTHING

Source of [code-anything.hr](https://code-anything.hr), a plain HTML/CSS site with no dependencies, in English, Croatian and German.

- `src/pages/<page>.html`: one template per page, with `{{placeholders}}` for all text.
- `src/i18n/en.json`, `hr.json`, `de.json`: all text, one file per language. Text may contain HTML.
- `src/layout.html`: the shared page frame (header, menu, footer).
- `src/static/`: copied as-is (styles, scripts, fonts, favicon, CNAME).
- `python3 build.py` writes the site to `docs/` (not committed). The build stops and lists any text missing from a language.
- **Publishing is manual.** Pushing to `main` only runs *Build check* (`check.yml`), which fails if text is missing; it never publishes.
  - Actions → *Run normal mode* → Run workflow: publishes the full site.
  - Actions → *Run maintenance mode* → Run workflow: every address shows `src/maintenance.html`.
  - Both use the shared steps in `.github/workflows/site.yml`, and only people with write access can run them.
- Search indexing is controlled by `INDEXING` in `build.py`.
- Easter eggs live in `src/static/assets/eggs.js`.

Preview locally: `python3 build.py && python3 -m http.server -d docs 8000`

Built with help from AI.

Fonts: Marcellus SC and Cormorant Garamond, under the SIL Open Font License (`src/static/fonts/OFL.txt`).
