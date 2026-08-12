/**
 * Where this page points.
 *
 * Nothing secret lives here and nothing can. Contract addresses are public the
 * moment they exist, and an RPC endpoint is a public read. There is no key, no
 * token and no account in this file, because the page never holds one: every
 * signature is asked for through MetaMask, which shows the user the dialog and
 * keeps the key inside the extension.
 */

/**
 * Polygon Amoy, the testnet. POL here is free from a faucet and worth nothing,
 * which is the point: nobody should risk real money trying a portfolio piece.
 */
export const CHAIN = {
  id: 80002,
  hex: "0x13882",
  name: "Polygon Amoy",
  currency: { name: "POL", symbol: "POL", decimals: 18 },
  rpc: "https://rpc-amoy.polygon.technology",
  explorer: "https://amoy.polygonscan.com",
  faucet: "https://faucet.polygon.technology",
};

/**
 * The deployed contracts.
 *
 * Both null until somebody runs `pnpm deploy:amoy` and pastes the addresses
 * back in. Null is not a failure state: the page runs its demo either way, and
 * a visitor without MetaMask sees the same marketplace with invented listings.
 *
 * Deliberately not read from an environment variable or a build step. This page
 * is served as written, so the addresses it uses are the addresses you can read
 * in the source.
 */
export const CONTRACTS = {
  market: null,
  collection: null,
};

/** Whether a real deployment exists to talk to. */
export const isDeployed = () => CONTRACTS.market !== null && CONTRACTS.collection !== null;
