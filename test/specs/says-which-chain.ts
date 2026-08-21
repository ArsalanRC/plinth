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
      const body = (dict as Record<string, string>)["start.s4.body"];
      assert.ok(body, `${lang} has no start.s4.body`);

      assert.doesNotMatch(
        body, /not live|nothing on Polygon|noch nicht live|nichts zu verbinden/i,
        `${lang}: route 04 says mainnet is not live, and ${mainnet.name} is on it`,
      );
      assert.ok(
        body.includes(mainnet.name),
        `${lang}: route 04 never names ${mainnet.name}, which is the collection it is about`,
      );
    }

    assert.match(read("start.html"), /id="mainnet-link"/, "route 04 has no way through to the collection");
    assert.match(
      read("start.js"), /collection\.html\?c=\$\{mainnet\.id\}/,
      "route 04 links to a collection written out rather than the mainnet one",
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
