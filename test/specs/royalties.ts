import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddress } from "viem";

import { fixture, bps, PRICE, FEE_BPS, type Fixture } from "../helpers.js";

const GREEDY = 0;
const REVERTING = 1;
const BLACKHOLE = 2;

/** The marketplace's own ceiling on what any collection may claim. */
const MAX_ROYALTY_BPS = 1000n;

async function sellThrough(f: Fixture, collection: { address: `0x${string}` }, tokenId: bigint) {
  await f.market.write.list([collection.address, tokenId, PRICE], {
    account: f.seller.account,
  });
  await f.market.write.buy([collection.address, tokenId], {
    account: f.buyer.account,
    value: PRICE,
  });
}

async function hostile(f: Fixture, mode: number) {
  const collection = await f.viem.deployContract("HostileRoyalty", [
    mode,
    f.creator.account.address,
  ]);
  await collection.write.mint([f.seller.account.address]);
  await collection.write.approve([f.market.address, 1n], { account: f.seller.account });
  return collection;
}

describe("royalties", () => {
  it("pays a well behaved collection what it asks for", async () => {
    const f = await fixture();
    await f.collection.write.mint([f.seller.account.address]);
    await f.collection.write.approve([f.market.address, 1n], { account: f.seller.account });

    await sellThrough(f, f.collection, 1n);

    assert.equal(
      await f.market.read.proceedsOf([f.creator.account.address]),
      bps(PRICE, 500n),
    );
  });

  it("caps a collection demanding more than the sale price", async () => {
    const f = await fixture();
    const collection = await hostile(f, GREEDY);

    await sellThrough(f, collection, 1n);

    const capped = bps(PRICE, MAX_ROYALTY_BPS);
    assert.equal(await f.market.read.proceedsOf([f.creator.account.address]), capped);
  });

  it("still pays the seller when a collection is greedy", async () => {
    const f = await fixture();
    const collection = await hostile(f, GREEDY);

    await sellThrough(f, collection, 1n);

    const capped = bps(PRICE, MAX_ROYALTY_BPS);
    const fee = bps(PRICE, BigInt(FEE_BPS));

    assert.equal(
      await f.market.read.proceedsOf([f.seller.account.address]),
      PRICE - capped - fee,
    );
    assert.ok(
      (await f.market.read.proceedsOf([f.seller.account.address])) > 0n,
      "a hostile collection must not be able to zero the seller",
    );
  });

  it("sells anyway when the collection reverts on the royalty question", async () => {
    const f = await fixture();
    const collection = await hostile(f, REVERTING);

    await sellThrough(f, collection, 1n);

    assert.equal(
      getAddress(await collection.read.ownerOf([1n])),
      getAddress(f.buyer.account.address),
    );
    assert.equal(await f.market.read.proceedsOf([f.creator.account.address]), 0n);
  });

  it("gives an unanswered royalty to the seller rather than losing it", async () => {
    const f = await fixture();
    const collection = await hostile(f, REVERTING);

    await sellThrough(f, collection, 1n);

    assert.equal(
      await f.market.read.proceedsOf([f.seller.account.address]),
      PRICE - bps(PRICE, BigInt(FEE_BPS)),
    );
  });

  it("refuses to credit the zero address", async () => {
    const f = await fixture();
    const collection = await hostile(f, BLACKHOLE);

    await sellThrough(f, collection, 1n);

    const burned = "0x0000000000000000000000000000000000000000";
    assert.equal(await f.market.read.proceedsOf([burned]), 0n);
    assert.equal(
      await f.market.read.proceedsOf([f.seller.account.address]),
      PRICE - bps(PRICE, BigInt(FEE_BPS)),
      "money with nowhere to go stays with the seller",
    );
  });

  it("charges no royalty on a collection that does not implement ERC-2981", async () => {
    const f = await fixture();
    const collection = await f.viem.deployContract("PlainCollection", []);
    await collection.write.mint([f.seller.account.address]);
    await collection.write.approve([f.market.address, 1n], { account: f.seller.account });

    await sellThrough(f, collection, 1n);

    assert.equal(await f.market.read.proceedsOf([f.creator.account.address]), 0n);
    assert.equal(
      await f.market.read.proceedsOf([f.seller.account.address]),
      PRICE - bps(PRICE, BigInt(FEE_BPS)),
    );
  });

  it("quotes the capped figure, not the demanded one", async () => {
    const f = await fixture();
    const collection = await hostile(f, GREEDY);

    const [, royalty] = await f.market.read.quote([collection.address, 1n, PRICE]);

    assert.equal(royalty, bps(PRICE, MAX_ROYALTY_BPS));
  });

  it("never lets royalty and fee together exceed the price", async () => {
    const f = await fixture();
    await f.market.write.setFee([1000, f.feeTaker.account.address]);
    const collection = await hostile(f, GREEDY);

    await sellThrough(f, collection, 1n);

    const total =
      (await f.market.read.proceedsOf([f.creator.account.address])) +
      (await f.market.read.proceedsOf([f.feeTaker.account.address])) +
      (await f.market.read.proceedsOf([f.seller.account.address]));

    assert.equal(total, PRICE);
  });
});
