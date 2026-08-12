/**
 * Mutation check: break each defence on purpose and confirm a test notices.
 *
 * A security test that passes against an undefended contract is worse than no
 * test, because it is a claim rather than a check. The only way to know the
 * difference is to delete the defence and watch something go red.
 *
 * This is not a substitute for a real mutation testing tool. It is a fixed list
 * of the mutations that matter, kept short enough that it runs in CI on every
 * push and specific enough that a failure names the defence that stopped
 * mattering.
 *
 *   node scripts/mutate.ts
 *
 * Every mutation must make its listed tests fail. A mutation that survives is
 * reported as SURVIVED and exits non-zero, because it means the contract could
 * lose that defence tomorrow and the suite would stay green.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface Mutation {
  /** What defence is being removed, in the terms the README uses. */
  name: string;
  file: string;
  /** Applied in order. Every edit must match exactly once. */
  edits: Array<{ find: string; replace: string }>;
  /** Tests that must fail once the defence is gone. */
  expect: string[];
}

const MUTATIONS: Mutation[] = [
  {
    name: "withdraw zeroes the balance before paying out",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: `    function withdraw() external nonReentrant {
        uint256 amount = _proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        _proceeds[msg.sender] = 0;

        (bool sent,) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert WithdrawFailed();`,
        replace: `    function withdraw() external {
        uint256 amount = _proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        (bool sent,) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert WithdrawFailed();
        _proceeds[msg.sender] = 0;`,
      },
    ],
    expect: ["survives a seller that re-enters withdraw while being paid"],
  },
  {
    name: "buy deletes the listing before the token moves",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: "    function buy(address collection, uint256 tokenId) external payable nonReentrant {",
        replace: "    function buy(address collection, uint256 tokenId) external payable {",
      },
      {
        find: `        delete _listings[collection][tokenId];

        (address creator, uint256 royalty) = _royalty(collection, tokenId, msg.value);`,
        replace: "        (address creator, uint256 royalty) = _royalty(collection, tokenId, msg.value);",
      },
      {
        find: `        IERC721(collection).safeTransferFrom(item.seller, msg.sender, tokenId);
    }`,
        replace: `        IERC721(collection).safeTransferFrom(item.seller, msg.sender, tokenId);
        delete _listings[collection][tokenId];
    }`,
      },
    ],
    // Not the reentrant-buyer test. That one passes either way, because the
    // fillability check refuses the nested purchase before the ordering ever
    // matters. What the ordering actually protects is everybody reading the
    // marketplace during the callback.
    expect: ["shows no listing to anyone reading it during the transfer"],
  },
  {
    name: "the seller is credited rather than paid during the sale",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: "        _credit(item.seller, toSeller);",
        replace: `        (bool paid,) = payable(item.seller).call{value: toSeller}("");
        if (!paid) revert WithdrawFailed();`,
      },
    ],
    expect: ["sells for a seller that cannot receive ether"],
  },
  {
    name: "a collection's royalty claim is capped",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: `            uint256 cap = (price * MAX_ROYALTY_BPS) / BPS_DENOMINATOR;
            return (receiver, reported > cap ? cap : reported);`,
        replace: "            return (receiver, reported);",
      },
    ],
    expect: [
      "caps a collection demanding more than the sale price",
      "still pays the seller when a collection is greedy",
    ],
  },
  {
    name: "a royalty naming the zero address is refused",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: "            if (receiver == address(0) || reported == 0) return (address(0), 0);",
        replace: "            if (reported == 0) return (address(0), 0);",
      },
    ],
    expect: ["refuses to credit the zero address"],
  },
  {
    name: "buy checks the listing can still be filled",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: "        if (!_fillable(collection, tokenId, item.seller)) revert ListingStale();\n",
        replace: "",
      },
    ],
    expect: ["says why, rather than failing somewhere inside the token"],
  },
  {
    name: "the marketplace fee is bounded by a constant",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: "        if (bps > MAX_FEE_BPS) revert FeeTooHigh(MAX_FEE_BPS, bps);\n",
        replace: "",
      },
    ],
    expect: ["refuses a fee above the cap, so buyers can read the ceiling from the code"],
  },
  {
    name: "payment must be exact, not merely sufficient",
    file: "contracts/Consign.sol",
    edits: [
      {
        find: "        if (msg.value != item.price) revert WrongPayment(item.price, msg.value);",
        replace: "        if (msg.value < item.price) revert WrongPayment(item.price, msg.value);",
      },
    ],
    expect: ["refuses payment above the asking price rather than keeping the difference"],
  },
];

function runTests(): { passed: boolean; output: string } {
  try {
    const output = execFileSync("pnpm", ["hardhat", "test"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { passed: true, output };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return { passed: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function apply(mutation: Mutation): string {
  const target = path.join(root, mutation.file);
  const original = readFileSync(target, "utf8");

  let mutated = original;
  for (const edit of mutation.edits) {
    const occurrences = mutated.split(edit.find).length - 1;
    if (occurrences !== 1) {
      throw new Error(
        `Mutation "${mutation.name}" expected exactly one match for an edit, found ${occurrences}. ` +
          `The contract has moved and this mutation is checking nothing.`,
      );
    }
    mutated = mutated.replace(edit.find, edit.replace);
  }

  writeFileSync(target, mutated);
  return original;
}

console.log("Baseline: the suite must be green before any of this means anything.\n");
const baseline = runTests();
if (!baseline.passed) {
  console.error("The suite is already failing. Fix that first.\n");
  console.error(baseline.output.split("\n").slice(-40).join("\n"));
  process.exit(1);
}
console.log("Baseline green.\n");

const survived: string[] = [];
const missed: string[] = [];

for (const mutation of MUTATIONS) {
  const target = path.join(root, mutation.file);
  const original = apply(mutation);

  try {
    const result = runTests();

    if (result.passed) {
      survived.push(mutation.name);
      console.log(`SURVIVED  ${mutation.name}`);
      continue;
    }

    const unnoticed = mutation.expect.filter((name) => !result.output.includes(name));
    if (unnoticed.length > 0) {
      missed.push(`${mutation.name} -> ${unnoticed.join(", ")}`);
      console.log(`WRONG     ${mutation.name}`);
      console.log(`          something failed, but not: ${unnoticed.join(", ")}`);
      continue;
    }

    console.log(`caught    ${mutation.name}`);
  } finally {
    writeFileSync(target, original);
  }
}

console.log("");

if (survived.length === 0 && missed.length === 0) {
  console.log(`All ${MUTATIONS.length} mutations were caught.`);
  process.exit(0);
}

for (const name of survived) {
  console.error(`Survived, so nothing tests it: ${name}`);
}
for (const name of missed) {
  console.error(`Caught by the wrong test: ${name}`);
}
process.exit(1);
