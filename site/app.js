/**
 * plinth: the marketplace.
 *
 * One page that runs in two modes and never pretends to be in the other.
 *
 * - **Demo.** Nobody has connected anything, or nothing is deployed yet. The
 *   whole market runs on invented state in memory. Every button works and the
 *   refusals are the contract's refusals. A demo badge sits on the wallet.
 * - **Live.** A wallet is connected and the contracts exist. Every read is an
 *   `eth_call`, every write is a transaction the user signs in MetaMask.
 *
 * No wallet library, no framework, no build step. `abi.js` does the encoding
 * and is tested against a real node, because an encoder that is wrong does not
 * throw.
 */

import { STRINGS, SCENES } from "./i18n.js";
import { initChrome, prefersReduced, sleep } from "./chrome.js";
import { CHAIN, isDeployed, hasDrip } from "./config.js";
import { createDemo } from "./demo.js";
import { formatUnits, parseUnits } from "./abi.js";
import * as chain from "./chain.js";

const chrome = initChrome(STRINGS, { prefix: "plinth" });
const $ = (id) => document.getElementById(id);

const dict = () => STRINGS[chrome.lang()] ?? STRINGS.en;
const scenes = () => SCENES[chrome.lang()] ?? SCENES.en;
const t = (key) => dict()[key] ?? key;

/** German writes a decimal comma, and a page that gets that wrong looks foreign. */
const locale = () => (chrome.lang() === "de" ? "de-DE" : "en-GB");
const pol = (wei) => `${Number(formatUnits(wei)).toLocaleString(locale(), { maximumFractionDigits: 4 })} POL`;

/** Everything the page is currently showing. Demo until proven otherwise. */
let state = createDemo();
let account = null;

// ------------------------------------------------------------------- status

let statusTimer = null;

function say(message, kind = "", { busy = false, href = null } = {}) {
  const el = $("status");
  clearTimeout(statusTimer);

  el.className = `status ${kind}`;
  el.innerHTML = "";

  if (busy) {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    el.append(spinner);
  }

  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = message;
    el.append(link);
  } else {
    el.append(document.createTextNode(message));
  }

  if (kind === "is-good") statusTimer = setTimeout(() => say(""), 8000);
}

/**
 * Turn a revert into something a person can act on.
 *
 * Custom errors arrive as a name buried in a long provider message, and 4001
 * is the user closing the dialog, which is not an error at all.
 */
function explain(error) {
  const code = error?.code;
  if (code === 4001 || code === "ACTION_REJECTED") return t("err.rejected");

  const text = String(error?.message ?? error);
  const named = [
    "NotListed", "AlreadyListed", "NotOwner", "NotSeller", "NotApproved",
    "PriceIsZero", "WrongPayment", "ListingStale", "NothingToWithdraw", "SoldOut",
    "TooSoon", "Dry", "TooFull",
  ].find((name) => text.includes(name));

  if (named) return t(`err.${named}`) ?? named;
  if (text.includes("no-wallet")) return t("err.noWallet");
  if (text.includes("own-listing")) return t("err.ownListing");
  if (text.includes("demo-sold-out")) return t("err.demoSoldOut");
  if (text.includes("reverted")) return t("err.reverted");
  if (text.includes("timeout")) return t("err.timeout");

  return text.slice(0, 140);
}

// ------------------------------------------------------------------ backdrop

/**
 * Parallax on the ridges, from the scroll position that already exists.
 *
 * Each layer moves by its own depth, so the near ridge travels further than
 * the far one. That is the whole effect: no drift, no float, nothing that
 * moves when the page is still.
 */
const ridges = [...document.querySelectorAll(".ridge")];

function parallax() {
  if (prefersReduced) return;
  const y = window.scrollY;

  for (const ridge of ridges) {
    const depth = Number(ridge.dataset.depth ?? 0);
    ridge.style.transform = `translateY(${y * depth}px)`;
  }
}

// ------------------------------------------------------------------- reveals

/*
 * Position check inside the scroll handler, never IntersectionObserver.
 * Observers coalesce callbacks, so an element entering and leaving between two
 * ticks never reports as intersecting and stays invisible for good.
 */
