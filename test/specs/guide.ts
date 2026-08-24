import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { STRINGS } from "../../site/i18n.js";

const SITE = join(import.meta.dirname, "../../site");
const html = readFileSync(join(SITE, "start.html"), "utf8");
const js = readFileSync(join(SITE, "start.js"), "utf8");

/**
 * The way in, for somebody who has never held a wallet.
 *
 * There are three kinds of visitor and the guide is the only place that says
 * which is which: one who will not install anything, one who wants the free
 * test network, and one who will spend real money on mainnet. It had four
 * routes, and one of them was "make a wallet", which is a step inside two of
 * the others rather than a place to go.
 *
 * None of this fails loudly. A guide that skips a step still renders, and the
 * visitor is the one who finds out.
 */
describe("the guide", () => {
  it("offers exactly three routes, and the picker reaches all of them", () => {
    for (const id of ["look", "free", "main"]) {
      assert.match(html, new RegExp(`<section class="band" id="${id}"`), `no ${id} route`);
      assert.match(html, new RegExp(`href="#${id}"`), `the picker does not link to ${id}`);
    }

    // A fourth would mean the wallet has become a destination again.
    assert.equal((html.match(/<section class="band"/g) ?? []).length, 3);
  });

  /**
   * Every step is present, once, and in order.
   *
   * This is the test the rewrite needed. A scripted edit to this markup matched
   * one `<li>` and swallowed the two after it, because the pattern ran across
   * list items. The replacement count was 1, the assertion passed, and three
   * steps were gone. Counting the edit is not the same as checking the result.
   */
  const ROUTES = { free: 6, main: 4 };

  for (const [route, count] of Object.entries(ROUTES)) {
    it(`keeps all ${count} steps of the ${route} route, in order`, () => {
      const seen = [];

      for (let n = 1; n <= count; n++) {
        const key = `start.${route}.step${n}`;
        const at = html.indexOf(`data-i18n="${key}"`);
        assert.notEqual(at, -1, `${key} is missing from the markup`);
        assert.equal(
          html.indexOf(`data-i18n="${key}"`, at + 1), -1,
          `${key} appears more than once`,
        );
        seen.push(at);
      }

      const sorted = [...seen].sort((a, b) => a - b);
      assert.deepEqual(seen, sorted, `the ${route} steps are out of order in the markup`);
    });
  }

  /**
   * The two buttons and the one link the script reaches for.
   *
   * `$("free-add")` returning null throws on the very first line that touches
   * it, which takes the whole module down: the mainnet link then never gets
   * filled and the route quietly ends in an empty anchor. That is exactly what
   * happened, and only the browser console said so.
   */
  it("carries every element the script binds to", () => {
    for (const id of ["free-add", "free-result", "main-add", "main-result", "main-link"]) {
      assert.equal(
        (html.match(new RegExp(`id="${id}"`, "g")) ?? []).length, 1,
        `#${id} is not in the markup exactly once, and start.js binds to it`,
      );
      assert.match(js, new RegExp(`"${id}"`), `start.js does not use #${id}`);
    }
  });

  it("has a translation for every key it uses", () => {
    const used = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(used.length > 20, `only ${used.length} keys found, the scrape is wrong`);

    for (const [lang, dict] of Object.entries(STRINGS)) {
      const strings = dict as Record<string, string>;
      for (const key of used) {
        assert.ok(strings[key], `${lang} has no ${key}, so the guide renders it blank`);
      }
    }
  });

  /**
   * The numbers are a CSS counter, because the markers are styled. A counter
   * does not read the `start` attribute, so the half of the list that follows
   * the seed-phrase warning has to be told where to resume or it starts at 1
   * again, and the guide has two step ones.
   */
  it("resumes the split list at the right number", () => {
    assert.match(html, /start="4" style="--step-from: 3"/, "the second half restarts at one");

    const css = readFileSync(join(SITE, "base.css"), "utf8");
    assert.match(
      css, /counter-reset: step var\(--step-from, 0\)/,
      "base.css ignores the resume point, so the attribute would be decoration",
    );
  });

  /**
   * The faucet step points at a tap that exists.
   *
   * The markup ships with the public faucet, which is always there. This
   * project's own tap is a contract and is not deployed, so a guide that sent
   * people to a one-click button would be sending them to a panel that says
   * "not deployed". Gated on the registry rather than on the copy, so deploying
   * the drip is all it takes for the step to improve.
   */
  it("offers the public faucet until this project has its own", () => {
    assert.match(html, /href="https:\/\/faucet\.polygon\.technology"/, "no faucet to send anybody to");

    const paint = js.slice(js.indexOf("function paintFaucet"));
    const body = paint.slice(0, paint.indexOf("\n}"));

    assert.match(body, /hasFaucet\(testnet\)/, "the swap is not gated on a deployed drip");
    assert.match(body, /index\.html#faucet/, "it never points at the one-click panel");
  });

  /**
   * Drawn here, not borrowed. Screenshots of somebody else's product are theirs
   * rather than ours, and they rot the next time that product is redesigned.
   */
  it("draws its own step art, with no external images", () => {
    assert.equal((html.match(/class="step-art"/g) ?? []).length, 11);
    assert.doesNotMatch(html, /<img/, "the guide pulls in an image from somewhere");
  });
});

/**
 * Every page carries the same way out to the portfolio.
 *
 * Added because the profile page had no route back to anything of his, and a
 * link that exists on three pages out of four is the kind of thing nobody
 * notices until it is the page somebody landed on.
 */
describe("the nav", () => {
  const pages = readdirSync(SITE).filter((f) => f.endsWith(".html"));

  it("has pages to check at all", () => {
    assert.ok(pages.length >= 4, `expected at least four pages, found ${pages.length}`);
  });

  for (const page of pages) {
    it(`${page} links to the portfolio, once`, () => {
      const src = readFileSync(join(SITE, page), "utf8");
      assert.equal(
        (src.match(/data-i18n="nav\.portfolio"/g) ?? []).length, 1,
        `${page} does not carry exactly one portfolio link`,
      );
      assert.match(src, /href="https:\/\/arsalanrc\.github\.io"/, `${page} points somewhere else`);
    });
  }
});
