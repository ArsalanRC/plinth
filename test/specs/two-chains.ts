import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CHAIN, CHAINS, COLLECTIONS, CONTRACTS, DEFAULT_COLLECTION,
  chainOf, collectionById, hasFaucet, isLive,
} from "../../site/config.js";
import * as chain from "../../site/chain.js";

/**
 * Two collections on two chains, and the ways that goes quietly wrong.
 *
 * The cats are on Amoy where POL is free, the dogs on Polygon mainnet where it
 * is real. Nothing in that arrangement fails loudly. A wallet pointed at the
 * wrong network still signs, the transaction still succeeds, and it lands
 * against a contract that is not the one the page was showing.
 */
describe("two chains", () => {
  /**
   * The one that would be silent and expensive.
   *
   * `hex` is what goes to `wallet_switchEthereumChain` and `id` is what the
   * page compares against. A pair that disagrees sends the wallet somewhere the
   * page then fails to recognise, or worse, somewhere it does.
   */
  it("agrees with itself about every chain id", () => {
    for (const [key, c] of Object.entries(CHAINS)) {
      assert.equal(
        BigInt(c.hex), BigInt(c.id),
        `${key}: hex ${c.hex} is ${BigInt(c.hex)}, but id says ${c.id}`,
      );
    }

    // Spelled out, because these two are the whole point and a typo in either
    // is the kind of thing a loop over the object would happily confirm.
    assert.equal(CHAINS.amoy.id, 80002);
    assert.equal(CHAINS.polygon.id, 137);
  });

  it("gives every chain what a wallet needs to add it", () => {
    for (const [key, c] of Object.entries(CHAINS)) {
      const fields = c as unknown as Record<string, unknown>;
      for (const field of ["hex", "name", "currency", "rpc", "explorer"]) {
        assert.ok(fields[field], `${key} has no ${field}, so wallet_addEthereumChain would fail`);
      }
      assert.ok(c.rpc.length > 0, `${key} has no RPC endpoint`);
      assert.equal(typeof c.testnet, "boolean", `${key} does not say whether it is a testnet`);
    }
  });

  it("puts every collection on a chain that exists", () => {
    for (const c of COLLECTIONS) {
      const named = CHAINS[c.chain as keyof typeof CHAINS];
      assert.ok(named, `${c.id} names chain "${c.chain}", which is not defined`);
      assert.equal(chainOf(c), named);
    }
  });

  /**
   * Mainnet has no faucet and the start guide offers one. If a mainnet
   * collection ever answered true here, that page would send somebody looking
   * for free coins on a chain where there are none.
   */
  it("offers no faucet on a chain that has none", () => {
    for (const c of COLLECTIONS) {
      if (hasFaucet(c)) {
        assert.ok(chainOf(c).testnet, `${c.id} offers a faucet on ${c.chain}, which is not a testnet`);
      }
      if (!chainOf(c).testnet) {
        assert.equal(chainOf(c).faucet, null, `${c.chain} names a faucet and is not a testnet`);
      }
    }
  });

  it("knows the cats are live and the dogs are not yet", () => {
    assert.equal(isLive(collectionById("cats")), true);
    assert.equal(isLive(collectionById("dogs")), false, "dogs look deployed; update this when they are");
  });

  it("has a default collection that exists", () => {
    assert.ok(collectionById(DEFAULT_COLLECTION), `default "${DEFAULT_COLLECTION}" is not a collection`);
    assert.equal(collectionById("nothing-like-this"), null);
  });

  /**
   * The compatibility exports are derived, not duplicated. If someone later
   * types an address into `CONTRACTS` by hand this fails, which is the point:
   * two copies of an address is how the page ends up talking to a contract the
   * registry does not know about.
   */
  it("derives the single-collection view from the registry", () => {
    const def = collectionById(DEFAULT_COLLECTION);
    assert.ok(def, `default "${DEFAULT_COLLECTION}" is not a collection`);

    assert.equal(CHAIN, chainOf(def));
    assert.equal(CONTRACTS.market, def.market);
    assert.equal(CONTRACTS.collection, def.collection);
    assert.equal(CONTRACTS.drip, def.drip);
  });

  it("points at the default until something says otherwise", () => {
    assert.equal(chain.current()?.id, DEFAULT_COLLECTION);
    assert.equal(chain.chain().id, CHAINS.amoy.id);
  });

  it("follows use() onto the other chain, and back", () => {
    chain.use(collectionById("dogs"));
    assert.equal(chain.current()?.id, "dogs");
    assert.equal(chain.chain().id, 137);
    assert.equal(chain.chain().testnet, false);

    chain.use(collectionById("cats"));
    assert.equal(chain.current()?.id, "cats");
    assert.equal(chain.chain().id, 80002);
    assert.equal(chain.chain().testnet, true);
  });

  it("refuses a collection that does not exist rather than pointing at nothing", () => {
    assert.throws(() => chain.use(collectionById("hamsters")), /No such collection/);

    // And the target is unchanged, so a bad call cannot leave the page talking
    // to whatever happened to be last.
    assert.equal(chain.current()?.id, "cats");
  });
});

