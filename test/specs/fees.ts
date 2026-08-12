import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddress } from "viem";

import { fixture, listed, rejects, bps, PRICE, FEE_BPS, ROYALTY_BPS } from "../helpers.js";

describe("fees", () => {
  it("starts with the fee it was constructed with", async () => {
    const f = await fixture();

    assert.equal(await f.market.read.feeBps(), FEE_BPS);
    assert.equal(
      getAddress(await f.market.read.feeRecipient()),
      getAddress(f.feeTaker.account.address),
    );
  });

  it("lets the owner move the fee inside the cap", async () => {
    const f = await fixture();

    await f.market.write.setFee([1000, f.deployer.account.address]);

    assert.equal(await f.market.read.feeBps(), 1000);
    assert.equal(
      getAddress(await f.market.read.feeRecipient()),
      getAddress(f.deployer.account.address),
    );
  });

  it("refuses a fee above the cap, so buyers can read the ceiling from the code", async () => {
    const f = await fixture();

    await rejects(f.market.write.setFee([1001, f.feeTaker.account.address]), "FeeTooHigh");
    assert.equal(await f.market.read.MAX_FEE_BPS(), 1000);
  });

  it("refuses a fee going to nowhere", async () => {
    const f = await fixture();

    await rejects(
      f.market.write.setFee([100, "0x0000000000000000000000000000000000000000"]),
      "ZeroAddress",
    );
  });

  it("lets nobody but the owner touch the fee", async () => {
    const f = await fixture();

    await rejects(
      f.market.write.setFee([100, f.stranger.account.address], { account: f.stranger.account }),
      "OwnableUnauthorizedAccount",
    );
  });

  it("applies a changed fee to the next sale", async () => {
    const f = await fixture();
    await f.market.write.setFee([1000, f.feeTaker.account.address]);
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    assert.equal(
      await f.market.read.proceedsOf([f.feeTaker.account.address]),
      bps(PRICE, 1000n),
    );
  });

  it("cannot be raised past the cap even one step at a time", async () => {
    const f = await fixture();

    await f.market.write.setFee([1000, f.feeTaker.account.address]);
    await rejects(f.market.write.setFee([1500, f.feeTaker.account.address]), "FeeTooHigh");

    assert.equal(await f.market.read.feeBps(), 1000);
  });

  it("leaves the seller the remainder at the worst legal fee and royalty", async () => {
    const f = await fixture();
    await f.market.write.setFee([1000, f.feeTaker.account.address]);
    const tokenId = await listed(f);

    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    const toSeller = await f.market.read.proceedsOf([f.seller.account.address]);

    assert.equal(toSeller, PRICE - bps(PRICE, 1000n) - bps(PRICE, ROYALTY_BPS));
    assert.equal(toSeller, (PRICE * 85n) / 100n, "the seller keeps at least 85%");
  });
});
