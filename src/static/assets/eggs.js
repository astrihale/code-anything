// Easter eggs and the secrets they unlock.
//
// To add an egg: add an entry to SECRETS (all three languages), then wire a
// trigger near the bottom of this file, usually an element with
// data-egg="..." in a page.
(() => {
  "use strict";

  const lang = ["hr", "de"].includes(document.documentElement.lang) ? document.documentElement.lang : "en";

  const UI = {
    en: { kicker: "Secret uncovered", close: "Click anywhere or press Esc.", hurt: "The machine will not reason with you.", boombox: "Say Anything (1989). The company is named after it.", book: "From the unwritten book", bookDesc: "Answer: still being written.", radio: "Team radio", maxDesc: "Max Verstappen, P1. Orange everywhere.", playing: "Now playing", playingDesc: "Mitski. On repeat, as always.", torch: "The torch flares", torchDark: "Resolve is only tested once every secret is found.", tested: "Resolve is tested", virtueDesc: "Against all odds, a light in the dark.", afflictionDesc: "The mind cracks under the weight of every secret.", count: "secrets found" },
    hr: { kicker: "Otkrivena tajna", close: "Klikni bilo gdje ili pritisni Esc.", hurt: "Stroj neće raspravljati s tobom.", boombox: "Say Anything (1989). Tvrtka je nazvana po tom filmu.", book: "Iz nenapisane knjige", bookDesc: "Odgovor: još se piše.", radio: "Timski radio", maxDesc: "Max Verstappen, P1. Sve je narančasto.", playing: "Sada svira", playingDesc: "Mitski. Na ponavljanju, kao i uvijek.", torch: "Baklja planu", torchDark: "Odlučnost se iskušava tek kad otkriješ sve tajne.", tested: "Odlučnost je na kušnji", virtueDesc: "Unatoč svemu, svjetlo u tami.", afflictionDesc: "Um puca pod težinom svih tajni.", count: "otkrivenih tajni" },
    de: { kicker: "Geheimnis entdeckt", close: "Irgendwo klicken oder Esc drücken.", hurt: "Die Maschine diskutiert nicht mit dir.", boombox: "Say Anything (1989). Das Unternehmen ist nach dem Film benannt.", book: "Aus dem ungeschriebenen Buch", bookDesc: "Antwort: wird noch geschrieben.", radio: "Boxenfunk", maxDesc: "Max Verstappen, P1. Alles in Orange.", playing: "Läuft gerade", playingDesc: "Mitski. In Dauerschleife, wie immer.", torch: "Die Fackel lodert auf", torchDark: "Die Entschlossenheit wird erst geprüft, wenn alle Geheimnisse gefunden sind.", tested: "Die Entschlossenheit wird geprüft", virtueDesc: "Allen Widrigkeiten zum Trotz ein Licht im Dunkeln.", afflictionDesc: "Der Verstand zerbricht unter der Last aller Geheimnisse.", count: "Geheimnisse gefunden" },
  }[lang];

  const SECRETS = {
    "i-wanna-get-hurt": { icon: "♥", en: ["I Wanna Get Hurt", "Argued with a deterministic machine."], hr: ["I Wanna Get Hurt", "Rasprava s determinističkim strojem."], de: ["I Wanna Get Hurt", "Mit einer deterministischen Maschine diskutiert."] },
    boombox: { icon: "♫", en: ["Boombox Overhead", "Held it high outside the window."], hr: ["Kazetofon iznad glave", "Podignut visoko pod prozorom."], de: ["Ghettoblaster über dem Kopf", "Hoch gehalten vor dem Fenster."] },
    lloyd: { icon: "✉", en: ["Not a Career Plan", "Read the pinned note."], hr: ["Nije plan karijere", "Pročitana prikvačena bilješka."], de: ["Kein Karriereplan", "Die angeheftete Notiz gelesen."] },
    sprachtalent: { icon: "D", en: ["Sprachtalent", "Clicked Deutsch until it answered."], hr: ["Sprachtalent", "Klikovi na Deutsch dok nije odgovorio."], de: ["Sprachtalent", "Wunderbar."] },
    "new-hair": { icon: "⚗", en: ["New Colour", "The portrait changed. Don't be surprised."], hr: ["Nova boja", "Portret se promijenio. Bez iznenađenja."], de: ["Neue Farbe", "Das Porträt hat sich verändert."] },
    speedcuber: { icon: "■", en: ["Speedcuber", "Six quick turns. Solved."], hr: ["Speedcuber", "Šest brzih poteza. Riješeno."], de: ["Speedcuber", "Sechs schnelle Züge. Gelöst."] },
    "party-of-six": { icon: "∴", en: ["R(3,3) = 6", "Three acquaintances or three strangers. Always."], hr: ["R(3,3) = 6", "Troje poznanika ili troje stranaca. Uvijek."], de: ["R(3,3) = 6", "Drei Bekannte oder drei Fremde. Immer."] },
    "lights-out": { icon: "⚑", en: ["Lights Out", "And away we go."], hr: ["Lights Out", "I krenuli su."], de: ["Lights Out", "Und los geht's."] },
    "never-landed-it": { icon: "⟋", en: ["Never Landed It", "The kickflip remains theoretical."], hr: ["Nikad doskočeno", "Kickflip ostaje teoretski."], de: ["Nie gelandet", "Der Kickflip bleibt Theorie."] },
    keybinder: { icon: "⌨", en: ["Keyboard Only", "Navigated without touching the mouse."], hr: ["Samo tipkovnica", "Navigacija bez miša."], de: ["Nur Tastatur", "Ohne Maus navigiert."] },
    "flung-out-of-space": { icon: "🧤", en: ["Flung Out of Space", "The gloves found their way back."], hr: ["Flung Out of Space", "Rukavice su našle put natrag."], de: ["Flung Out of Space", "Die Handschuhe haben ihren Weg zurückgefunden."] },
    raven: { icon: "✒", en: ["Message Sent", "A reply will follow."], hr: ["Poruka poslana", "Odgovor slijedi."], de: ["Nachricht gesendet", "Eine Antwort folgt."] },
  };
  const TOTAL = Object.keys(SECRETS).length;

  // Session storage: discoveries last until the tab is closed.
  const store = {
    get(key, fallback) {
      try { const v = window.sessionStorage.getItem("ca:" + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { window.sessionStorage.setItem("ca:" + key, JSON.stringify(value)); } catch { /* storage blocked: eggs still work, just aren't remembered */ }
    },
  };

  const earned = new Set(store.get("earned", []).filter((id) => SECRETS[id]));

  // ---------- Toasts ----------
  const queue = [];
  let showing = false;

  function toast(icon, title, desc, kicker = UI.kicker) {
    queue.push({ icon, title, desc, kicker });
    showNext();
  }

  function showNext() {
    if (showing || queue.length === 0) return;
    showing = true;
    const t = queue.shift();
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML = '<span class="toast-icon" aria-hidden="true"></span><span><span class="toast-kicker"></span><span class="toast-title"></span><span class="toast-desc"></span></span>';
    el.querySelector(".toast-icon").textContent = t.icon;
    el.querySelector(".toast-kicker").textContent = t.kicker;
    el.querySelector(".toast-title").textContent = t.title;
    el.querySelector(".toast-desc").textContent = t.desc;
    document.body.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
    setTimeout(() => el.classList.remove("show"), 3600);
    setTimeout(() => { el.remove(); showing = false; showNext(); }, 4100);
  }

  function announce(id) {
    const s = SECRETS[id];
    const [title, desc] = s[lang] || s.en;
    toast(s.icon, title, desc);
    if (earned.size === TOTAL) {
      const r = resolve();
      toast(r.virtue ? "✦" : "☠", `${UI.tested}: ${r.name}`, r.virtue ? UI.virtueDesc : UI.afflictionDesc);
    }
  }

  function unlock(id, { deferred = false } = {}) {
    if (!SECRETS[id] || earned.has(id)) return;
    earned.add(id);
    store.set("earned", [...earned]);
    renderStress();
    applyRewards();
    if (deferred) {
      // The page is about to change; show the toast on the next one.
      try { window.sessionStorage.setItem("ca:pending", id); } catch { /* ignore */ }
      return;
    }
    announce(id);
  }

  // ---------- Stress meter ----------
  function renderStress() {
    document.querySelectorAll("[data-pips]").forEach((pips) => {
      pips.style.setProperty("--pips", TOTAL);
      if (pips.children.length !== TOTAL) {
        pips.replaceChildren(...Array.from({ length: TOTAL }, () => Object.assign(document.createElement("span"), { className: "pip" })));
      }
      [...pips.children].forEach((pip, i) => pip.classList.toggle("on", i < earned.size));
      const meter = pips.closest(".stress");
      if (!meter) return;
      const full = earned.size === TOTAL;
      meter.classList.toggle("full", full);
      let state = meter.querySelector(".stress-state");
      if (full && !state) {
        const r = resolve();
        meter.classList.add(r.virtue ? "virtue" : "affliction");
        state = Object.assign(document.createElement("span"), { className: "stress-state", textContent: `${UI.tested}: ${r.name}` });
        meter.append(state);
      }
    });
    // The portrait shows the outcome too: good Ana or evil Ana.
    if (earned.size === TOTAL) {
      const r = resolve();
      document.documentElement.classList.toggle("resolve-virtue", r.virtue);
      document.documentElement.classList.toggle("resolve-affliction", !r.virtue);
    }
    document.querySelectorAll("[data-achievements]").forEach((el) => {
      el.textContent = `${earned.size} / ${TOTAL} ${UI.count}`;
    });
    document.querySelectorAll("[data-achievements-short]").forEach((el) => {
      el.textContent = `${earned.size} / ${TOTAL}`;
    });
    // Secrets in the keyboard window: found ones by name, the rest as "???".
    document.querySelectorAll("[data-secrets]").forEach((list) => {
      list.replaceChildren(...Object.entries(SECRETS).map(([id, secret]) => {
        const li = document.createElement("li");
        const found = earned.has(id);
        li.className = found ? "found" : "unknown";
        const [title, desc] = secret[lang] || secret.en;
        li.textContent = found ? `${secret.icon}  ${title}` : "???";
        if (found) li.title = desc;
        return li;
      }));
    });
  }

  // Darkest Dungeon: at full stress, resolve is tested. Usually an affliction, sometimes a virtue.
  const VIRTUES = ["Stalwart", "Courageous", "Focused", "Powerful", "Vigorous"];
  const AFFLICTIONS = ["Fearful", "Paranoid", "Selfish", "Masochistic", "Abusive", "Hopeless", "Irrational"];
  function resolve() {
    let r = store.get("resolve", null);
    if (!r) {
      const virtue = Math.random() < 0.25;
      const pool = virtue ? VIRTUES : AFFLICTIONS;
      r = { virtue, name: pool[Math.floor(Math.random() * pool.length)] };
      store.set("resolve", r);
    }
    return r;
  }

  window.CodeAnything = { unlock };

  // ---------- Helpers ----------
  function rapidClicks(el, count, windowMs, onDone) {
    let times = [];
    el.addEventListener("click", () => {
      const now = Date.now();
      times = times.filter((t) => now - t < windowMs);
      times.push(now);
      if (times.length >= count) { times = []; onDone(); }
    });
  }

  function stage(content) {
    const el = document.createElement("div");
    el.className = "stage";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.tabIndex = -1;
    el.append(content);
    const opener = document.activeElement;
    const close = () => {
      el.remove();
      document.removeEventListener("keydown", onKey);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    el.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.append(el);
    el.focus();
    return el;
  }

  function floaters(parent, cls, glyphs, count) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = cls;
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = `${10 + Math.random() * 80}%`;
      s.style.top = `${40 + Math.random() * 40}%`;
      s.style.setProperty("--dx", `${Math.round(Math.random() * 80 - 40)}px`);
      s.style.animationDelay = `${(Math.random() * 1.4).toFixed(2)}s`;
      parent.append(s);
    }
  }

  function hint(text) {
    return Object.assign(document.createElement("p"), { className: "stage-hint", textContent: text });
  }

  // ---------- Eggs ----------

  // Click the "everything happens for a reason" principle five times quickly.
  document.querySelectorAll('[data-egg="axiom"]').forEach((el) => {
    rapidClicks(el, 5, 2000, () => {
      const inner = document.createElement("div");
      inner.className = "stage-inner";
      const words = document.createElement("p");
      words.className = "hurt";
      words.setAttribute("aria-label", "I wanna get hurt");
      [..."I WANNA GET HURT"].forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch === " " ? " " : ch;
        span.style.setProperty("--i", i);
        words.append(span);
      });
      inner.append(words, hint(UI.hurt), hint(UI.close));
      const s = stage(inner);
      floaters(s, "heart", ["♥", "❤", "♡"], 16);
      unlock("i-wanna-get-hurt");
    });
  });

  // ↑ ↑ ↓ ↓ ← → ← → B A
  const konami = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let progress = 0;
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    progress = key === konami[progress] ? progress + 1 : key === konami[0] ? 1 : 0;
    if (progress < konami.length) return;
    progress = 0;
    const inner = document.createElement("div");
    inner.className = "stage-inner";
    inner.innerHTML = BOOMBOX_SVG + '<p class="stage-caption">In your eyes…</p>';
    inner.append(hint(UI.boombox), hint(UI.close));
    const s = stage(inner);
    floaters(s, "note-fly", ["♪", "♫", "♩", "♬"], 12);
    unlock("boombox");
  });

  // Click "Deutsch" seven times quickly: unlocks the German language switch.
  document.querySelectorAll('[data-egg="deutsch"]').forEach((el) => {
    rapidClicks(el, 7, 3000, () => unlock("sprachtalent"));
  });

  // Lasting effects of secrets already found.
  function applyRewards() {
    if (earned.has("sprachtalent")) {
      document.querySelectorAll('[data-unlock="de"]').forEach((el) => { el.hidden = false; });
    }
    if (earned.has("speedcuber")) {
      document.querySelectorAll('[data-egg="cube"]').forEach((el) => el.classList.add("solved"));
    }
  }

  // Hair dye: cycles the portrait's hair colour.
  const HAIR = ["#eee4c8", "#8a0f13", "#4a1a5c", "#1e3a6b", "#0f4a3a", "#b0552a", "#cfc6b8", "#0d0a0a", "#c9a227"];
  const setHair = (i) => document.documentElement.style.setProperty("--hair", HAIR[i % HAIR.length]);
  let hair = store.get("hair", 0);
  if (hair) setHair(hair);
  document.querySelectorAll('[data-egg="potion"]').forEach((el) => {
    el.addEventListener("click", () => {
      hair = (hair + 1) % HAIR.length;
      setHair(hair);
      store.set("hair", hair);
      const ribbon = document.createElement("div");
      ribbon.className = "hair-ribbon";
      ribbon.style.setProperty("--ribbon", HAIR[hair]);
      document.body.append(ribbon);
      setTimeout(() => ribbon.remove(), 2200);
      unlock("new-hair");
    });
  });

  // Puzzle cube: six quick turns solve it.
  document.querySelectorAll('[data-egg="cube"]').forEach((el) => {
    el.addEventListener("click", () => {
      el.classList.remove("spin");
      void el.offsetWidth;
      el.classList.add("spin");
    });
    rapidClicks(el, 6, 4000, () => unlock("speedcuber"));
  });

  const simple = { ramsey: "party-of-six", f1: "lights-out", skateboard: "never-landed-it" };
  Object.entries(simple).forEach(([egg, id]) => {
    document.querySelectorAll(`[data-egg="${egg}"]`).forEach((el) => el.addEventListener("click", () => unlock(id)));
  });

  // The skateboard sends a calico cat rolling along the bottom of the screen, with bats across the menu.
  document.querySelectorAll('[data-egg="skateboard"]').forEach((el) => {
    el.addEventListener("click", () => {
      if (document.querySelector(".cat-rider")) return;
      const rider = document.createElement("div");
      rider.className = "cat-rider";
      rider.setAttribute("aria-hidden", "true");
      rider.innerHTML = CAT_SVG;
      document.body.append(rider);
      rider.addEventListener("animationend", (e) => { if (e.target === rider) rider.remove(); });
      // ...and a few bats flit across the menu bar.
      const bar = document.querySelector(".menu");
      const barBox = bar ? bar.getBoundingClientRect() : { top: 0, height: 60 };
      const barMiddle = Math.max(0, barBox.top) + barBox.height / 2;
      for (let i = 0; i < 4; i++) {
        const bat = document.createElement("div");
        bat.className = "bat";
        bat.setAttribute("aria-hidden", "true");
        bat.innerHTML = BAT_SVG;
        bat.style.setProperty("--top", `${Math.round(barMiddle - 14 + (Math.random() * 24 - 12))}px`);
        bat.style.setProperty("--delay", `${(i * 0.3 + Math.random() * 0.2).toFixed(2)}s`);
        bat.style.setProperty("--dur", `${(2.2 + Math.random() * 0.8).toFixed(2)}s`);
        bat.style.setProperty("--size", `${22 + Math.round(Math.random() * 12)}px`);
        document.body.append(bat);
        bat.addEventListener("animationend", (e) => { if (e.target === bat) bat.remove(); });
      }
    });
  });

  // The portrait blinks once when the pointer arrives, and winks when clicked.
  // Each runs once and is cleared when it ends, so one never retriggers the other.
  document.querySelectorAll(".portrait").forEach((el) => {
    const play = (cls) => {
      el.classList.remove("blink", "wink");
      void el.getBoundingClientRect();
      el.classList.add(cls);
    };
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !el.classList.contains("wink")) play("blink"); });
    el.addEventListener("click", () => play("wink"));
    el.addEventListener("animationend", (e) => {
      if (e.animationName === "blink" || e.animationName === "wink") el.classList.remove(e.animationName);
    });
  });

  // Carol's gloves: one flies in an arc to the other side of the page, as if being returned.
  document.querySelectorAll('[data-egg="gloves"]').forEach((el) => {
    el.addEventListener("click", () => {
      if (document.querySelector(".glove-flight")) return;
      const box = el.getBoundingClientRect();
      const flight = document.createElement("div");
      flight.className = "glove-flight";
      flight.setAttribute("aria-hidden", "true");
      flight.innerHTML = el.querySelector("svg").outerHTML;
      flight.style.left = `${box.left}px`;
      flight.style.top = `${box.top}px`;
      flight.style.setProperty("--dx", `${Math.round(window.innerWidth - 2 * box.left - box.width)}px`);
      document.body.append(flight);
      flight.addEventListener("animationend", () => flight.remove());
      unlock("flung-out-of-space");
    });
  });

  // The chequered flag: an orange ribbon and a message over team radio.
  document.querySelectorAll('[data-egg="f1"]').forEach((el) => {
    el.addEventListener("click", () => {
      const ribbon = document.createElement("div");
      ribbon.className = "hair-ribbon";
      ribbon.style.setProperty("--ribbon", "#ff7a00");
      document.body.append(ribbon);
      setTimeout(() => ribbon.remove(), 2200);
      toast("🏁", "Super Max!", UI.maxDesc, UI.radio);
    });
  });

  // The unwritten book: one of the many questions, in random order without repeats.
  const QUESTIONS = {
      "hr": [
          "Kako da začepim odvod u školjki da je napunim limunskom kiselinom?",
          "Zašto voda u WC školjku ulazi samo s jedne strane i vrti se kao tornado?",
          "Kako da skinem osušenu bijelu boju za zid s otirača?",
          "Mogu li gramofon spojiti na liniju bez kabela preko poda?",
          "Kako se radi poširano jaje?",
          "Kako se radi hollandaise?",
          "Kako da napjenim mlijeko na DeLonghi Stilosi za latte art?",
          "Kako se rade ćevapi na električnom roštilju?",
          "Zašto kabel za bateriju ne sjeda u MacBook?",
          "Što znači kad multimetar pokaže 0.00 V?",
          "Treba li mi uopće multimetar ili mi je dosta šrafciger?",
          "Je li multimetar iz Lidla dovoljno dobar?",
          "Što da upgradeam na AM4 kompu da mi radi Forza Horizon 6?",
          "Hoće li GTA 6 raditi na RX 580?",
          "Koji jeftini auto je pouzdan, a da izgleda šminkerski?",
          "Je li Mazda 3 BL dobar auto?",
          "Kako da se odjavim sa svih „Sign in with Google” stranica?",
          "Kako se brine o peace lilyju?"
      ],
      "en": [
          "How do I plug the toilet drain so I can fill it with citric acid?",
          "Why does water enter the toilet bowl from one side only and spin like a tornado?",
          "How do I get dried white wall paint off a doormat?",
          "Can I connect a record player to line-in without running a cable across the floor?",
          "How do you make a poached egg?",
          "How do you make hollandaise?",
          "How do I froth milk on a DeLonghi Stilosa for latte art?",
          "How do you make ćevapi on an electric grill?",
          "Why won't the charging cable sit properly in my MacBook?",
          "What does it mean when the multimeter shows 0.00 V?",
          "Do I even need a multimeter, or is a screwdriver enough?",
          "Is the multimeter from Lidl good enough?",
          "What should I upgrade on my AM4 PC to run Forza Horizon 6?",
          "Will GTA 6 run on an RX 580?",
          "Which cheap car is reliable but still looks fancy?",
          "Is the Mazda 3 BL a good car?",
          "How do I sign out of every “Sign in with Google” site at once?",
          "How do you take care of a peace lily?"
      ],
      "de": [
          "Wie verstopfe ich den Abfluss der Toilette, um sie mit Zitronensäure zu füllen?",
          "Warum kommt das Wasser nur von einer Seite in die Toilette und dreht sich wie ein Tornado?",
          "Wie bekomme ich getrocknete weiße Wandfarbe von einer Fußmatte?",
          "Kann ich einen Plattenspieler an den Line-Eingang anschließen, ohne ein Kabel über den Boden zu legen?",
          "Wie macht man ein pochiertes Ei?",
          "Wie macht man Sauce hollandaise?",
          "Wie schäume ich Milch mit einer DeLonghi Stilosa für Latte Art auf?",
          "Wie macht man Ćevapi auf einem Elektrogrill?",
          "Warum sitzt das Ladekabel nicht richtig in meinem MacBook?",
          "Was bedeutet es, wenn das Multimeter 0,00 V anzeigt?",
          "Brauche ich überhaupt ein Multimeter, oder reicht ein Schraubenzieher?",
          "Ist das Multimeter von Lidl gut genug?",
          "Was soll ich an meinem AM4-PC aufrüsten, damit Forza Horizon 6 läuft?",
          "Läuft GTA 6 auf einer RX 580?",
          "Welches günstige Auto ist zuverlässig und sieht trotzdem schick aus?",
          "Ist der Mazda 3 BL ein gutes Auto?",
          "Wie melde ich mich bei allen „Mit Google anmelden“-Seiten auf einmal ab?",
          "Wie pflegt man ein Einblatt (Peace Lily)?"
      ]
  };
  let deck = [];
  document.querySelectorAll('[data-egg="book"]').forEach((el) => {
    el.addEventListener("click", () => {
      const pool = QUESTIONS[lang] || QUESTIONS.en;
      if (deck.length === 0) deck = pool.map((_, i) => i).sort(() => Math.random() - 0.5);
      toast("📖", pool[deck.pop()], UI.bookDesc, UI.book);
    });
  });

  // The headphones: always the same song.
  document.querySelectorAll('[data-egg="phones"]').forEach((el) => {
    el.addEventListener("click", () => {
      const slot = el.closest(".slot") || el;
      floaters(slot, "note-fly slot-note", ["♪", "♫", "♪", "♬"], 4);
      setTimeout(() => slot.querySelectorAll(".slot-note").forEach((n) => n.remove()), 2600);
      toast("♫", "Francis Forever", UI.playingDesc, UI.playing);
    });
  });

  // The torch: lights up the page and, at full stress, tests resolve again.
  let torchTimer = null;
  document.querySelectorAll('[data-egg="torch"]').forEach((el) => {
    el.addEventListener("click", () => {
      const root = document.documentElement;
      root.classList.remove("torch-lit");
      void root.offsetWidth;
      root.classList.add("torch-lit");
      clearTimeout(torchTimer);
      torchTimer = setTimeout(() => root.classList.remove("torch-lit"), 4200);
      if (earned.size < TOTAL) { toast("🔥", UI.torch, UI.torchDark); return; }
      store.set("resolve", null);
      document.querySelectorAll(".stress-state").forEach((n) => n.remove());
      document.querySelectorAll(".stress").forEach((m) => m.classList.remove("virtue", "affliction"));
      setTimeout(() => {
        renderStress();
        const r = resolve();
        toast(r.virtue ? "✦" : "☠", `${UI.tested}: ${r.name}`, r.virtue ? UI.virtueDesc : UI.afflictionDesc);
      }, 700);
    });
  });

  // The pinned note on the ambitions board.
  document.querySelectorAll('details[data-egg="lloyd"]').forEach((el) => {
    el.addEventListener("toggle", () => { if (el.open) unlock("lloyd"); });
  });

  renderStress();
  applyRewards();
  try {
    const pending = window.sessionStorage.getItem("ca:pending");
    if (pending && SECRETS[pending]) {
      window.sessionStorage.removeItem("ca:pending");
      announce(pending);
    }
  } catch { /* ignore */ }

  // ---------- Art ----------
  const BAT_SVG = `<svg viewBox="0 0 40 24" width="100%" height="100%">
    <g class="bat-wave" stroke="#8c6a50" stroke-width="0.7" stroke-linejoin="round">
      <g class="bat-wing"><path d="M18 12 C12 3 6 3 1 7 C4 8 5 10 5 13 C8 11 11 12 14 15 Z" fill="#1d1416"/></g>
      <g class="bat-wing"><path d="M22 12 C28 3 34 3 39 7 C36 8 35 10 35 13 C32 11 29 12 26 15 Z" fill="#1d1416"/></g>
      <path d="M17 7 L18 3 L20 7 L22 3 L23 7 Z" fill="#1d1416"/>
      <ellipse cx="20" cy="12" rx="4.2" ry="5.2" fill="#1d1416"/>
      <circle cx="18.5" cy="10" r="0.9" fill="#ff5a5a"/><circle cx="21.5" cy="10" r="0.9" fill="#ff5a5a"/>
    </g>
  </svg>`;
  const CAT_SVG = `<svg viewBox="0 0 90 62" width="90" height="62">
    <defs><clipPath id="cat-body"><ellipse cx="44" cy="35" rx="20" ry="10"/><circle cx="66" cy="25" r="9"/></clipPath></defs>
    <g class="cat-bob">
      <path d="M26 33 C16 30 10 22 12 12" fill="none" stroke="#f4f1ea" stroke-width="4" stroke-linecap="round"/>
      <path d="M13 17 C12 14 12 13 12 12" fill="none" stroke="#2a2523" stroke-width="4" stroke-linecap="round"/>
      <rect x="30" y="40" width="4" height="7" rx="1.5" fill="#f4f1ea"/><rect x="37" y="40" width="4" height="7" rx="1.5" fill="#f4f1ea"/>
      <rect x="50" y="40" width="4" height="7" rx="1.5" fill="#f4f1ea"/><rect x="57" y="40" width="4" height="7" rx="1.5" fill="#f4f1ea"/>
      <ellipse cx="44" cy="35" rx="20" ry="10" fill="#f4f1ea"/>
      <path d="M59 19 L60 9 L66 16 Z" fill="#e08a3c"/><path d="M67 16 L72 8 L74 19 Z" fill="#2a2523"/>
      <circle cx="66" cy="25" r="9" fill="#f4f1ea"/>
      <g clip-path="url(#cat-body)">
        <ellipse cx="36" cy="29" rx="10" ry="7" fill="#e08a3c"/>
        <ellipse cx="51" cy="33" rx="7" ry="6" fill="#2a2523"/>
        <ellipse cx="61" cy="20" rx="6" ry="5" fill="#e08a3c"/>
        <ellipse cx="71" cy="18" rx="4" ry="4" fill="#2a2523"/>
      </g>
      <circle cx="68.5" cy="24" r="1.3" fill="#1a1414"/>
      <circle cx="74.5" cy="27" r="1.1" fill="#e58f9a"/>
      <path d="M73 29 L82 28 M73 30 L82 31.5" stroke="#cfc6b8" stroke-width="0.6"/>
    </g>
    <path d="M8 47 L82 47 C84 47 85 48 84 50 L80 51 L10 51 L6 50 C5 48 6 47 8 47 Z" fill="#4a1215" stroke="#cfc6b8" stroke-width="0.8"/>
    <g class="cat-wheel"><circle cx="22" cy="56" r="4.5" fill="#c9b37e"/><path d="M22 52 V60 M18 56 H26" stroke="#6b5a3e" stroke-width="1"/></g>
    <g class="cat-wheel"><circle cx="68" cy="56" r="4.5" fill="#c9b37e"/><path d="M68 52 V60 M64 56 H72" stroke="#6b5a3e" stroke-width="1"/></g>
  </svg>`;
  const BOOMBOX_SVG = `<svg class="boombox" viewBox="0 0 40 34" shape-rendering="crispEdges" role="img" aria-label="A boombox held overhead">
    <rect x="6" y="22" width="4" height="12" fill="#8a6a55"/><rect x="30" y="22" width="4" height="12" fill="#8a6a55"/>
    <rect x="11" y="1" width="18" height="2" fill="#6e665b"/><rect x="10" y="1" width="2" height="6" fill="#6e665b"/><rect x="28" y="1" width="2" height="6" fill="#6e665b"/>
    <rect x="2" y="6" width="36" height="17" fill="#26201d"/><rect x="2" y="6" width="36" height="3" fill="#3d342c"/>
    <rect x="3" y="7" width="3" height="1" fill="#c9b37e"/><rect x="34" y="7" width="2" height="1" fill="#c41e24"/>
    <rect x="4" y="10" width="11" height="11" fill="#0d0a09"/><rect x="6" y="12" width="7" height="7" fill="#4a4038"/><rect x="8" y="14" width="3" height="3" fill="#120e0c"/>
    <rect x="25" y="10" width="11" height="11" fill="#0d0a09"/><rect x="27" y="12" width="7" height="7" fill="#4a4038"/><rect x="29" y="14" width="3" height="3" fill="#120e0c"/>
    <rect x="16" y="10" width="8" height="7" fill="#120e0c"/><rect x="17" y="12" width="6" height="2" fill="#6e7f80"/><rect x="18" y="12" width="1" height="2" fill="#1d2526"/><rect x="21" y="12" width="1" height="2" fill="#1d2526"/>
    <rect x="16" y="18" width="2" height="2" fill="#c41e24"/><rect x="19" y="18" width="2" height="2" fill="#c9b37e"/><rect x="22" y="18" width="2" height="2" fill="#6e665b"/>
    <rect x="5" y="21" width="6" height="3" fill="#9a7862"/><rect x="29" y="21" width="6" height="3" fill="#9a7862"/>
  </svg>`;
})();
