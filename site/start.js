/**
 * The way in for somebody who has never held a wallet.
 *
 * Almost all of this page is markup on purpose. The four routes are plain
 * anchors, the wallet instructions are a list, and both work with no
 * JavaScript at all. Somebody who does not yet have a wallet is exactly the
 * visitor least likely to forgive a page that needs one to explain itself.
 *
 * The only scripted thing is the button that adds the test network, because
 * that genuinely has to talk to the wallet.
 */

import { STRINGS } from "./i18n.js";
import { initChrome, prefersReduced } from "./chrome.js";
import { CHAIN, isDeployed } from "./config.js";
import * as chain from "./chain.js";

const chrome = initChrome(STRINGS, { prefix: "plinth" });
const $ = (id) => document.getElementById(id);
const t = (key) => (STRINGS[chrome.lang()] ?? STRINGS.en)[key] ?? key;

let account = null;

/*
 * No `.reveal` on this page, and that is deliberate rather than an omission.
 *
 * The sibling pages fade their sections in on scroll. That needs the class to
 * start at `opacity: 0` and a handler to switch it on, so the content is
 * invisible until a module has loaded and run. Written that way here, the page
 * first shipped with the class and without the handler, and rendered its hero
 * and nothing else. It looked finished in the source and was blank on screen.
 *
 * The handler would have fixed that instance. The reason it is gone instead is
 * the trade: this is the one page whose visitors have no wallet, no context,
 * and no particular reason to give a broken page a second try. Making them
 * depend on JavaScript to see the instructions for installing JavaScript's
 * prerequisites is a bad bargain for an entrance animation.
 *
 * The ridges still drift, because that degrades to a still background.
 */
const ridges = [...document.querySelectorAll(".ridge")];

function onScroll() {
  if (prefersReduced) return;
  for (const ridge of ridges) {
    ridge.style.transform = `translateY(${window.scrollY * Number(ridge.dataset.depth ?? 0)}px)`;
  }
}

addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll, { passive: true });

function paintAccount() {
  $("connect").textContent = account ? chain.shortAddress(account) : t("nav.connect");
  $("signout").hidden = !account;
}

/**
 * Say what happened, in the page rather than in an alert.
 *
 * A browser dialog here would be the wrong tool twice over: it blocks the page,
 * and this is the one screen where the visitor is already being asked to trust
 * a series of popups they do not yet understand.
 */
function report(key, bad = false) {
  const box = $("add-result");
  box.textContent = t(key);
  box.classList.toggle("is-bad", bad);
  box.hidden = false;
}

$("add-chain").addEventListener("click", async () => {
  if (!chain.hasWallet()) {
    report("start.s3.nowallet", true);
    return;
  }

  try {
    // `ensureChain` already switches, and adds the network when the wallet
    // answers 4902 because it has never heard of Amoy. That is exactly the
    // one-click behaviour wanted here, so it is reused rather than written
    // twice and left to drift.
    await chain.ensureChain();
    report("start.s3.added");
  } catch {
    // Refusing is a normal answer, not a fault. Somebody who clicks Cancel in
    // MetaMask should not be told the site is broken.
    report("start.s3.failed", true);
  }
});

$("connect").addEventListener("click", async () => {
  if (!chain.hasWallet() || !isDeployed()) return;
  try {
    account = await chain.connect();
  } catch {
    /* Refused, or the wrong network. The guide is still readable either way. */
  }
  paintAccount();
});

$("signout").addEventListener("click", async () => {
  await chain.disconnect();
  account = null;
  paintAccount();
});

chrome.onLangChange(paintAccount);

async function boot() {
  if (isDeployed() && chain.hasWallet()) {
    const existing = await chain.currentAccount();
    if (existing && (await chain.currentChainId()) === CHAIN.hex) account = existing;
  }
  paintAccount();
  onScroll();
}

boot();
