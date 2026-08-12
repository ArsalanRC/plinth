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
import { formatEther, parseEther } from "viem";

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

if (balance < parseEther("0.05")) {
  throw new Error(
    "Balance is under 0.05. Top up from a faucet before deploying, " +
      "because a deployment that runs out of gas half way still costs the gas.",
  );
}

const market = await viem.deployContract("Plinth", [FEE_BPS, deployer]);
console.log(`Plinth            ${market.address}`);

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
