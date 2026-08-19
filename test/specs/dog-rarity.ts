import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

import { LAYERS, RARITY, SUPPLY, TOKENS, percentOf, rarestOf, traitsOf } from "../../site/dog-rarity.js";

/**
 * The generated dog rarity table, checked against the contract that produced it.
 *
 * Two separate things can go wrong and only one of them is the usual staleness
 * check:
 *
 *   1. The art changes and nobody regenerates, so the page shows the old
 *      distribution. That is the same risk the cats have.
 *   2. **The packing is wrong.** Each token is nine characters indexing into
 *      per-layer value lists, so an off-by-one in the encoder mislabels all
 *      5000 dogs at once, consistently, with a table that still sums correctly.
 *      Nothing about the file would look wrong.
 *
 * So the round trip is checked against the chain rather than against itself.
 */
describe("dog rarity", () => {
  async function dogs() {
    const { viem } = await network.create();
    const [deployer] = await viem.getWalletClients();

    return viem.deployContract("PlinthDogs", [
      "Plinth Dogs", "PDOG", BigInt(SUPPLY), deployer!.account.address,
    ]);
  }

  it("has one packed row per token, all the right width", () => {
    assert.equal(TOKENS.length, SUPPLY);
    for (const row of TOKENS) assert.equal(row.length, LAYERS.length);
  });

  it("counts every token exactly once in every layer", () => {
    for (const entry of RARITY) {
      const total = entry.values.reduce((sum, v) => sum + v.count, 0);
      assert.equal(total, SUPPLY, `${entry.layer} counts ${total} of ${SUPPLY}`);
    }
  });

  it("lists values rarest first, which both pages rely on", () => {
    for (const entry of RARITY) {
      const counts = entry.values.map((v) => v.count);
      assert.deepEqual(counts, [...counts].sort((a, b) => a - b), `${entry.layer} is out of order`);
    }
  });

  /**
   * The one that catches a bad encoder. Sampled with a stride rather than all
   * 5000, because 5000 calls would add minutes to every build and that is how a
   * guard becomes something people skip. Same reasoning as fanout's PageDataTest.
   */
  it("unpacks to exactly what the contract says, sampled across the supply", async () => {
    const collection = await dogs();

    for (let id = 1; id <= SUPPLY; id += 137) {
      const onChain = await collection.read.traitsOf([BigInt(id)]);
      assert.deepEqual(traitsOf(id), [...onChain], `token ${id} does not match the chain`);
    }

    // The ends as well, since a stride can walk straight past an off-by-one.
    assert.deepEqual(traitsOf(1), [...(await collection.read.traitsOf([1n]))]);
    assert.deepEqual(traitsOf(SUPPLY), [...(await collection.read.traitsOf([BigInt(SUPPLY)]))]);
  });

  it("has nothing outside the supply", () => {
    assert.equal(traitsOf(0), null);
    assert.equal(traitsOf(SUPPLY + 1), null);
    assert.equal(rarestOf(SUPPLY + 1), 100);
  });

  it("agrees with itself about how rare a token's rarest trait is", () => {
    for (const id of [1, 500, 1234, 4999]) {
      const traits = traitsOf(id);
      const lowest = Math.min(...traits.map((value, i) => percentOf(i, value)));

      assert.equal(rarestOf(id), lowest, `token ${id} disagrees about its rarest trait`);
    }
  });

  it("kept the file small enough to ship", async () => {
    const { readFileSync } = await import("node:fs");
    const bytes = readFileSync("site/dog-rarity.js").length;

    // Spelled out the way the cats are, this was projected at 484 KB. The
    // packing exists to avoid that, and a regression would undo it silently.
    assert.ok(bytes < 120_000, `dog-rarity.js is ${(bytes / 1024).toFixed(0)} KB, the packing has regressed`);
  });
});
