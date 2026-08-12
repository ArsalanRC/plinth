import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddress, parseEther } from "viem";

import { fixture, listed, rejects, bps, splitOf, PRICE, FEE_BPS } from "../helpers.js";

describe("buying", () => {
  it("moves the token to the buyer", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    assert.equal(
      getAddress(await f.collection.read.ownerOf([tokenId])),
      getAddress(f.buyer.account.address),
    );
  });

  it("clears the listing so the same token cannot sell twice", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.stranger.account,
        value: PRICE,
      }),
      "NotListed",
    );
  });

  it("divides the price three ways and leaves nothing behind", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    const { royalty, fee, toSeller } = await splitOf(f, tokenId);

    assert.equal(await f.market.read.proceedsOf([f.creator.account.address]), royalty);
    assert.equal(await f.market.read.proceedsOf([f.feeTaker.account.address]), fee);
    assert.equal(await f.market.read.proceedsOf([f.seller.account.address]), toSeller);

    assert.equal(
      royalty + fee + toSeller,
      PRICE,
      "every wei of the sale is owed to somebody",
    );
  });

  it("holds exactly the sale price until it is withdrawn", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    assert.equal(await f.publicClient.getBalance({ address: f.market.address }), PRICE);
  });

  it("quotes the same split it will actually apply", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    const [creator, royalty, fee, toSeller] = await f.market.read.quote([
      f.collection.address,
      tokenId,
      PRICE,
    ]);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    assert.equal(getAddress(creator), getAddress(f.creator.account.address));
    assert.equal(await f.market.read.proceedsOf([f.creator.account.address]), royalty);
    assert.equal(await f.market.read.proceedsOf([f.feeTaker.account.address]), fee);
    assert.equal(await f.market.read.proceedsOf([f.seller.account.address]), toSeller);
  });

  it("refuses payment below the asking price", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.buyer.account,
        value: PRICE - 1n,
      }),
      "WrongPayment",
    );
  });

  it("refuses payment above the asking price rather than keeping the difference", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.buyer.account,
        value: PRICE + 1n,
      }),
      "WrongPayment",
    );
  });

  it("reverts rather than overpaying when the seller raises the price first", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    // The buyer agreed to one ether. The seller moves first.
    await f.market.write.updatePrice([f.collection.address, tokenId, parseEther("50")], {
      account: f.seller.account,
    });

    await rejects(
      f.market.write.buy([f.collection.address, tokenId], {
        account: f.buyer.account,
        value: PRICE,
      }),
      "WrongPayment",
    );

    assert.equal(
      getAddress(await f.collection.read.ownerOf([tokenId])),
      getAddress(f.seller.account.address),
    );
  });

  it("announces the sale with the split it applied", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    const events = await f.market.getEvents.Sold();
    assert.equal(events.length, 1);

    const sold = events[0]!.args;
    assert.equal(getAddress(sold.buyer!), getAddress(f.buyer.account.address));
    assert.equal(getAddress(sold.seller!), getAddress(f.seller.account.address));
    assert.equal(sold.price, PRICE);
    const { royalty, fee } = await splitOf(f, tokenId);
    assert.equal(sold.royalty, royalty);
    assert.equal(sold.fee, fee);
  });

  it("sells at zero fee when the marketplace charges nothing", async () => {
    const f = await fixture();
    await f.market.write.setFee([0, f.feeTaker.account.address]);
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    const { royalty } = await splitOf(f, tokenId);
    assert.equal(await f.market.read.proceedsOf([f.feeTaker.account.address]), 0n);
    assert.equal(await f.market.read.proceedsOf([f.seller.account.address]), PRICE - royalty);
  });
});
