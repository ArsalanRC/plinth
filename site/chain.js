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

import { CHAIN, CONTRACTS } from "./config.js";
import {
  encode,
  decodeUint,
  decodeBool,
  decodeAddress,
  decodeUintArray,
  decodeString,
  decodeListing,
} from "./abi.js";

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
  if (hasWallet()) {
    return provider().request({ method: "eth_call", params: [{ to, data }, "latest"] });
  }

  return rpcCall("eth_call", [{ to, data }, "latest"]);
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

  for (const url of CHAIN.rpc) {
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

  await ensureChain();
  return accounts[0];
}

/** Accounts already granted, without prompting. Used on load. */
export async function currentAccount() {
  if (!hasWallet()) return null;

  const accounts = await provider().request({ method: "eth_accounts" });
  return accounts && accounts.length > 0 ? accounts[0] : null;
}

export async function currentChainId() {
  if (!hasWallet()) return null;
  return provider().request({ method: "eth_chainId" });
}

/**
 * Put the wallet on Amoy, adding the network first if it has never seen it.
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
      params: [{ chainId: CHAIN.hex }],
    });
  } catch (error) {
    if (error?.code !== 4902) throw error;

    await provider().request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN.hex,
          chainName: CHAIN.name,
          nativeCurrency: CHAIN.currency,
          rpcUrls: CHAIN.rpc,
          blockExplorerUrls: [CHAIN.explorer],
        },
      ],
    });
  }
}

/** Native balance, in wei. */
export async function balanceOf(address) {
  if (!hasWallet()) return 0n;

  const hex = await provider().request({ method: "eth_getBalance", params: [address, "latest"] });
  return BigInt(hex);
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

const market = () => CONTRACTS.market;
const collection = () => CONTRACTS.collection;

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
};

/** A short address, the way every wallet shows one. */
export const shortAddress = (address) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export const explorerTx = (hash) => `${CHAIN.explorer}/tx/${hash}`;
