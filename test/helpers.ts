import { network } from "hardhat";
import { parseEther } from "viem";

/** 2.5% to the marketplace. */
export const FEE_BPS = 250;

/** 5% to the creator, declared by the collection through ERC-2981. */
export const ROYALTY_BPS = 500n;

/** The asking price every test uses, chosen so all three shares divide exactly. */
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

  const market = await viem.deployContract("Consign", [FEE_BPS, feeTaker!.account.address]);

  const collection = await viem.deployContract("ConsignCollection", [
    "Consign Demo",
    "CNSGN",
    "ipfs://demo/",
    MAX_SUPPLY,
    creator!.account.address,
    ROYALTY_BPS,
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
