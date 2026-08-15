import type { HardhatUserConfig } from "hardhat/config";
import { configVariable } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

/**
 * Networks other than the in-process one read their key through
 * `configVariable`, which resolves from the Hardhat keystore or the
 * environment. No key is ever written into this file, and nothing here works
 * without the operator supplying one deliberately.
 *
 * `pnpm hardhat keystore set AMOY_PRIVATE_KEY` puts it in an encrypted store
 * rather than in a dotfile that a screen share can leak.
 */
const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViem],
  // Specs only. The runner treats every file in this directory as a test, so
  // shared fixtures live one level up in `test/` and get imported rather than
  // run, which keeps the reported count equal to the number of real cases.
  paths: {
    tests: { nodejs: "test/specs" },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      /**
       * The IR pipeline, because the art does not fit the legacy one.
       *
       * Composing an SVG means concatenating many fragments in one expression,
       * and the old code generator runs out of stack slots doing it. The
       * alternative was breaking readable drawing code into a chain of tiny
       * functions to satisfy a compiler limitation, which makes the art harder
       * to follow and benefits nobody reading it.
       *
       * Costs a slower compile, and generates tighter code in return.
       */
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
      // Deployed bytecode carries no metadata hash, so an identical source
      // always compiles to identical bytecode. That is what makes a
      // verification on the explorer reproducible by somebody else.
      metadata: { bytecodeHash: "none" },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    amoy: {
      type: "http",
      chainType: "l1",
      url: configVariable("AMOY_RPC_URL"),
      accounts: [configVariable("AMOY_PRIVATE_KEY")],
      chainId: 80002,
    },
  },
};

export default config;