const reveals = [...document.querySelectorAll(".reveal")];

function onScroll() {
  const limit = window.innerHeight * 0.9;
  for (const el of reveals) {
    if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < limit) {
      el.classList.add("is-in");
    }
  }
  parallax();
  autoplay();
}

addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll, { passive: true });

// -------------------------------------------------------------------- market

/** An `<img>` carrying an SVG, which is how a wallet would show the token too. */
function artFor(token) {
  const wrap = document.createElement("div");
  wrap.className = "art";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = `${t("item.token")} #${token.id}`;
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(token.svg)))}`;

  wrap.append(img);
  return wrap;
}

function button(label, className, onClick) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `btn ${className}`.trim();
  el.textContent = label;
  el.addEventListener("click", onClick);
  return el;
}

/** One card. `mine` decides which actions it offers. */
function card(token, { mine }) {
  const el = document.createElement("article");
  el.className = `item glass${mine ? " is-mine" : ""}`;
  el.dataset.id = String(token.id);

  const meta = document.createElement("div");
  meta.className = "meta";

  const row = document.createElement("div");
  row.className = "row";

  const id = document.createElement("span");
  id.className = "id";
  id.textContent = `#${token.id}`;

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = token.listed ? pol(token.price) : t("item.unlisted");

  row.append(id, price);

  const owner = document.createElement("span");
  owner.className = "owner";
  owner.textContent = `${t("item.royalty")} ${token.royalty}`;

  const actions = document.createElement("div");
  actions.className = "actions";

  if (mine && token.listed) {
    actions.append(button(t("item.cancel"), "", () => run(el, () => doCancel(token))));
  } else if (mine) {
    const input = document.createElement("input");
    input.className = "price-input";
    input.type = "text";
    input.inputMode = "decimal";
    input.placeholder = t("item.pricePlaceholder");
    input.value = "1";

    actions.append(button(t("item.list"), "btn-primary", () => run(el, () => doList(token, input.value))));
    meta.append(row, owner, input, actions);
    el.append(artFor(token), meta);
    return el;
  } else if (token.listed) {
    actions.append(button(t("item.buy"), "btn-primary", () => run(el, () => doBuy(token))));
  }

  meta.append(row, owner, actions);
  el.append(artFor(token), meta);
  return el;
}

/** Disable a card while its transaction is in flight, then refresh. */
async function run(el, action) {
  el.classList.add("is-busy");
  try {
    await action();
  } catch (error) {
    say(explain(error), "is-bad");
  } finally {
    el.classList.remove("is-busy");
    await render();
  }
}

async function render() {
  const marketGrid = $("market-grid");
  const mineGrid = $("mine-grid");
  marketGrid.innerHTML = "";
  mineGrid.innerHTML = "";

  const listings = state.isDemo
    ? state.listings().filter((tk) => tk.owner !== state.address)
    : state.listings();
  const mine = state.mine();

  for (const token of listings) marketGrid.append(card(token, { mine: false }));
  for (const token of mine) mineGrid.append(card(token, { mine: true }));

  $("market-empty").hidden = listings.length > 0;
  $("mine-empty").hidden = mine.length > 0;

  // The wallet strip.
  $("w-address").textContent = state.isDemo
    ? t("wallet.demoAccount")
    : chain.shortAddress(state.address);
  $("w-balance").textContent = pol(state.balance);
  $("w-owned").textContent = String(mine.length);
  $("w-proceeds").textContent = pol(state.proceeds);
  $("w-demo").hidden = !state.isDemo;
  $("withdraw").disabled = state.proceeds === 0n;

  $("connect").textContent = state.isDemo ? t("nav.connect") : chain.shortAddress(state.address);
  $("connect-2").textContent = state.isDemo ? t("hero.connect") : t("hero.connected");
  $("connect-2").disabled = !state.isDemo;

  $("supply").textContent = `${state.tokens.length} / ${state.supply ?? state.tokens.length}`;
  $("split-note").textContent = `${t("split.fee")} ${state.feeBps / 100}%`;

  renderFaucet();
  paintSplit();
}

// ------------------------------------------------------------------- actions

