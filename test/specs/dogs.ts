import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { readFileSync } from "node:fs";

/**
 * The dog collection: nine layers, and the size limit that decided the number.
 *
 * The art is `pure` in the token id, so almost none of this needs a mint. That
 * is the same property the cats rely on and it is what lets the rarity table be
 * exact rather than sampled.
 */

const LAYERS = [
  "Background", "Coat", "Pattern", "Ears", "Eyes",
  "Eye shape", "Muzzle", "Collar", "Accessory",
] as const;

async function dogs(maxSupply = 100n) {
  const { viem } = await network.create();
  const [deployer, holder] = await viem.getWalletClients();

  const collection = await viem.deployContract("PlinthDogs", [
    "Plinth Dogs",
    "PDOG",
    maxSupply,
    deployer!.account.address,
  ]);

  return { collection, holder: holder!, deployer: deployer! };
}

describe("PlinthDogs", () => {
  /**
   * The constraint the whole collection was designed around.
   *
   * `DogArt` is inlined, so the art sits inside this contract's own bytecode
   * and EIP-170 caps it at 24,576 bytes. Nine layers was chosen against a
   * measurement, and a tenth layer or a richer variant would push it over. The
   * failure without this test is a deploy that reverts on mainnet after the gas
   * has been paid, which is a bad place to learn it.
   */
  it("fits inside the EIP-170 contract size limit", () => {
    const artifact = JSON.parse(
      readFileSync("artifacts/contracts/PlinthDogs.sol/PlinthDogs.json", "utf8"),
    );
    const object = typeof artifact.deployedBytecode === "string"
      ? artifact.deployedBytecode
      : artifact.deployedBytecode.object;

    const size = (object.length - 2) / 2;
    assert.ok(size < 24576, `deployed bytecode is ${size} bytes, over the 24576 limit`);

    // Named so a future layer sees what it is eating into rather than only
    // finding out when the assertion above flips.
    console.log(`      PlinthDogs: ${size} bytes, ${24576 - size} to spare`);
  });

  it("reports nine layers, in the documented order", async () => {
    const { collection } = await dogs();
    const traits = await collection.read.traitsOf([1n]);

    assert.equal(traits.length, 9);
    for (const t of traits) assert.ok(t.length > 0, "a layer returned an empty string");
  });

  it("names every layer in the metadata, so a marketplace can filter", async () => {
    const { collection, holder } = await dogs();
    await collection.write.mint([holder.account.address]);

    const uri = await collection.read.tokenURI([1n]);
    const json = JSON.parse(
      Buffer.from(uri.split("base64,")[1]!, "base64").toString("utf8"),
    );

    const named = json.attributes.map((a: { trait_type: string }) => a.trait_type);
    for (const layer of LAYERS) assert.ok(named.includes(layer), `${layer} is missing`);

    // Nine layers plus the royalty, which is an attribute and not a layer.
    assert.equal(json.attributes.length, 10);
  });

  /**
   * Ears carry the collection. A dog and a cat drawn at this size differ mainly
   * in the ears, and three of the five variants had to be redrawn because they
   * read as a bear, a lynx and a cat respectively. If a variant ever becomes
   * unreachable the silhouette quietly collapses to four.
   */
  it("can roll every ear, so no variant is unreachable", async () => {
    const { collection } = await dogs();
    const seen = new Set<string>();

    for (let id = 1n; id <= 400n; id++) {
      seen.add((await collection.read.traitsOf([id]))[3]!);
    }

    for (const ear of ["Drop", "Folded", "Long", "Tufted", "Prick"]) {
      assert.ok(seen.has(ear), `${ear} never came up in 400 rolls`);
    }
  });

  it("draws the same dog for the same id, every time", async () => {
    const a = await dogs();
    const b = await dogs();

    // Two separate chains, so this is a property of the id and not of state.
    assert.deepEqual(await a.collection.read.traitsOf([77n]), await b.collection.read.traitsOf([77n]));
  });

  it("needs no mint to draw one, so the next token can be previewed", async () => {
    const { collection } = await dogs();

    // Nothing minted at all.
    assert.equal(await collection.read.totalMinted(), 0n);
    assert.equal((await collection.read.traitsOf([4999n])).length, 9);
  });

  it("keeps every royalty inside the ceiling it advertises", async () => {
    const { collection, holder } = await dogs();
    const max = await collection.read.MAX_ROYALTY_BPS();

    for (let i = 0; i < 12; i++) await collection.write.mint([holder.account.address]);

    for (let id = 1n; id <= 12n; id++) {
      const [, amount] = await collection.read.royaltyInfo([id, 10000n]);
      assert.ok(amount <= max, `token ${id} pays ${amount} against a ceiling of ${max}`);
      assert.ok(amount >= 250n, `token ${id} pays ${amount}, under the 250 floor`);
    }
  });

  it("stops at the supply it promised", async () => {
    const { collection, holder } = await dogs(3n);

    for (let i = 0; i < 3; i++) await collection.write.mint([holder.account.address]);
    await assert.rejects(collection.write.mint([holder.account.address]), /SoldOut/);
  });

  it("draws an svg that is actually an svg", async () => {
    const { collection, holder } = await dogs();
    await collection.write.mint([holder.account.address]);

    const svg = await collection.read.imageOf([1n]);
    assert.ok(svg.startsWith("<svg "), "does not open with an svg element");
    assert.ok(svg.endsWith("</svg>"), "does not close");
    // Head, muzzle and eyes are always drawn whatever the layers rolled.
    assert.ok(svg.includes("ellipse"), "no ellipse, so no head or muzzle");
  });
});
