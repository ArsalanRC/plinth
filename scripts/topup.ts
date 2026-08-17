/**
 * Refill the faucet.
 *
 *   pnpm topup
 *
 * This exists because the alternative is a daily chore. Amoy POL cannot be
 * created, so the faucet only ever holds what its owner claimed from a public
 * one first. A routine that means finding a faucet, copying an address, working
 * out an amount and confirming a transfer gets abandoned inside a week, and
 * then the page offers a button that always fails.
 *
 * Nothing here is typed in. The drip amount, the faucet's ceiling, its current
 * balance and the gas price are all read at the moment they are used, and the
 * amount to send is derived from them. Three separate hand-typed numbers in
 * `deploy.ts` went stale and cost a failed deployment each, which is the whole
 * argument for computing instead of remembering.
 *
 * Override the amount when you want to:
 *
 *   TOPUP_POL=0.05 pnpm topup
 */

import { network } from "hardhat";
import { formatEther, parseEther } from "viem";

import { CONTRACTS } from "../site/config.js";

/**
 * How full to keep the faucet, counted in claims rather than in POL.
 *
 * Twenty visitors is a few days of a portfolio page, and a target in claims
 * survives a change to the drip amount. A target in POL would quietly become a
 * different number of visitors the moment the drip was resized for gas.
 */
const TARGET_CLAIMS = 20n;

/**
 * What to leave behind, counted in plain transfers at today's gas price.
 *
 * The point is that this script must never be the reason a wallet cannot pay
 * for its next transaction. Ten is arbitrary and small; the ceiling on the
 * faucet is the guard that matters, this is only good manners.
 */
const RESERVE_TRANSFERS = 10n;
const GAS_PER_TRANSFER = 21_000n;

const drip = CONTRACTS.drip as `0x${string}` | null;
if (drip === null) {
  throw new Error(
    "No faucet address in site/config.js. Deploy it first with `pnpm deploy:drip`, " +
      "then put the address in CONTRACTS.drip.",
  );
}

const { viem } = await network.connect();

const [wallet] = await viem.getWalletClients();
if (wallet === undefined) throw new Error("No account is configured for this network.");

const publicClient = await viem.getPublicClient();
const owner = wallet.account.address;

const code = await publicClient.getCode({ address: drip });
if (!code || code === "0x") throw new Error(`No contract at ${drip}. Check CONTRACTS.drip.`);

const faucet = await viem.getContractAt("Drip", drip);

const [dripAmount, ceiling, balance, walletBalance, gasPrice] = await Promise.all([
  faucet.read.dripAmount(),
  faucet.read.MAX_BALANCE(),
  publicClient.getBalance({ address: drip }),
  publicClient.getBalance({ address: owner }),
  publicClient.getGasPrice(),
]);

console.log(`Faucet         ${drip}`);
console.log(`  holds        ${formatEther(balance)} POL, ${balance / dripAmount} claims`);
console.log(`  ceiling      ${formatEther(ceiling)} POL`);
console.log(`  per claim    ${formatEther(dripAmount)} POL`);
console.log(`Wallet         ${owner}`);
console.log(`  holds        ${formatEther(walletBalance)} POL`);
console.log(`  gas price    ${Number(gasPrice) / 1e9} gwei\n`);

/**
 * Three separate ceilings, and the smallest one wins.
 *
 * Sending more than any of them either reverts, which wastes gas, or leaves the
 * wallet unable to pay for its own next transaction.
 */
const reserve = RESERVE_TRANSFERS * GAS_PER_TRANSFER * gasPrice;
const wanted = TARGET_CLAIMS * dripAmount;
const shortfall = wanted > balance ? wanted - balance : 0n;
const headroom = ceiling > balance ? ceiling - balance : 0n;
const affordable = walletBalance > reserve ? walletBalance - reserve : 0n;

const override = process.env.TOPUP_POL;
const amount = override ? parseEther(override) : min(shortfall, min(headroom, affordable));

if (override) {
  console.log(`Sending        ${formatEther(amount)} POL, asked for on the command line`);
  if (amount > headroom) {
    throw new Error(
      `That is more than the faucet will accept. It holds ${formatEther(balance)} and its ` +
        `ceiling is ${formatEther(ceiling)}, so ${formatEther(headroom)} is the most it can take.`,
    );
  }
  if (amount > affordable) {
    throw new Error(
      `That would leave nothing for gas. The wallet holds ${formatEther(walletBalance)} and ` +
        `this keeps ${formatEther(reserve)} back, so ${formatEther(affordable)} is the most to send.`,
    );
  }
} else {
  console.log(`Target         ${TARGET_CLAIMS} claims, ${formatEther(wanted)} POL`);
  console.log(`  short by     ${formatEther(shortfall)} POL`);
  console.log(`  room for     ${formatEther(headroom)} POL`);
  console.log(`  can spare    ${formatEther(affordable)} POL`);
  console.log(`Sending        ${formatEther(amount)} POL\n`);
}

if (amount === 0n) {
  if (shortfall === 0n) {
    console.log(`Nothing to do. The faucet already holds ${balance / dripAmount} claims.`);
  } else if (affordable === 0n) {
    console.log(
      `The wallet has ${formatEther(walletBalance)} POL and needs to keep ${formatEther(reserve)} ` +
        `back for gas. Claim from https://faucet.polygon.technology and run this again.`,
    );
  } else {
    console.log("The faucet is at its ceiling. Nothing to do.");
  }
  process.exit(0);
}

const hash = await wallet.sendTransaction({ to: drip, value: amount });
console.log(`Sent           ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") throw new Error(`The transfer failed: ${hash}`);

// Read the faucet back rather than trusting the receipt, the same way the
// deploy script reads its contracts back. A mined transaction is not the same
// thing as the balance being where you expect it.
const after = await publicClient.getBalance({ address: drip });
console.log(`\nFaucet holds   ${formatEther(after)} POL, ${after / dripAmount} claims`);

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}
