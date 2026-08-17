/**
 * Deploy the marketplace and a demo collection to whichever network is selected.
 *
 *   pnpm hardhat keystore set AMOY_RPC_URL
 *   pnpm hardhat keystore set AMOY_PRIVATE_KEY
 *   pnpm deploy:amoy
 *
 * The key is read from Hardhat's encrypted keystore. Nothing in this repository
 * reads a key from a file, an argument or an environment variable it sets
 * itself, and nothing here should ever be run with a key that also holds
 * anything of value. Amoy is a testnet: its POL is free from a faucet.
 *
 * The addresses are printed at the end. Put them in `site/config.js` so the
 * page points at this deployment.
 */

import hre, { network } from "hardhat";
import { encodeAbiParameters, formatEther } from "viem";

/** 2.5%, well inside the contract's own 10% ceiling. */
const FEE_BPS = 250;

const COLLECTION = {
  name: "Plinth Demo",
  symbol: "PLNTH",
  maxSupply: 500n,
};

const { viem } = await network.connect();

const [wallet] = await viem.getWalletClients();
if (wallet === undefined) {
  throw new Error("No account is configured for this network.");
}

const publicClient = await viem.getPublicClient();
const deployer = wallet.account.address;
const balance = await publicClient.getBalance({ address: deployer });

console.log(`Deploying from ${deployer}`);
console.log(`Balance        ${formatEther(balance)}\n`);

/**
 * Can this account afford the whole job, at today's gas price?
 *
 * The first version asked for a flat 0.05 and then began a two-contract
 * deployment. That is worse than no check: it let a run start that could not
 * finish. The marketplace landed on chain, the collection died halfway, and the
 * node reported it as "contract creation code storage out of gas", which reads
 * like a code-size problem and is not one. Estimate what is about to be spent.
 */
const gasPrice = await publicClient.getGasPrice();

/**
 * What this deployment will actually cost.
 *
 * Third version of this check, and the first two were both wrong in the same
 * way: a number typed in by hand that went stale. First a flat 0.05 POL
 * threshold, then a hardcoded gas figure that was right for a 9KB contract and
 * badly wrong once the art took it to 19KB. Both let a run begin that could not
 * finish, and both times the node reported it as "contract creation code
 * storage out of gas", which reads like a size problem and is not one.
 *
 * So nothing is typed in now. The node is asked, and the arithmetic is only a
 * fallback for a node that will not answer. Plus 5%, because the gas price can
 * move between this check and the transaction landing.
 */
async function gasFor(name: string): Promise<bigint> {
  const artifact = await hre.artifacts.readArtifact(name);

  /**
   * Ask the node first, and only fall back to arithmetic.
   *
   * `eth_estimateGas` normally refuses here, because it simulates against the
   * sender's real balance and this is precisely the case where that balance is
   * in question. The state override lends the sender a large balance for the
   * simulation only, which gets a true number out of a node that would
   * otherwise answer "out of gas" and tell us nothing.
   *
   * Measured against the real thing the formula came out 1.6% high, so it is a
   * good fallback for a node that does not support overrides. It is a fallback
   * all the same: the node knows and this does not.
   */
  try {
    const data = (artifact.bytecode +
      encodeDeployArgs(name).slice(2)) as `0x${string}`;

    const estimate = await publicClient.request({
      method: "eth_estimateGas",
      params: [
        { from: deployer, data },
        "latest",
        { [deployer]: { balance: "0x56BC75E2D63100000" } },
      ],
    } as never);

    return (BigInt(estimate as string) * 105n) / 100n;
  } catch {
    const bytes = BigInt((artifact.deployedBytecode.length - 2) / 2);
    return bytes * 200n + 600_000n;
  }
}

/** Constructor arguments, encoded, so the estimate is of the real deployment. */
function encodeDeployArgs(name: string): `0x${string}` {
  if (name === "Plinth") {
    return encodeAbiParameters(
      [{ type: "uint16" }, { type: "address" }],
      [FEE_BPS, deployer],
    );
  }

  return encodeAbiParameters(
    [{ type: "string" }, { type: "string" }, { type: "uint256" }, { type: "address" }],
    [COLLECTION.name, COLLECTION.symbol, COLLECTION.maxSupply, deployer],
  );
}

const reuse = process.env.PLINTH_ADDRESS as `0x${string}` | undefined;
const gasCollection = await gasFor("PlinthCollection");
const gasMarket = reuse ? 0n : await gasFor("Plinth");
const needed = (gasMarket + gasCollection) * gasPrice;

console.log(`Gas price      ${Number(gasPrice) / 1e9} gwei`);
console.log(`Needs about    ${formatEther(needed)}\n`);

if (balance < needed) {
  throw new Error(
    `Balance is ${formatEther(balance)} and this needs about ${formatEther(needed)} at ` +
      `${Number(gasPrice) / 1e9} gwei. Top up at https://faucet.polygon.technology, ` +
      `then run this again.`,
  );
}

/**
 * Reuse a marketplace that is already on chain.
 *
 * Test POL is rationed by a faucet, so paying twice for the same bytecode
 * because the second half of a run failed is a real cost. Set `PLINTH_ADDRESS`
 * and only what is missing gets deployed.
 */
let market;
if (reuse) {
  const code = await publicClient.getCode({ address: reuse });
  if (!code || code === "0x") throw new Error(`No contract at ${reuse}. Check PLINTH_ADDRESS.`);

  market = await viem.getContractAt("Plinth", reuse);
  console.log(`Plinth            ${reuse}  (already on chain, reused)`);
} else {
  market = await viem.deployContract("Plinth", [FEE_BPS, deployer]);
  console.log(`Plinth            ${market.address}`);
}

const collection = await viem.deployContract("PlinthCollection", [
  COLLECTION.name,
  COLLECTION.symbol,
  COLLECTION.maxSupply,
  deployer,
]);
console.log(`PlinthCollection  ${collection.address}\n`);

// Read the deployed contracts back rather than trusting the receipts. A
// deployment that reverted in the constructor leaves an address behind too.
const feeOnChain = await market.read.feeBps();
const supplyOnChain = await collection.read.maxSupply();

if (feeOnChain !== FEE_BPS) {
  throw new Error(`Fee reads back as ${feeOnChain}, expected ${FEE_BPS}`);
}
if (supplyOnChain !== COLLECTION.maxSupply) {
  throw new Error(`Supply reads back as ${supplyOnChain}, expected ${COLLECTION.maxSupply}`);
}

console.log("Both contracts answered correctly on chain.");
console.log("\nPut these in site/config.js:");
console.log(`  market:     "${market.address}",`);
console.log(`  collection: "${collection.address}",`);
