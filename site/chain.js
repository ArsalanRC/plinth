/**
 * Everything this page does with a wallet or a chain.
 *
 * EIP-1193 directly, through `window.ethereum`. No wallet library, no
 * connector framework, no CDN. MetaMask injects the provider; this file asks
 * it questions and asks it to sign things. The key never leaves the extension
 * and never touches this page, which is why a static site on GitHub Pages is a
 * perfectly safe place to put a marketplace.
 *
 * Reads go through the wallet when there is one and through a public RPC when
 * there is not, so the market is browsable before anybody connects anything.
 */

import { chainOf, collectionById, DEFAULT_COLLECTION } from "./config.js";
import {
  encode,
  decodeUint,
  decodeBool,
  decodeAddress,
  decodeUintArray,
  decodeString,
  decodeListing,
  decodeCheck,
} from "./abi.js";

/*
 * Which collection this document is talking to, and therefore which chain.
 *
 * Module state rather than a parameter on forty functions. Each page is one
 * document showing one collection, so the target is set once at boot and does
 * not change under anybody. Threading a chain argument through `call`, `send`,
 * `listingOf` and the rest would touch every line here to express something no
 * page actually varies mid-life.
 *
 * The cats are the default because they are what the marketplace page has
 * always shown, and a bookmarked link should not find a different collection
 * under it.
 */
let target = collectionById(DEFAULT_COLLECTION);

/**
 * Point this module at a collection. Call it before anything else.
 *
 * Takes null rather than refusing it at the type level, because the only way
 * to get one here is `collectionById` answering for a name that does not
 * exist. Throwing on it is the whole job: the alternative is a page silently
 * talking to whichever collection happened to be set last.
 *
 * @param {object|null} collection an entry from `COLLECTIONS`
 */
export function use(collection) {
  if (!collection) throw new Error("No such collection");
  target = collection;
}

/** The collection currently being talked to. */
export const current = () => target;

/** The chain that collection lives on. */
export const chain = () => chainOf(target);

export const hasWallet = () => typeof globalThis.ethereum !== "undefined";

/** Never throws on a missing wallet. Callers branch on it instead. */
const provider = () => globalThis.ethereum;

/**
 * A read, through the wallet if one is present and the public RPC otherwise.
 *
 * `eth_call` costs nothing and changes nothing, so it is safe to do before a
 * user has connected and safe to do on their behalf afterwards.
 */
export async function call(to, data) {
  if (await walletIsHere()) {
    return provider().request({ method: "eth_call", params: [{ to, data }, "latest"] });
  }

  return rpcCall("eth_call", [{ to, data }, "latest"]);
}

/*
 * Is the wallet on the chain we are asking about?
 *
 * This used to ask only whether a wallet existed, which was right while there
 * was one chain and silently wrong the moment there were two. A wallet sits on
 * exactly one network. Reading the mainnet dog collection through a wallet
 * parked on Amoy does not fail: `eth_call` runs against Amoy, finds no contract
 * at that address, and returns empty. The page then reports, honestly and
 * incorrectly, that the wallet holds nothing.
 *
 * That is worse here than anywhere else in this file, because the two chains
 * share contract addresses. The same address is a real contract on both.
 *
 * So a read goes through the wallet only when the wallet is already there, and
 * through the chain's own public RPC otherwise. Reads cost nothing and need no
 * permission, so nobody has to switch networks to look at a page.
 */
let walletChain = null;
let watching = false;

async function walletIsHere() {
  if (!hasWallet()) return false;

  /*
   * The cached answer stops being true the moment the user switches network,
   * so the wallet is asked to say when that happens.
   *
   * Subscribed here rather than at import, because at import there may be no
   * wallet yet. An extension that injects a moment late would leave this file
   * with a cached chain id and nothing to ever correct it, which is the worst
   * of both: every read goes confidently to whichever network the wallet
   * happened to be on when the page loaded.
   */
  if (!watching) {
    watching = true;
    provider().on?.("chainChanged", (id) => {
      walletChain = id;
    });
  }

  if (walletChain === null) {
    try {
      walletChain = await provider().request({ method: "eth_chainId" });
    } catch {
      return false;
    }
  }
  return walletChain === chain().hex;
}

/**
 * A JSON-RPC call against the first endpoint that answers.
 *
 * Public testnet endpoints go down, and the best known one for Amoy was
 * refusing connections outright the day this was written. One dead endpoint
 * should cost a visitor a second, not the whole page.
 */
async function rpcCall(method, params) {
  let last = null;

  for (const url of chain().rpc) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });

      const body = await response.json();

      // An error from the node is a real answer: the endpoint is alive and the
      // call was wrong. Trying the next one would just get the same reply.
      if (body.error) throw new Error(body.error.message ?? "The node refused the call");
      return body.result;
    } catch (error) {
      last = error;
    }
  }

  throw last ?? new Error("No RPC endpoint answered");
}

