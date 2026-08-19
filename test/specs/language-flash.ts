import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * No frame of the wrong language, on any page.
 *
 * The markup is written in English and translated in place once `chrome.js`
 * loads. That module is deferred, so without a guard a German visitor gets one
 * painted frame of English on every navigation. It is brief and it is very
 * visible, and it was reported as a flicker between the two languages.
 *
 * The fix has three parts in three files, and the failure mode is that they
 * drift: somebody adds a page and copies the markup without the inline guard.
 * That is not hypothetical here. `profile.html` was added the same day and the
 * nav it copied had been half-finished for weeks.
 *
 * So this checks the parts are all present rather than trying to catch a single
 * frame in a headless browser, which is timing-dependent and would be flaky.
 */
describe("no language flash", () => {
  const SITE = join(import.meta.dirname, "../../site");
  const pages = readdirSync(SITE).filter((f) => f.endsWith(".html"));

  it("has pages to check at all", () => {
    // A glob that silently matches nothing is the classic way this kind of
    // test reports success without checking anything.
    assert.ok(pages.length >= 3, `expected at least three pages, found ${pages.length}`);
  });

  for (const page of pages) {
    it(`${page} hides itself until the translation has run`, () => {
      const html = readFileSync(join(SITE, page), "utf8");

      // Set before first paint, which is the only moment it can be set. An
      // external file would be a round trip during which the page paints.
      assert.match(
        html,
        /dataset\.i18nPending\s*=\s*"1"/,
        `${page} does not arm the guard before first paint`,
      );

      // Only for languages that need swapping, so English pays nothing.
      assert.match(
        html,
        /document\.documentElement\.lang\s*!==\s*"en"/,
        `${page} hides every visitor rather than only the ones needing a swap`,
      );

      // A page whose JavaScript never arrives has to appear anyway.
      assert.match(
        html,
        /setTimeout[\s\S]{0,120}delete\s+document\.documentElement\.dataset\.i18nPending/,
        `${page} has no fallback, so a failed module would leave it blank forever`,
      );
    });
  }

  it("the stylesheet actually hides the body while the guard is armed", () => {
    const css = readFileSync(join(SITE, "base.css"), "utf8");

    assert.match(
      css,
      /html\[data-i18n-pending\]\s+body\s*\{[^}]*visibility:\s*hidden/,
      "base.css has no rule, so the attribute would be decoration",
    );
  });

  it("the translator clears the guard once the swap is done", () => {
    const chrome = readFileSync(join(SITE, "chrome.js"), "utf8");

    // Cleared after the strings are applied rather than when the module loads.
    // It is the finished swap that makes the page safe to look at.
    const applyLang = chrome.slice(chrome.indexOf("function applyLang"));
    assert.match(
      applyLang.slice(0, applyLang.indexOf("function applyTheme")),
      /delete\s+root\.dataset\.i18nPending/,
      "chrome.js never clears the guard, so translated pages would stay hidden",
    );
  });
});
