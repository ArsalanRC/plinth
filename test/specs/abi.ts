import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAddress, toFunctionSelector, parseEther } from "viem";

import {
  SELECTOR,
  encode,
  decodeUint,
  decodeBool,
  decodeAddress,
  decodeUintArray,
  decodeString,
  decodeListing,
  decodeQuote,
  decodeRoyalty,
  decodeCheck,
  formatUnits,
  parseUnits,
} from "../../site/abi.js";

import { fixture, dripFixture, mintTo, listed, mintAndApprove, PRICE, DRIP } from "../helpers.js";

/**
 * The page talks to the chain with no library at all. That is only defensible
 * if the codec is checked against a real node rather than against itself.
 *
 * A wrong encoder does not throw. It produces neat hexadecimal that the node
 * either rejects with something unhelpful or, far worse, reads as a different
 * call than the one intended. So every one of these cases sends real call data
 * to a real chain and compares the answer with what the typed contract says.
 */
describe("abi codec", () => {
  it("has a selector that matches the compiled ABI for every signature", async () => {
    const f = await fixture();
    const d = await dripFixture();
    const abi = [...f.market.abi, ...f.collection.abi, ...d.drip.abi];

    const known = new Map<string, string>();
    for (const entry of abi) {
      if (entry.type !== "function") continue;
      const signature = `${entry.name}(${entry.inputs.map((i) => i.type).join(",")})`;
      known.set(signature, toFunctionSelector(signature));
    }

    for (const [signature, selector] of Object.entries(SELECTOR)) {
      const real = known.get(signature);
      assert.ok(real !== undefined, `${signature} is not on either contract any more`);
      assert.equal(selector, real, `${signature} has the wrong selector`);
    }
  });

  it("refuses a signature it has no selector for", () => {
    assert.throws(() => encode("nonsense(uint256)", [1n]), /No selector/);
  });

  it("refuses the wrong number of arguments", () => {
    assert.throws(() => encode("buy(address,uint256)", [1n]), /takes 2 arguments/);
  });

  it("refuses something that is not an address", () => {
    assert.throws(() => encode("mint(address)", ["not-an-address"]), /Not an address/);
  });

  // ------------------------------------------------------- against a real node

  it("reads a uint through call data it built itself", async () => {
    const f = await fixture();
    await mintTo(f, f.seller.account.address);
    await mintTo(f, f.seller.account.address);

    const { data } = await f.publicClient.call({
      to: f.collection.address,
      data: encode("totalMinted()") as `0x${string}`,
    });

    assert.equal(decodeUint(data!), 2n);
    assert.equal(decodeUint(data!), await f.collection.read.totalMinted());
  });

  it("reads an address", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const { data } = await f.publicClient.call({
      to: f.collection.address,
      data: encode("ownerOf(uint256)", [tokenId]) as `0x${string}`,
    });

    assert.equal(getAddress(decodeAddress(data!)), getAddress(f.seller.account.address));
  });

  it("reads a bool, both ways round", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    const yes = await f.publicClient.call({
      to: f.market.address,
      data: encode("isFillable(address,uint256)", [f.collection.address, tokenId]) as `0x${string}`,
    });
    assert.equal(decodeBool(yes.data!), true);

    const no = await f.publicClient.call({
      to: f.market.address,
      data: encode("isFillable(address,uint256)", [f.collection.address, 999n]) as `0x${string}`,
    });
    assert.equal(decodeBool(no.data!), false);
  });

  it("reads a struct out of one slot", async () => {
    const f = await fixture();
    const tokenId = await listed(f, parseEther("3"));

    const { data } = await f.publicClient.call({
      to: f.market.address,
      data: encode("listingOf(address,uint256)", [f.collection.address, tokenId]) as `0x${string}`,
    });

    const listing = decodeListing(data!);
    assert.equal(getAddress(listing.seller), getAddress(f.seller.account.address));
    assert.equal(listing.price, parseEther("3"));
  });

  it("reads four values out of one return", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    const { data } = await f.publicClient.call({
      to: f.market.address,
      data: encode("quote(address,uint256,uint256)", [
        f.collection.address,
        tokenId,
        PRICE,
      ]) as `0x${string}`,
    });

    const quote = decodeQuote(data!);
    const [creator, royalty, fee, toSeller] = await f.market.read.quote([
      f.collection.address,
      tokenId,
      PRICE,
    ]);

    assert.equal(getAddress(quote.creator), getAddress(creator));
    assert.equal(quote.royalty, royalty);
    assert.equal(quote.fee, fee);
    assert.equal(quote.toSeller, toSeller);
    assert.equal(quote.royalty + quote.fee + quote.toSeller, PRICE);
  });

  it("reads ERC-2981 back", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const { data } = await f.publicClient.call({
      to: f.collection.address,
      data: encode("royaltyInfo(uint256,uint256)", [tokenId, PRICE]) as `0x${string}`,
    });

    const decoded = decodeRoyalty(data!);
    const [receiver, amount] = await f.collection.read.royaltyInfo([tokenId, PRICE]);

    assert.equal(getAddress(decoded.receiver), getAddress(receiver));
    assert.equal(decoded.amount, amount);
  });

  /**
   * The one most likely to be silently wrong. A dynamic return starts with an
   * offset, not with the data, and reading word zero as the length happens to
   * work for a single return value and breaks everywhere else.
   */
  it("reads a dynamic array", async () => {
    const f = await fixture();
    await mintTo(f, f.seller.account.address);
    await mintTo(f, f.buyer.account.address);
    await mintTo(f, f.seller.account.address);
    await mintTo(f, f.seller.account.address);

    const { data } = await f.publicClient.call({
      to: f.collection.address,
      data: encode("tokensOf(address)", [f.seller.account.address]) as `0x${string}`,
    });

    assert.deepEqual(decodeUintArray(data!), [1n, 3n, 4n]);
  });

  it("reads an empty dynamic array without inventing an element", async () => {
    const f = await fixture();
    await mintTo(f, f.buyer.account.address);

    const { data } = await f.publicClient.call({
      to: f.collection.address,
      data: encode("tokensOf(address)", [f.stranger.account.address]) as `0x${string}`,
    });

    assert.deepEqual(decodeUintArray(data!), []);
  });

  it("reads a long string, across several words", async () => {
    const f = await fixture();
    const tokenId = await mintTo(f, f.seller.account.address);

    const { data } = await f.publicClient.call({
      to: f.collection.address,
      data: encode("tokenURI(uint256)", [tokenId]) as `0x${string}`,
    });

    const decoded = decodeString(data!);
    assert.equal(decoded, await f.collection.read.tokenURI([tokenId]));
    assert.ok(decoded.length > 1000, "the on-chain metadata is long, which is the point here");
    assert.ok(decoded.startsWith("data:application/json;base64,"));
  });

  it("reads a short string without trailing rubbish", async () => {
    const f = await fixture();

    const { data } = await f.publicClient.call({
      to: f.collection.address,
      data: encode("symbol()") as `0x${string}`,
    });

    assert.equal(decodeString(data!), "PLNTH");
  });

  it("sends a transaction the chain accepts", async () => {
    const f = await fixture();

    const hash = await f.seller.sendTransaction({
      to: f.collection.address,
      data: encode("mint(address)", [f.seller.account.address]) as `0x${string}`,
    });
    const receipt = await f.publicClient.waitForTransactionReceipt({ hash });

    assert.equal(receipt.status, "success");
    assert.equal(await f.collection.read.totalMinted(), 1n);
    assert.equal(
      getAddress(await f.collection.read.ownerOf([1n])),
      getAddress(f.seller.account.address),
    );
  });

  it("sends a payable transaction that settles a real sale", async () => {
    const f = await fixture();
    const tokenId = await listed(f);

    const hash = await f.buyer.sendTransaction({
      to: f.market.address,
      data: encode("buy(address,uint256)", [f.collection.address, tokenId]) as `0x${string}`,
      value: PRICE,
    });
    const receipt = await f.publicClient.waitForTransactionReceipt({ hash });

    assert.equal(receipt.status, "success");
    assert.equal(
      getAddress(await f.collection.read.ownerOf([tokenId])),
      getAddress(f.buyer.account.address),
    );
  });

  it("encodes a uint96 argument the contract reads back unchanged", async () => {
    const f = await fixture();
    const tokenId = await mintAndApprove(f);
    const price = parseEther("2.5");

    const hash = await f.seller.sendTransaction({
      to: f.market.address,
      data: encode("list(address,uint256,uint96)", [
        f.collection.address,
        tokenId,
        price,
      ]) as `0x${string}`,
    });
    await f.publicClient.waitForTransactionReceipt({ hash });

    const listing = await f.market.read.listingOf([f.collection.address, tokenId]);
    assert.equal(listing.price, price);
  });

  it("encodes a bool argument", async () => {
    const f = await fixture();

    const hash = await f.seller.sendTransaction({
      to: f.collection.address,
      data: encode("setApprovalForAll(address,bool)", [
        f.market.address,
        true,
      ]) as `0x${string}`,
    });
    await f.publicClient.waitForTransactionReceipt({ hash });

    assert.equal(
      await f.collection.read.isApprovedForAll([f.seller.account.address, f.market.address]),
      true,
    );
  });

  // ------------------------------------------------------------------ faucet

  it("reads the faucet's whole state through one hand-built call", async () => {
    const d = await dripFixture();

    const { data } = await d.publicClient.call({
      to: d.drip.address,
      data: encode("check(address)", [d.visitor.account.address]) as `0x${string}`,
    });

    const decoded = decodeCheck(data!);
    const [ready, nextAt, amount, balance, claimsLeft] = await d.drip.read.check([
      d.visitor.account.address,
    ]);

    // Five static words in one return value, so a codec that miscounts them
    // reports a faucet that is empty, or ready when it is not.
    assert.deepEqual(decoded, { ready, nextAt, amount, balance, claimsLeft });
    assert.equal(decoded.amount, DRIP);
    assert.equal(decoded.ready, true);
  });

  it("reads a used faucet the same way the contract does", async () => {
    const d = await dripFixture();
    await d.drip.write.claim({ account: d.visitor.account });

    const { data } = await d.publicClient.call({
      to: d.drip.address,
      data: encode("check(address)", [d.visitor.account.address]) as `0x${string}`,
    });

    const decoded = decodeCheck(data!);

    assert.equal(decoded.ready, false);
    assert.equal(decoded.nextAt, await d.drip.read.nextClaimAt([d.visitor.account.address]));
  });

  it("claims through call data it built itself", async () => {
    const d = await dripFixture();

    const before = await d.publicClient.getBalance({ address: d.other.account.address });
    const hash = await d.other.sendTransaction({
      to: d.drip.address,
      data: encode("claim()") as `0x${string}`,
    });
    const receipt = await d.publicClient.waitForTransactionReceipt({ hash });
    const after = await d.publicClient.getBalance({ address: d.other.account.address });

    assert.equal(receipt.status, "success");
    // Net of the gas this very transaction burned, which is the only honest
    // way to assert on a balance the sender also paid out of.
    assert.equal(after - before + receipt.gasUsed * receipt.effectiveGasPrice, DRIP);
  });

  it("reads the cooldown rather than letting the page write it down", async () => {
    const d = await dripFixture();

    const { data } = await d.publicClient.call({
      to: d.drip.address,
      data: encode("COOLDOWN()") as `0x${string}`,
    });

    assert.equal(decodeUint(data!), await d.drip.read.COOLDOWN());
    assert.equal(decodeUint(data!), 86_400n);
  });

  // ------------------------------------------------------------------- units

  it("formats wei without going near a float", () => {
    assert.equal(formatUnits(parseEther("1")), "1");
    assert.equal(formatUnits(parseEther("0.925")), "0.925");
    assert.equal(formatUnits(parseEther("1234.5678")), "1234.5678");
    assert.equal(formatUnits(0n), "0");
    assert.equal(formatUnits(1n), "0");
    assert.equal(formatUnits(parseEther("0.1") + parseEther("0.2")), "0.3");
  });

  it("parses a decimal string back to exactly the same wei", () => {
    for (const text of ["1", "0.925", "0.000001", "1234.5678", "0"]) {
      assert.equal(parseUnits(text), parseEther(text as `${number}`), text);
    }
  });

  it("refuses input it cannot represent exactly", () => {
    assert.throws(() => parseUnits("1.2.3"), /Not a number/);
    assert.throws(() => parseUnits(""), /Not a number/);
    assert.throws(() => parseUnits("abc"), /Not a number/);
    assert.throws(() => parseUnits(`0.${"1".repeat(19)}`), /More than 18 decimal places/);
  });
});
