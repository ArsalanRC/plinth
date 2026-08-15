/**
 * Compute the collection's rarity table from the contract.
 *
 *   pnpm hardhat run scripts/gen-rarity.ts
 *
 * `traitsOf` is pure and does not need a token to exist, so the whole supply
 * can be enumerated without minting anything. That makes the table exact rather
 * than sampled: these are the real counts across all 500 tokens, not an
 * estimate from the weights in `Art.sol`.
 *
 * Committed rather than computed in the browser because 500 `eth_call`s on page
 * load would take longer than anybody waits, and because a table typed into
 * JavaScript by hand drifts from the contract the moment the art changes.
 * `test/specs/rarity.ts` fails if this file goes stale.
 */

import { writeFileSync } from "node:fs";
import { network } from "hardhat";

const SUPPLY = 500n;
const LAYERS = ["Background", "Fur", "Pattern", "Eyes", "Eye shape", "Mouth", "Accessory"];

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();

const collection = await viem.deployContract("PlinthCollection", [
  "Plinth Cats",
  "PLNTH",
  SUPPLY,
  deployer!.account.address,
]);

/** trait name -> value -> how many of the supply have it */
const counts: Record<string, Record<string, number>> = {};
/** token id -> its seven values, so a token page needs no extra call */
const tokens: Record<string, string[]> = {};

for (let id = 1n; id <= SUPPLY; id++) {
  const traits = await collection.read.traitsOf([id]);

  tokens[String(id)] = [...traits];
  LAYERS.forEach((layer, i) => {
    const value = traits[i]!;
    (counts[layer] ??= {})[value] = ((counts[layer] ??= {})[value] ?? 0) + 1;
  });
}

// Sorted rarest first, which is the order both pages want to show them in.
const table = LAYERS.map((layer) => ({
  layer,
  values: Object.entries(counts[layer]!)
    .map(([value, count]) => ({ value, count, percent: (count / Number(SUPPLY)) * 100 }))
    .sort((a, b) => a.count - b.count),
}));

const file = `/**
 * The rarity table, computed from the contract across all ${SUPPLY} tokens.
 *
 * GENERATED. Do not edit by hand.
 *   pnpm hardhat run scripts/gen-rarity.ts
 *
 * Exact counts, not estimates from the weights. \`test/specs/rarity.ts\` fails
 * if the art changes and this is not regenerated.
 */

export const SUPPLY = ${SUPPLY};

export const LAYERS = ${JSON.stringify(LAYERS)};

/** Every layer, its values, and how many of the supply carry each. Rarest first. */
export const RARITY = ${JSON.stringify(table, null, 2)};

/** Token id to its seven trait values, in LAYERS order. */
export const TOKEN_TRAITS = ${JSON.stringify(tokens)};

/** How rare one token's rarest trait is, as a percentage. Lower is rarer. */
export function rarestOf(id) {
  const traits = TOKEN_TRAITS[String(id)];
  if (!traits) return 100;

  return Math.min(
    ...traits.map((value, i) => {
      const found = RARITY[i].values.find((v) => v.value === value);
      return found ? found.percent : 100;
    }),
  );
}

/** The percentage of the supply sharing a given value of a given layer. */
export function percentOf(layerIndex, value) {
  const found = RARITY[layerIndex]?.values.find((v) => v.value === value);
  return found ? found.percent : 0;
}
`;

writeFileSync(new URL("../site/rarity.js", import.meta.url), file);

console.log(`Wrote the rarity table for ${SUPPLY} tokens to site/rarity.js`);
for (const { layer, values } of table) {
  const rarest = values[0]!;
  console.log(`  ${layer.padEnd(11)} rarest: ${rarest.value} at ${rarest.percent.toFixed(1)}%`);
}
