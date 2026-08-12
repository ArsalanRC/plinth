import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { fixture, listed, rejects, PRICE } from "../helpers.js";

/**
 * Not taking custody of the token is what makes these cases possible, and
 * handling them is the price of that choice. A marketplace holding the token in
 * escrow has no stale listings and a much worse failure if it ever has a bug.
 */
describe("staleness", () => {
  it("stops being fillable once the seller moves the token away", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.collection.write.transferFrom(
      [f.seller.account.address, f.stranger.account.address, tokenId],
      { account: f.seller.account },
    );

    assert.equal(await f.market.read.isFillable([f.collection.address, tokenId]), false);
  });

  it("says why, rather than failing somewhere inside the token", async () => {
    const f = await fixture();
    const tokenId = await listed(f);
    await f.collection.write.transferFrom(
      [f.seller.account.address, f.stranger.account.address, tokenId],
      { account: f.seller.account },
    );

    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.buyer.account,
        value: PRICE,
      }),
      "ListingStale",
    );
  });

  it("stops being fillable once approval is revoked", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.collection.write.approve(
      ["0x0000000000000000000000000000000000000000", tokenId],
      { account: f.seller.account },
    );

    assert.equal(await f.market.read.isFillable([f.collection.address, tokenId]), false);
    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.buyer.account,
        value: PRICE,
      }),
      "ListingStale",
    );
  });

  it("takes the buyer's money nowhere when a listing is stale", async () => {
    const f = await fixture();
    const tokenId = await listed(f);
    await f.collection.write.transferFrom(
      [f.seller.account.address, f.stranger.account.address, tokenId],
      { account: f.seller.account },
    );

    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.buyer.account,
        value: PRICE,
      }),
      "ListingStale",
    );

    assert.equal(await f.publicClient.getBalance({ address: f.market.address }), 0n);
    assert.equal(await f.market.read.proceedsOf([f.seller.account.address]), 0n);
  });

  it("lets anybody clear a stale listing", async () => {
    const f = await fixture();
    const tokenId = await listed(f);
    await f.collection.write.transferFrom(
      [f.seller.account.address, f.stranger.account.address, tokenId],
      { account: f.seller.account },
    );

    await f.market.write.pruneListing([f.collection.address, tokenId], {
      account: f.stranger.account,
    });

    const item = await f.market.read.listingOf([f.collection.address, tokenId]);
    assert.equal(item.seller, "0x0000000000000000000000000000000000000000");
  });

  it("refuses to clear a listing that is perfectly good", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await rejects(
      f.market.write.pruneListing([f.collection.address, tokenId], {
        account: f.stranger.account,
      }),
      "ListingIsFine",
    );
  });

  it("has nothing to clear when there is no listing", async () => {
    const f = await fixture();

    await rejects(
      f.market.write.pruneListing([f.collection.address, 99n], {
        account: f.stranger.account,
      }),
      "NotListed",
    );
  });

  it("becomes fillable again if the seller puts things back", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.collection.write.transferFrom(
      [f.seller.account.address, f.stranger.account.address, tokenId],
      { account: f.seller.account },
    );
    assert.equal(await f.market.read.isFillable([f.collection.address, tokenId]), false);

    await f.collection.write.transferFrom(
      [f.stranger.account.address, f.seller.account.address, tokenId],
      { account: f.stranger.account },
    );
    await f.collection.write.approve([f.market.address, tokenId], {
      account: f.seller.account,
    });

    assert.equal(await f.market.read.isFillable([f.collection.address, tokenId]), true);
    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });
  });

  it("survives a collection that has no such token", async () => {
    const f = await fixture();

    assert.equal(await f.market.read.isFillable([f.collection.address, 12345n]), false);
  });
});