async function doMint() {
  if (state.isDemo) {
    const token = state.mint();
    say(`${t("ok.minted")} #${token.id}`, "is-good");
    return;
  }

  say(t("busy.sign"), "", { busy: true });
  const { hash } = await chain.send({ ...chain.tx.mint(account), from: account }, () =>
    say(t("busy.mining"), "", { busy: true }),
  );

  say(t("ok.minted"), "is-good", { href: chain.explorerTx(hash) });
  await loadLive();
}

async function doList(token, priceText) {
  const price = parseUnits(priceText);
  if (price <= 0n) throw new Error("PriceIsZero");

  if (state.isDemo) {
    state.list(token.id, price);
    say(`${t("ok.listed")} #${token.id}`, "is-good");
    return;
  }

  // The marketplace has to be allowed to move the token before it can be
  // listed. Asking every time would be two signatures per listing, so this
  // checks first and only asks when it has to.
  if (!(await chain.isApprovedForAll(account))) {
    say(t("busy.approve"), "", { busy: true });
    await chain.send({ ...chain.tx.approveAll(), from: account }, () =>
      say(t("busy.mining"), "", { busy: true }),
    );
  }

  say(t("busy.sign"), "", { busy: true });
  const { hash } = await chain.send({ ...chain.tx.list(token.id, price), from: account }, () =>
    say(t("busy.mining"), "", { busy: true }),
  );

  say(t("ok.listed"), "is-good", { href: chain.explorerTx(hash) });
  await loadLive();
}

async function doCancel(token) {
  if (state.isDemo) {
    state.cancel(token.id);
    say(`${t("ok.cancelled")} #${token.id}`, "is-good");
    return;
  }

  say(t("busy.sign"), "", { busy: true });
  const { hash } = await chain.send({ ...chain.tx.cancel(token.id), from: account }, () =>
    say(t("busy.mining"), "", { busy: true }),
  );

  say(t("ok.cancelled"), "is-good", { href: chain.explorerTx(hash) });
  await loadLive();
}

async function doBuy(token) {
  if (state.isDemo) {
    state.buy(token.id);
    say(`${t("ok.bought")} #${token.id}`, "is-good");
    return;
  }

  say(t("busy.sign"), "", { busy: true });
  const { hash } = await chain.send(
    { ...chain.tx.buy(token.id, token.price), from: account },
    () => say(t("busy.mining"), "", { busy: true }),
  );

  say(t("ok.bought"), "is-good", { href: chain.explorerTx(hash) });
  await loadLive();
}

async function doWithdraw() {
  if (state.isDemo) {
    const amount = state.withdraw();
    say(`${t("ok.withdrew")} ${pol(amount)}`, "is-good");
    await render();
    return;
  }

  say(t("busy.sign"), "", { busy: true });
  const { hash } = await chain.send({ ...chain.tx.withdraw(), from: account }, () =>
    say(t("busy.mining"), "", { busy: true }),
  );

  say(t("ok.withdrew"), "is-good", { href: chain.explorerTx(hash) });
  await loadLive();
}

// -------------------------------------------------------------------- faucet

/** The faucet's last known state, or null when there is no faucet at all. */
let faucet = null;

const ZERO = "0x0000000000000000000000000000000000000000";

