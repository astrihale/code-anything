#!/usr/bin/env python3
"""Builds the static site into docs/ (served by GitHub Pages) from src/.

Standard library only, so building the site never installs anything.

    python3 build.py                  the full site
    python3 build.py --maintenance    only the maintenance page, for every address

Layout:
  src/layout.html         shared page frame
  src/pages/<page>.html   one template per page, with placeholders
  src/i18n/<lang>.json    all text, one file per language
  src/static/             copied as-is

Placeholders in templates:
  {{key}}                 text from the page's section of the language file,
                          falling back to its "common" section
  {{link.<page>}}         URL of another page in the current language
  {{lang}}                current language code
  {{#each key}}…{{/each}} repeat for every item of a list; inside it,
                          {{.field}} is a field of the item and {{.}} the item itself
  {{.field|li}}           a list of strings as <li> elements
  {{.field|reward}}       a list of strings as reward tags
  {{.field|flavor}}       an optional quote line

Text may contain HTML. A missing key stops the build and names the key.
"""
import datetime
import hashlib
import html
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "docs"
SITE = "https://code-anything.hr"

# Flip to True when the site should be found by search engines.
INDEXING = False

# Menu order; the number keys 1–6 open these tabs.
PAGES = ["index", "services", "expertise", "founder", "ambitions", "contact"]

LANGS = {
    "en": {"prefix": "/", "name": "English", "slugs": {"services": "services", "expertise": "expertise", "founder": "founder", "ambitions": "ambitions", "contact": "contact"}},
    "hr": {"prefix": "/hr/", "name": "Hrvatski", "slugs": {"services": "usluge", "expertise": "strucnost", "founder": "osnivacica", "ambitions": "ambicije", "contact": "kontakt"}},
    "de": {"prefix": "/de/", "name": "Deutsch", "slugs": {"services": "leistungen", "expertise": "expertise", "founder": "gruenderin", "ambitions": "vorhaben", "contact": "kontakt"}},
}

FILTERS = {
    "li": lambda v: "".join(f"<li>{x}</li>" for x in v),
    "reward": lambda v: "".join(f'<span class="reward">{x}</span>' for x in v),
    "flavor": lambda v: f'<p class="tt-flavor">{v}</p>' if v else "",
}

EACH = re.compile(r"\{\{#each (\w+)\}\}(.*?)\{\{/each\}\}", re.S)
ITEM = re.compile(r"\{\{\.(\w*)(?:\|(\w+))?\}\}")
KEY = re.compile(r"\{\{([\w.]+)\}\}")


class MissingText(Exception):
    pass


def path_for(lang, page):
    prefix = LANGS[lang]["prefix"]
    if page == "index":
        return prefix
    if page == "404":
        return "/404.html"
    return f"{prefix}{LANGS[lang]['slugs'][page]}/"


def out_file(lang, page):
    rel = path_for(lang, page).lstrip("/")
    if rel == "" or rel.endswith("/"):
        rel += "index.html"
    return OUT / rel


def render(template, lookup, where):
    """Fill a template. `lookup(key)` returns text or raises KeyError."""

    def each(match):
        name, body = match.group(1), match.group(2)
        try:
            items = lookup(name)
        except KeyError:
            raise MissingText(f"{where}: missing list '{name}'")
        out = []
        for i, item in enumerate(items):
            def field(m):
                key, flt = m.group(1), m.group(2)
                if key == "":
                    value = item
                elif key in item:
                    value = item[key]
                elif flt == "flavor":
                    value = ""
                else:
                    raise MissingText(f"{where}: '{name}[{i}]' has no '{key}'")
                return FILTERS[flt](value) if flt else str(value)
            out.append(ITEM.sub(field, body))
        return "".join(out)

    text = EACH.sub(each, template)

    def key(match):
        try:
            return str(lookup(match.group(1)))
        except KeyError:
            raise MissingText(f"{where}: missing text '{match.group(1)}'")

    return KEY.sub(key, text)


def nav(lang, current, labels):
    items = []
    for n, page in enumerate(PAGES, 1):
        attrs = ' aria-current="page"' if page == current else ""
        items.append(
            f'<li><a class="tab" href="{path_for(lang, page)}" data-num="{n}" aria-keyshortcuts="{n}"{attrs}>'
            f'<span class="tab-label">{labels[page]}</span>'
            f'<kbd class="tab-key" aria-hidden="true">{n}</kbd></a></li>'
        )
    return "\n        ".join(items)


def lang_switch(lang, page, label):
    links = []
    for code, conf in LANGS.items():
        target = path_for(code, page if page != "404" else "index")
        current = ' aria-current="true"' if code == lang else ""
        # German is a secret: its switch appears once unlocked (see eggs.js), except on German pages.
        locked = ' data-unlock="de" hidden' if code == "de" and lang != "de" else ""
        links.append(f'<a href="{target}" hreflang="{code}" lang="{code}" title="{conf["name"]}"{current}{locked}>{code.upper()}</a>')
    return f'<nav class="langs" aria-label="{label}" data-roving="a">' + "".join(links) + "</nav>"


def alternates(page):
    if page == "404":
        return ""
    links = [f'<link rel="alternate" hreflang="{l}" href="{SITE}{path_for(l, page)}">' for l in LANGS]
    links.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{path_for("en", page)}">')
    return "\n  ".join(links)


