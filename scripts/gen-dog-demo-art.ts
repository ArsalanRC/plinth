/**
 * Generate the dog gallery's artwork from the contract itself.
 *
 *   pnpm hardhat run scripts/gen-dog-demo-art.ts
 *
 * Same reasoning as `gen-demo-art.ts`: the art is deterministic in the token
 * id, but the colours come out of `keccak256`, which browsers do not provide
 * and which is not worth shipping a hash implementation to reproduce.
 *
 * **This one carries more weight than the cats' version.** The cats are
 * deployed, so their page falls back to reading the chain. The dogs are not
 * deployed yet, so until they are this file is the only way the site can show
 * one at all. It is the difference between a collection page and a promise.
 *
 * Twenty-four rather than twelve, because the dog grid is the whole page here
 * rather than a strip on the marketplace, and because five ear variants need
 * enough tokens that the 8% one turns up.
 */

import { writeFileSync } from "node:fs";
import { network } from "hardhat";

const COUNT = 24;

const { viem } = await network.connect();
const [deployer] = await viem.getWalletClients();

const collection = await viem.deployContract("PlinthDogs", [
  "Plinth Dogs",
  "PDOG",
  5000n,
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
 * Artwork for the dog gallery, rendered by the contract.
 *
 * GENERATED. Do not edit by hand.
 *   pnpm hardhat run scripts/gen-dog-demo-art.ts
 *
 * These are the real SVGs \`PlinthDogs.imageOf\` returns for tokens 1 to ${COUNT},
 * not a browser-side imitation. The colours derive from keccak256, which
 * browsers cannot compute.
 *
 * Until the dogs are deployed this is the only source of dog artwork the site
 * has. \`test/specs/dog-demo-art.ts\` keeps it honest against the contract.
 */

export const DOG_DEMO_ART = ${JSON.stringify(tokens, null, 2)};
`;

writeFileSync("site/dog-demo-art.js", file);
console.log(`wrote site/dog-demo-art.js with ${tokens.length} tokens, ${(Buffer.byteLength(file) / 1024).toFixed(0)} KB`);