/** Ask the wallet for accounts. This is the call that opens MetaMask. */
export async function connect() {
  if (!hasWallet()) throw new Error("no-wallet");

  const accounts = await provider().request({ method: "eth_requestAccounts" });
  if (!accounts || accounts.length === 0) throw new Error("no-account");

  remember(false);
  await ensureChain();
  return accounts[0];
}

/*
 * Signing out, and why it needs a flag of our own.
 *
 * A wallet permission outlives the page. Once somebody has connected, MetaMask
 * goes on answering `eth_accounts` with their address no matter what this site
 * does, so a sign-out that only cleared a variable would be undone by the
 * silent reconnect on the very next load, and the button would look broken.
 *
 * The flag lives in localStorage, with a variable behind it for the browsers
 * that refuse storage in private windows. There the sign-out lasts the page
 * rather than the session, which is worth having over throwing.
 */
const SIGNED_OUT = "plinth:signed-out";
let signedOutHere = false;

function remember(on) {
  signedOutHere = on;
  try {
    if (on) localStorage.setItem(SIGNED_OUT, "1");
    else localStorage.removeItem(SIGNED_OUT);
  } catch {
    /* Storage blocked. `signedOutHere` still holds for this page. */
  }
}

export function signedOut() {
  if (signedOutHere) return true;
  try {
    return localStorage.getItem(SIGNED_OUT) === "1";
  } catch {
    return false;
  }
}

/**
 * Let go of the connected wallet.
 *
 * **A page cannot log anybody out of MetaMask**, and a button pretending
 * otherwise would be the dishonest version of this. What it can do is forget
 * the account, stop reconnecting silently, and ask the wallet to revoke the
 * permission it granted.
 *
 * `wallet_revokePermissions` is the call that really releases it. Wallets that
 * have not implemented it throw rather than quietly do nothing, which is why
 * the local flag is what makes the behaviour identical everywhere.
 */
export async function disconnect() {
  remember(true);
  if (!hasWallet()) return;

  try {
    await provider().request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch {
    /* No such method in this wallet. The flag above is the fallback. */
  }
}

/**
 * Accounts already granted, without prompting. Used on load.
 *
 * Answers null after a sign-out even though the wallet would still hand the
 * address over, because that is the whole point of the sign-out.
 */
export async function currentAccount() {
  if (!hasWallet() || signedOut()) return null;

  const accounts = await provider().request({ method: "eth_accounts" });
  return accounts && accounts.length > 0 ? accounts[0] : null;
}

export async function currentChainId() {
  if (!hasWallet()) return null;
  return provider().request({ method: "eth_chainId" });
}

/**
 * Put the wallet on this collection's chain, adding it first if the wallet has
 * never seen it.
 *
 * Which chain that is depends on what `use()` was called with, and the two are
 * not interchangeable: one is a testnet with free coins and the other is real
 * money. Sending a mint to the wrong one is not an error anybody sees, it is a
 * transaction that succeeds against the wrong contract.
 *
 * 4902 is "unrecognised chain", which is the normal answer the first time
 * anybody tries this, not an error worth showing. Anything else is real and
 * gets raised.
 */
export async function ensureChain() {
  if (!hasWallet()) throw new Error("no-wallet");

  try {
    await provider().request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain().hex }],
    });
  } catch (error) {
    if (error?.code !== 4902) throw error;

    await provider().request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chain().hex,
          chainName: chain().name,
          nativeCurrency: chain().currency,
          rpcUrls: chain().rpc,
          blockExplorerUrls: [chain().explorer],
        },
      ],
    });
  }
}

/**
 * Native balance, in wei, on the chain this module is pointed at.
 *
 * The last read that preferred the wallet unconditionally, and therefore the
 * last one that answered about whichever network the wallet happened to be
 * parked on. With two chains that is not a small inaccuracy: the profile shows
 * a balance row per collection precisely because POL on Amoy is free and POL on
 * Polygon is money, and every row was reporting the same wallet-side number.
 *
 * Same rule as `call`: the wallet only when it is already here, the chain's own
 * public RPC otherwise. A balance is a public read and needs no permission.
 */
export async function balanceOf(address) {
  if (await walletIsHere()) {
    const hex = await provider().request({ method: "eth_getBalance", params: [address, "latest"] });
    return BigInt(hex);
  }

  return BigInt(await rpcCall("eth_getBalance", [address, "latest"]));
}

/**
 * Send a transaction and wait for it to be mined.
 *
 * `onSent` fires with the hash as soon as the user signs, so the interface can
 * stop saying "check your wallet" and start saying "waiting for the chain".
 * Those are different states and a page that shows one spinner for both feels
 * broken during the twenty seconds that separate them.
 */
