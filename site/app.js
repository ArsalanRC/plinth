/**
 * consign: the page.
 *
 * Four scenes, and every one of them shows something the contract actually
 * does rather than decorating the page around it. The numbers come from the
 * same basis points the Solidity uses, so a reader who opens the source finds
 * the figures they just watched move.
 *
 * No build step, no bundler, no framework. Plain ES modules, served as written.
 */

import { STRINGS, SCENES, MUTATIONS } from "./i18n.js";
import { initChrome, prefersReduced, sleep } from "./chrome.js";

const chrome = initChrome(STRINGS, { prefix: "consign" });

const $ = (id) => document.getElementById(id);

/** The same constants the contract is deployed with. */
const PRICE = 1;
const FEE_BPS = 250;
const ROYALTY_BPS = 500;
const MAX_ROYALTY_BPS = 1000;

const scenes = () => SCENES[chrome.lang()] ?? SCENES.en;

/** German writes a decimal comma, and a page that gets that wrong looks foreign. */
const num = (value, places = 3) =>
  value.toLocaleString(chrome.lang() === "de" ? "de-DE" : "en-GB", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });

// --------------------------------------------------------------- reveals

/**
 * Reveal on scroll, by checking positions inside the scroll handler that
 * already exists.
 *
 * Deliberately not `IntersectionObserver`. Observers coalesce their callbacks,
 * so an element that enters and leaves the viewport between two ticks never
 * reports as intersecting and stays invisible permanently. Fast scrolling, a
 * deep link and the End key all reproduce it, and it is silent.
 */
const reveals = [...document.querySelectorAll(".reveal")];
const onScroll = () => {
  const limit = window.innerHeight * 0.88;
  for (const el of reveals) {
    if (el.classList.contains("is-in")) continue;
    if (el.getBoundingClientRect().top < limit) el.classList.add("is-in");
  }
  autoplay();
};

addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll, { passive: true });

// --------------------------------------------------- scene 1: the split

function paintSplit() {
  const royalty = (PRICE * ROYALTY_BPS) / 10_000;
  const fee = (PRICE * FEE_BPS) / 10_000;
  const seller = PRICE - royalty - fee;

  $("bar-seller").style.width = `${(seller / PRICE) * 100}%`;
  $("bar-creator").style.width = `${(royalty / PRICE) * 100}%`;
  $("bar-market").style.width = `${(fee / PRICE) * 100}%`;

  $("v-seller").textContent = num(seller);
  $("v-creator").textContent = num(royalty);
  $("v-market").textContent = num(fee);
}

// ------------------------------------------- scene 2: push against pull

/** Render a step list one line at a time, marking the last one good or bad. */
async function runSteps(listEl, verdictEl, lines, verdict, outcome) {
  listEl.innerHTML = "";
  verdictEl.textContent = "";
  verdictEl.className = "verdict";

  const items = lines.map((line, index) => {
    const li = document.createElement("li");
    const mark = document.createElement("span");
    mark.className = "mark";
    mark.textContent = index === lines.length - 1 ? (outcome === "bad" ? "✕" : "✓") : "·";
    const text = document.createElement("span");
    text.textContent = line;
    li.append(mark, text);
    listEl.append(li);
    return li;
  });

  for (let i = 0; i < items.length; i++) {
    await sleep(i === 0 ? 260 : 620);
    items[i].classList.add("is-on");
    if (i === items.length - 1) {
      items[i].classList.add(outcome === "bad" ? "is-bad" : "is-good");
    }
  }

  await sleep(280);
  verdictEl.textContent = verdict;
  verdictEl.className = `verdict ${outcome === "bad" ? "is-bad" : "is-good"}`;
}

let payRunning = false;

async function runPay() {
  if (payRunning) return;
  payRunning = true;

  const s = scenes();
  $("lane-push").className = "lane";
  $("lane-pull").className = "lane";

  // Both lanes at once, because the whole point is that they are the same sale.
  await Promise.all([
    runSteps($("steps-push"), $("verdict-push"), s.push, s.pushVerdict, "bad"),
    runSteps($("steps-pull"), $("verdict-pull"), s.pull, s.pullVerdict, "good"),
  ]);

  $("lane-push").className = "lane is-reverted";
  $("lane-pull").className = "lane is-settled";
  payRunning = false;
}

// ------------------------------------------------ scene 3: the royalty cap