/**
 * The collection page loads whichever rarity module the URL asks for, so the
 * two have to answer the same names. They are generated by different scripts
 * and store their tokens differently: the cats spell every trait out, the dogs
 * pack theirs into index strings because 5000 spelled out is 484 KB.
 *
 * That difference is meant to stay inside the module. A page that has to know
 * which collection it is looking at to read a trait would defeat the point of
 * having a registry at all.
 */
describe("both rarity modules answer the same way", () => {
  it("exposes the same six names from each", async () => {
    for (const c of COLLECTIONS) {
      const mod = await import(`../../site/${c.rarity.replace("./", "")}`);

      for (const name of ["SUPPLY", "LAYERS", "RARITY", "traitsOf", "rarestOf", "percentOf"]) {
        assert.ok(name in mod, `${c.id}: ${c.rarity} has no ${name}`);
      }

      assert.equal(mod.SUPPLY, c.supply, `${c.id}: rarity says ${mod.SUPPLY}, config says ${c.supply}`);
      assert.equal(mod.LAYERS.length, c.layers, `${c.id}: ${mod.LAYERS.length} layers, config says ${c.layers}`);
    }
  });

  it("answers traitsOf with one value per layer, and null past the end", async () => {
    for (const c of COLLECTIONS) {
      const mod = await import(`../../site/${c.rarity.replace("./", "")}`);

      assert.equal(mod.traitsOf(1).length, c.layers, `${c.id}: token 1 has the wrong layer count`);
      assert.equal(mod.traitsOf(c.supply).length, c.layers, `${c.id}: the last token has the wrong layer count`);
      assert.equal(mod.traitsOf(c.supply + 1), null, `${c.id}: answered for a token past the supply`);
    }
  });

  it("names every layer the page has a label for", async () => {
    const { STRINGS } = await import("../../site/i18n.js");
    const en = STRINGS.en as unknown as Record<string, string>;
    const de = STRINGS.de as unknown as Record<string, string>;

    for (const c of COLLECTIONS) {
      const mod = await import(`../../site/${c.rarity.replace("./", "")}`);

      // The labels were keyed by index once, which silently mislabelled the
      // dogs as having Fur and Eyes in slots the cats use for those.
      for (const layer of mod.LAYERS) {
        assert.ok(en[`layer.${layer}`], `no English label for layer "${layer}" (${c.id})`);
        assert.ok(de[`layer.${layer}`], `no German label for layer "${layer}" (${c.id})`);
      }
    }
  });
});

/**
 * The deploy script and the site must agree on what a collection is called.
 *
 * This is not hypothetical. The cats deploy as `Plinth Demo` with symbol
 * `PLNTH` and the site calls them "Plinth Cats", so every wallet and explorer
 * shows a name the page never mentions. The contract is deployed and the name
 * is a constructor argument, so that one is permanent.
 *
 * The dogs go to mainnet, where the same mistake would be permanent and public.
 */
describe("the chain and the page agree on names", () => {
  it("deploys the dogs under the name the site shows", async () => {
    const { readFileSync } = await import("node:fs");
    const script = readFileSync("scripts/deploy-dogs.ts", "utf8");

    const name = /name:\s*"([^"]+)"/.exec(script)?.[1];
    const symbol = /symbol:\s*"([^"]+)"/.exec(script)?.[1];
    const dogs = COLLECTIONS.find((c) => c.id === "dogs");

    assert.ok(dogs, "no dogs in the registry");
    assert.equal(name, dogs.name, "deploy-dogs.ts would deploy a name the site does not show");
    assert.equal(symbol, dogs.symbol, "deploy-dogs.ts would deploy a symbol the site does not show");
  });
});
