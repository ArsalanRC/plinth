/**
 * Generate the demo gallery's artwork from the contract itself.
 *
 *   node --experimental-strip-types scripts/gen-demo-art.ts
 *
 * The art is deterministic in the token id, but the colours come out of
 * `keccak256`, which browsers do not provide and which is not worth shipping a
 * hash implementation to reproduce. So the first twelve tokens are rendered
 * once, here, by the real contract on a real chain, and written to
 * `site/demo-art.js`.
 *
 * That makes the demo gallery show exactly what a minted token looks like
 * rather than an artist's impression of one. `test/specs/demo-art.ts` asserts
 * the committed file still matches the contract, so the two cannot drift.
 */

import { writeFileSync } from "node:fs";
import { network } from "hardhat";

const COUNT = 12;

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();

const collection = await viem.deployContract("PlinthCollection", [
  "Plinth Demo",
  "PLNTH",
  500n,
  deployer!.account.address,
]);

const tokens: Array<{ id: number; royalty: string; svg: string }> = [];

for (let id = 1; id <= COUNT; id++) {
  await collection.write.mint([deployer!.account.address]);

  const [, amount] = await collection.read.royaltyInfo([BigInt(id), 10_000n]);
  tokens.push({
    id,
    royalty: `${amount / 100n}.${(amount % 100n) / 10n}%`,
    svg: await collection.read.imageOf([BigInt(id)]),
  });
}

const file = `/**
 * Artwork for the demo gallery, rendered by the contract.
 *
 * GENERATED. Do not edit by hand.
 *   node --experimental-strip-types scripts/gen-demo-art.ts
 *
 * These are the real SVGs \`PlinthCollection.imageOf\` returns for tokens 1 to
 * ${COUNT}, not a browser-side imitation of them. The colours derive from
 * keccak256, which browsers cannot compute, so reproducing them in JavaScript
 * would mean shipping a hash implementation to redraw a picture the contract
 * already draws. \`test/specs/demo-art.ts\` keeps this file honest.
 */

export const DEMO_ART = ${JSON.stringify(tokens, null, 2)};
`;

writeFileSync(new URL("../site/demo-art.js", import.meta.url), file);
console.log(`Wrote ${tokens.length} tokens to site/demo-art.js`);
