/**
 * Page copy, English and German.
 *
 * Each language is written as itself, never translated across. Terms German
 * engineers say in English stay in English: Wallet, Listing, Royalty, Testnet,
 * Gas, minten.
 *
 * Interface copy cannot satisfy both the sentence-length rule and the corpus
 * the humanize pipeline measures against. A page made of labels and buttons has
 * no room to vary sentence length, so the length rule wins here and the prose
 * in the README carries the score.
 */

export const STRINGS = {
  en: {
    "meta.title": "plinth · an NFT marketplace on Polygon",
    "nav.lang": "Deutsch",
    "nav.source": "Source",
    "nav.linkedin": "LinkedIn",
    "nav.portfolio": "Portfolio",
    "nav.connect": "Connect",
    "nav.market": "Market",
    "nav.collection": "Collection",
    "nav.profile": "Profile",
    "nav.signout": "Sign out",
    "nav.start": "Start here",

    "start.metaTitle": "Start here · plinth",
    "start.title": "New to all this? Start here.",
    "start.sub": "Three routes in. One needs nothing, one is free with a wallet, one spends real money.",

    /*
     * Named for what they are rather than numbered, because the numbers moved.
     * There were four routes and one of them was a prerequisite rather than a
     * destination, which is the confusion this rewrite was asked to fix.
     */
    "start.pick1": "Just look around",
    "start.pick1sub": "No wallet, nothing installed, nothing at risk.",
    "start.pick2": "Play for free on Amoy",
    "start.pick2sub": "A wallet, a test network, and coins that cost nothing.",
    "start.pick3": "Mint on real Polygon",
    "start.pick3sub": "A wallet with real POL. Cents, not euros.",

    "start.need": "You need",
    "start.cost": "It costs",
    "start.get": "You get",

    "start.look.need": "Nothing at all",
    "start.look.cost": "Nothing",
    "start.look.get": "The whole market, on invented data",
    "start.free.need": "MetaMask, and about two minutes",
    "start.free.cost": "Nothing. The coins are free",
    "start.free.get": "Mint a cat, list it, buy one",
    "start.main.need": "MetaMask holding real POL",
    "start.main.cost": "A few cents of gas",
    "start.main.get": "A dog on Polygon mainnet",

    "start.look.title": "Just look around",
    "start.look.body":
      "The market and the collection both work with nothing installed. You get invented listings and real artwork, drawn by the contract itself. Nothing you click can cost anything, because there is no wallet there to charge.",
    "start.look.cta": "Open the market",

    "start.free.title": "Play for free on Amoy",
    "start.free.body":
      "Amoy is Polygon's test network. The coins are free and worth nothing, which is exactly the point. You can mint, list and buy here without spending anything real.",
    "start.free.step1": "Install MetaMask from its own site. Never from a search advert.",
    "start.free.dl": "metamask.io/download",
    "start.free.step2": "Choose Create a new wallet. The password is for this browser only.",
    "start.free.step3": "Write the twelve words on paper. Not a photo, not a notes app.",
    "start.free.warn":
      "Anybody holding those twelve words owns everything in the wallet. No support desk can undo it. This site never asks for them and could not use them.",
    "start.free.step4": "Add Amoy with this button. Your wallet asks you first.",
    "start.free.step5": "Get free test POL. One claim is enough for a mint.",
    "start.free.step6": "Come back, press Connect, and mint a cat.",
    "start.free.add": "Add Amoy to MetaMask",
    "start.free.added": "Done. Amoy is in your network list now.",
    "start.free.failed": "MetaMask turned that down. You can add it by hand instead.",
    "start.free.nowallet": "Install a wallet first and this button starts working.",
    "start.free.faucet": "Open the faucet",
    "start.free.mint": "Mint a cat",
    "start.free.docs": "MetaMask's own guide",

    "start.main.title": "Mint on real Polygon",
    "start.main.body":
      "Plinth Dogs runs on Polygon mainnet. The POL there is real money, so a mint costs real gas. Your wallet shows the exact amount before you sign. The cats stay on Amoy, where everything is free.",
    "start.main.step1": "Use the same wallet. No wallet yet? Start at step one above.",
    "start.main.back": "back to step one",
    "start.main.step2": "Switch to Polygon with this button.",
    "start.main.step3": "Put real POL in that wallet. You buy it on an exchange and send it to your own address.",
    "start.main.step4": "Open the dogs and mint one. The wallet shows the cost first.",
    "start.main.add": "Switch MetaMask to Polygon",
    "start.main.added": "Done. Your wallet is on Polygon now.",
    "start.main.failed": "MetaMask turned that down. You can switch by hand instead.",

    "prof.metaTitle": "Your wallet · plinth",
    "prof.title": "Your wallet",
    "prof.sub": "What this address holds, read from the chain.",
    "prof.owned": "Held",
    "prof.listed": "Listed",
    "prof.proceeds": "Owed to you",
    "prof.balance": "Balance",
    "prof.across": "Collections",
    "prof.chains": "Chains",
    "prof.viewContract": "Contract",
    "prof.withdraw": "Withdraw",
    "prof.items": "Your tokens",
    "prof.connect": "Connect a wallet to see what it holds.",
    "prof.connectCta": "Connect",
    "prof.headHint": "Nothing is read until you do. No address, no numbers.",
    "prof.empty": "This address holds nothing yet.",
    "prof.emptyCta": "Mint one on the market",
    "prof.tokenListed": "Listed for {price}",
    "prof.tokenIdle": "Not listed",
    "prof.explorer": "View on the explorer",
    "prof.noWallet": "No wallet found in this browser.",
    "prof.privacy":
      "Whatever address you connect is the one shown. Nothing about the owner is stored anywhere, because there is nowhere to store it.",

    "col.metaTitle": "The collection · plinth",
    "col.by": "Created by",
    "col.testnet": "testnet",
    "col.open": "Open {name}",
    "col.mint": "Mint one",
    "col.mintConnect": "Connect a wallet to mint.",
    "col.mintSwitch": "Approve the network switch in your wallet.",
    "col.mintSigning": "Check your wallet.",
    "col.mintMining": "Waiting for the chain.",
    "col.mintDone": "Minted.",
    "col.mintRefused": "Your wallet turned that down.",
    "col.mintSoldOut": "Every token in this collection is minted.",
    "col.pending": "Not deployed yet. The artwork below is drawn by the contract, and there is nothing on chain to buy.",
    "col.desc.cats":
      "500 cats, each drawn by the contract itself from seven weighted layers. No IPFS, no pinning service, no server. The rarity below is counted across the whole supply, not estimated.",
    "col.desc.dogs":
      "5000 dogs, drawn by the contract from nine weighted layers. Two more layers than the cats, which is close to what fits inside a contract at all. The rarity below is counted across the whole supply.",
    "col.items": "Minted",
    "col.supply": "Supply",
    "col.owners": "Owners",
    "col.listed": "Listed",
    "col.floor": "Floor",
    "col.traits": "Traits",
    "col.clear": "Clear",
    "col.sort": "Sort",
    "col.sortId": "Token id",
    "col.sortRare": "Rarest first",
    "col.sortPrice": "Price",
    "col.showing": "{n} of {total}",
    "col.rarest": "rarest trait",
    "col.none": "Nothing matches those traits.",

    "layer.Background": "Background",
    "layer.Fur": "Fur",
    "layer.Coat": "Coat",
    "layer.Pattern": "Pattern",
    "layer.Ears": "Ears",
    "layer.Eyes": "Eyes",
    "layer.Eye shape": "Eye shape",
    "layer.Mouth": "Mouth",
    "layer.Muzzle": "Muzzle",
    "layer.Collar": "Collar",
    "layer.Accessory": "Accessory",

    "tok.owner": "Owned by",
    "tok.you": "you",
    "tok.price": "Price",
    "tok.traits": "Traits",
    "tok.details": "Details",
    "tok.have": "{p} have this",
    "tok.contract": "Contract",
    "tok.tokenId": "Token id",
    "tok.standard": "Standard",
    "tok.chain": "Chain",
    "tok.royalty": "Creator royalty",
    "tok.demoOnly": "demo, nothing deployed",

    "theme.toLight": "Switch to the light theme",
    "theme.toDark": "Switch to the dark theme",

    /*
     * The chains are appended by the page, from the registry.
     *
     * This line named Polygon Amoy and nothing else for weeks after the dogs
     * went live on mainnet, which made the first thing anybody reads the one
     * thing that was out of date. Written out, it goes stale on the next
     * deploy. Derived, it cannot.
     */
    "hero.kicker": "Solidity · ERC-721 · ERC-2981",
    "hero.title": "A marketplace<br />that keeps <em>nothing</em>.",
    "hero.lede":
      "Mint a token, list it, buy somebody else's. The art is generated on chain, the seller keeps custody until it sells, and nobody is paid during the sale. No server, no account, no data stored anywhere.",
    "hero.connect": "Connect a wallet",
    "hero.connected": "Wallet connected",
    "hero.browse": "Browse the market",

    "wallet.account": "Account",
    "wallet.balance": "Balance",
    "wallet.owned": "Tokens held",
    "wallet.proceeds": "Owed to you",
    "wallet.withdraw": "Withdraw",
    "wallet.demo": "Demo",
    "wallet.demoAccount": "0xDEM0…DEM0",

    "faucet.title": "Test POL",
    "faucet.body":
      "Amoy POL is free but rationed. This faucet hands on what its owner claimed, so it runs dry some mornings. The demo needs no wallet and no POL at all.",
    "faucet.get": "Get test POL",
    "faucet.public": "Public faucet",
    "faucet.claims": "{n} claims left",
    "faucet.one": "1 claim left",
    "faucet.empty": "Empty",
    "faucet.wait": "Again in {t}",
    "faucet.none": "Not deployed",
    "faucet.ready": "Ready",
    "faucet.noteCooldown": "One claim per address a day, counted by the contract itself.",
    "faucet.noteDry":
      "There is nothing in it right now. The public faucet still works, and it is what refills this one.",
    "faucet.noteZero":
      "A wallet at zero cannot claim, because sending that transaction costs gas. Take the first POL from the public faucet.",
    "faucet.noteDemo": "Connect a wallet to claim. Or stay in the demo, which costs nothing.",
    "faucet.noteNone": "No faucet is deployed yet. The public one works today.",

    "market.eyebrow": "The market",
    "market.title": "Everything currently for sale",
    "market.body":
      "Each token stays with whoever listed it. This contract never takes custody, so a listing can go stale, and buying one checks that the seller still owns it before a single wei moves.",
    "market.empty": "Nothing is listed right now.",
    "market.which": "This market trades {name} on {chain}.",

    "mine.eyebrow": "Your side",
    "mine.title": "Mint one, then put it up",
    "mine.body":
      "Minting is open to anyone and the art is built from the token id, so no two look alike and none of it is stored off chain. Listing grants an approval rather than handing the token over.",
    "mine.chains": "Two collections on two chains. One is free to try, the other is real money.",
    "mine.mintOne": "Mint",
    "mine.mintDemo": "Minted in the demo. Connect a wallet to do it on Amoy.",
    "mine.mintReal": "The dogs live on Polygon, so a mint costs real POL. Connect a wallet first.",
    "mine.empty": "You do not hold any tokens yet.",

    // What a mint on that chain costs the person pressing the button. The two
    // are priced in the same ticker and not in the same money.
    "chain.free": "POL is free",
    "chain.real": "real POL",

    "item.token": "Token",
    "item.unlisted": "Not listed",
    "item.royalty": "Royalty",
    "item.buy": "Buy",
    "item.list": "List",
    "item.cancel": "Cancel listing",
    "item.pricePlaceholder": "Price in POL",

    "split.eyebrow": "Settlement",
    "split.title": "Where the money goes",
    "split.body":
      "Every sale divides three ways and the whole of it is owed to somebody. Nothing is sent during the sale. All three shares are credited, and each party withdraws when it suits them.",
    "split.sceneTitle": "A sale, divided",
    "split.seller": "Seller",
    "split.creator": "Creator royalty",
    "split.market": "Marketplace fee",
    "split.fee": "Fee",
    "split.caption":
      "Drawn from the first listing above, at the rate that token actually carries. The royalty is registered per token and matches the number its own picture draws.",

    "pay.eyebrow": "The reason",
    "pay.title": "A seller who cannot be paid",
    "pay.body":
      "Some sellers are contracts, and a contract can refuse money. If the marketplace pays during the sale, that refusal takes the whole sale down and the buyer sees the error. Both lanes run the same sale against the same awkward seller.",
    "pay.sceneTitle": "Same sale, two settlement rules",
    "pay.pushTitle": "Paid during the sale",
    "pay.pushSub": "The obvious way. Send the money inside buy().",
    "pay.pullTitle": "Credited, withdrawn later",
    "pay.pullSub": "What this contract does.",
    "pay.caption":
      "The seller is a contract whose receive() reverts. Only one of these lanes leaves the buyer holding the token.",

    "common.replay": "Replay",

    "busy.connect": "Opening your wallet",
    "busy.sign": "Waiting for you to sign",
    "busy.approve": "Approving the marketplace first",
    "busy.mining": "Waiting for the chain",

    "ok.connected": "Connected.",
    "ok.minted": "Minted",
    "ok.listed": "Listed",
    "ok.cancelled": "Listing cancelled",
    "ok.bought": "Bought",
    "ok.withdrew": "Withdrew",

    "err.rejected": "You cancelled that in your wallet.",
    "err.wrongChain": "Your wallet is on another network. Switch it back and try again.",
    "err.noWallet": "No wallet found. Install MetaMask, or keep browsing the demo.",
    "err.notDeployed": "Nothing is deployed yet, so the demo is all there is to show.",
    "err.ownListing": "That is your own listing.",
    "err.demoSoldOut": "The demo gallery is only twelve tokens.",
    "err.reverted": "The chain refused that.",
    "err.timeout": "Still not mined. Check your wallet.",
    "err.NotListed": "That is not for sale.",
    "err.AlreadyListed": "That is already listed.",
    "err.NotOwner": "You do not own that.",
    "err.NotSeller": "That is not your listing.",
    "err.NotApproved": "The marketplace is not approved to move that token.",
    "err.PriceIsZero": "Give it a price above zero.",
    "err.WrongPayment": "The price changed. Reload and try again.",
    "err.ListingStale": "The seller moved that token. The listing is dead.",
    "err.NothingToWithdraw": "You are not owed anything.",
    "err.SoldOut": "The collection is sold out.",
    "err.TooSoon": "You claimed already today. Come back tomorrow.",
    "err.Dry": "The faucet is empty. Try the public one.",
    "err.TooFull": "The faucet is already full.",

    "ok.dripped": "Test POL on its way",

    "status.eyebrow": "Where it stands",
    "status.title": "Done, and deliberately not done",
    "status.done": "done",
    "status.next": "not yet",
    "status.p1": "Marketplace and collection, 132 tests, mutation check in CI",
    "status.p2": "Art generated on chain, no IPFS, nothing to pin",
    "status.p3": "Wallet, mint, list, buy and withdraw, plus a demo for everyone else",
    "status.p4": "Live on Polygon Amoy",
    "status.p5": "Auctions and offers",
    "status.caption":
      "There is no upgrade path and there will not be one. A proxy would let the owner rewrite the settlement rules after people had already trusted them.",

    "foot.built": "Built by",
    "foot.deps": "No wallet library, no framework, no build step",
  },

  de: {
    "meta.title": "plinth · ein NFT-Marktplatz auf Polygon",
    "nav.lang": "English",
    "nav.source": "Quellcode",
    "nav.linkedin": "LinkedIn",
    "nav.portfolio": "Portfolio",
    "nav.connect": "Verbinden",
    "nav.market": "Markt",
    "nav.collection": "Collection",
    "nav.profile": "Profil",
    "nav.signout": "Trennen",
    "nav.start": "Hier starten",

    "start.metaTitle": "Hier starten · plinth",
    "start.title": "Neu bei alldem? Fang hier an.",
    "start.sub": "Drei Wege hinein. Einer braucht nichts, einer ist gratis mit Wallet, einer kostet echtes Geld.",

    "start.pick1": "Nur umsehen",
    "start.pick1sub": "Kein Wallet, nichts installiert, kein Risiko.",
    "start.pick2": "Gratis auf Amoy spielen",
    "start.pick2sub": "Ein Wallet, ein Testnetz, und Coins ohne Wert.",
    "start.pick3": "Auf echtem Polygon minten",
    "start.pick3sub": "Ein Wallet mit echtem POL. Cent, nicht Euro.",

    "start.need": "Du brauchst",
    "start.cost": "Es kostet",
    "start.get": "Du bekommst",

    "start.look.need": "Gar nichts",
    "start.look.cost": "Nichts",
    "start.look.get": "Den ganzen Markt, mit erfundenen Daten",
    "start.free.need": "MetaMask und etwa zwei Minuten",
    "start.free.cost": "Nichts. Die Coins sind gratis",
    "start.free.get": "Eine Katze minten, einstellen, kaufen",
    "start.main.need": "MetaMask mit echtem POL",
    "start.main.cost": "Ein paar Cent Gas",
    "start.main.get": "Einen Hund auf Polygon Mainnet",

    "start.look.title": "Nur umsehen",
    "start.look.body":
      "Markt und Collection laufen ohne alles. Du siehst erfundene Listings und echte Grafik, vom Vertrag selbst gezeichnet. Klicken kostet nichts, weil es kein Wallet gibt, das zahlen könnte.",
    "start.look.cta": "Zum Markt",

    "start.free.title": "Gratis auf Amoy spielen",
    "start.free.body":
      "Amoy ist das Testnetz von Polygon. Die Coins sind gratis und wertlos, und genau darum geht es. Du kannst hier minten, listen und kaufen, ohne echtes Geld auszugeben.",
    "start.free.step1": "MetaMask von der eigenen Seite installieren. Nie über eine Suchanzeige.",
    "start.free.dl": "metamask.io/download",
    "start.free.step2": "Neues Wallet erstellen wählen. Das Passwort gilt nur für diesen Browser.",
    "start.free.step3": "Die zwölf Wörter auf Papier schreiben. Kein Foto, keine Notiz-App.",
    "start.free.warn":
      "Wer diese zwölf Wörter hat, besitzt alles im Wallet. Kein Support macht das rückgängig. Diese Seite fragt nie danach und könnte damit nichts anfangen.",
    "start.free.step4": "Amoy mit diesem Button hinzufügen. Dein Wallet fragt vorher.",
    "start.free.step5": "Kostenloses Test-POL holen. Eine Abholung reicht für einen Mint.",
    "start.free.step6": "Zurückkommen, Verbinden drücken, eine Katze minten.",
    "start.free.add": "Amoy zu MetaMask hinzufügen",
    "start.free.added": "Fertig. Amoy steht jetzt in deiner Netzwerkliste.",
    "start.free.failed": "MetaMask hat abgelehnt. Du kannst es auch von Hand eintragen.",
    "start.free.nowallet": "Erst ein Wallet installieren, dann geht dieser Button.",
    "start.free.faucet": "Faucet öffnen",
    "start.free.mint": "Katze minten",
    "start.free.docs": "Die Anleitung von MetaMask",

    "start.main.title": "Auf echtem Polygon minten",
    "start.main.body":
      "Plinth Dogs läuft auf Polygon Mainnet. Das POL dort ist echtes Geld, ein Mint kostet also echtes Gas. Dein Wallet zeigt den genauen Betrag, bevor du signierst. Die Katzen bleiben auf Amoy, dort ist alles gratis.",
    "start.main.step1": "Dasselbe Wallet nehmen. Noch keins? Dann oben bei Schritt eins anfangen.",
    "start.main.back": "zurück zu Schritt eins",
    "start.main.step2": "Mit diesem Button auf Polygon wechseln.",
    "start.main.step3": "Echtes POL ins Wallet legen. Man kauft es an einer Börse und schickt es an die eigene Adresse.",
    "start.main.step4": "Die Hunde öffnen und einen minten. Die Kosten zeigt das Wallet vorher.",
    "start.main.add": "MetaMask auf Polygon umstellen",
    "start.main.added": "Fertig. Dein Wallet ist jetzt auf Polygon.",
    "start.main.failed": "MetaMask hat abgelehnt. Du kannst auch von Hand wechseln.",

    "prof.metaTitle": "Dein Wallet · plinth",
    "prof.title": "Dein Wallet",
    "prof.sub": "Was diese Adresse hält, direkt von der Chain gelesen.",
    "prof.owned": "Gehalten",
    "prof.listed": "Gelistet",
    "prof.proceeds": "Dir zusteht",
    "prof.balance": "Guthaben",
    "prof.across": "Collections",
    "prof.chains": "Chains",
    "prof.viewContract": "Vertrag",
    "prof.withdraw": "Abholen",
    "prof.items": "Deine Token",
    "prof.connect": "Verbinde ein Wallet, um seinen Bestand zu sehen.",
    "prof.connectCta": "Verbinden",
    "prof.headHint": "Vorher wird nichts gelesen. Keine Adresse, keine Zahlen.",
    "prof.empty": "Diese Adresse hält noch nichts.",
    "prof.emptyCta": "Auf dem Markt einen minten",
    "prof.tokenListed": "Gelistet für {price}",
    "prof.tokenIdle": "Nicht gelistet",
    "prof.explorer": "Im Explorer ansehen",
    "prof.noWallet": "In diesem Browser ist kein Wallet vorhanden.",
    "prof.privacy":
      "Gezeigt wird die Adresse, die du verbindest. Über den Besitzer wird nichts gespeichert, denn es gibt keinen Ort dafür.",

    "col.metaTitle": "Die Collection · plinth",
    "col.by": "Erstellt von",
    "col.testnet": "Testnetz",
    "col.open": "Zu {name}",
    "col.mint": "Einen minten",
    "col.mintConnect": "Verbinde ein Wallet zum Minten.",
    "col.mintSwitch": "Bestätige den Netzwerkwechsel im Wallet.",
    "col.mintSigning": "Schau in dein Wallet.",
    "col.mintMining": "Warten auf die Chain.",
    "col.mintDone": "Geminted.",
    "col.mintRefused": "Dein Wallet hat abgelehnt.",
    "col.mintSoldOut": "Diese Collection ist vollständig geminted.",
    "col.pending": "Noch nicht deployed. Die Grafik unten zeichnet der Vertrag, auf der Chain gibt es aber nichts zu kaufen.",
    "col.desc.cats":
      "500 Katzen, jede vom Vertrag selbst aus sieben gewichteten Ebenen gezeichnet. Kein IPFS, kein Pinning-Dienst, kein Server. Die Rarität unten ist über die gesamte Supply gezählt, nicht geschätzt.",
    "col.desc.dogs":
      "5000 Hunde, vom Vertrag aus neun gewichteten Ebenen gezeichnet. Zwei Ebenen mehr als die Katzen, und damit nahe an dem, was in einen Vertrag überhaupt passt. Die Rarität unten ist über die gesamte Supply gezählt.",
    "col.items": "Geminted",
    "col.supply": "Supply",
    "col.owners": "Besitzer",
    "col.listed": "Gelistet",
    "col.floor": "Floor",
    "col.traits": "Merkmale",
    "col.clear": "Zurücksetzen",
    "col.sort": "Sortieren",
    "col.sortId": "Token-ID",
    "col.sortRare": "Seltenste zuerst",
    "col.sortPrice": "Preis",
    "col.showing": "{n} von {total}",
    "col.rarest": "seltenstes Merkmal",
    "col.none": "Nichts passt zu diesen Merkmalen.",

    "layer.Background": "Hintergrund",
    "layer.Fur": "Fell",
    "layer.Coat": "Fell",
    "layer.Pattern": "Muster",
    "layer.Ears": "Ohren",
    "layer.Eyes": "Augen",
    "layer.Eye shape": "Augenform",
    "layer.Mouth": "Mund",
    "layer.Muzzle": "Schnauze",
    "layer.Collar": "Halsband",
    "layer.Accessory": "Accessoire",

    "tok.owner": "Gehört",
    "tok.you": "dir",
    "tok.price": "Preis",
    "tok.traits": "Merkmale",
    "tok.details": "Details",
    "tok.have": "{p} haben das",
    "tok.contract": "Vertrag",
    "tok.tokenId": "Token-ID",
    "tok.standard": "Standard",
    "tok.chain": "Chain",
    "tok.royalty": "Royalty",
    "tok.demoOnly": "Demo, nichts deployt",

    "theme.toLight": "Zum hellen Design wechseln",
    "theme.toDark": "Zum dunklen Design wechseln",

    // Die Chains hängt die Seite selbst an, aus der Registry. Siehe oben.
    "hero.kicker": "Solidity · ERC-721 · ERC-2981",
    "hero.title": "Ein Marktplatz,<br />der <em>nichts</em> behält.",
    "hero.lede":
      "Token minten, einstellen, den von jemand anderem kaufen. Die Grafik entsteht on chain, der Verkäufer behält den Token bis zum Verkauf, und während des Verkaufs wird niemand ausgezahlt. Kein Server, kein Konto, nirgends gespeicherte Daten.",
    "hero.connect": "Wallet verbinden",
    "hero.connected": "Wallet verbunden",
    "hero.browse": "Markt ansehen",

    "wallet.account": "Konto",
    "wallet.balance": "Guthaben",
    "wallet.owned": "Token",
    "wallet.proceeds": "Dir zusteht",
    "wallet.withdraw": "Abholen",
    "wallet.demo": "Demo",
    "wallet.demoAccount": "0xDEM0…DEM0",

    "faucet.title": "Test-POL",
    "faucet.body":
      "Amoy-POL kostet nichts, ist aber knapp. Was hier verteilt wird, hat der Betreiber selbst geholt. Manchmal ist deshalb morgens nichts mehr da. Die Demo läuft ganz ohne Wallet.",
    "faucet.get": "Test-POL holen",
    "faucet.public": "Offizielle Faucet",
    "faucet.claims": "reicht für {n}",
    "faucet.one": "reicht für einen",
    "faucet.empty": "Leer",
    "faucet.wait": "Wieder in {t}",
    "faucet.none": "Nicht deployed",
    "faucet.ready": "Bereit",
    "faucet.noteCooldown": "Eine Abholung pro Adresse und Tag, gezählt vom Contract selbst.",
    "faucet.noteDry":
      "Gerade ist nichts drin. Die offizielle Faucet läuft weiter, und aus ihr wird diese hier gefüllt.",
    "faucet.noteZero":
      "Mit null POL geht kein Abruf, denn auch der kostet Gas. Hol dir die ersten POL bei der offiziellen Faucet.",
    "faucet.noteDemo": "Zum Abholen die Wallet verbinden. Oder in der Demo bleiben, die kostet nichts.",
    "faucet.noteNone": "Es ist noch keine Faucet deployed. Heute hilft die offizielle.",

    "market.eyebrow": "Der Markt",
    "market.title": "Alles, was gerade zum Verkauf steht",
    "market.body":
      "Jeder Token bleibt bei dem, der ihn eingestellt hat. Dieser Vertrag übernimmt nie die Verwahrung. Ein Listing kann also veralten, und ein Kauf prüft erst, ob der Verkäufer den Token noch besitzt, bevor sich ein einziger Wei bewegt.",
    "market.empty": "Gerade steht nichts zum Verkauf.",
    "market.which": "Hier wird {name} auf {chain} gehandelt.",

    "mine.eyebrow": "Deine Seite",
    "mine.title": "Einen minten, dann anbieten",
    "mine.body":
      "Minten kann jeder, und die Grafik entsteht aus der Token-ID. Keine zwei sehen gleich aus, und nichts davon liegt off chain. Ein Listing erteilt ein Approval, statt den Token aus der Hand zu geben.",
    "mine.chains": "Zwei Collections, zwei Chains. Die eine ist gratis, die andere kostet echtes Geld.",
    "mine.mintOne": "Minten:",
    "mine.mintDemo": "Im Demo geminted. Verbinde ein Wallet, dann geht es auf Amoy.",
    "mine.mintReal": "Die Hunde liegen auf Polygon, ein Mint kostet also echtes POL. Verbinde zuerst ein Wallet.",
    "mine.empty": "Du hältst noch keine Token.",

    "chain.free": "POL gratis",
    "chain.real": "echtes POL",

    "item.token": "Token",
    "item.unlisted": "Nicht gelistet",
    "item.royalty": "Royalty",
    "item.buy": "Kaufen",
    "item.list": "Anbieten",
    "item.cancel": "Zurückziehen",
    "item.pricePlaceholder": "Preis in POL",

    "split.eyebrow": "Abrechnung",
    "split.title": "Wohin das Geld geht",
    "split.body":
      "Jeder Verkauf teilt sich dreifach, und alles davon steht jemandem zu. Während des Verkaufs wird nichts verschickt. Alle drei Anteile werden gutgeschrieben, und jeder holt sie ab, wann es ihm passt.",
    "split.sceneTitle": "Ein Verkauf, aufgeteilt",
    "split.seller": "Verkäufer",
    "split.creator": "Royalty",
    "split.market": "Gebühr",
    "split.fee": "Gebühr",
    "split.caption":
      "Gezeichnet aus dem ersten Listing oben, zu dem Satz, den dieser Token wirklich trägt. Die Royalty ist pro Token registriert und entspricht genau der Zahl, die seine eigene Grafik zeigt.",

    "pay.eyebrow": "Der Grund",
    "pay.title": "Ein Verkäufer, den man nicht bezahlen kann",
    "pay.body":
      "Manche Verkäufer sind Verträge, und ein Vertrag kann Geld ablehnen. Zahlt der Marktplatz während des Verkaufs aus, reißt diese Ablehnung den ganzen Verkauf mit, und den Fehler sieht der Käufer. Beide Spuren fahren denselben Verkauf mit demselben sperrigen Verkäufer.",
    "pay.sceneTitle": "Derselbe Verkauf, zwei Regeln",
    "pay.pushTitle": "Auszahlung im Verkauf",
    "pay.pushSub": "Der naheliegende Weg. Geld direkt in buy() schicken.",
    "pay.pullTitle": "Gutschrift, Abholung später",
    "pay.pullSub": "So macht es dieser Vertrag.",
    "pay.caption":
      "Der Verkäufer ist ein Vertrag, dessen receive() revertet. Nur eine dieser Spuren lässt den Käufer mit dem Token zurück.",

    "common.replay": "Nochmal",

    "busy.connect": "Wallet wird geöffnet",
    "busy.sign": "Warte auf deine Signatur",
    "busy.approve": "Erst das Approval für den Marktplatz",
    "busy.mining": "Warte auf die Chain",

    "ok.connected": "Verbunden.",
    "ok.minted": "Geminted",
    "ok.listed": "Eingestellt",
    "ok.cancelled": "Listing zurückgezogen",
    "ok.bought": "Gekauft",
    "ok.withdrew": "Abgeholt",

    "err.rejected": "Du hast das in deiner Wallet abgebrochen.",
    "err.wrongChain": "Deine Wallet ist auf einem anderen Netzwerk. Wechsle zurück und probier es nochmal.",
    "err.noWallet": "Keine Wallet gefunden. Installiere MetaMask, oder sieh dir die Demo an.",
    "err.notDeployed": "Es ist noch nichts deployt, also gibt es nur die Demo zu sehen.",
    "err.ownListing": "Das ist dein eigenes Listing.",
    "err.demoSoldOut": "Die Demo-Galerie hat nur zwölf Token.",
    "err.reverted": "Die Chain hat das abgelehnt.",
    "err.timeout": "Noch nicht gemined. Sieh in deiner Wallet nach.",
    "err.NotListed": "Das steht nicht zum Verkauf.",
    "err.AlreadyListed": "Das ist bereits eingestellt.",
    "err.NotOwner": "Das gehört dir nicht.",
    "err.NotSeller": "Das ist nicht dein Listing.",
    "err.NotApproved": "Der Marktplatz darf diesen Token nicht bewegen.",
    "err.PriceIsZero": "Gib einen Preis über null an.",
    "err.WrongPayment": "Der Preis hat sich geändert. Neu laden und nochmal.",
    "err.ListingStale": "Der Verkäufer hat den Token weitergeschoben. Das Listing ist tot.",
    "err.NothingToWithdraw": "Dir steht nichts zu.",
    "err.SoldOut": "Die Collection ist ausverkauft.",
    "err.TooSoon": "Heute schon abgeholt. Morgen wieder.",
    "err.Dry": "Die Faucet ist leer. Nimm die offizielle.",
    "err.TooFull": "Die Faucet ist schon voll.",

    "ok.dripped": "Test-POL ist unterwegs",

    "status.eyebrow": "Stand der Dinge",
    "status.title": "Fertig, und bewusst nicht fertig",
    "status.done": "fertig",
    "status.next": "offen",
    "status.p1": "Marktplatz und Collection, 132 Tests, Mutationstest in der CI",
    "status.p2": "Grafik on chain erzeugt, kein IPFS, nichts zu pinnen",
    "status.p3": "Wallet, minten, anbieten, kaufen, abholen, plus Demo für alle anderen",
    "status.p4": "Live auf Polygon Amoy",
    "status.p5": "Auktionen und Angebote",
    "status.caption":
      "Einen Upgrade-Pfad gibt es nicht, und es wird auch keinen geben. Ein Proxy ließe den Owner die Abrechnungsregeln umschreiben, nachdem Leute ihnen bereits vertraut haben.",

    "foot.built": "Gebaut von",
    "foot.deps": "Keine Wallet-Library, kein Framework, kein Build-Schritt",
  },
};

