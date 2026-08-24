import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CHAINS, COLLECTIONS, chainOf, collectionById, isLive } from "../../site/config.js";
import { STRINGS } from "../../site/i18n.js";
import * as chain from "../../site/chain.js";

const SITE = join(import.meta.dirname, "../../site");
const read = (file: string) => readFileSync(join(SITE, file), "utf8");

/** The live collection on a chain where POL is somebody's actual money. */
const mainnet = COLLECTIONS.find((c) => isLive(c) && !chainOf(c).testnet);

/**
 * The site has to say which chain it is talking about, everywhere it says
 * anything at all.
 *
 * This is the defect that was reported, in his words: "i only see the cats
 * there, no dog one on polygon". Both collections were wired up and working.
 * What was missing was the site ever saying so. The hero named Polygon Amoy,
 * the onboarding guide said mainnet was not live, the token dialog called every
 * dog a Plinth Cat, and the biggest button on the market minted the cats
 * without naming them.
 *
 * None of that fails. A page that names the wrong chain renders perfectly.
 */
describe("the site says which chain", () => {
  it("has a mainnet collection at all, or the rest of this is moot", () => {
    assert.ok(mainnet, "no live collection on a non-testnet chain");
    assert.equal(chainOf(mainnet).id, CHAINS.polygon.id);
  });

  /**
   * The generic mint button, and why it is gone rather than relabelled.
   *
   * It read "Mint a token", minted the cats on Amoy, and named neither, while
   * the buttons directly beside it named both their collection and their chain.
   * Two mint mechanisms on one page and only one of them honest. The demo path
   * it carried moved into `mintFrom`, so nothing was lost by deleting it.
   */
  it("has no mint button that does not say what it mints", () => {
    const html = read("index.html");

    assert.doesNotMatch(html, /id="mint"/, "index.html still has the unlabelled mint button");
    assert.doesNotMatch(read("app.js"), /\$\("mint"\)/, "app.js still wires the unlabelled button");

    for (const [lang, dict] of Object.entries(STRINGS)) {
      assert.equal(
        (dict as Record<string, string>)["mine.mint"], undefined,
        `${lang} still carries mine.mint, the label that named no collection`,
      );
    }
  });

  /**
   * Every remaining mint control is built from the registry, so it cannot name
   * one collection and mint another.
   */
  it("builds the mint buttons from the collections", () => {
    const app = read("app.js");
    const mintOthers = app.slice(app.indexOf("function paintMintOthers"));
    const body = mintOthers.slice(0, mintOthers.indexOf("async function mintFrom"));

    assert.match(body, /for \(const c of COLLECTIONS\)/, "the buttons are not built from the registry");
    assert.match(body, /c\.name/, "a mint button that does not name its collection");
    assert.match(body, /net\.shortName/, "a mint button that does not name its chain");
  });

  /**
   * The guide told every newcomer that Polygon mainnet had nothing on it, and
   * kept telling them after the dogs were deployed there. Route 04 is the one
   * route somebody follows to find the mainnet collection.
   *
   * Pinned against the registry rather than against the words, so removing the
   * mainnet collection fails this instead of quietly making the page lie again.
   */
  it("does not call a live chain dead in the onboarding guide", () => {
    assert.ok(mainnet);

    for (const [lang, dict] of Object.entries(STRINGS)) {
      const body = (dict as Record<string, string>)["start.main.body"];
      assert.ok(body, `${lang} has no start.main.body`);

      assert.doesNotMatch(
        body, /not live|nothing on Polygon|noch nicht live|nichts zu verbinden/i,
        `${lang}: the mainnet route says mainnet is not live, and ${mainnet.name} is on it`,
      );
      assert.ok(
        body.includes(mainnet.name),
        `${lang}: the mainnet route never names ${mainnet.name}, which is the collection it is about`,
      );
    }

    assert.match(read("start.html"), /id="main-link"/, "the mainnet route has no way through to the collection");
    assert.match(
      read("start.js"), /collection\.html\?c=\$\{mainnet\.id\}/,
      "the mainnet route links to a collection written out rather than the mainnet one",
    );
  });

  /**
   * The token dialog took its name from a string that said "Plinth Cat #N", so
   * every dog opened under a cat's name. The chain badge beside it was right
   * the whole time, which is what made it look deliberate.
   */
  it("names a token after the collection it is actually in", () => {
    const js = read("collection.js");

    assert.doesNotMatch(js, /Plinth Cat #/, "the token dialog still hardcodes a cat's name");
    assert.match(js, /\$\("t-name"\)\.textContent = `\$\{shown\.name\}/, "the token name is not taken from the collection");

    for (const [lang, dict] of Object.entries(STRINGS)) {
      const strings = dict as Record<string, string>;
      for (const key of ["col.metaTitle", "col.name"]) {
        assert.doesNotMatch(
          strings[key] ?? "", /Plinth Cats/,
          `${lang}: ${key} names one collection on a page that serves both`,
        );
      }
    }
  });

  /** The profile reads every chain, so it must not label itself with one. */
  it("does not label the profile with a single chain", () => {
    assert.doesNotMatch(read("profile.html"), /Polygon Amoy/, "the profile still names one chain in markup");
    assert.match(read("profile.js"), /p-chain-names/, "the profile never fills its chain label");
  });

  /**
   * Both languages carry every key.
   *
   * A key added to one dictionary and not the other does not throw. `t()` falls
   * back to the key itself, so the page renders "mine.mintReal" as a sentence,
   * and only somebody reading in that language ever sees it.
   */
  it("carries every key in both languages", () => {
    const en = Object.keys(STRINGS.en);
    const de = Object.keys(STRINGS.de);

    assert.deepEqual(en.filter((k) => !de.includes(k)), [], "keys missing from German");
    assert.deepEqual(de.filter((k) => !en.includes(k)), [], "keys missing from English");
  });
});

/**
 * A write must never be signed on the wrong chain.
 *
 * The read-side half of this was fixed when the dogs went live: a wallet parked
 * on Amoy reading mainnet returns empty, and the page reports "you hold
 * nothing" honestly and incorrectly. The write-side half is worse and was still
 * open. The two chains share contract addresses, so there is no invalid address
 * to save anybody: listing a cat while the wallet sits on mainnet is a real
 * transaction against the dogs' marketplace, in real POL.
 *
 * It is also how minting the dogs from the market page was reached at all, so
 * this is exercised by the fix rather than hypothetical.
 */
describe("a write refuses the wrong chain", () => {
  const calls: string[] = [];

  function wallet(chainId: string) {
    calls.length = 0;
    (globalThis as Record<string, unknown>).ethereum = {
      request: async ({ method }: { method: string }) => {
        calls.push(method);
        if (method === "eth_chainId") return chainId;
        if (method === "eth_sendTransaction") return "0xhash";
        if (method === "eth_getTransactionReceipt") return { status: "0x1" };
        return null;
      },
    };
  }

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).ethereum;
    chain.use(collectionById("cats"));
  });

  it("refuses, and does not sign, when the wallet is on the other chain", async () => {
    chain.use(collectionById("cats"));
    wallet(CHAINS.polygon.hex);

    await assert.rejects(
      () => chain.send({ to: "0x1", data: "0x", from: "0x2" }),
      /wrong-chain/,
    );

    // The refusal is worth nothing if the transaction went out first.
    assert.ok(!calls.includes("eth_sendTransaction"), "it signed anyway");
  });

  it("sends when the wallet is where the write belongs", async () => {
    chain.use(collectionById("cats"));
    wallet(CHAINS.amoy.hex);

    const { hash } = await chain.send({ to: "0x1", data: "0x", from: "0x2" });
    assert.equal(hash, "0xhash");
    assert.ok(calls.includes("eth_sendTransaction"));
  });

  it("follows use() rather than a fixed chain", async () => {
    chain.use(collectionById("dogs"));
    wallet(CHAINS.polygon.hex);

    const { hash } = await chain.send({ to: "0x1", data: "0x", from: "0x2" });
    assert.equal(hash, "0xhash", "a mainnet write was refused while pointed at mainnet");
  });
});

/**
 * A read must answer about the chain it was asked about.
 *
 * `call` was fixed when the dogs went live. `balanceOf` was not, and it was the
 * last read that went through the wallet unconditionally. A wallet sits on one
 * network, so it answered about that one whatever the page had asked for.
 *
 * The profile shows a balance row per collection, precisely because POL on Amoy
 * is free and POL on Polygon is money. Every row was reporting the same
 * wallet-side number.
 */
describe("a balance comes from the chain it is a balance on", () => {
  const realFetch = globalThis.fetch;
  const ADDRESS = "0x1111111111111111111111111111111111111111";

  let asked: string[] = [];
  let announce: ((id: string) => void) | null = null;

  function walletOn(chainId: string) {
    asked = [];
    (globalThis as Record<string, unknown>).ethereum = {
      request: async ({ method }: { method: string }) => {
        asked.push(`wallet:${method}`);
        if (method === "eth_chainId") return chainId;
        return "0xde0b6b3a7640000";
      },
      // The real wallet's own event, which is the only thing that corrects the
      // cached chain id. Captured so a test can switch networks the way a
      // person does.
      on: (event: string, fn: (id: string) => void) => {
        if (event === "chainChanged") announce = fn;
      },
    };

    globalThis.fetch = (async (url: string) => {
      asked.push(`rpc:${url}`);
      return { json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }) };
    }) as unknown as typeof fetch;
  }

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).ethereum;
    globalThis.fetch = realFetch;
    chain.use(collectionById("cats"));
  });

  it("uses the chain's own RPC when the wallet is on the other one", async () => {
    chain.use(collectionById("cats"));
    walletOn(CHAINS.polygon.hex);

    await chain.balanceOf(ADDRESS);

    const rpc = asked.find((a) => a.startsWith("rpc:"));
    assert.ok(rpc, "it asked the wallet, which is parked on the other chain");
    assert.ok(
      CHAINS.amoy.rpc.some((url) => rpc === `rpc:${url}`),
      `asked ${rpc}, which is not an Amoy endpoint`,
    );
    assert.ok(!asked.includes("wallet:eth_getBalance"), "it read the balance through the wallet");
  });

  /**
   * And it follows the wallet when the wallet moves.
   *
   * The chain id is cached, so without this the answer is frozen at whatever
   * the wallet was doing on the first read. Announcing the switch is what a
   * real wallet does, and subscribing to it is the whole reason the cache is
   * safe to keep.
   */
  it("uses the wallet once the wallet arrives on this chain", async () => {
    chain.use(collectionById("cats"));
    walletOn(CHAINS.polygon.hex);

    await chain.balanceOf(ADDRESS);
    assert.ok(announce, "chain.js never subscribed, so the cache could never be corrected");

    announce(CHAINS.amoy.hex);
    asked = [];

    await chain.balanceOf(ADDRESS);
    assert.ok(asked.includes("wallet:eth_getBalance"), "it went to an RPC with the wallet right here");
  });
});

/**
 * What a wallet holds spans every collection. What is for sale on this page
 * does not.
 *
 * He reported this: connected on the market page, his minted dogs missing,
 * while the profile listed them correctly. The market page read one collection
 * for everything, so the answer was honest and narrower than the question.
 *
 * The market grid, the supply count and the split stay on this page's own
 * collection deliberately. Those are one chain's figures and mixing another
 * chain's into them would produce numbers in no currency at all.
 */
describe("the market page shows everything the wallet holds", () => {
  const app = read("app.js");

  it("sweeps the other collections for what is held", () => {
    assert.match(app, /async function heldElsewhere/, "there is no cross-collection sweep");

    const sweep = app.slice(app.indexOf("async function heldElsewhere"));
    assert.match(sweep, /for \(const c of COLLECTIONS\)/, "the sweep is not built from the registry");
    assert.match(sweep, /c\.id === home\.id/, "the sweep does not skip this page's own collection");
  });

  it("keeps the market grid on this page's own collection", () => {
    const live = app.slice(app.indexOf("async function loadLive"));
    const body = live.slice(0, live.indexOf("async function heldElsewhere"));

    assert.match(body, /mine: \(\) => held/, "what you hold is not the cross-collection list");
    assert.match(
      body, /listings: \(\) => tokens\.filter/,
      "the market grid is no longer this page's own collection",
    );
    assert.match(body, /chain\.use\(home\)/, "the sweep leaves the page pointed at another chain");
  });

  /**
   * A card for the other chain has to act on the other chain. The two share
   * contract addresses, so listing a dog with the wallet on Amoy would be a
   * real transaction against the cats' marketplace.
   */
  it("acts on each token's own chain", () => {
    assert.match(app, /async function onItsOwnChain/, "there is no per-token chain switch");

    const wrap = app.slice(app.indexOf("async function onItsOwnChain"));
    const body = wrap.slice(0, wrap.indexOf("async function doList"));

    assert.match(body, /switching = true/, "the switch would trip the page's own reload");
    assert.match(body, /ensureChain/, "it never moves the wallet");
    assert.match(body, /finally[\s\S]*chain\.use\(home\)/, "the target is never restored");

    for (const action of ["doList", "doCancel"]) {
      const fn = app.slice(app.indexOf(`async function ${action}`));
      assert.match(
        fn.slice(0, fn.indexOf("\n}")), /onItsOwnChain/,
        `${action} does not follow the token to its chain`,
      );
    }
  });
});

/**
 * The market page switches networks to mint the other collection, and its own
 * `chainChanged` handler used to reload the page in the middle of doing it.
 *
 * That is what "the dog minting is broken" was. MetaMask switches, the handler
 * reloads, the mint that was about to be signed never happens, and nothing
 * errors anywhere. The page simply starts again on the cats.
 */
describe("a deliberate switch does not reload the page", () => {
  it("guards the reload with the switching flag", () => {
    const app = read("app.js");
    const handler = app.slice(app.indexOf('on?.("chainChanged"'));

    assert.match(
      handler.slice(0, handler.indexOf("}")),
      /if \(!switching\)/,
      "chainChanged reloads unconditionally, which kills any mint that switches chain",
    );

    const mintFrom = app.slice(app.indexOf("async function mintFrom"));
    const body = mintFrom.slice(0, mintFrom.indexOf("async function mintInDemo"));

    assert.match(body, /switching = true[\s\S]*ensureChain/, "the flag is not set before the switch");
    assert.match(body, /finally[\s\S]*switching = false/, "the flag is never cleared");
  });
});
