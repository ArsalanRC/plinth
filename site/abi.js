/**
 * A very small ABI codec, for exactly the calls this page makes.
 *
 * There is no library here and nothing loaded from a CDN. A marketplace front
 * end normally pulls in ethers or viem, which is 100 kilobytes or more of
 * someone else's code to format some hexadecimal. Everything this page needs
 * is static types and two dynamic ones, so it is written out instead.
 *
 * Two things make that safe rather than reckless:
 *
 * 1. The selectors are constants, not computed. Computing them needs keccak256,
 *    which browsers do not provide, and shipping a hash implementation to save
 *    typing twenty-seven hex strings is a bad trade. `test/specs/abi.ts`
 *    asserts every one of them against the compiled artifact, so a signature
 *    that changes fails the build rather than the user.
 *
 * 2. The codec is tested against a real node, not against itself. The same
 *    spec deploys both contracts on a live chain, calls them through these
 *    functions, and checks the answers. An encoder that is wrong does not
 *    throw. It produces neat hexadecimal that the node rejects or, worse,
 *    silently misreads, and no amount of structural assertion in isolation
 *    catches it.
 */

/**
 * Four-byte selectors, keyed by signature.
 *
 * Verified against the compiled ABI in `test/specs/abi.ts`. Do not edit by
 * hand without running that.
 */
export const SELECTOR = {
  "mint(address)": "0x6a627842",
  "list(address,uint256,uint96)": "0x5e60f358",
  "buy(address,uint256)": "0xcce7ec13",
  "cancel(address,uint256)": "0x98590ef9",
  "updatePrice(address,uint256,uint96)": "0xa00eaa0c",
  "pruneListing(address,uint256)": "0x731bc325",
  "withdraw()": "0x3ccfd60b",
  "proceedsOf(address)": "0x9194eae7",
  "listingOf(address,uint256)": "0x216f2f24",
  "isFillable(address,uint256)": "0x3fe00be0",
  "quote(address,uint256,uint256)": "0x9e8cc04b",
  "feeBps()": "0x24a9d853",
  "feeRecipient()": "0x46904840",
  "approve(address,uint256)": "0x095ea7b3",
  "setApprovalForAll(address,bool)": "0xa22cb465",
  "getApproved(uint256)": "0x081812fc",
  "isApprovedForAll(address,address)": "0xe985e9c5",
  "ownerOf(uint256)": "0x6352211e",
  "balanceOf(address)": "0x70a08231",
  "tokenURI(uint256)": "0xc87b56dd",
  "tokensOf(address)": "0x5a3f2672",
  "totalMinted()": "0xa2309ff8",
  "maxSupply()": "0xd5abeb01",
  "royaltyInfo(uint256,uint256)": "0x2a55205a",
  "name()": "0x06fdde03",
  "symbol()": "0x95d89b41",
  "transferFrom(address,address,uint256)": "0x23b872dd",
};

const ZERO_WORD = "0".repeat(64);

/** A bigint as one right-aligned 32-byte word. */
function word(value) {
  const hex = BigInt(value).toString(16);
  if (hex.length > 64) throw new Error(`Value does not fit in a word: ${value}`);
  return hex.padStart(64, "0");
}

/** An address as one right-aligned 32-byte word, with its checksum dropped. */
function addressWord(value) {
  const hex = String(value).replace(/^0x/, "").toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(hex)) throw new Error(`Not an address: ${value}`);
  return hex.padStart(64, "0");
}

/**
 * Build call data from a signature and its arguments.
 *
 * Only static argument types, because that is all this page sends. Anything
 * dynamic would need an offset table, and quietly encoding it as static would
 * produce call data the node reads as a different call entirely.
 */
export function encode(signature, args = []) {
  const selector = SELECTOR[signature];
  if (selector === undefined) throw new Error(`No selector for ${signature}`);

  const types = signature.slice(signature.indexOf("(") + 1, -1);
  const list = types.length === 0 ? [] : types.split(",");
  if (list.length !== args.length) {
    throw new Error(`${signature} takes ${list.length} arguments, got ${args.length}`);
  }

  let data = selector;
  list.forEach((type, i) => {
    const value = args[i];
    if (type === "address") data += addressWord(value);
    else if (type === "bool") data += word(value ? 1 : 0);
    else if (/^uint\d*$/.test(type)) data += word(value);
    else throw new Error(`This codec does not encode ${type}`);
  });

  return data;
}

/** Split returned data into 32-byte words. */
function words(data) {
  const hex = String(data).replace(/^0x/, "");
  const out = [];
  for (let i = 0; i < hex.length; i += 64) out.push(hex.slice(i, i + 64));
  return out;
}

export function decodeUint(data, index = 0) {
  const w = words(data)[index];
  if (w === undefined) throw new Error("Returned data is shorter than expected");
  return BigInt(`0x${w || ZERO_WORD}`);
}

export function decodeBool(data, index = 0) {
  return decodeUint(data, index) === 1n;
}

export function decodeAddress(data, index = 0) {
  const w = words(data)[index];
  if (w === undefined) throw new Error("Returned data is shorter than expected");
  return `0x${w.slice(24)}`;
}

/**
 * A `uint256[]` return value.
 *
 * The first word is an offset to the array, not the array. Reading the length
 * from word 0 works by accident whenever the offset happens to be 32 bytes,
 * which it always is for a single return value, and breaks the moment it is
 * not. So the offset is followed rather than assumed.
 */
export function decodeUintArray(data) {
  const w = words(data);
  if (w.length === 0) return [];

  const offset = Number(BigInt(`0x${w[0]}`)) / 32;
  const length = Number(BigInt(`0x${w[offset]}`));

  const out = [];
  for (let i = 0; i < length; i++) out.push(BigInt(`0x${w[offset + 1 + i]}`));
  return out;
}

/** A `string` return value, decoded as UTF-8. */
export function decodeString(data) {
  const w = words(data);
  if (w.length === 0) return "";

  const offset = Number(BigInt(`0x${w[0]}`)) / 32;
  const length = Number(BigInt(`0x${w[offset]}`));
  const hex = w.slice(offset + 1).join("").slice(0, length * 2);

  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return new TextDecoder().decode(bytes);
}

/** The marketplace's `Listing` struct: a seller and a price in one slot. */
export function decodeListing(data) {
  return { seller: decodeAddress(data, 0), price: decodeUint(data, 1) };
}

/** The marketplace's `quote`: who, how much royalty, how much fee, and the rest. */
export function decodeQuote(data) {
  return {
    creator: decodeAddress(data, 0),
    royalty: decodeUint(data, 1),
    fee: decodeUint(data, 2),
    toSeller: decodeUint(data, 3),
  };
}

/** ERC-2981's `royaltyInfo`. */
export function decodeRoyalty(data) {
  return { receiver: decodeAddress(data, 0), amount: decodeUint(data, 1) };
}

/** A wei amount as a decimal string, without a float anywhere near it. */
export function formatUnits(value, decimals = 18, places = 4) {
  const negative = value < 0n;
  const n = negative ? -value : value;
  const base = 10n ** BigInt(decimals);

  const whole = n / base;
  const rest = (n % base).toString().padStart(decimals, "0").slice(0, places).replace(/0+$/, "");

  return `${negative ? "-" : ""}${whole}${rest ? `.${rest}` : ""}`;
}

/** A decimal string as wei. Rejects anything it cannot represent exactly. */
export function parseUnits(text, decimals = 18) {
  const trimmed = String(text).trim();
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    throw new Error(`Not a number: ${text}`);
  }

  const [whole = "0", fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) throw new Error(`More than ${decimals} decimal places`);

  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
}