/** A wait as the largest unit that still says something useful. */
function formatWait(seconds) {
  if (seconds <= 0n) return "0s";
  const hours = seconds / 3600n;
  const minutes = (seconds % 3600n) / 60n;

  if (hours > 0n) return `${hours}h ${minutes}m`;
  if (minutes > 0n) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Read the faucet.
 *
 * Works before anybody connects, because `eth_call` needs no account. The zero
 * address is used then: the contract answers `ready: false` for it, which is
 * correct, and the balance and the drip size are the same whoever asks. So a
 * visitor sees how full the faucet is before deciding to connect.
 */
async function loadFaucet() {
  if (!hasDrip()) {
    faucet = null;
    return;
  }

  try {
    faucet = await chain.dripCheck(state.isDemo ? ZERO : state.address);
  } catch {
    // A faucet that cannot be read is shown as one that cannot be used, rather
    // than as a button that fails when pressed.
    faucet = null;
  }
}

/**
 * Draw the panel for whichever of six states the visitor is in.
 *
 * Every branch ends with something to do. "Empty" names the public faucet,
 * "no POL at all" explains why the button cannot help and names it too. A
 * refusal with no next step is the failure this panel exists to replace.
 */
function renderFaucet() {
  const panel = $("faucet");
  const chip = $("faucet-chip");
  const note = $("faucet-note");
  const button = $("drip");
  const link = $("faucet-public");

  link.href = CHAIN.faucet;
  $("faucet-body").textContent = t("faucet.body");

  panel.classList.remove("is-ready", "is-dry");
  chip.className = "scene-note";

  const set = (chipText, chipKind, noteKey, enabled) => {
    chip.textContent = chipText;
    if (chipKind) {
      chip.classList.add(chipKind);
      panel.classList.add(chipKind);
    }
    note.textContent = t(noteKey);
    button.disabled = !enabled;
    button.hidden = false;
  };

  if (faucet === null) {
    set(t("faucet.none"), null, "faucet.noteNone", false);
    button.hidden = true;
    return;
  }

  const claims = faucet.claimsLeft;
  const full = claims === 1n ? t("faucet.one") : t("faucet.claims").replace("{n}", claims);

  if (claims === 0n) {
    set(t("faucet.empty"), "is-dry", "faucet.noteDry", false);
    return;
  }

  // Before connecting, the honest thing to show is how full it is, plus what
  // the two routes are. The button starts the connection rather than a claim.
  if (state.isDemo) {
    set(full, null, "faucet.noteDemo", true);
    return;
  }

  // A wallet at exactly zero cannot pay for the claim transaction. No contract
  // fixes that, so the panel says where the first POL comes from instead.
  if (state.balance === 0n) {
    set(full, null, "faucet.noteZero", false);
    return;
  }

  if (!faucet.ready) {
    const now = BigInt(Math.floor(Date.now() / 1000));
    set(
      t("faucet.wait").replace("{t}", formatWait(faucet.nextAt - now)),
      null,
      "faucet.noteCooldown",
      false,
    );
    return;
  }

  set(full, "is-ready", "faucet.noteCooldown", true);
}

async function doDrip() {
  // In demo mode the button is the connect button. Claiming needs a real
  // address, and inventing a drip into an invented balance would teach a
  // visitor something false about what the page just did.
  if (state.isDemo) {
    await doConnect();
    return;
  }

  say(t("busy.sign"), "", { busy: true });
  const { hash } = await chain.send({ ...chain.tx.claim(), from: account }, () =>
    say(t("busy.mining"), "", { busy: true }),
  );

  say(t("ok.dripped"), "is-good", { href: chain.explorerTx(hash) });
  await loadLive();
}

// ---------------------------------------------------------------------- live

/** Read the whole market off the chain. */
async function loadLive() {
  const minted = await chain.totalMinted();
  const supply = await chain.maxSupply();
  const owned = await chain.tokensOf(account);
  const ownedSet = new Set(owned.map(String));

  const tokens = [];
  for (let id = 1n; id <= minted; id++) {
    const listing = await chain.listingOf(id);
    const listed = listing.seller !== "0x0000000000000000000000000000000000000000";
    const meta = chain.metaFrom(await chain.tokenURI(id));

    tokens.push({
      id,
      svg: atob(meta.image.split(";base64,")[1]),
      royalty: meta.attributes?.find((a) => /royalty/i.test(a.trait_type))?.value ?? "",
      owner: listed ? listing.seller : await chain.ownerOf(id),
      mineFlag: ownedSet.has(String(id)),
      listed,
      price: listing.price,
    });
  }

  state = {
    isDemo: false,
    address: account,
    balance: await chain.balanceOf(account),
    proceeds: await chain.proceedsOf(account),
    feeBps: await chain.feeBps(),
    supply,
    tokens,
    listings: () => tokens.filter((tk) => tk.listed && !tk.mineFlag),
    mine: () => tokens.filter((tk) => tk.mineFlag),
  };

  await loadFaucet();
  await render();
}

async function doConnect() {
  if (!chain.hasWallet()) {
    say(t("err.noWallet"), "is-bad");
    return;
  }

  if (!isDeployed()) {
    say(t("err.notDeployed"), "is-bad");
    return;
  }

  try {
    say(t("busy.connect"), "", { busy: true });
    account = await chain.connect();
    await loadLive();
    say(t("ok.connected"), "is-good");
  } catch (error) {
    say(explain(error), "is-bad");
  }
}

// -------------------------------------------------------------- the split

function paintSplit() {
  const sample = state.listings()[0] ?? state.tokens[0];
  if (!sample) return;

  const price = sample.price > 0n ? sample.price : 10n ** 18n;
  const royaltyBps = BigInt(Math.round(parseFloat(sample.royalty) * 100) || 500);
  const royalty = (price * royaltyBps) / 10_000n;
  const fee = (price * BigInt(state.feeBps)) / 10_000n;
  const seller = price - royalty - fee;

  const pct = (part) => `${(Number(part) / Number(price)) * 100}%`;
  $("bar-seller").style.width = pct(seller);
  $("bar-creator").style.width = pct(royalty);
  $("bar-market").style.width = pct(fee);

  $("v-seller").textContent = pol(seller);
  $("v-creator").textContent = pol(royalty);
  $("v-market").textContent = pol(fee);
}

// ------------------------------------------------------- push against pull

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
    await sleep(i === 0 ? 220 : 560);
    items[i].classList.add("is-on");
    if (i === items.length - 1) items[i].classList.add(outcome === "bad" ? "is-bad" : "is-good");
  }

  await sleep(260);
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

  await Promise.all([
    runSteps($("steps-push"), $("verdict-push"), s.push, s.pushVerdict, "bad"),
    runSteps($("steps-pull"), $("verdict-pull"), s.pull, s.pullVerdict, "good"),
  ]);

  $("lane-push").className = "lane is-reverted";
  $("lane-pull").className = "lane is-settled";
  payRunning = false;
}