/** Scene scripts. Arrays, so they live outside the translator's reach. */
export const SCENES = {
  en: {
    push: [
      "buy() takes 1 POL from the buyer",
      "royalty and fee are worked out",
      "send the rest to the seller",
      "the seller's receive() reverts",
      "the whole sale reverts with it",
    ],
    pull: [
      "buy() takes 1 POL from the buyer",
      "royalty and fee are worked out",
      "all three shares are credited",
      "the token moves to the buyer",
      "the seller withdraws when they can",
    ],
    pushVerdict: "Reverted. Nobody was paid and nobody got the token.",
    pullVerdict: "Settled. The buyer holds the token; the rest waits.",
  },
  de: {
    push: [
      "buy() nimmt 1 POL vom Käufer",
      "Royalty und Gebühr werden berechnet",
      "der Rest geht an den Verkäufer",
      "dessen receive() revertet",
      "der ganze Verkauf revertet mit",
    ],
    pull: [
      "buy() nimmt 1 POL vom Käufer",
      "Royalty und Gebühr werden berechnet",
      "alle drei Anteile werden gutgeschrieben",
      "der Token geht an den Käufer",
      "der Verkäufer holt ab, wenn er kann",
    ],
    pushVerdict: "Revertet. Niemand wurde bezahlt, niemand bekam den Token.",
    pullVerdict: "Abgerechnet. Der Käufer hat den Token, der Rest wartet.",
  },
};
