# consign

**English** · [Deutsch](./README.de.md)

### [→ See how it settles](https://arsalanrc.github.io/consign)

A consignment marketplace for ERC-721 tokens. The seller keeps the token, and
the contract holds nothing but the buyer's money, only until somebody withdraws
it.

Solidity 0.8.28, Hardhat 3, OpenZeppelin. 70 tests. Every defence in it has been
deleted on purpose, to check that a test notices.

---

## The four decisions

Each one is here because the obvious alternative fails quietly.

### The seller keeps the token

Listing grants an approval. Nothing moves until somebody buys.

A marketplace that takes custody can strand your token behind its own bug, which
is a worse failure than anything waiting on the other side of a trade. The cost
of staying out of the way is that a listing can go stale, so `buy` checks for it
before settling anything. The seller must still own the token. The approval must
still stand.

Anybody can clear a stale listing. Sellers who have moved on do not come back to
tidy up, so until somebody else does, the listing sits in every front end
looking real.

### Nobody is paid during the sale

`buy` credits a balance. Sellers call `withdraw` when they want the money.

Paying inside the sale hands a seller the power to break their own listing. A
contract whose `receive` reverts makes every purchase of its items fail, and the
buyer is the one left looking at the error. Crediting keeps the fault with the
party that caused it. There is a test where exactly that seller sells anyway.

### The listing is deleted before the token moves

`safeTransferFrom` calls the buyer back, and the buyer chooses what runs there.

Any contract that prices or lends against a listing can be made to read it at
that exact instant. Delete the listing afterwards, and every one of those
readers sees a token still offered by somebody who no longer owns it. That is a
true answer to the wrong question. Read-only reentrancy has cost real money on
exactly this mistake.

### Royalties are capped at ten percent

`royaltyInfo` is somebody else's code answering a question about money.

A collection can report a royalty larger than the price it is being paid.
Uncapped, subtracting that underflows the seller's share, and every sale of that
collection reverts from then on. The marketplace looks like the broken party.
Capping keeps the sale alive, and it keeps the damage inside the collection that
caused it.

A royalty naming the zero address is refused too, because crediting it is not a
failed payment: it is a successful payment nobody can ever collect.

---

## The mutation check

A security test that passes against an undefended contract is a claim, not a
check, and there is no way to tell the two apart by reading. So `pnpm mutate`
deletes each defence in turn, and fails if the suite stays green.

It caught two hollow tests on its first run. Both had looked fine.

**The reentrancy test passed with the guard removed.** The marketplace held only
what the attacker was owed, so the nested withdrawal failed for want of balance,
and the arithmetic was doing the work. It now sells three other tokens first. A
drain would take money belonging to somebody else, and the assertion can watch
it go.

**The ordering test passed with the ordering reversed.** The staleness check
already refuses the nested purchase, so the ordering never came into it. What
the ordering actually protects is a contract reading mid-callback, and
`SaleObserver` tests that directly.

Eight mutations now. All eight caught.

```bash
pnpm mutate
```

---

## Running it

```bash
git clone https://github.com/ArsalanRC/consign.git
cd consign
pnpm install

pnpm test      # 70 tests
pnpm mutate    # 8 mutations, each one must be caught
pnpm check     # lint, types, tests
```

Hardhat 3 needs Node 22 or newer. CI runs 22 and 24.

---

## What is where

| Path | What it holds |
|---|---|
| `contracts/Consign.sol` | The marketplace: listing, buying, settlement, fees |
| `contracts/ConsignCollection.sol` | The ERC-721, with a royalty and a supply that cannot grow |
| `contracts/mocks/` | Contracts that misbehave on purpose |
| `test/specs/` | The suite, one file per concern |
| `scripts/mutate.ts` | Deletes each defence and checks a test notices |
| `scripts/deploy.ts` | Deployment, run by hand, never by CI |

The ERC-721 itself comes from OpenZeppelin. Writing your own is not a display of
skill: it is a place to put a bug that costs somebody their token. The judgement
here is in what sits around the standard.

---

## Deploying to Amoy

Amoy is Polygon's testnet, and its POL is free from a faucet.

```bash
pnpm hardhat keystore set AMOY_RPC_URL
pnpm hardhat keystore set AMOY_PRIVATE_KEY
pnpm deploy:amoy
```

The key lives in Hardhat's encrypted keystore. Nothing in this repository reads
a key from a dotfile, or from an environment variable it sets itself. Use a
wallet that holds nothing you would miss.

The script reads both contracts back after deploying them, because a
constructor that reverts still leaves an address behind, and a receipt is not
proof.

---

## What is deliberately missing

Auctions, offers, bundles and an order book. Every one of them is a real
feature, and not one of them would change the argument this repository is
making.

There is no upgrade path either. A proxy would let the owner rewrite the
settlement rules after people had already trusted them. The fee cap is only
worth something because nobody can raise it later.

---

## Author

Built by Arsalan Khadim.

[LinkedIn](https://www.linkedin.com/in/muhammad-arsalan-khadim-b87550259/) ·
[GitHub](https://github.com/ArsalanRC) ·
[Portfolio](https://arsalanrc.github.io)

## Licence

MIT. See [LICENSE](./LICENSE).
