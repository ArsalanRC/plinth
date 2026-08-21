/**
 * Deploy the dog collection, and a marketplace beside it if one is not there.
 *
 *   pnpm hardhat keystore set POLYGON_RPC_URL
 *   pnpm hardhat keystore set POLYGON_PRIVATE_KEY
 *   pnpm deploy:dogs
 *
 * **This one spends real money.** The dogs go to Polygon mainnet while the cats
 * stay on Amoy, so unlike `deploy.ts` there is no faucet behind a mistake here.
 * Three things follow from that and they are the only real differences:
 *
 *   1. It reads `POLYGON_PRIVATE_KEY`, never the Amoy one, so a slip of the
 *      `--network` flag cannot spend mainnet POL on a rehearsal.
 *   2. It refuses to run on a chain it does not expect, rather than trusting
 *      the flag.
 *   3. It states the cost in POL before spending any, and stops if the gas
 *      price is absurd, because the same deployment has cost anywhere between
 *      0.18 and 3.63 POL depending only on when it was run.
 *
 * The addresses are printed at the end. Put them in `site/config.js`.
 */

import hre, { network } from "hardhat";
import { encodeAbiParameters, formatEther } from "viem";

/** 2.5%, well inside the contract's own 10% ceiling. */
const FEE_BPS = 250;

const COLLECTION = {
  name: "Plinth Dogs",
  symbol: "PDOG",
  maxSupply: 5000n,
};

/** Polygon mainnet. Anything else and this script has no business running. */
const EXPECTED_CHAIN = 137n;

/**
 * Refuse above this, in gwei.
 *
 * Not a safety rail against bankruptcy: the whole job is about a euro even at
 * 600. It is a rail against paying twenty times more than necessary for no
 * reason, since Polygon sat at 25 gwei one day and 277 the next, and the
 * contract does not care which one it lands in.
 */
const MAX_GWEI = 800n;

const { viem } = await network.connect();

const [wallet] = await viem.getWalletClients();
if (wallet === undefined) {
  throw new Error("No account is configured for this network.");
}

const publicClient = await viem.getPublicClient();
const deployer = wallet.account.address;

// Ask the chain what it is rather than trusting the flag that selected it.
const chainId = BigInt(await publicClient.getChainId());
if (chainId !== EXPECTED_CHAIN) {
  throw new Error(
    `This is chain ${chainId} and the dogs go to Polygon mainnet, ${EXPECTED_CHAIN}. ` +
      `Run it with --network polygon.`,
  );
}

const balance = await publicClient.getBalance({ address: deployer });

console.log(`Deploying from ${deployer}`);
console.log(`Chain          ${chainId} (Polygon mainnet)`);
console.log(`Balance        ${formatEther(balance)} POL\n`);

const gasPrice = await publicClient.getGasPrice();
const gwei = gasPrice / 1_000_000_000n;

if (gwei > MAX_GWEI) {
  throw new Error(
    `Gas is ${gwei} gwei, over the ${MAX_GWEI} this script will spend at. Nothing is wrong; ` +
      `Polygon is just busy. Wait and run it again.`,
  );
}

/**
 * What this deployment will actually cost.
 *
 * Nothing is typed in. The node is asked with a state override, because
 * `eth_estimateGas` otherwise simulates against the sender's real balance and
 * that is precisely the thing in question. The arithmetic is only a fallback
 * for a node that will not answer. Plus 5%, because the gas price moves between
 * this check and the transaction landing.
 */
async function gasFor(name: string): Promise<bigint> {
  const artifact = await hre.artifacts.readArtifact(name);

  try {
    const data = (artifact.bytecode + encodeDeployArgs(name).slice(2)) as `0x${string}`;

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
    return encodeAbiParameters([{ type: "uint16" }, { type: "address" }], [FEE_BPS, deployer]);
  }

  return encodeAbiParameters(
    [{ type: "string" }, { type: "string" }, { type: "uint256" }, { type: "address" }],
    [COLLECTION.name, COLLECTION.symbol, COLLECTION.maxSupply, deployer],
  );
}

const reuse = process.env.PLINTH_ADDRESS as `0x${string}` | undefined;
const gasCollection = await gasFor("PlinthDogs");
const gasMarket = reuse ? 0n : await gasFor("Plinth");
const needed = (gasMarket + gasCollection) * gasPrice;

console.log(`Gas price      ${Number(gasPrice) / 1e9} gwei`);
console.log(`Needs about    ${formatEther(needed)} POL`);
console.log(`Leaves         ${formatEther(balance > needed ? balance - needed : 0n)} POL for minting\n`);

if (balance < needed) {
  throw new Error(
    `Balance is ${formatEther(balance)} POL and this needs about ${formatEther(needed)} at ` +
      `${Number(gasPrice) / 1e9} gwei. This is mainnet, so top up by sending POL to ${deployer}.`,
  );
}

/**
 * Reuse a marketplace that is already on chain.
 *
 * Worth more here than on the testnet. Paying twice for the same bytecode
 * because the second half of a run failed costs real POL rather than a faucet
 * claim. Set `PLINTH_ADDRESS` and only what is missing gets deployed.
 */
let market;
if (reuse) {
  const code = await publicClient.getCode({ address: reuse });
  if (!code || code === "0x") throw new Error(`No contract at ${reuse}. Check PLINTH_ADDRESS.`);

  market = await viem.getContractAt("Plinth", reuse);
  console.log(`Plinth      ${reuse}  (already on chain, reused)`);
} else {
  market = await viem.deployContract("Plinth", [FEE_BPS, deployer]);
  console.log(`Plinth      ${market.address}`);
}

const collection = await viem.deployContract("PlinthDogs", [
  COLLECTION.name,
  COLLECTION.symbol,
  COLLECTION.maxSupply,
  deployer,
]);
console.log(`PlinthDogs  ${collection.address}\n`);

// Read the deployed contracts back rather than trusting the receipts. A
// deployment that reverted in the constructor leaves an address behind too.
const feeOnChain = await market.read.feeBps();
const supplyOnChain = await collection.read.maxSupply();

if (feeOnChain !== FEE_BPS) throw new Error(`Fee reads back as ${feeOnChain}, expected ${FEE_BPS}`);
if (supplyOnChain !== COLLECTION.maxSupply) {
  throw new Error(`Supply reads back as ${supplyOnChain}, expected ${COLLECTION.maxSupply}`);
}

// The art is the reason this collection exists, so it gets checked too rather
// than only the numbers. `traitsOf` is pure and needs no mint.
const traits = await collection.read.traitsOf([1n]);
if (traits.length !== 9) throw new Error(`traitsOf returned ${traits.length} layers, expected 9`);

console.log("Both contracts answered correctly on chain.");
console.log(`Token 1 would be: ${traits.join(" / ")}\n`);
console.log("Put these in site/config.js, under the mainnet entry:");
console.log(`  market:     "${market.address}",`);
console.log(`  collection: "${collection.address}",`);