export async function send({ to, data, value = 0n, from }, onSent) {
  if (!hasWallet()) throw new Error("no-wallet");

  /*
   * Refuse rather than sign, when the wallet is not on the chain this write is
   * for. The write-side twin of `walletIsHere` above, and the more expensive
   * half of the same mistake.
   *
   * A read against the wrong chain returns empty and the page reports nothing
   * held. A *write* against the wrong chain is signed, mined and paid for. The
   * two chains here share contract addresses, so there is no invalid-address
   * error to save anybody: listing a cat while the wallet sits on mainnet is a
   * real transaction against the dogs' marketplace, in real POL.
   *
   * `ensureChain` is what callers use to move the wallet first. This is what
   * catches the case where nobody did, or where the user switched networks
   * between the click and the signature.
   */
  const on = await provider().request({ method: "eth_chainId" });
  if (on !== chain().hex) throw new Error("wrong-chain");

  const params = { from, to, data };
  if (value > 0n) params.value = `0x${value.toString(16)}`;

  const hash = await provider().request({ method: "eth_sendTransaction", params: [params] });
  onSent?.(hash);

  return waitFor(hash);
}

/** Poll until the transaction is mined, then check it did not revert. */
async function waitFor(hash, tries = 90) {
  for (let i = 0; i < tries; i++) {
    const receipt = await provider().request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    });

    if (receipt) {
      // A mined transaction that reverted still has a receipt. Status 0x0 is
      // the difference between "it happened" and "it worked".
      if (BigInt(receipt.status) === 0n) throw new Error("reverted");
      return { hash, receipt };
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("timeout");
}

// ------------------------------------------------------------------- reading

const market = () => target.market;
const collection = () => target.collection;

export async function totalMinted() {
  return decodeUint(await call(collection(), encode("totalMinted()")));
}

export async function maxSupply() {
  return decodeUint(await call(collection(), encode("maxSupply()")));
}

export async function ownerOf(tokenId) {
  return decodeAddress(await call(collection(), encode("ownerOf(uint256)", [tokenId])));
}

export async function tokensOf(address) {
  return decodeUintArray(await call(collection(), encode("tokensOf(address)", [address])));
}

export async function tokenURI(tokenId) {
  return decodeString(await call(collection(), encode("tokenURI(uint256)", [tokenId])));
}

export async function listingOf(tokenId) {
  return decodeListing(
    await call(market(), encode("listingOf(address,uint256)", [collection(), tokenId])),
  );
}

export async function isFillable(tokenId) {
  return decodeBool(
    await call(market(), encode("isFillable(address,uint256)", [collection(), tokenId])),
  );
}

export async function proceedsOf(address) {
  return decodeUint(await call(market(), encode("proceedsOf(address)", [address])));
}

export async function feeBps() {
  return Number(decodeUint(await call(market(), encode("feeBps()"))));
}

export async function isApprovedForAll(owner) {
  return decodeBool(
    await call(collection(), encode("isApprovedForAll(address,address)", [owner, market()])),
  );
}

// -------------------------------------------------------------------- faucet

const drip = () => target.drip;

/**
 * The faucet's whole state for one address, in a single call.
 *
 * Returns null when there is no faucet deployed, which is a normal state and
 * not a failure: the marketplace works without one and the page says so rather
 * than offering a button that cannot work.
 */
export async function dripCheck(address) {
  if (drip() === null) return null;
  return decodeCheck(await call(drip(), encode("check(address)", [address])));
}

/** How long between claims, read rather than written down on the page. */
export async function dripCooldown() {
  if (drip() === null) return null;
  return decodeUint(await call(drip(), encode("COOLDOWN()")));
}

/**
 * The image for a token, pulled out of its on-chain metadata.
 *
 * Two base64 layers: the metadata document is one, and the image inside it is
 * another. Both are decoded here rather than handed to an `<img>` as a nested
 * data URI, which browsers will not follow.
 */
export function imageFrom(metadataUri) {
  const json = JSON.parse(fromDataUri(metadataUri));
  return json.image;
}

export function metaFrom(metadataUri) {
  return JSON.parse(fromDataUri(metadataUri));
}

function fromDataUri(uri) {
  const marker = ";base64,";
  const at = uri.indexOf(marker);
  if (at === -1) throw new Error("Not a base64 data URI");
  return new TextDecoder().decode(
    Uint8Array.from(atob(uri.slice(at + marker.length)), (c) => c.charCodeAt(0)),
  );
}

// ------------------------------------------------------------------- writing

export const tx = {
  mint: (to) => ({ to: collection(), data: encode("mint(address)", [to]) }),

  approveAll: () => ({
    to: collection(),
    data: encode("setApprovalForAll(address,bool)", [market(), true]),
  }),

  list: (tokenId, price) => ({
    to: market(),
    data: encode("list(address,uint256,uint96)", [collection(), tokenId, price]),
  }),

  cancel: (tokenId) => ({
    to: market(),
    data: encode("cancel(address,uint256)", [collection(), tokenId]),
  }),

  buy: (tokenId, price) => ({
    to: market(),
    data: encode("buy(address,uint256)", [collection(), tokenId]),
    value: price,
  }),

  withdraw: () => ({ to: market(), data: encode("withdraw()") }),

  claim: () => ({ to: drip(), data: encode("claim()") }),
};

/** A short address, the way every wallet shows one. */
export const shortAddress = (address) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export const explorerTx = (hash) => `${chain().explorer}/tx/${hash}`;
