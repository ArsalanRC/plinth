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

import { network } from "hardhat";
import { formatEther } from "viem";

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
const GAS_MARKET = 1_200_000n;
const GAS_COLLECTION = 2_200_000n;

const reuse = process.env.PLINTH_ADDRESS as `0x${string}` | undefined;
const needed = (reuse ? GAS_COLLECTION : GAS_MARKET + GAS_COLLECTION) * gasPrice;

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
