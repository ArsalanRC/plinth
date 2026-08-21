/**
 * Where this page points.
 *
 * Nothing secret lives here and nothing can. Contract addresses are public the
 * moment they exist, and an RPC endpoint is a public read. There is no key, no
 * token and no account in this file, because the page never holds one: every
 * signature is asked for through MetaMask, which shows the user the dialog and
 * keeps the key inside the extension.
 *
 * **Two chains at once, on purpose.** The cats live on Amoy, where POL is free
 * and worth nothing, and the dogs live on Polygon mainnet, where it is real.
 * That is not a migration half-finished: a testnet collection is the honest
 * place to let a stranger try minting, and a mainnet one is the honest place to
 * put something meant to last.
 *
 * It does mean the page can show two collections priced in currencies that are
 * not comparable. **Every collection carries its chain, and every chain says
 * whether it is a testnet**, so nothing can render a real price beside a free
 * one without saying which is which.
 */

/**
 * Polygon Amoy, the testnet. POL here is free from a faucet and worth nothing,
 * which is the point: nobody should risk real money trying a portfolio piece.
 */
const AMOY = {
  key: "amoy",
  id: 80002,
  hex: "0x13882",
  name: "Polygon Amoy",
  shortName: "Amoy",
  testnet: true,
  currency: { name: "POL", symbol: "POL", decimals: 18 },

  /**
   * Several endpoints, tried in order, because the obvious one is not reliable.
   *
   * `rpc-amoy.polygon.technology` is the endpoint every guide names and it was
   * refusing connections entirely on 2026-08-14. A wallet pointed at it said
   * "unable to connect to Amoy" and reported a funded account as empty, which
   * looks exactly like a faucet that never paid out. It is not a failure worth
   * debugging twice, so the page carries alternatives and moves on.
   *
   * All of these are public and keyless. Anything needing an API key does not
   * belong in a file served to the browser.
   */
  rpc: [
    "https://polygon-amoy-bor-rpc.publicnode.com",
    "https://polygon-amoy.drpc.org",
    "https://polygon-amoy.gateway.tenderly.co",
    "https://rpc-amoy.polygon.technology",
  ],

  explorer: "https://amoy.polygonscan.com",
  faucet: "https://faucet.polygon.technology",
};

/**
 * Polygon mainnet. The POL here is somebody's actual money.
 *
 * No faucet, and that absence is deliberate rather than an oversight: the page
 * must never offer a route that looks like free coins on a chain where there
 * are none. Code that wants a faucet has to check.
 */
const POLYGON = {
  key: "polygon",
  id: 137,
  hex: "0x89",
  name: "Polygon",
  shortName: "Polygon",
  testnet: false,
  currency: { name: "POL", symbol: "POL", decimals: 18 },

  rpc: [
    "https://polygon-bor-rpc.publicnode.com",
    "https://polygon.drpc.org",
    "https://polygon-rpc.com",
  ],

  explorer: "https://polygonscan.com",
  faucet: null,
};

export const CHAINS = { amoy: AMOY, polygon: POLYGON };

/**
 * The collections, and which chain each one lives on.
 *
 * `market` and `collection` are null until something is deployed. Null is not a
 * failure state: the page runs its demo either way, and a visitor without
 * MetaMask sees a marketplace with invented listings.
 *
 * Deliberately not read from an environment variable or a build step. This page
 * is served as written, so the addresses it uses are the addresses you can read
 * in the source.
 */
export const COLLECTIONS = [
  {
    id: "cats",
    name: "Plinth Cats",
    symbol: "PLNTH",
    chain: "amoy",
    market: "0x2e24d151283c5b5da36db089be1a1c6eab70cbcf",
    collection: "0x62a11d9bf24f568489d1779c66d04d0212731f1e",
    supply: 500,
    layers: 7,
    rarity: "./rarity.js",

    /**
     * The faucet. Null until it is deployed, and the page handles that: the
     * button is simply not offered, and the public faucets are named instead.
     *
     * `scripts/topup.ts` reads this same line, so the address the page talks to
     * and the address the owner funds cannot drift apart.
     */
    drip: null,
  },
  {
    id: "dogs",
    name: "Plinth Dogs",
    symbol: "PDOG",
    chain: "polygon",
    market: null,
    collection: null,
    supply: 5000,
    layers: 9,
    rarity: "./dog-rarity.js",

    // There is no faucet on mainnet and there never will be. See POLYGON above.
    drip: null,
  },
];

/**
 * The collection a page shows when nothing says otherwise.
 *
 * The cats, because that is what the marketplace page has always shown and a
 * visitor arriving at a bookmarked link should not find a different collection
 * under it. A page wanting the other one asks by id.
 */
export const DEFAULT_COLLECTION = "cats";

export function collectionById(id) {
  return COLLECTIONS.find((c) => c.id === id) ?? null;
}

export function chainOf(collection) {
  return CHAINS[collection.chain];
}

/** Whether a collection has a real deployment to talk to. */
export const isLive = (collection) =>
  collection !== null && collection.market !== null && collection.collection !== null;

/** Whether a collection has a faucet to offer. Separate: the market works without one. */
export const hasFaucet = (collection) => collection !== null && collection.drip !== null;

// ---------------------------------------------------------------- compatibility

/*
 * The single-collection view, kept so the existing pages keep working while
 * they are moved over one at a time.
 *
 * A rewrite that changed the config and all four pages in one commit would be
 * one commit nobody can review and no way to bisect a break. These are derived
 * rather than duplicated, so they cannot drift from the registry above.
 */
const DEFAULT = collectionById(DEFAULT_COLLECTION);

export const CHAIN = chainOf(DEFAULT);

export const CONTRACTS = {
  market: DEFAULT.market,
  collection: DEFAULT.collection,
  drip: DEFAULT.drip,
};

export const isDeployed = () => isLive(DEFAULT);

export const hasDrip = () => hasFaucet(DEFAULT);
