import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddress, parseEther } from "viem";

import { fixture, mintAndApprove, mintTo, listed, rejects, PRICE } from "../helpers.js";

describe("listing", () => {
  it("records a listing the seller owns and has approved", async () => {
    const f = await fixture();
    const tokenId = await mintAndApprove(f);

    await f.market.write.list([f.collection.address, tokenId, PRICE], {
      account: f.seller.account,
    });

    const item = await f.market.read.listingOf([f.collection.address, tokenId]);
    assert.equal(getAddress(item.seller), getAddress(f.seller.account.address));
    assert.equal(item.price, PRICE);
  });

  it("leaves the token with the seller", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    assert.equal(
      getAddress(await f.collection.read.ownerOf([tokenId])),
      getAddress(f.seller.account.address),
      "the marketplace must never take custody",
    );
  });

  it("refuses a listing from somebody who does not own the token", async () => {
    const f = await fixture();
    const tokenId = await mintAndApprove(f);

    await rejects(
      f.market.write.list([f.collection.address, tokenId, PRICE], {
        account: f.stranger.account,
      }),
      "NotOwner",
    );
  });

  it("refuses a listing the marketplace cannot fill", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    await rejects(
      f.market.write.list([f.collection.address, tokenId, PRICE], {
        account: f.seller.account,
      }),
      "NotApproved",
    );
  });

  it("accepts a blanket approval as well as a single one", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    await f.collection.write.setApprovalForAll([f.market.address, true], {
      account: f.seller.account,
    });
    await f.market.write.list([f.collection.address, tokenId, PRICE], {
      account: f.seller.account,
    });

    assert.equal(await f.market.read.isFillable([f.collection.address, tokenId]), true);
  });

  it("refuses a price of zero", async () => {
    const f = await fixture();
    const tokenId = await mintAndApprove(f);

    await rejects(
      f.market.write.list([f.collection.address, tokenId, 0n], { account: f.seller.account }),
      "PriceIsZero",
    );
  });

  it("refuses to list a token that is already listed", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await rejects(
      f.market.write.list([f.collection.address, tokenId, PRICE], {
        account: f.seller.account,
      }),
      "AlreadyListed",
    );
  });

  it("lets the seller change the price", async () => {
    const f = await fixture();
    const tokenId = await listed(f);
    const raised = parseEther("3");

    await f.market.write.updatePrice([f.collection.address, tokenId, raised], {
      account: f.seller.account,
    });

    const item = await f.market.read.listingOf([f.collection.address, tokenId]);
    assert.equal(item.price, raised);
  });

  it("lets nobody else change the price", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await rejects(
      f.market.write.updatePrice([f.collection.address, tokenId, 1n], {
        account: f.stranger.account,
      }),
      "NotSeller",
    );
  });

  it("lets the seller cancel", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.market.write.cancel([f.collection.address, tokenId], { account: f.seller.account });

    const item = await f.market.read.listingOf([f.collection.address, tokenId]);
    assert.equal(item.seller, "0x0000000000000000000000000000000000000000");
    assert.equal(await f.market.read.isFillable([f.collection.address, tokenId]), false);
  });

  it("lets nobody else cancel", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await rejects(
      f.market.write.cancel([f.collection.address, tokenId], { account: f.stranger.account }),
      "NotSeller",
    );
  });

  it("treats a cancelled listing as absent rather than as priced at zero", async () => {
    const f = await fixture();
    const tokenId = await listed(f);
    await f.market.write.cancel([f.collection.address, tokenId], { account: f.seller.account });

    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.buyer.account,
        value: 0n,
      }),
      "NotListed",
    );
  });
});
