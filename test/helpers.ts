import { network } from "hardhat";
import { parseEther } from "viem";

/** 2.5% to the marketplace. */
export const FEE_BPS = 250;

/** The asking price every test uses. */
export const PRICE = parseEther("1");

export const MAX_SUPPLY = 100n;

/**
 * A fresh chain per test.
 *
 * `network.create` rather than a snapshot helper, because these tests care
 * about balances and a leaked wei from a previous case is exactly the kind of
 * thing that makes a settlement test pass for the wrong reason.
 */
export async function fixture() {
  const { viem } = await network.create();
  const [deployer, seller, buyer, creator, feeTaker, stranger] = await viem.getWalletClients();

  const market = await viem.deployContract("Plinth", [FEE_BPS, feeTaker!.account.address]);

  const collection = await viem.deployContract("PlinthCollection", [
    "Plinth Demo",
    "PLNTH",
    MAX_SUPPLY,
    creator!.account.address,
  ]);

  const publicClient = await viem.getPublicClient();

  return {
    viem,
    publicClient,
    market,
    collection,
    deployer: deployer!,
    seller: seller!,
    buyer: buyer!,
    creator: creator!,
    feeTaker: feeTaker!,
    stranger: stranger!,
  };
}

export type Fixture = Awaited<ReturnType<typeof fixture>>;

/**
 * Mint a token to the seller and approve the marketplace for it.
 *
 * Returns the token id rather than assuming it, so a test that changes the
 * mint order does not silently start asserting about somebody else's token.
 */
export async function mintTo(f: Fixture, owner: `0x${string}`): Promise<bigint> {
  await f.collection.write.mint([owner]);
  return f.collection.read.totalMinted();
}

export async function mintAndApprove(f: Fixture): Promise<bigint> {
  const tokenId = await mintTo(f, f.seller.account.address);
  await f.collection.write.approve([f.market.address, tokenId], {
    account: f.seller.account,
  });
  return tokenId;
}

export async function listed(f: Fixture, price: bigint = PRICE): Promise<bigint> {
  const tokenId = await mintAndApprove(f);
  await f.market.write.list([f.collection.address, tokenId, price], {
    account: f.seller.account,
  });
  return tokenId;
}

/**
 * How a sale of `tokenId` at `price` should divide.
 *
 * Both rates are read back from the contracts rather than written down here.
 * The royalty is per token, and the fee is whatever the marketplace is
 * currently charging, which a test is free to change. A hardcoded figure would
 * stop testing the sale and start testing the constant, and it did: this
 * helper used `FEE_BPS` and disagreed with the one test that moves the fee.
 */
export async function splitOf(
  f: Fixture,
  tokenId: bigint,
  price: bigint = PRICE,
  collection: {
    read: { royaltyInfo: (args: [bigint, bigint]) => Promise<readonly [string, bigint]> };
  } = f.collection,
): Promise<{ creator: string; royalty: bigint; fee: bigint; toSeller: bigint }> {
  const [receiver, royalty] = await collection.read.royaltyInfo([tokenId, price]);
  const fee = bps(price, BigInt(await f.market.read.feeBps()));

  return { creator: receiver, royalty, fee, toSeller: price - royalty - fee };
}

/**
 * Assert that a call reverts, and that it reverts for the stated reason.
 *
 * Matching on the name matters more than it looks. A test that only asserts
 * "this reverted" passes just as happily when the revert comes from a typo in
 * the test itself, which is how a security test quietly stops testing anything.
 */
export async function rejects(promise: Promise<unknown>, expected: string): Promise<void> {
  try {
    await promise;
  } catch (error) {
    const text = String(error);
    if (!text.includes(expected)) {
      throw new Error(`Expected a revert matching ${expected}, got:\n${text}`);
    }
    return;
  }
  throw new Error(`Expected a revert matching ${expected}, but the call succeeded`);
}

export function bps(amount: bigint, points: bigint): bigint {
  return (amount * points) / 10_000n;
}

/** Decode a base64 data URI into the string it carries. */
export function fromDataUri(uri: string): string {
  const marker = ";base64,";
  const at = uri.indexOf(marker);
  if (at === -1) throw new Error(`Not a base64 data URI: ${uri.slice(0, 60)}`);
  return Buffer.from(uri.slice(at + marker.length), "base64").toString("utf8");
}
