/**
 * Compute the dog collection's rarity table from the contract.
 *
 *   pnpm hardhat run scripts/gen-dog-rarity.ts
 *
 * Same idea as `gen-rarity.ts` and a different encoding, because the numbers
 * are different enough to change the answer. The cats are 500 tokens of 7
 * layers. The dogs are **5000 of 9**, which is roughly fourteen times the data,
 * and writing it the cat way produced a projected **484 KB** JavaScript module
 * parsed on every page load.
 *
 * So the values are written once per layer and each token is a **string of
 * indices**, one character per layer, rather than nine repeated trait names.
 * "Sand" appears once in the file instead of nine hundred times. Same
 * information, and the file lands near 60 KB.
 *
 * This is the fanout recording-layout lesson applied: decide the shape before
 * generating, because 1456 searches as separate files and 5000 tokens as
 * repeated strings are the same mistake wearing different clothes.
 *
 * `traitsOf` is pure and needs no token to exist, so the whole supply is
 * enumerated without minting. The table is exact rather than sampled.
 */

import { writeFileSync } from "node:fs";
import { network } from "hardhat";

const SUPPLY = 5000n;
const LAYERS = [
  "Background", "Coat", "Pattern", "Ears", "Eyes",
  "Eye shape", "Muzzle", "Collar", "Accessory",
];

/**
 * Index to character. 0-9 then a-z, so a layer can carry up to 36 values in one
 * character. The widest layer here has eight, so there is plenty of room, and
 * the encoder throws rather than silently wrapping if that ever stops holding.
 */
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();

const collection = await viem.deployContract("PlinthDogs", [
  "Plinth Dogs",
  "PDOG",
  SUPPLY,
  deployer!.account.address,
]);

/** trait name -> value -> how many of the supply have it */
const counts: Record<string, Record<string, number>> = {};
/** Every token's nine values, held until the value lists are known. */
const rows: string[][] = [];

for (let id = 1n; id <= SUPPLY; id++) {
  const traits = await collection.read.traitsOf([id]);

  rows.push([...traits]);
  LAYERS.forEach((layer, i) => {
    const value = traits[i]!;
    (counts[layer] ??= {})[value] = ((counts[layer] ??= {})[value] ?? 0) + 1;
  });

  if (id % 500n === 0n) console.log(`  ${id} / ${SUPPLY}`);
}

// Sorted rarest first, which is the order both pages want to show them in.
const table = LAYERS.map((layer) => ({
  layer,
  values: Object.entries(counts[layer]!)
    .map(([value, count]) => ({ value, count, percent: (count / Number(SUPPLY)) * 100 }))
    .sort((a, b) => a.count - b.count),
}));

// The index a token's value has within its own layer, in the same order the
// table publishes. One lookup built once rather than a search per token.
const indexOf = table.map((entry) => {
  const map = new Map<string, number>();
  entry.values.forEach((v, i) => map.set(v.value, i));

  if (entry.values.length > ALPHABET.length) {
    throw new Error(`${entry.layer} has ${entry.values.length} values, over the ${ALPHABET.length} the encoding allows`);
  }
  return map;
});

const packed = rows.map((values) =>
  values.map((value, i) => ALPHABET[indexOf[i]!.get(value)!]).join(""),
);

const file = `/**
 * The dog rarity table, computed from the contract across all ${SUPPLY} tokens.
 *
 * GENERATED. Do not edit by hand.
 *   pnpm hardhat run scripts/gen-dog-rarity.ts
 *
 * Exact counts, not estimates from the weights.
 *
 * **Tokens are packed rather than spelled out.** Each entry in \`TOKENS\` is a
 * ${LAYERS.length}-character string, one character per layer, indexing into that layer's
 * value list in \`RARITY\`. Written the way the cats are, with every trait name
 * repeated per token, this file was projected at 484 KB. Use \`traitsOf\` to
 * unpack one.
 */

export const SUPPLY = ${SUPPLY};

export const LAYERS = ${JSON.stringify(LAYERS)};

/** Every layer, its values, and how many of the supply carry each. Rarest first. */
export const RARITY = ${JSON.stringify(table)};

/** One packed row per token, id order from 1. See the note above. */
export const TOKENS = ${JSON.stringify(packed)};

const ALPHABET = ${JSON.stringify(ALPHABET)};

/** One token's nine trait values, in LAYERS order. */
export function traitsOf(id) {
  const row = TOKENS[Number(id) - 1];
  if (!row) return null;

  return LAYERS.map((_, i) => RARITY[i].values[ALPHABET.indexOf(row[i])].value);
}

/** How rare one token's rarest trait is, as a percentage. Lower is rarer. */
export function rarestOf(id) {
  const row = TOKENS[Number(id) - 1];
  if (!row) return 100;

  // The values are sorted rarest first, so the lowest index in the row is the
  // rarest trait and no percentage lookup is needed to find which one it is.
  return Math.min(...LAYERS.map((_, i) => RARITY[i].values[ALPHABET.indexOf(row[i])].percent));
}

/** The percentage of the supply sharing a given value of a given layer. */
export function percentOf(layerIndex, value) {
  const found = RARITY[layerIndex].values.find((v) => v.value === value);
  return found ? found.percent : 0;
}
`;

writeFileSync("site/dog-rarity.js", file);

const bytes = Buffer.byteLength(file);
console.log(`\nsite/dog-rarity.js  ${(bytes / 1024).toFixed(1)} KB`);
console.log(`packed ${packed.length} tokens at ${LAYERS.length} chars each`);
for (const entry of table) {
  const rarest = entry.values[0]!;
  console.log(`  ${entry.layer.padEnd(11)} ${String(entry.values.length).padStart(2)} values, rarest ${rarest.value} at ${rarest.percent.toFixed(1)}%`);
}
