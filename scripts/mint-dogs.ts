/**
 * Mint dogs on Polygon mainnet.
 *
 *   POLYGON_RPC_URL="..." POLYGON_PRIVATE_KEY="0x..." pnpm mint:dogs
 *   MINT_COUNT=3 pnpm mint:dogs
 *
 * **Real money.** One mint is a few cents of gas, but the same slip of the
 * `--network` flag that would ruin a deploy applies here, so this carries the
 * same guards: it asks the chain what it is rather than trusting the flag, and
 * it prices the job before spending.
 *
 * The address it mints to is the deployer's own, because that is the wallet
 * this project uses and asking for a second address is one more place to fat
 * finger something irreversible. `MINT_TO` overrides it if that is ever wrong.
 *
 * Why mint at all: OpenSea and every other indexer builds a collection from
 * transfer events. A deployed contract with nothing minted has produced no
 * events, so there is nothing to index and the collection does not appear.
 * One token is enough to make it exist.
 */

import { network } from "hardhat";
import { formatEther, getAddress } from "viem";

const EXPECTED_CHAIN = 137n;
const MAX_GWEI = 800n;

const COUNT = BigInt(process.env.MINT_COUNT ?? "1");
const COLLECTION = "0xa4a3cbcd73d1709cb1db4d7a45fd35ff2f149af7";

const { viem } = await network.connect();

const [wallet] = await viem.getWalletClients();
if (wallet === undefined) throw new Error("No account is configured for this network.");

const publicClient = await viem.getPublicClient();
const deployer = wallet.account.address;
const to = getAddress(process.env.MINT_TO ?? deployer);

const chainId = BigInt(await publicClient.getChainId());
if (chainId !== EXPECTED_CHAIN) {
  throw new Error(
    `This is chain ${chainId} and the dogs are on Polygon mainnet, ${EXPECTED_CHAIN}. ` +
      `Run it with --network polygon.`,
  );
}

// The address is the same on Amoy, where it is the old cat collection, so a
// contract being there proves nothing on its own. Ask it what it is.
const dogs = await viem.getContractAt("PlinthDogs", COLLECTION);
const name = await dogs.read.name();
if (name !== "Plinth Dogs") {
  throw new Error(`The contract at ${COLLECTION} calls itself ${name}, not Plinth Dogs.`);
}

const minted = await dogs.read.totalMinted();
const supply = await dogs.read.maxSupply();
const gasPrice = await publicClient.getGasPrice();
const gwei = gasPrice / 1_000_000_000n;

if (gwei > MAX_GWEI) {
  throw new Error(`Gas is ${gwei} gwei, over the ${MAX_GWEI} this script will spend at. Wait and run it again.`);
}

if (minted + COUNT > supply) {
  throw new Error(`${minted} of ${supply} are minted, so ${COUNT} more would exceed the supply.`);
}

const perMint = await publicClient.estimateContractGas({
  address: COLLECTION,
  abi: dogs.abi,
  functionName: "mint",
  args: [to],
  account: deployer,
});

const needed = perMint * COUNT * gasPrice;
const balance = await publicClient.getBalance({ address: deployer });

console.log(`Collection     ${name} (${COLLECTION})`);
console.log(`Minted         ${minted} of ${supply}`);
console.log(`Minting        ${COUNT} to ${to}`);
console.log(`Gas price      ${Number(gasPrice) / 1e9} gwei`);
console.log(`Costs about    ${formatEther(needed)} POL`);
console.log(`Balance        ${formatEther(balance)} POL\n`);

if (balance < needed) {
  throw new Error(`Balance is ${formatEther(balance)} POL and this needs about ${formatEther(needed)}.`);
}

for (let i = 0n; i < COUNT; i++) {
  const hash = await dogs.write.mint([to]);
  await publicClient.waitForTransactionReceipt({ hash });

  const id = minted + i + 1n;
  const traits = await dogs.read.traitsOf([id]);
  console.log(`#${id}  ${traits.join(" / ")}`);
  console.log(`     https://polygonscan.com/tx/${hash}`);
}

console.log(`\nNow ${await dogs.read.totalMinted()} of ${supply} minted.`);
console.log(`OpenSea:  https://opensea.io/assets/matic/${COLLECTION}/${minted + 1n}`);
console.log("Indexers build a collection from transfer events, so allow a few minutes.");
