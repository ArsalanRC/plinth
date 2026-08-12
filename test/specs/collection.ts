import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddress } from "viem";

import { fixture, mintTo, rejects, MAX_SUPPLY, ROYALTY_BPS, PRICE, bps } from "../helpers.js";

describe("ConsignCollection", () => {
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

  it("records the owner of a freshly minted token", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    assert.equal(
      getAddress(await f.collection.read.ownerOf([tokenId])),
      getAddress(f.seller.account.address),
    );
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
    const small = await f.viem.deployContract("ConsignCollection", [
      "Tiny",
      "TINY",
      "ipfs://tiny/",
      2n,
      f.creator.account.address,
      ROYALTY_BPS,
    ]);

    await small.write.mint([f.seller.account.address]);
    await small.write.mint([f.seller.account.address]);

    await rejects(small.write.mint([f.seller.account.address]), "SoldOut");
  });

  it("cannot raise its own supply after deployment", async () => {
    const f = await fixture();

    assert.equal(await f.collection.read.maxSupply(), MAX_SUPPLY);
    // `maxSupply` is immutable, so there is no setter to call. The assertion
    // that matters is that the ABI carries no way to move it.
    const names = f.collection.abi
      .filter((entry) => entry.type === "function")
      .map((entry) => entry.name);
    assert.ok(!names.some((name) => /setMaxSupply|increaseSupply/i.test(name)));
  });

  it("reports an ERC-2981 royalty proportional to the price", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const [receiver, amount] = await f.collection.read.royaltyInfo([tokenId, PRICE]);

    assert.equal(getAddress(receiver), getAddress(f.creator.account.address));
    assert.equal(amount, bps(PRICE, ROYALTY_BPS));
  });

  it("refuses a royalty above its own cap at construction", async () => {
    const f = await fixture();

    await rejects(
      f.viem.deployContract("ConsignCollection", [
        "Greedy",
        "GRDY",
        "ipfs://greedy/",
        10n,
        f.creator.account.address,
        1001n,
      ]),
      "RoyaltyTooHigh",
    );
  });

  it("builds a token URI from the base and the id", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    assert.equal(await f.collection.read.tokenURI([tokenId]), "ipfs://demo/1.json");
  });

  it("has no URI for a token that does not exist", async () => {
    const f = await fixture();

    await rejects(f.collection.read.tokenURI([7n]), "NoSuchToken");
  });

  it("lets the owner move the metadata, once, and then never again", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    await f.collection.write.setBaseURI(["ipfs://moved/"]);
    assert.equal(await f.collection.read.tokenURI([tokenId]), "ipfs://moved/1.json");

    await f.collection.write.freezeMetadata();

    assert.equal(await f.collection.read.metadataFrozen(), true);
    await rejects(f.collection.write.setBaseURI(["ipfs://again/"]), "MetadataIsFrozen");
    assert.equal(await f.collection.read.tokenURI([tokenId]), "ipfs://moved/1.json");
  });

  it("keeps metadata away from everyone but the owner", async () => {
    const f = await fixture();

    await rejects(
      f.collection.write.setBaseURI(["ipfs://hijack/"], { account: f.stranger.account }),
      "OwnableUnauthorizedAccount",
    );
  });

  it("announces both ERC-721 and ERC-2981 through ERC-165", async () => {
    const f = await fixture();

    assert.equal(await f.collection.read.supportsInterface(["0x80ac58cd"]), true, "ERC-721");
    assert.equal(await f.collection.read.supportsInterface(["0x2a55205a"]), true, "ERC-2981");
    assert.equal(await f.collection.read.supportsInterface(["0xffffffff"]), false);
  });
});
