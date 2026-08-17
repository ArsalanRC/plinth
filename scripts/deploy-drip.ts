/**
 * Deploy the faucet.
 *
 *   pnpm deploy:drip
 *
 * Separate from `deploy.ts` because it is a separate job. The marketplace and
 * the collection are the application; the faucet is a convenience the owner
 * pays for, and it can be deployed, swept and abandoned without touching
 * anything a visitor's tokens depend on.
 *
 * Funds itself in the same transaction, because the constructor is payable and
 * test POL is rationed enough that paying for two transactions to do one job is
 * a real cost. `DRIP_FUNDING` sets how much, and nothing is sent by default:
 * an amount this script guessed would be an amount nobody checked.
 *
 *   DRIP_FUNDING=0.1 pnpm deploy:drip
 *
 * The key comes from Hardhat's encrypted keystore, exactly as in `deploy.ts`.
 * Nothing in this repository reads a key from a file or an argument.
 */

import hre, { network } from "hardhat";
import { encodeAbiParameters, formatEther, parseEther } from "viem";

/**
 * What one claim pays.
 *
 * 0.015 covers a mint with room for the gas price to move, and gets six
 * visitors out of a single 0.1 POL claim from a public faucet. Measured at 30
 * gwei: mint 0.0078, list 0.0033, buy 0.0048. The contract can be resized later
 * with `setDrip`, which is why the number here is a starting point and not a
 * promise.
 */
const DRIP = parseEther("0.015");

const { viem } = await network.connect();

const [wallet] = await viem.getWalletClients();
if (wallet === undefined) throw new Error("No account is configured for this network.");

const publicClient = await viem.getPublicClient();
const deployer = wallet.account.address;

const funding = process.env.DRIP_FUNDING ? parseEther(process.env.DRIP_FUNDING) : 0n;
const balance = await publicClient.getBalance({ address: deployer });
const gasPrice = await publicClient.getGasPrice();

/**
 * Ask the node what this costs. Same reasoning as `deploy.ts`, where a
 * hardcoded gas figure went stale twice and reported itself as a code-size
 * problem both times.
 */
const artifact = await hre.artifacts.readArtifact("Drip");
const args = encodeAbiParameters([{ type: "uint256" }], [DRIP]);
const data = (artifact.bytecode + args.slice(2)) as `0x${string}`;

let gas: bigint;
try {
  const estimate = await publicClient.request({
    method: "eth_estimateGas",
    params: [
      { from: deployer, data, value: `0x${funding.toString(16)}` },
      "latest",
      { [deployer]: { balance: "0x56BC75E2D63100000" } },
    ],
  } as never);
  gas = (BigInt(estimate as string) * 105n) / 100n;
} catch {
  gas = BigInt((artifact.deployedBytecode.length - 2) / 2) * 200n + 600_000n;
}

const needed = gas * gasPrice + funding;

console.log(`Deploying from ${deployer}`);
console.log(`Balance        ${formatEther(balance)} POL`);
console.log(`Gas price      ${Number(gasPrice) / 1e9} gwei`);
console.log(`Per claim      ${formatEther(DRIP)} POL`);
console.log(`Funding        ${formatEther(funding)} POL`);
console.log(`Needs about    ${formatEther(needed)} POL\n`);

if (balance < needed) {
  throw new Error(
    `Balance is ${formatEther(balance)} and this needs about ${formatEther(needed)} at ` +
      `${Number(gasPrice) / 1e9} gwei. Claim at https://faucet.polygon.technology, ` +
      `or lower DRIP_FUNDING, then run this again.`,
  );
}

const faucet = await viem.deployContract("Drip", [DRIP], { value: funding });
console.log(`Drip           ${faucet.address}`);

// Read it back rather than trusting the receipt. A constructor that reverted
// leaves an address behind too.
const amountOnChain = await faucet.read.dripAmount();
const held = await publicClient.getBalance({ address: faucet.address });

if (amountOnChain !== DRIP) {
  throw new Error(`The drip reads back as ${amountOnChain}, expected ${DRIP}`);
}

console.log(`Holds          ${formatEther(held)} POL, ${held / DRIP} claims\n`);
console.log("Put this in site/config.js:");
console.log(`  drip: "${faucet.address}",`);
