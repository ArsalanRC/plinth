/**
 * The profile: what one connected wallet holds, read from the chain.
 *
 * **There is no profile stored anywhere, and that is the design.** No account,
 * no server, no row in a table. The page asks the contract which tokens an
 * address owns and renders the answer, so whoever connects sees themselves and
 * nobody else is described at all.
 *
 * That also settles a privacy question this repository had to answer. Hardcoding
 * the author's address would have made a nice demo and permanently tied his name
 * to every holding that address ever has. It shows the connected wallet instead,
 * the way a marketplace does.
 *
 * Unlike the market page there is deliberately **no demo mode**. Invented cats
 * under a heading reading "Your wallet" would be a lie about the one thing this
 * page exists to report. With nothing connected it asks you to connect.
 */

import { STRINGS } from "./i18n.js";
import { initChrome, prefersReduced } from "./chrome.js";
import { COLLECTIONS, chainOf, isLive } from "./config.js";
import { formatUnits } from "./abi.js";
import * as chain from "./chain.js";

const chrome = initChrome(STRINGS, { prefix: "plinth" });
const $ = (id) => document.getElementById(id);
const t = (key) => (STRINGS[chrome.lang()] ?? STRINGS.en)[key] ?? key;

const locale = () => (chrome.lang() === "de" ? "de-DE" : "en-GB");
const pol = (wei) =>
  `${Number(formatUnits(wei)).toLocaleString(locale(), { maximumFractionDigits: 4 })} POL`;

const ZERO = "0x0000000000000000000000000000000000000000";

let account = null;
let held = [];

/**
 * Balance and proceeds, one row per chain, never summed.
 *
 * POL on Amoy is free from a faucet and POL on Polygon is money. Adding them
 * produces a figure in no currency at all, which is exactly the kind of number
 * that looks authoritative and means nothing.
 */
let perChain = [];

// ------------------------------------------------------------------ backdrop

const ridges = [...document.querySelectorAll(".ridge")];
const reveals = [...document.querySelectorAll(".reveal")];

function onScroll() {
  const limit = window.innerHeight * 0.9;
  for (const el of reveals) {
    if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < limit) {
      el.classList.add("is-in");
    }
  }
  if (prefersReduced) return;
  for (const ridge of ridges) {
    ridge.style.transform = `translateY(${window.scrollY * Number(ridge.dataset.depth ?? 0)}px)`;
  }
}

addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll, { passive: true });

// -------------------------------------------------------------------- render

function artFor(token) {
  const wrap = document.createElement("div");
  wrap.className = "art";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = `Plinth Cat #${token.id}`;
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(token.svg)))}`;

  wrap.append(img);
  return wrap;
}

function paintIdentity() {
  const link = $("p-address");

  if (!account) {
    link.textContent = "—";
    link.removeAttribute("href");
    $("p-avatar").innerHTML = "";
    $("p-avatar").hidden = true;
    return;
  }

  link.textContent = chain.shortAddress(account);
  link.href = `${chainOf(COLLECTIONS[0]).explorer}/address/${account}`;
  link.title = t("prof.explorer");

  // The avatar is the first token this wallet holds, so the page is
  // represented by something the owner actually has rather than a generated
  // blob. Hidden outright when they hold nothing: an empty rounded box reads
  // as a picture that failed to load, which was visible only once rendered.
  $("p-avatar").innerHTML = "";
  $("p-avatar").hidden = !held[0];
  if (held[0]) $("p-avatar").append(artFor(held[0]));
}

function paintStats() {
  const listed = held.filter((tk) => tk.listed).length;

  $("p-owned").textContent = account ? String(held.length) : "—";
  $("p-listed").textContent = account ? String(listed) : "—";

  // Across how many collections, which is the honest cross-chain summary. A
  // total balance is not, so it is a row per chain further down instead.
  const across = new Set(held.map((tk) => tk.collection.id)).size;
  $("p-across").textContent = account ? String(across) : "—";
  $("p-chains").textContent = account ? String(perChain.length) : "—";

  paintWallets();

  // Only offered when there is something to take. A withdraw button that is
  // always there invites a transaction that reverts and costs gas anyway.
  // Nothing to withdraw is the common case and an always-present button
  // invites a transaction that reverts and costs gas anyway.
  const owed = perChain.filter((w) => w.proceeds > 0n);
  const row = $("p-withdraw-row");
  row.hidden = !account || owed.length === 0;
  if (!row.hidden) {
    $("p-withdraw-note").textContent = owed
      .map((w) => `${pol(w.proceeds)} · ${w.chain.shortName}`)
      .join("   ");
  }
}

/**
 * One row per chain: what this wallet holds there and what it is owed.
 *
 * Separate rows rather than a total, because the two currencies share a ticker
 * and nothing else. A single "18.10 POL" spanning a testnet and mainnet would
 * be a number nobody could act on.
 */
function paintWallets() {
  const box = $("p-wallets");
  box.innerHTML = "";
  box.hidden = !account || perChain.length === 0;

  for (const w of perChain) {
    const row = document.createElement("div");
    row.className = "wallet-row";

    const net = document.createElement("span");
    net.className = "chain-badge" + (w.chain.testnet ? " is-testnet" : "");
    net.textContent = w.chain.testnet ? `${w.chain.shortName} · ${t("col.testnet")}` : w.chain.shortName;

    const bal = document.createElement("strong");
    bal.textContent = pol(w.balance);

    const held_ = document.createElement("span");
    held_.className = "wallet-held";
    const n = held.filter((tk) => tk.collection.id === w.collection.id).length;
    held_.textContent = `${n} × ${w.collection.name}`;

    const link = document.createElement("a");
    link.href = `${w.chain.explorer}/token/${w.collection.collection}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = t("prof.viewContract");

    row.append(net, bal, held_, link);
    box.append(row);
  }
}

