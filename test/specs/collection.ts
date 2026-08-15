import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddress } from "viem";

import { fixture, mintTo, rejects, fromDataUri, MAX_SUPPLY, PRICE } from "../helpers.js";

describe("PlinthCollection", () => {
  it("mints sequential ids starting at one", async () => {
    const f = await fixture();

    const first = await mintTo(f, f.seller.account.address);
    const second = await mintTo(f, f.buyer.account.address);

    assert.equal(first, 1n);
    assert.equal(second, 2n);
    assert.equal(await f.collection.read.totalMinted(), 2n);
  });

  it("leaves id zero unused, so zero can mean no token", async () => {
    const f = await fixture();
    await mintTo(f, f.seller.account.address);

    await rejects(f.collection.read.ownerOf([0n]), "ERC721NonexistentToken");
  });

  it("transfers between accounts", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    await f.collection.write.transferFrom(
      [f.seller.account.address, f.buyer.account.address, tokenId],
      { account: f.seller.account },
    );

    assert.equal(
      getAddress(await f.collection.read.ownerOf([tokenId])),
      getAddress(f.buyer.account.address),
    );
  });

  it("refuses to mint past the declared supply", async () => {
    const f = await fixture();
    const small = await f.viem.deployContract("PlinthCollection", [
      "Tiny",
      "TINY",
      2n,
      f.creator.account.address,
    ]);

    await small.write.mint([f.seller.account.address]);
    await small.write.mint([f.seller.account.address]);

    await rejects(small.write.mint([f.seller.account.address]), "SoldOut");
  });

  it("cannot raise its own supply after deployment", async () => {
    const f = await fixture();

    assert.equal(await f.collection.read.maxSupply(), MAX_SUPPLY);

    const names = f.collection.abi
      .filter((entry) => entry.type === "function")
      .map((entry) => entry.name);
    assert.ok(!names.some((name) => /setMaxSupply|increaseSupply/i.test(name)));
  });

  it("lists every token an address owns", async () => {
    const f = await fixture();
    await mintTo(f, f.seller.account.address);
    await mintTo(f, f.buyer.account.address);
    await mintTo(f, f.seller.account.address);

    const sellers = await f.collection.read.tokensOf([f.seller.account.address]);
    const buyers = await f.collection.read.tokensOf([f.buyer.account.address]);

    assert.deepEqual([...sellers], [1n, 3n]);
    assert.deepEqual([...buyers], [2n]);
  });

  it("lists nothing for an address holding nothing", async () => {
    const f = await fixture();
    await mintTo(f, f.seller.account.address);

    assert.deepEqual([...(await f.collection.read.tokensOf([f.stranger.account.address]))], []);
  });

  it("follows a token when it changes hands", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    await f.collection.write.transferFrom(
      [f.seller.account.address, f.buyer.account.address, tokenId],
      { account: f.seller.account },
    );

    assert.deepEqual([...(await f.collection.read.tokensOf([f.seller.account.address]))], []);
    assert.deepEqual([...(await f.collection.read.tokensOf([f.buyer.account.address]))], [tokenId]);
  });

  // --------------------------------------------------------------- metadata

  it("builds its metadata on chain, with no link to anywhere", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const uri = await f.collection.read.tokenURI([tokenId]);

    assert.ok(uri.startsWith("data:application/json;base64,"));
    assert.ok(!uri.includes("ipfs"), "nothing may point at a file somebody has to keep paying for");
    assert.ok(!uri.includes("http"), "nor at a server that can stop answering");
  });

  it("carries a name, a description and an embedded image", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const meta = JSON.parse(fromDataUri(await f.collection.read.tokenURI([tokenId])));

    assert.equal(meta.name, "Plinth Demo #1");
    assert.ok(meta.description.length > 20);
    assert.ok(meta.image.startsWith("data:image/svg+xml;base64,"));
  });

  it("embeds an image that is really an SVG", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const meta = JSON.parse(fromDataUri(await f.collection.read.tokenURI([tokenId])));
    const svg = fromDataUri(meta.image);

    assert.ok(svg.startsWith("<svg "), "a wallet will try to render this");
    assert.ok(svg.trimEnd().endsWith("</svg>"), "and an unclosed tag renders as nothing");
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), "without this it is not an image");
  });

  it("has no setter for its metadata, because there is nowhere to set it to", async () => {
    const f = await fixture();

    const names = f.collection.abi
      .filter((entry) => entry.type === "function")
      .map((entry) => entry.name);

    assert.ok(!names.some((name) => /setBaseURI|setTokenURI|freezeMetadata/i.test(name)));
  });

  it("draws the same picture for the same id, every time", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const first = await f.collection.read.imageOf([tokenId]);
    const second = await f.collection.read.imageOf([tokenId]);

    assert.equal(first, second);
  });

  it("draws a different picture for a different id", async () => {
    const f = await fixture();
    await mintTo(f, f.seller.account.address);
    await mintTo(f, f.seller.account.address);

    assert.notEqual(await f.collection.read.imageOf([1n]), await f.collection.read.imageOf([2n]));
  });

  it("has no URI and no image for a token that does not exist", async () => {
    const f = await fixture();

    await rejects(f.collection.read.tokenURI([7n]), "NoSuchToken");
    await rejects(f.collection.read.imageOf([7n]), "NoSuchToken");
  });

  // --------------------------------------------------------------- royalties

  it("registers a royalty per token, inside its own ceiling", async () => {
    const f = await fixture();

    for (let i = 0; i < 5; i++) {
      const tokenId = await mintTo(f, f.seller.account.address);
      const [receiver, amount] = await f.collection.read.royaltyInfo([tokenId, 10_000n]);

      assert.equal(getAddress(receiver), getAddress(f.creator.account.address));
      assert.ok(amount >= 250n, `token ${tokenId} pays ${amount}, under the floor`);
      assert.ok(amount <= 1000n, `token ${tokenId} pays ${amount}, over the ceiling`);
    }
  });

  /**
   * The one that matters. The metadata states a royalty; `royaltyInfo` states a
   * royalty. If those two ever disagree, the token advertises a number the
   * contract will not honour, and a buyer reads the wrong one.
   */
  it("publishes exactly the royalty it charges", async () => {
    const f = await fixture();

    for (let i = 0; i < 5; i++) {
      const tokenId = await mintTo(f, f.seller.account.address);

      const [, amount] = await f.collection.read.royaltyInfo([tokenId, 10_000n]);
      const expected = `${amount / 100n}.${(amount % 100n) / 10n}%`;

      const meta = JSON.parse(fromDataUri(await f.collection.read.tokenURI([tokenId])));
      const stated = meta.attributes.find(
        (a: { trait_type: string }) => a.trait_type === "Creator royalty",
      );

      assert.equal(stated?.value, expected, `token ${tokenId} states the wrong royalty`);
    }
  });

  it("publishes every layer as a filterable attribute", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const meta = JSON.parse(fromDataUri(await f.collection.read.tokenURI([tokenId])));
    const traits = meta.attributes.map((a: { trait_type: string }) => a.trait_type);

    // Without these a marketplace cannot filter or rank by rarity, and a
    // weighted generative collection whose weights are invisible is a picture.
    for (const key of ["Background", "Fur", "Pattern", "Eyes", "Eye shape", "Mouth", "Accessory"]) {
      assert.ok(traits.includes(key), `no ${key} attribute`);
    }

    for (const attr of meta.attributes) {
      assert.ok(String(attr.value).length > 0, `${attr.trait_type} has an empty value`);
    }
  });

  /**
   * The rarest traits have to actually be rare, and the common ones common.
   * A weighting table that is wired up backwards still produces valid art, so
   * nothing else in the suite would notice.
   */
  it("hands out rare traits rarely", async () => {
    const f = await fixture();
    const counts = new Map<string, number>();
    const SAMPLE = 120;

    for (let id = 1n; id <= BigInt(SAMPLE); id++) {
      const accessory = (await f.collection.read.traitsOf([id]))[6];
      counts.set(accessory, (counts.get(accessory) ?? 0) + 1);
    }

    const none = counts.get("None") ?? 0;
    const crown = counts.get("Crown") ?? 0;

    assert.ok(none > crown, `None appeared ${none} times, Crown ${crown}. The table is backwards`);
    assert.ok(none / SAMPLE > 0.2, `None is only ${((none / SAMPLE) * 100).toFixed(0)}%, expected ~35%`);
    assert.ok(crown / SAMPLE < 0.12, `Crown is ${((crown / SAMPLE) * 100).toFixed(0)}%, expected ~3%`);
  });

  it("gives two different tokens different cats", async () => {
    const f = await fixture();
    const seen = new Set<string>();

    for (let i = 0; i < 12; i++) {
      const tokenId = await mintTo(f, f.seller.account.address);
      seen.add(await f.collection.read.imageOf([tokenId]));
    }

    assert.equal(seen.size, 12, "some tokens drew an identical cat");
  });

  it("scales the royalty with the sale price", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const [, atOne] = await f.collection.read.royaltyInfo([tokenId, PRICE]);
    const [, atTen] = await f.collection.read.royaltyInfo([tokenId, PRICE * 10n]);

    assert.equal(atTen, atOne * 10n);
  });

  it("announces both ERC-721 and ERC-2981 through ERC-165", async () => {
    const f = await fixture();

    assert.equal(await f.collection.read.supportsInterface(["0x80ac58cd"]), true, "ERC-721");
    assert.equal(await f.collection.read.supportsInterface(["0x2a55205a"]), true, "ERC-2981");
    assert.equal(await f.collection.read.supportsInterface(["0xffffffff"]), false);
  });
});
