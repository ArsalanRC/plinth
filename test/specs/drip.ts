import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseEther } from "viem";

import { dripFixture, advance, rejects, DRIP } from "../helpers.js";

const DAY = 24 * 60 * 60;

/**
 * The faucet exists so a visitor with an almost-empty wallet can try the
 * marketplace without queueing at a public faucet. Every test here is about a
 * way that generosity gets abused or goes quietly wrong.
 */
describe("drip", () => {
  it("pays a fresh address exactly the drip amount", async () => {
    const f = await dripFixture();

    const before = await f.publicClient.getBalance({ address: f.visitor.account.address });
    await f.drip.write.claim({ account: f.visitor.account });
    const after = await f.publicClient.getBalance({ address: f.visitor.account.address });

    // Gas comes out of the same balance, so the visitor nets less than the
    // drip. What must hold is that the faucet sent exactly the drip.
    assert.ok(after > before, "the visitor should be better off than before");
    assert.equal(
      await f.publicClient.getBalance({ address: f.drip.address }),
      parseEther("0.5") - DRIP,
    );
  });

  it("refuses a second claim inside the cooldown", async () => {
    const f = await dripFixture();

    await f.drip.write.claim({ account: f.visitor.account });
    await rejects(f.drip.write.claim({ account: f.visitor.account }), "TooSoon");
  });

  it("pays again once the cooldown has passed", async () => {
    const f = await dripFixture();

    await f.drip.write.claim({ account: f.visitor.account });
    await advance(f, DAY);
    await f.drip.write.claim({ account: f.visitor.account });

    assert.equal(
      await f.publicClient.getBalance({ address: f.drip.address }),
      parseEther("0.5") - DRIP * 2n,
    );
  });

  it("still refuses one second before the cooldown is up", async () => {
    const f = await dripFixture();

    await f.drip.write.claim({ account: f.visitor.account });
    await advance(f, DAY - 2);

    await rejects(f.drip.write.claim({ account: f.visitor.account }), "TooSoon");
  });

  it("treats an address that has never claimed as ready right now", async () => {
    const f = await dripFixture();

    assert.equal(await f.drip.read.nextClaimAt([f.visitor.account.address]), 0n);

    const [ready] = await f.drip.read.check([f.visitor.account.address]);
    assert.equal(ready, true);
  });

  it("says when the next claim is due rather than only that it refused", async () => {
    const f = await dripFixture();

    await f.drip.write.claim({ account: f.visitor.account });

    const nextAt = await f.drip.read.nextClaimAt([f.visitor.account.address]);
    const cooldown = await f.drip.read.COOLDOWN();
    const block = await f.publicClient.getBlock();

    assert.equal(nextAt, block.timestamp + cooldown);

    // The page shows a countdown, so a refusal that does not carry the time is
    // a refusal the visitor cannot act on.
    const [ready, reported] = await f.drip.read.check([f.visitor.account.address]);
    assert.equal(ready, false);
    assert.equal(reported, nextAt);
  });

  it("lets somebody else pay the gas to fund a stranger", async () => {
    const f = await dripFixture();

    const before = await f.publicClient.getBalance({ address: f.other.account.address });
    await f.drip.write.claimFor([f.other.account.address], { account: f.visitor.account });
    const after = await f.publicClient.getBalance({ address: f.other.account.address });

    // The recipient spent nothing, so this is the exact drip and not a net of gas.
    assert.equal(after - before, DRIP);
  });

  it("keys the cooldown on the recipient, not on whoever paid", async () => {
    const f = await dripFixture();

    await f.drip.write.claimFor([f.other.account.address], { account: f.visitor.account });
    await f.drip.write.claimFor([f.stranger.account.address], { account: f.visitor.account });

    // One payer, two recipients, both served. Keyed on the caller this second
    // one would have been refused, and the faucet would be useless for its
    // main job of funding somebody who cannot transact yet.
    assert.equal(await f.drip.read.lastClaimAt([f.stranger.account.address]) > 0n, true);

    await rejects(
      f.drip.write.claimFor([f.other.account.address], { account: f.visitor.account }),
      "TooSoon",
    );
  });

  it("refuses to pay the zero address", async () => {
    const f = await dripFixture();

    await rejects(
      f.drip.write.claimFor(["0x0000000000000000000000000000000000000000"], {
        account: f.visitor.account,
      }),
      "ZeroAddress",
    );
  });

  it("says it is dry rather than sending what it does not have", async () => {
    // Funded for one claim and change, so the second finds it empty.
    const f = await dripFixture(DRIP + 1n);

    await f.drip.write.claim({ account: f.visitor.account });
    await rejects(f.drip.write.claim({ account: f.other.account }), "Dry");
  });

  it("reports itself as not ready once it cannot cover a claim", async () => {
    const f = await dripFixture(DRIP + 1n);
    await f.drip.write.claim({ account: f.visitor.account });

    const [ready, , , balance, claimsLeft] = await f.drip.read.check([f.other.account.address]);

    // The page needs this to say "the faucet is empty, here are the public
    // ones" instead of offering a button that sends a reverting transaction.
    assert.equal(ready, false);
    assert.equal(balance, 1n);
    assert.equal(claimsLeft, 0n);
  });

  it("counts how many claims are left in it", async () => {
    const f = await dripFixture(DRIP * 10n);

    const [, , amount, , claimsLeft] = await f.drip.read.check([f.visitor.account.address]);

    assert.equal(amount, DRIP);
    assert.equal(claimsLeft, 10n);
  });

  it("survives a recipient that claims again while it is being paid", async () => {
    const f = await dripFixture();
    const attacker = await f.viem.deployContract("ReentrantClaimer", [f.drip.address]);

    await attacker.write.start();

    // One drip, three refusals. The cooldown is written before the money moves,
    // so the nested calls read the timestamp the outer one just set.
    assert.equal(await attacker.read.received(), DRIP);
    assert.equal(await attacker.read.succeeded(), 0n);
    assert.equal(await attacker.read.refused(), 3n);
    assert.equal(
      await f.publicClient.getBalance({ address: f.drip.address }),
      parseEther("0.5") - DRIP,
    );
  });

  it("does not burn a cooldown when the transfer itself fails", async () => {
    const f = await dripFixture();
    const rejecter = await f.viem.deployContract("RejectsDrip", [f.drip.address]);

    await rejects(rejecter.write.start(), "SendFailed");

    // The whole claim came back, so this address has not spent its day's
    // allowance on a payment it never received.
    assert.equal(await f.drip.read.lastClaimAt([rejecter.address]), 0n);
  });

  it("refuses funding that would take it over its ceiling", async () => {
    const f = await dripFixture();
    const ceiling = await f.drip.read.MAX_BALANCE();

    await rejects(
      f.owner.sendTransaction({ to: f.drip.address, value: ceiling }),
      "TooFull",
    );
  });

  it("accepts funding right up to the ceiling", async () => {
    const f = await dripFixture(parseEther("0.5"));
    const ceiling = await f.drip.read.MAX_BALANCE();

    await f.owner.sendTransaction({ to: f.drip.address, value: ceiling - parseEther("0.5") });

    assert.equal(await f.publicClient.getBalance({ address: f.drip.address }), ceiling);
  });

  it("refuses to be deployed over the ceiling", async () => {
    // The topup script computes what it sends. This is the backstop for the day
    // that arithmetic is wrong, which in this repository is not hypothetical.
    await rejects(dripFixture(parseEther("1.5")), "TooFull");
  });

  it("lets the owner move the drip inside the cap", async () => {
    const f = await dripFixture();

    await f.drip.write.setDrip([parseEther("0.02")]);

    assert.equal(await f.drip.read.dripAmount(), parseEther("0.02"));
  });

  it("refuses a drip above the cap, so a visitor can read the ceiling from the code", async () => {
    const f = await dripFixture();

    await rejects(f.drip.write.setDrip([parseEther("0.06")]), "DripTooLarge");
    assert.equal(await f.drip.read.MAX_DRIP(), parseEther("0.05"));
  });

  it("refuses a drip of zero, which would burn a cooldown and pay nothing", async () => {
    const f = await dripFixture();

    await rejects(f.drip.write.setDrip([0n]), "DripIsZero");
  });

  it("lets nobody but the owner move the drip", async () => {
    const f = await dripFixture();

    await rejects(
      f.drip.write.setDrip([parseEther("0.02")], { account: f.stranger.account }),
      "OwnableUnauthorizedAccount",
    );
  });

  it("lets the owner take the remaining balance back out", async () => {
    const f = await dripFixture();

    const before = await f.publicClient.getBalance({ address: f.other.account.address });
    await f.drip.write.sweep([f.other.account.address]);
    const after = await f.publicClient.getBalance({ address: f.other.account.address });

    assert.equal(after - before, parseEther("0.5"));
    assert.equal(await f.publicClient.getBalance({ address: f.drip.address }), 0n);
  });

  it("lets nobody but the owner sweep it", async () => {
    const f = await dripFixture();

    await rejects(
      f.drip.write.sweep([f.stranger.account.address], { account: f.stranger.account }),
      "OwnableUnauthorizedAccount",
    );
  });

  it("refuses to sweep into nowhere", async () => {
    const f = await dripFixture();

    await rejects(
      f.drip.write.sweep(["0x0000000000000000000000000000000000000000"]),
      "ZeroAddress",
    );
  });

  it("refuses to sweep a faucet that is already empty", async () => {
    const f = await dripFixture();
    await f.drip.write.sweep([f.owner.account.address]);

    await rejects(f.drip.write.sweep([f.owner.account.address]), "NothingToSweep");
  });
});
