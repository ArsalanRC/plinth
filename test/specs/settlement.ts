import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseEther } from "viem";

import { fixture, listed, mintTo, rejects, bps, PRICE, FEE_BPS, ROYALTY_BPS } from "../helpers.js";

/**
 * These are the tests the contract exists for. Each one deletes a defence in
 * the reader's head and shows what would happen without it.
 */
describe("settlement", () => {
  it("pays nobody during the sale itself", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    const before = await f.publicClient.getBalance({ address: f.seller.account.address });
    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });
    const after = await f.publicClient.getBalance({ address: f.seller.account.address });

    assert.equal(after, before, "the seller's balance must not move until they withdraw");
    assert.equal(
      await f.market.read.proceedsOf([f.seller.account.address]),
      PRICE - bps(PRICE, ROYALTY_BPS) - bps(PRICE, BigInt(FEE_BPS)),
    );
  });

  it("pays out on withdrawal and zeroes the balance", async () => {
    const f = await fixture();
    const tokenId = await listed(f);
    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    const owed = await f.market.read.proceedsOf([f.creator.account.address]);
    const before = await f.publicClient.getBalance({ address: f.creator.account.address });

    const hash = await f.market.write.withdraw({ account: f.creator.account });
    const receipt = await f.publicClient.waitForTransactionReceipt({ hash });
    const gas = receipt.gasUsed * receipt.effectiveGasPrice;

    const after = await f.publicClient.getBalance({ address: f.creator.account.address });

    assert.equal(after, before + owed - gas);
    assert.equal(await f.market.read.proceedsOf([f.creator.account.address]), 0n);
  });

  it("refuses a withdrawal by somebody owed nothing", async () => {
    const f = await fixture();

    await rejects(
      f.market.write.withdraw({ account: f.stranger.account }),
      "NothingToWithdraw",
    );
  });

  it("sells for a seller that cannot receive ether", async () => {
    const f = await fixture();
    const rejector = await f.viem.deployContract("RejectsEther", [f.market.address]);

    const tokenId = await mintTo(f, rejector.address);
    await rejector.write.listOn([f.collection.address, tokenId, PRICE]);

    // The sale itself must not care that this seller is unpayable.
    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    assert.equal(
      (await f.collection.read.ownerOf([tokenId])).toLowerCase(),
      f.buyer.account.address.toLowerCase(),
      "the buyer got what they paid for",
    );
    assert.ok((await f.market.read.proceedsOf([rejector.address])) > 0n);
  });

  it("contains the damage of an unpayable seller to that seller", async () => {
    const f = await fixture();
    const rejector = await f.viem.deployContract("RejectsEther", [f.market.address]);

    const tokenId = await mintTo(f, rejector.address);
    await rejector.write.listOn([f.collection.address, tokenId, PRICE]);
    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    // Their own withdrawal fails, because their own `receive` reverts.
    await rejects(rejector.write.callWithdraw(), "WithdrawFailed");

    // Everybody else is untouched, and the failed attempt did not burn the credit.
    assert.ok((await f.market.read.proceedsOf([rejector.address])) > 0n);
    await f.market.write.withdraw({ account: f.creator.account });
    assert.equal(await f.market.read.proceedsOf([f.creator.account.address]), 0n);
  });

  it("survives a seller that re-enters withdraw while being paid", async () => {
    const f = await fixture();
    const attacker = await f.viem.deployContract("ReentrantWithdrawer", [f.market.address]);

    // Other people's money, sold and not yet withdrawn. Without it the nested
    // withdrawal fails because the contract is empty rather than because it is
    // defended, and this test passes against a contract with no defence at all.
    for (let i = 0; i < 3; i++) {
      const id = await listed(f);
      await f.market.write.buy([f.collection.address, id], {
        account: f.buyer.account,
        value: PRICE,
      });
    }

    const tokenId = await mintTo(f, attacker.address);
    await attacker.write.listOn([f.collection.address, tokenId, PRICE]);
    await f.market.write.buy([f.collection.address, tokenId], {
      account: f.buyer.account,
      value: PRICE,
    });

    const owed = await f.market.read.proceedsOf([attacker.address]);
    const held = await f.publicClient.getBalance({ address: f.market.address });

    assert.ok(held > owed * 4n, "the contract holds more than one drain's worth");

    await attacker.write.callWithdraw();

    // Attempted at least once. It cannot reach `MAX_REENTRIES` against a
    // working contract, because `receive` only fires again if a nested
    // withdrawal actually paid out, which is the thing being prevented.
    assert.ok(
      (await attacker.read.reentryAttempts()) >= 1n,
      "the attack was actually attempted",
    );
    assert.equal(await attacker.read.reentrySuccesses(), 0n, "and every attempt was refused");

    assert.equal(
      await f.publicClient.getBalance({ address: attacker.address }),
      owed,
      "the attacker took what it was owed and not one wei more",
    );
    assert.equal(
      await f.publicClient.getBalance({ address: f.market.address }),
      held - owed,
      "everybody else's money is still there",
    );
    assert.equal(await f.market.read.proceedsOf([attacker.address]), 0n);
  });

  it("survives a buyer that re-enters buy from inside the token transfer", async () => {
    const f = await fixture();
    const attacker = await f.viem.deployContract("ReentrantBuyer", [f.market.address]);
    const tokenId = await listed(f);

    // Funded for two purchases, so the second one fails on the listing rather
    // than on an empty wallet.
    await f.buyer.sendTransaction({ to: attacker.address, value: parseEther("2") });

    await attacker.write.attack([f.collection.address, tokenId, PRICE]);

    assert.equal(await attacker.read.reentryAttempts(), 1n, "the attack was actually attempted");
    assert.equal(await attacker.read.reentryReverted(), true, "and it found nothing to buy");

    assert.equal(
      (await f.collection.read.ownerOf([tokenId])).toLowerCase(),
      attacker.address.toLowerCase(),
    );
    assert.equal(
      await f.publicClient.getBalance({ address: f.market.address }),
      PRICE,
      "the marketplace was paid once, for one token",
    );
  });

  it("shows no listing to anyone reading it during the transfer", async () => {
    const f = await fixture();
    const observer = await f.viem.deployContract("SaleObserver", [f.market.address]);
    const tokenId = await listed(f);

    await observer.write.buyVia([f.collection.address, tokenId], { value: PRICE });

    assert.equal(await observer.read.observed(), true, "the observer actually looked");
    assert.equal(
      await observer.read.observedSeller(),
      "0x0000000000000000000000000000000000000000",
      "a reader mid-sale must not see the token still offered by its old owner",
    );
    assert.equal(await observer.read.observedPrice(), 0n);
    assert.equal(await observer.read.observedFillable(), false);
  });

  it("keeps separate balances separate", async () => {
    const f = await fixture();
    const first = await listed(f);
    const second = await listed(f, parseEther("2"));

    await f.market.write.buy([f.collection.address, first], {
      account: f.buyer.account,
      value: PRICE,
    });
    await f.market.write.buy([f.collection.address, second], {
      account: f.stranger.account,
      value: parseEther("2"),
    });

    const total = PRICE + parseEther("2");
    const owed =
      (await f.market.read.proceedsOf([f.seller.account.address])) +
      (await f.market.read.proceedsOf([f.creator.account.address])) +
      (await f.market.read.proceedsOf([f.feeTaker.account.address]));

    assert.equal(owed, total, "the ledger adds up to the money actually held");
    assert.equal(await f.publicClient.getBalance({ address: f.market.address }), total);
  });
});