function paintGrid() {
  const grid = $("p-grid");
  grid.innerHTML = "";

  $("p-nowallet").hidden = chain.hasWallet();
  $("p-connect").hidden = !!account || !chain.hasWallet();
  $("p-empty").hidden = !account || held.length > 0;

  for (const token of held) {
    // A link rather than a button, because the collection page already knows
    // how to open one token in detail and can be reached by its own URL.
    const card = document.createElement("a");
    card.className = "item glass";
    card.href = `./collection.html?c=${token.collection.id}&id=${token.id}`;

    const meta = document.createElement("figcaption");
    const name = document.createElement("strong");
    name.textContent = `#${token.id}`;

    const status = document.createElement("span");
    status.textContent = token.listed
      ? t("prof.tokenListed").replace("{price}", pol(token.price))
      : t("prof.tokenIdle");

    meta.append(name, status);
    card.append(artFor(token), meta);
    grid.append(card);
  }

  onScroll();
}

function paintAll() {
  paintIdentity();
  paintStats();
  paintGrid();
  $("connect").textContent = account ? chain.shortAddress(account) : t("nav.connect");
  $("signout").hidden = !account;
}

// ---------------------------------------------------------------------- live

/**
 * What this wallet holds, across every collection, on every chain.
 *
 * One sweep per collection, each one pointing `chain` at that collection first.
 * Reads go through the chain's own public RPC unless the wallet happens to be
 * there already, so a wallet parked on Amoy still sees its mainnet dogs and
 * nobody is asked to switch networks to look at a page.
 *
 * Balance and proceeds are per chain and not addable. POL on a testnet is free
 * and POL on mainnet is money, so summing them would produce a number that
 * means nothing. They are kept per collection and shown per collection.
 */
async function loadLive() {
  const rows = [];
  const wallets = [];

  for (const c of COLLECTIONS) {
    if (!isLive(c)) continue;
    chain.use(c);

    let owned = [];
    try {
      owned = await chain.tokensOf(account);
    } catch {
      // One unreachable chain should cost its own row, not the whole page.
      continue;
    }

    const tokens = [];
    for (const id of owned) {
      const listing = await chain.listingOf(id);
      const meta = chain.metaFrom(await chain.tokenURI(id));

      tokens.push({
        id, collection: c,
        svg: atob(meta.image.split(";base64,")[1]),
        listed: listing.seller !== ZERO,
        price: listing.price,
      });
    }

    /*
     * A listed token has been transferred to the marketplace, so `tokensOf` no
     * longer reports it as the seller's. Reading only that would show somebody
     * who listed everything an empty profile, which is exactly the wrong answer.
     * The seller of a live listing still owns it in every sense that matters.
     */
    const minted = await chain.totalMinted();
    for (let id = 1n; id <= minted; id++) {
      if (tokens.some((tk) => String(tk.id) === String(id))) continue;

      const listing = await chain.listingOf(id);
      if (listing.seller.toLowerCase() !== account.toLowerCase()) continue;

      const meta = chain.metaFrom(await chain.tokenURI(id));
      tokens.push({
        id, collection: c,
        svg: atob(meta.image.split(";base64,")[1]),
        listed: true,
        price: listing.price,
      });
    }

    rows.push(...tokens);
    wallets.push({
      collection: c,
      chain: chainOf(c),
      balance: await chain.balanceOf(account),
      proceeds: await chain.proceedsOf(account),
    });
  }

  held = rows.sort((a, b) =>
    a.collection.id === b.collection.id
      ? Number(a.id) - Number(b.id)
      : a.collection.id.localeCompare(b.collection.id));

  perChain = wallets;
  paintAll();
}


// ------------------------------------------------------------------- wiring

async function doConnect() {
  if (!chain.hasWallet() || !COLLECTIONS.some(isLive)) return;
  try {
    account = await chain.connect();
    await loadLive();
  } catch {
    /* Refused or wrong network. The page stays in its unconnected state. */
    paintAll();
  }
}

$("connect").addEventListener("click", doConnect);
$("p-connect-btn").addEventListener("click", doConnect);

$("signout").addEventListener("click", async () => {
  await chain.disconnect();
  account = null;
  held = [];
  proceeds = 0n;
  balance = 0n;
  paintAll();
});

$("p-withdraw").addEventListener("click", async () => {
  if (!account || proceeds === 0n) return;
  try {
    await chain.send({ ...chain.tx.withdraw(), from: account });
    await loadLive();
  } catch {
    /* Rejected in the wallet, or it reverted. The figures stay as they were. */
  }
});

chrome.onLangChange(paintAll);

// A wallet can change account or network under the page at any moment, and a
// profile still showing the previous account's holdings is worse than one
// showing nothing.
if (chain.hasWallet()) {
  globalThis.ethereum.on?.("accountsChanged", () => location.reload());
  globalThis.ethereum.on?.("chainChanged", () => location.reload());
}

async function boot() {
  if (COLLECTIONS.some(isLive) && chain.hasWallet()) {
    const existing = await chain.currentAccount();
    if (existing && true) {
      account = existing;
      try {
        await loadLive();
        return;
      } catch {
        /* Fall through to the unconnected state rather than a half-read page. */
      }
    }
  }
  paintAll();
}

boot();
