# plinth

**English** · [Deutsch](./README.de.md)

### [→ Open the marketplace](https://arsalanrc.github.io/plinth)

An NFT marketplace on Polygon. Mint a token, list it, buy somebody else's. The
art is generated on chain, the seller keeps custody until it sells, and nobody
is paid during the sale.

No server, no account, no database. The page is static, and it talks to the
chain with no wallet library at all.

Solidity 0.8.28, Hardhat 3, OpenZeppelin. 100 tests.

---

## Try it without a wallet

Most people will not install a browser extension to look at a portfolio piece,
so the whole marketplace runs on invented state until somebody connects one.
Every button works. Every refusal is the contract's own refusal, so buying your
own listing fails there for the same reason it fails on chain.

A demo that only shows the happy path teaches you something untrue.

---

## The four decisions

Each one is here because the obvious alternative fails quietly.

### The seller keeps the token

Listing grants an approval. Nothing moves until somebody buys.

A marketplace that takes custody can strand your token behind its own bug. That
is a worse failure than anything on the other side of the trade. The cost of
staying out of the way is that a listing can go stale, so `buy` checks for it.
The seller must still own the token. The approval must still stand.

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
collection reverts from then on. Capping keeps the sale alive, and it keeps the
damage inside the collection that caused it. A royalty naming the zero address
is refused too, because crediting it is not a failed payment: it is a successful
payment nobody can ever collect.

---

## The art is on chain

`tokenURI` returns a base64 JSON document with the image inside it. There is no
IPFS hash, no pinning service and no gateway. The picture is built from the
token id every time it is asked for, so it lasts exactly as long as the chain
does.

This started as the usual link to IPFS. That link pointed at nothing, which is
the same class of live defect as an install line nobody ever published.

Each token draws its own royalty: one bar, split where the creator's share
falls. A test asserts that the picture and `royaltyInfo` can never disagree.
Art that states a number its own contract will not honour is decoration
pretending to be data.

It draws the royalty and nothing else, on purpose. A marketplace fee would make
a better picture, and the collection has no way to know one.

---

## No wallet library

`site/abi.js` encodes calls and decodes returns by hand. No ethers, no viem,
nothing from a CDN. A marketplace front end normally pulls in a hundred
kilobytes of somebody else's code to format hexadecimal.

Function selectors are constants rather than computed, because computing them
needs keccak256 and browsers do not provide it. Shipping a hash implementation
to save typing twenty-seven hex strings is a bad trade.

What makes that defensible is the test. `test/specs/abi.ts` deploys both
contracts on a real chain and sends real call data through this codec, then
compares every answer with the typed contract. An encoder that is wrong does not
throw. It produces neat hexadecimal that the node misreads, and testing it
against itself proves nothing at all.

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

Eight mutations now. All eight caught, on every push.

---

## Running it

```bash
git clone https://github.com/ArsalanRC/plinth.git
cd plinth
pnpm install

pnpm test      # 100 tests
pnpm mutate    # 8 mutations, each one must be caught
pnpm check     # lint, types, tests
```

Hardhat 3 needs Node 22 or newer. CI runs 22 and 24.

To serve the page, anything static will do:

```bash
cd site && python3 -m http.server 8000
```

---

## What is where

| Path | What it holds |
|---|---|
| `contracts/Plinth.sol` | The marketplace: listing, buying, settlement, fees |
| `contracts/PlinthCollection.sol` | The ERC-721, with a fixed supply and a royalty per token |
| `contracts/Art.sol` | The picture and the metadata, both built from the token id |
| `contracts/mocks/` | Contracts that misbehave on purpose |
| `site/abi.js` | The codec, tested against a real node |
| `site/chain.js` | Wallet and chain, through `window.ethereum` |
| `site/demo.js` | The marketplace with nobody's wallet attached |
| `scripts/mutate.ts` | Deletes each defence and checks a test notices |

The ERC-721 itself comes from OpenZeppelin. Writing your own is not a display of
skill: it is a place to put a bug that costs somebody their token. The judgement
here is in what sits around the standard.

---

## Deploying your own

Amoy is Polygon's testnet, and its POL is free from
[the faucet](https://faucet.polygon.technology).

```bash
pnpm hardhat keystore set AMOY_RPC_URL       # https://rpc-amoy.polygon.technology
pnpm hardhat keystore set AMOY_PRIVATE_KEY   # a throwaway wallet, not a real one
pnpm deploy:amoy
```

Put the two addresses it prints into `site/config.js` and serve the page.

The key lives in Hardhat's encrypted keystore. Nothing in this repository reads
a key from a dotfile, or from an environment variable it sets itself. The script
reads both contracts back after deploying them, because a constructor that
reverts still leaves an address behind, and a receipt is not proof.

---

## Is a static page safe for this?

Yes, and it is the ordinary way to build one.

MetaMask injects a provider into the page. The page asks it to sign; the
extension shows you the dialog and keeps your key. Nothing here ever sees a
private key, and there is no server to store one on. Reads go to a public RPC,
which is a public read.

Having no backend is the security argument, not a compromise on it.

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