function paintCap() {
  const capped = $("cap-toggle").checked;
  const demanded = PRICE * 2;
  const ceiling = (PRICE * MAX_ROYALTY_BPS) / 10_000;
  const paid = capped ? ceiling : demanded;
  const fee = (PRICE * FEE_BPS) / 10_000;
  const kept = PRICE - paid - fee;

  const verdict = $("cap-verdict");
  const s = scenes();

  $("cap-v-demanded").textContent = num(demanded);

  if (capped) {
    $("cap-seller").style.width = `${(kept / PRICE) * 100}%`;
    $("cap-creator").style.width = `${(paid / PRICE) * 100}%`;
    $("cap-market").style.width = `${(fee / PRICE) * 100}%`;

    $("cap-v-paid").textContent = num(paid);
    $("cap-v-kept").textContent = num(kept);
    verdict.textContent = s.capOn
      .replace("{cap}", num(paid, 1))
      .replace("{kept}", num(kept));
    verdict.className = "verdict is-good";
    return;
  }

  // Uncapped the seller's share goes negative, which in Solidity is not a
  // negative number. It is a revert, and the bar has nothing to draw.
  $("cap-seller").style.width = "0%";
  $("cap-creator").style.width = "100%";
  $("cap-market").style.width = "0%";

  $("cap-v-paid").textContent = num(demanded);
  $("cap-v-kept").textContent = "revert";
  verdict.textContent = s.capOff;
  verdict.className = "verdict is-bad";
}

// -------------------------------------------------- scene 4: staleness

let staleRunning = false;

async function runStale() {
  if (staleRunning) return;
  staleRunning = true;

  const s = scenes();
  await runSteps($("steps-stale"), $("verdict-stale"), s.stale, s.staleVerdict, "good");

  staleRunning = false;
}

// ------------------------------------------------- scene 5: the mutations

function paintMutations() {
  const list = $("mutations");
  const rows = MUTATIONS[chrome.lang()] ?? MUTATIONS.en;
  const german = chrome.lang() === "de";
  const broken = new Set(
    [...list.querySelectorAll(".mutation.is-broken")].map((el) => Number(el.dataset.index)),
  );

  list.innerHTML = "";

  rows.forEach((row, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mutation";
    button.dataset.index = String(index);

    const what = document.createElement("span");
    what.className = "what";
    what.textContent = row.what;

    const state = document.createElement("span");
    state.className = "state";

    const caught = document.createElement("span");
    caught.className = "caught";

    const paint = (isBroken) => {
      button.classList.toggle("is-broken", isBroken);
      if (isBroken) state.textContent = german ? "gefangen" : "caught";
      else state.textContent = german ? "geschützt" : "defended";
      caught.textContent = isBroken ? `✕ ${row.caught}` : "";
      button.setAttribute("aria-pressed", String(isBroken));
    };

    button.append(what, state, caught);
    button.addEventListener("click", () => paint(!button.classList.contains("is-broken")));
    paint(broken.has(index));

    list.append(button);
  });
}

// ------------------------------------------------------------- autoplay

/**
 * Play each scene once, the first time it is on screen.
 *
 * Once each. A scene that restarts every time it scrolls past is a scene
 * nobody finishes reading.
 */
const played = new Set();

function autoplay() {
  const trigger = (id, run) => {
    if (played.has(id)) return;
    const el = $(id);
    if (!el) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.75 && box.bottom > 0) {
      played.add(id);
      run();
    }
  };

  trigger("steps-push", runPay);
  trigger("steps-stale", runStale);
}

// ----------------------------------------------------------------- wiring

$("pay-replay").addEventListener("click", runPay);
$("stale-replay").addEventListener("click", runStale);
$("cap-toggle").addEventListener("change", paintCap);

chrome.onLangChange(() => {
  paintSplit();
  paintCap();
  paintMutations();

  // Re-render any scene that has already run, so a language switch does not
  // leave half the page in the language nobody asked for.
  const s = scenes();
  if (played.has("steps-push") && !payRunning) {
    redrawSteps($("steps-push"), $("verdict-push"), s.push, s.pushVerdict, "bad");
    redrawSteps($("steps-pull"), $("verdict-pull"), s.pull, s.pullVerdict, "good");
  }
  if (played.has("steps-stale") && !staleRunning) {
    redrawSteps($("steps-stale"), $("verdict-stale"), s.stale, s.staleVerdict, "good");
  }
});

/** Same output as `runSteps`, drawn finished, with no animation. */
function redrawSteps(listEl, verdictEl, lines, verdict, outcome) {
  listEl.innerHTML = "";
  lines.forEach((line, index) => {
    const li = document.createElement("li");
    li.className = "is-on";
    const last = index === lines.length - 1;
    if (last) li.classList.add(outcome === "bad" ? "is-bad" : "is-good");

    const mark = document.createElement("span");
    mark.className = "mark";
    mark.textContent = last ? (outcome === "bad" ? "✕" : "✓") : "·";

    const text = document.createElement("span");
    text.textContent = line;

    li.append(mark, text);
    listEl.append(li);
  });

  verdictEl.textContent = verdict;
  verdictEl.className = `verdict ${outcome === "bad" ? "is-bad" : "is-good"}`;
}

paintSplit();
paintCap();
paintMutations();
onScroll();

// With motion reduced, the scenes still have to be readable, so they are drawn
// finished rather than skipped. `sleep` already collapses to zero, so running
// them is enough.
if (prefersReduced) {
  played.add("steps-push");
  played.add("steps-stale");
  runPay();
  runStale();
}
