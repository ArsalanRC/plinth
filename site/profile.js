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
import { CHAIN, isDeployed } from "./config.js";
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
let proceeds = 0n;
let balance = 0n;

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
  link.href = `${CHAIN.explorer}/address/${account}`;
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
  $("p-proceeds").textContent = account ? pol(proceeds) : "—";
  $("p-balance").textContent = account ? pol(balance) : "—";

  // Only offered when there is something to take. A withdraw button that is
  // always there invites a transaction that reverts and costs gas anyway.
  const row = $("p-withdraw-row");
  row.hidden = !account || proceeds === 0n;
  if (!row.hidden) $("p-withdraw-note").textContent = pol(proceeds);
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
    card.href = `./collection.html?id=${token.id}`;

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

async function loadLive() {
  const owned = await chain.tokensOf(account);

  const tokens = [];
  for (const id of owned) {
    const listing = await chain.listingOf(id);
    const meta = chain.metaFrom(await chain.tokenURI(id));

    tokens.push({
      id,
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
      id,
      svg: atob(meta.image.split(";base64,")[1]),
      listed: true,
      price: listing.price,
    });
  }

  held = tokens.sort((a, b) => Number(a.id) - Number(b.id));
  proceeds = await chain.proceedsOf(account);
  balance = await chain.balanceOf(account);

  paintAll();
}

// ------------------------------------------------------------------- wiring

async function doConnect() {
  if (!chain.hasWallet() || !isDeployed()) return;
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
  if (isDeployed() && chain.hasWallet()) {
    const existing = await chain.currentAccount();
    if (existing && (await chain.currentChainId()) === CHAIN.hex) {
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
