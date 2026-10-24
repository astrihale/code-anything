// Keybinds, keyboard navigation, touch tooltips and the raven (contact) form.
// No dependencies.
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  const modalOpen = () => document.querySelector("dialog[open], .stage");
  const unlock = (id, opts) => window.CodeAnything && window.CodeAnything.unlock(id, opts);

  // ---------- Keybinds dialog ----------
  const keys = document.getElementById("keys");
  let keysOpener = null;
  function openKeys() {
    if (!keys || keys.open) return;
    keysOpener = document.activeElement;
    keys.showModal();
  }
  if (keys) {
    keys.addEventListener("close", () => { if (keysOpener && keysOpener.focus) keysOpener.focus(); });
    keys.addEventListener("click", (e) => { if (e.target === keys || e.target.closest("[data-close]")) keys.close(); });
  }
  document.querySelectorAll("[data-help]").forEach((b) => b.addEventListener("click", openKeys));

  // "Not every key is listed here" reveals the secrets found so far.
  document.querySelectorAll("[data-secrets-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
  });

  // ---------- Menu button on small screens ----------
  const menu = document.querySelector(".menu");
  const toggle = menu && menu.querySelector(".menu-toggle");
  if (toggle) {
    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => {
      const open = !menu.classList.contains("open");
      setOpen(open);
      if (open) {
        const current = menu.querySelector('.tab[aria-current="page"]') || menu.querySelector(".tab");
        if (current) current.focus();
      }
    });
    document.addEventListener("pointerdown", (e) => { if (!menu.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); toggle.focus(); }
    });
  }

  // ---------- Global keybinds ----------
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || typing(document.activeElement)) return;
    if (event.key === "?") { event.preventDefault(); openKeys(); return; }
    if (modalOpen()) return;
    const key = event.key.toUpperCase();
    const tab = document.querySelector(`.tab[data-key="${key}"], .tab[data-num="${key}"]`);
    if (!tab) return;
    event.preventDefault();
    if (tab.getAttribute("aria-current") === "page") {
      document.getElementById("main").focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
      return;
    }
    unlock("keybinder", { deferred: true });
    window.location.href = tab.href;
  });

  // Elements acting as buttons (the secret ones) also answer to Enter and Space.
  document.querySelectorAll('[role="button"][tabindex]').forEach((el) => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); }
    });
  });

  // ---------- Roving focus: Tab between sections, arrows within ----------
  function rovingItems(group) {
    const sel = group.dataset.roving;
    const found = /^[a-z]+$/.test(sel) ? group.querySelectorAll(`:scope > ${sel}`) : group.querySelectorAll(sel);
    return [...found];
  }

  function pickSpatial(items, current, key) {
    const from = current.getBoundingClientRect();
    const fx = from.left + from.width / 2;
    const fy = from.top + from.height / 2;
    let best = null;
    let bestScore = Infinity;
    for (const item of items) {
      if (item === current) continue;
      const r = item.getBoundingClientRect();
      const dx = r.left + r.width / 2 - fx;
      const dy = r.top + r.height / 2 - fy;
      const ok =
        (key === "ArrowRight" && dx > 4 && Math.abs(dy) < Math.max(from.height, r.height) / 2) ||
        (key === "ArrowLeft" && dx < -4 && Math.abs(dy) < Math.max(from.height, r.height) / 2) ||
        (key === "ArrowDown" && dy > 4) ||
        (key === "ArrowUp" && dy < -4);
      if (!ok) continue;
      const vertical = key === "ArrowDown" || key === "ArrowUp";
      const score = vertical ? Math.abs(dy) + Math.abs(dx) * 2 : Math.abs(dx) + Math.abs(dy) * 2;
      if (score < bestScore) { bestScore = score; best = item; }
    }
    return best;
  }

  // Sections in page order: the language switch, the menu, then the page's groups of items
  // ([data-roving]) and plain text blocks ([data-stop]). Tab visits each section once;
  // arrows move within a section and continue into the next one.
  const sections = [...document.querySelectorAll("body > header [data-roving], body > nav[data-roving], #main [data-roving], #main [data-stop]")];
  const visible = (el) => !el.hidden && el.offsetParent !== null;
  const itemsOf = (section) => rovingItems(section).filter(visible);
  const select = (items, target) => items.forEach((it) => it.setAttribute("tabindex", it === target ? "0" : "-1"));

  function enter(section, fromEnd) {
    if (section.hasAttribute("data-stop")) { section.focus(); return; }
    const items = itemsOf(section);
    if (items.length === 0) { step(section, fromEnd ? -1 : 1); return; }
    const target = fromEnd ? items[items.length - 1] : items.find((it) => it.getAttribute("tabindex") === "0") || items[0];
    select(items, target);
    target.focus();
  }

  function step(section, direction) {
    const next = sections[sections.indexOf(section) + direction];
    if (next) enter(next, direction < 0);
  }

  sections.forEach((section) => {
    if (section.hasAttribute("data-stop")) {
      section.setAttribute("tabindex", "0");
      section.addEventListener("keydown", (e) => {
        if (e.target !== section || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); step(section, 1); }
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); step(section, -1); }
      });
      return;
    }

    // The current page or language starts selected; otherwise the first item.
    const initial = rovingItems(section);
    select(initial, initial.find((it) => it.hasAttribute("aria-current")) || initial[0]);

    section.addEventListener("focusin", (e) => {
      const items = itemsOf(section);
      if (items.includes(e.target)) select(items, e.target);
    });

    section.addEventListener("keydown", (e) => {
      const items = itemsOf(section);
      const current = items.find((it) => it === document.activeElement);
      if (!current || e.altKey || e.ctrlKey || e.metaKey) return;
      const i = items.indexOf(current);
      let to = null;
      if (e.key === "Home") to = items[0];
      else if (e.key === "End") to = items[items.length - 1];
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") to = pickSpatial(items, current, e.key);
      else if (e.key === "ArrowRight") to = pickSpatial(items, current, e.key) || items[i + 1] || null;
      else if (e.key === "ArrowLeft") to = pickSpatial(items, current, e.key) || items[i - 1] || null;
      else return;
      e.preventDefault();
      if (to) { select(items, to); to.focus(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") step(section, 1);
      else step(section, -1);
    });
  });

  // ---------- Inventory tooltips: tap to open on touch, keep on screen ----------
  const slots = [...document.querySelectorAll(".slot")];
  function placeTooltip(slot) {
    const tip = slot.querySelector(".tooltip");
    if (!tip) return;
    slot.classList.remove("edge-left", "edge-right");
    const r = slot.getBoundingClientRect();
    const half = Math.min(290, window.innerWidth - 32) / 2;
    if (r.left + r.width / 2 - half < 16) slot.classList.add("edge-left");
    else if (r.left + r.width / 2 + half > window.innerWidth - 16) slot.classList.add("edge-right");
  }
  slots.forEach((slot) => {
    slot.addEventListener("pointerenter", () => placeTooltip(slot));
    slot.addEventListener("focusin", () => placeTooltip(slot));
    const btn = slot.querySelector(".slot-btn");
    // Touch has no hover, so a tap pins the tooltip open; a mouse only shows it while hovering.
    let pointer = "mouse";
    if (btn) btn.addEventListener("pointerdown", (e) => { pointer = e.pointerType; });
    if (btn) btn.addEventListener("click", () => {
      if (pointer !== "touch" && pointer !== "pen") return;
      placeTooltip(slot);
      slots.forEach((s) => { if (s !== slot) s.classList.remove("open"); });
      slot.classList.add("open");
    });
    slot.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") slot.classList.remove("open"); });
  });
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".slot")) slots.forEach((s) => s.classList.remove("open"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") slots.forEach((s) => s.classList.remove("open"));
  });

  // ---------- Reveal sections as they scroll into view ----------
  // Anything at or above the bottom of the screen is revealed, so sections passed by a fast
  // scroll or a jump never stay hidden.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let pending = [...document.querySelectorAll(".tree, .quest, .legend > article, .tomes > li, .party > li, .arsenal > div, .feat, .board-col")]
      .filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    pending.forEach((el) => el.classList.add("reveal"));
    let queued = false;
    const check = () => {
      queued = false;
      const limit = window.innerHeight * 0.95;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < limit) { el.classList.add("in"); return false; }
        return true;
      });
      if (pending.length === 0) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Anything focused by keyboard must be visible immediately.
    document.addEventListener("focusin", (e) => {
      const hidden = e.target.closest(".reveal:not(.in)");
      if (hidden) hidden.classList.add("in");
    });
  }

  // ---------- The raven form ----------
  // Composes an email in the visitor's own mail app, so nothing is sent to any server but theirs.
  const form = document.querySelector("form[data-raven]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const company = data.get("company");
    const subject = `[${data.get("quest")}] ${data.get("name")}${company ? " / " + company : ""}`;
    const body = [data.get("message"), "", "—", `${data.get("name")}${company ? ", " + company : ""}`, data.get("email")].join("\n");
    window.location.href = `mailto:${form.dataset.raven}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const sent = form.querySelector(".sent");
    if (sent) sent.hidden = false;
    unlock("raven");
  });
})();