const played = new Set();

function autoplay() {
  if (played.has("pay")) return;
  const el = $("steps-push");
  const box = el.getBoundingClientRect();

  if (box.top < window.innerHeight * 0.8 && box.bottom > 0) {
    played.add("pay");
    runPay();
  }
}

// ----------------------------------------------------------------- wiring

$("connect").addEventListener("click", doConnect);
$("connect-2").addEventListener("click", doConnect);
$("mint").addEventListener("click", () => run($("mine"), doMint));
$("withdraw").addEventListener("click", () => run($("wallet"), doWithdraw));
$("drip").addEventListener("click", () => run($("faucet"), doDrip));
$("pay-replay").addEventListener("click", runPay);

chrome.onLangChange(() => {
  render();
  if (played.has("pay") && !payRunning) runPay();
});

// A wallet can change account or network under the page at any moment, and a
// marketplace still showing the previous account's holdings is worse than one
// showing none.
if (chain.hasWallet()) {
  globalThis.ethereum.on?.("accountsChanged", () => location.reload());
  globalThis.ethereum.on?.("chainChanged", () => location.reload());
}

/** Reconnect silently if this browser has already granted access. */
async function boot() {
  /* Both halves of this row derive from the same fact. Hardcoding the word
     "done" in the markup would leave a fork with no contract addresses
     claiming a deployment it does not have. */
  const deployed = isDeployed();
  const row = $("status-deploy");
  row.classList.toggle("is-done", deployed);
  row.querySelector("em").dataset.i18n = deployed ? "status.done" : "status.next";
  row.querySelector("em").textContent = t(deployed ? "status.done" : "status.next");

  if (isDeployed() && chain.hasWallet()) {
    const existing = await chain.currentAccount();
    const onChain = (await chain.currentChainId()) === CHAIN.hex;

    if (existing && onChain) {
      account = existing;
      try {
        await loadLive();
        onScroll();
        return;
      } catch {
        // Fall through to the demo rather than showing a broken market.
      }
    }
  }

  await loadFaucet();
  await render();
  onScroll();
}

boot();

if (prefersReduced) {
  played.add("pay");
  runPay();
}