def keys_dialog(k):
    rows = "\n".join(f"      <div><dt>{keys}</dt><dd>{what}</dd></div>" for keys, what in k["rows"])
    return f"""<dialog class="keys" id="keys" aria-labelledby="keys-title">
    <h2 id="keys-title">{k["title"]}</h2>
    <dl>
{rows}
    </dl>
    <p class="keys-hint"><button type="button" aria-expanded="false" aria-controls="secrets" data-secrets-toggle>{k["hint"]}</button></p>
    <div id="secrets" hidden>
      <h3 class="secrets-title">{k["secrets"]} <span data-achievements-short></span></h3>
      <ul class="secret-list" data-secrets></ul>
    </div>
    <button class="btn" type="button" data-close>{k["close"]}</button>
  </dialog>"""


def fingerprint(text):
    """Add a content hash to asset URLs so browsers fetch new versions after every change."""
    for asset in ("assets/site.css", "assets/site.js", "assets/eggs.js", "favicon.ico", "favicon.png", "apple-touch-icon.png"):
        digest = hashlib.sha256((SRC / "static" / asset).read_bytes()).hexdigest()[:10]
        text = text.replace(f'"/{asset}"', f'"/{asset}?v={digest}"')
    return text


def build_maintenance():
    """Every address shows the maintenance page (index.html, and 404.html for all other paths)."""
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "static", OUT)
    page = fingerprint((SRC / "maintenance.html").read_text(encoding="utf-8"))
    for name in ("index.html", "404.html"):
        (OUT / name).write_text(page, encoding="utf-8")
    (OUT / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    print(f"Built the maintenance page into {OUT.relative_to(ROOT)}/")


def build():
    texts = {lang: json.loads((SRC / "i18n" / f"{lang}.json").read_text(encoding="utf-8")) for lang in LANGS}
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    templates = {f.stem: f.read_text(encoding="utf-8") for f in sorted((SRC / "pages").glob("*.html"))}
    jsonld = {}
    for f in (SRC / "pages").glob("*.json"):
        jsonld[f.stem] = '<script type="application/ld+json">' + json.dumps(json.loads(f.read_text(encoding="utf-8")), ensure_ascii=False) + "</script>"

    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "static", OUT)

    layout = fingerprint(layout)

    errors = []
    count = 0
    for lang in LANGS:
        t = texts[lang]
        common = t.get("common", {})
        pages = PAGES + (["404"] if lang == "en" else [])
        for page in pages:
            section = t.get(page, {})
            links = {f"link.{p}": path_for(lang, p) for p in PAGES}

            def lookup(key, section=section):
                if key in section:
                    return section[key]
                if key in common:
                    return common[key]
                if key in links:
                    return links[key]
                if key == "lang":
                    return lang
                raise KeyError(key)

            try:
                body = render(templates[page], lookup, f"{lang}/{page}")
                values = {
                    "lang": lang,
                    "title": html.escape(lookup("title")),
                    "description": html.escape(lookup("description")),
                    "canonical": SITE + path_for(lang, page),
                    "alternates": alternates(page),
                    "robots": "index, follow" if INDEXING and page != "404" else "noindex, nofollow",
                    "jsonld": jsonld.get(page, ""),
                    "page": page,
                    "home": path_for(lang, "index"),
                    "nav": nav(lang, page, common["nav"]),
                "current_label": common["nav"].get(page, common["menu"]),
                    "langs": lang_switch(lang, page, common["language"]),
                    "keys_dialog": keys_dialog(common["keys"]),
                    "content": body.strip(),
                }
                for key in ("tagline", "skip", "menu", "keys_label", "legal_heading", "legal", "legal_link", "privacy", "credit"):
                    values[key] = common[key]
                values["legal_href"] = path_for(lang, "contact") + "#legal"
                values["copyright"] = common["copyright"].replace("{year}", str(datetime.date.today().year))
            except (MissingText, KeyError) as e:
                errors.append(str(e) if isinstance(e, MissingText) else f"{lang}/{page}: missing text {e}")
                continue
            text = layout
            for key, value in values.items():
                text = text.replace("{{" + key + "}}", value)
            target = out_file(lang, page)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")
            count += 1

    if errors:
        print("Build failed, text is missing:", *errors, sep="\n  ", file=sys.stderr)
        sys.exit(1)

    robots_txt = "User-agent: *\n"
    robots_txt += f"Allow: /\n\nSitemap: {SITE}/sitemap.xml\n" if INDEXING else "Disallow: /\n"
    (OUT / "robots.txt").write_text(robots_txt, encoding="utf-8")

    urls = []
    for page in PAGES:
        for lang in LANGS:
            alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{SITE}{path_for(l, page)}"/>' for l in LANGS)
            urls.append(f"  <url>\n    <loc>{SITE}{path_for(lang, page)}</loc>{alts}\n  </url>")
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(urls)
        + "\n</urlset>\n",
        encoding="utf-8",
    )
    print(f"Built {count} pages into {OUT.relative_to(ROOT)}/ (indexing {'ON' if INDEXING else 'OFF'})")


if __name__ == "__main__":
    if "--maintenance" in sys.argv[1:]:
        build_maintenance()
    else:
        build()
