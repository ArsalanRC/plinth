import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { currentAccount, disconnect, signedOut } from "../../site/chain.js";

/**
 * Signing the page out of a wallet.
 *
 * The behaviour worth pinning is not that a variable got cleared. It is that
 * the page stops answering with an address the wallet would still happily hand
 * over. MetaMask keeps the permission whatever this site does, so `eth_accounts`
 * goes on returning the account, and a sign-out that trusted it would be undone
 * by the silent reconnect on the very next load.
 *
 * The wallet is stubbed rather than mocked through a library, for the same
 * reason `abi.ts` exists: this project talks to the provider by hand, so the
 * thing to check is the hand-written call.
 */
describe("signing out", () => {
  const ACCOUNT = "0x9dacea62daf0ac225a3ecbf81a574863e4ea744a";

  /** A wallet that has already granted this site an account, and says so. */
  function stubWallet() {
    let revoked = false;

    (globalThis as Record<string, unknown>).ethereum = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_accounts") return revoked ? [] : [ACCOUNT];
        if (method === "wallet_revokePermissions") {
          revoked = true;
          return null;
        }
        throw new Error(`unexpected call: ${method}`);
      },
    };

    return { revoked: () => revoked };
  }

  it("hands the permission back to a wallet that can take it", async () => {
    const wallet = stubWallet();

    // Before: the page is connected and the wallet confirms it.
    assert.equal(signedOut(), false);
    assert.equal((await currentAccount())?.toLowerCase(), ACCOUNT);

    await disconnect();

    assert.equal(signedOut(), true);
    assert.equal(await currentAccount(), null);
    assert.equal(wallet.revoked(), true);
  });

  /*
   * This is the one that pins the local flag, and it is worth saying why.
   *
   * A wallet that really revokes then answers `eth_accounts` with an empty
   * list, so the test above passes with or without the guard in
   * `currentAccount`. Only a wallet that cannot revoke tells the two apart, and
   * `wallet_revokePermissions` is far from universal. Checked by removing the
   * guard: this test fails and the one above does not.
   */
  it("survives a wallet that cannot revoke, because most of them could not", async () => {
    (globalThis as Record<string, unknown>).ethereum = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_accounts") return [ACCOUNT];
        throw new Error("The method wallet_revokePermissions does not exist");
      },
    };

    // Throwing is the honest answer from a wallet that has not implemented it,
    // and it must not become an error the visitor sees. The local flag is what
    // makes the button behave the same everywhere.
    await assert.doesNotReject(() => disconnect());
    assert.equal(signedOut(), true);
    assert.equal(await currentAccount(), null);
  });
});
