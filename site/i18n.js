/**
 * Page copy, English and German.
 *
 * Each language is written as itself. The German is not a translation of the
 * English, and a few sections argue in a different order because German wants
 * the emphasis somewhere else. Terms that German engineers say in English stay
 * in English: Listing, Approval, Reentrancy, Guard, Testnet.
 *
 * Interface copy cannot satisfy both the sentence-length rule and the corpus
 * the humanize pipeline measures against. The corpus wants a mean near twenty
 * words with a quarter of sentences over twenty-eight. A page made of labels
 * and captions cannot do that without padding, so the length rule wins here and
 * the prose in the README carries the score.
 */

export const STRINGS = {
  en: {
    "meta.title": "consign · a marketplace that settles carefully",
    "nav.lang": "Deutsch",
    "nav.source": "Source",
    "nav.linkedin": "LinkedIn",
    "theme.toLight": "Switch to the light theme",
    "theme.toDark": "Switch to the dark theme",

    "hero.kicker": "Solidity · ERC-721 · ERC-2981",
    "hero.title": "Selling is easy.<br /><em>Settling</em> is the hard part.",
    "hero.lede":
      "A consignment marketplace for ERC-721 tokens. The seller keeps the token. Nobody is paid during the sale, a collection cannot claim more than a tenth, and every defence here has been deleted on purpose to check that a test notices.",
    "hero.cta": "Read the source",
    "hero.cta2": "See a sale settle",

    "split.title": "One sale, three shares",
    "split.note": "1 POL · fee 250 bps · royalty 500 bps",
    "split.seller": "Seller",
    "split.creator": "Creator royalty",
    "split.market": "Marketplace fee",
    "split.caption":
      "Drawn from the same basis points the contract uses. Nothing is sent anywhere. All three amounts are credited, and each party withdraws when it suits them.",

    "common.replay": "Replay",

    "pay.eyebrow": "The sale",
    "pay.title": "A seller who cannot be paid",
    "pay.body":
      "Some sellers are contracts, and a contract can refuse money. If the marketplace pays during the sale, that refusal takes the whole sale down. The buyer sees the error and the item becomes unsellable. Both lanes below run the same sale against the same awkward seller.",
    "pay.sceneTitle": "Same sale, two settlement rules",
    "pay.pushTitle": "Paid during the sale",
    "pay.pushSub": "The obvious way. Send the money as part of buy().",
    "pay.pullTitle": "Credited, withdrawn later",
    "pay.pullSub": "What this contract does.",
    "pay.caption":
      "The seller is a contract whose receive() reverts. Only one of these lanes leaves the buyer holding the token.",

    "cap.eyebrow": "The royalty",
    "cap.title": "Somebody else's code, asked about money",
    "cap.body":
      "royaltyInfo lives in the collection, not here. A collection can report a royalty larger than the price it is being paid. Uncapped, subtracting that underflows the seller's share, and every sale of that collection reverts from then on. Turn the cap off and watch it happen.",
    "cap.sceneTitle": "A collection demanding 200%",
    "cap.note": "MAX_ROYALTY_BPS = 1000",
    "cap.switch": "Cap the royalty at 10%",
    "cap.demanded": "Demanded",
    "cap.paid": "Actually paid",
    "cap.kept": "Seller keeps",
    "cap.caption":
      "Capping keeps the sale alive and keeps the damage inside the collection that caused it. There is a test for exactly this collection.",

    "stale.eyebrow": "The listing",
    "stale.title": "Not taking custody has a price",
    "stale.body":
      "The token never moves to this contract, so the seller can still do what they like with it. That is the point, and it means a listing can stop being fillable without anybody telling the marketplace.",
    "stale.sceneTitle": "A seller moves the token elsewhere",
    "stale.caption":
      "Anyone can prune a stale listing, not just the seller. Sellers who have moved on do not come back to tidy up.",

    "mut.eyebrow": "The proof",
    "mut.title": "Delete the defence, watch a test go red",
    "mut.body":
      "A security test that passes against an undefended contract is a claim, not a check, and there is no way to tell the two apart by reading. So pnpm mutate breaks each defence in turn and fails if the suite stays green. Click one to break it.",
    "mut.sceneTitle": "Eight defences, eight mutations",
    "mut.note": "results from a real run",
    "mut.caption":
      "This caught two hollow tests on its first run. The reentrancy test passed with the guard removed, because the contract held only what the attacker was owed. The ordering test passed with the ordering reversed, because a different check was doing the work.",

    "status.eyebrow": "Where it stands",
    "status.title": "Done, and deliberately not done",
    "status.done": "done",
    "status.next": "not yet",
    "status.p1": "Marketplace, collection, 70 tests, mutation check in CI",
    "status.p2": "Pull payments, capped royalties, stale-listing handling",
    "status.p3": "Both READMEs, English and German",
    "status.p4": "Deployed to Amoy, with the page reading live listings",
    "status.p5": "Auctions and offers",
    "status.caption":
      "There is no upgrade path and there will not be one. A proxy would let the owner rewrite the settlement rules after people had already trusted them.",

    "foot.built": "Built by",
    "foot.deps": "OpenZeppelin, and nothing else at runtime",
  },

  de: {
    "meta.title": "consign · ein Marktplatz, der sorgfältig abrechnet",
    "nav.lang": "English",
    "nav.source": "Quellcode",
    "nav.linkedin": "LinkedIn",
    "theme.toLight": "Zum hellen Design wechseln",
    "theme.toDark": "Zum dunklen Design wechseln",

    "hero.kicker": "Solidity · ERC-721 · ERC-2981",
    "hero.title": "Verkaufen ist leicht.<br />Schwer ist das <em>Abrechnen</em>.",
    "hero.lede":
      "Ein Kommissions-Marktplatz für ERC-721-Token. Der Verkäufer behält den Token. Während des Verkaufs wird niemand ausgezahlt, keine Collection bekommt mehr als ein Zehntel, und jede Absicherung hier wurde absichtlich gelöscht, um zu prüfen, ob ein Test das merkt.",
    "hero.cta": "Quellcode lesen",
    "hero.cta2": "Eine Abrechnung ansehen",

    "split.title": "Ein Verkauf, drei Anteile",
    "split.note": "1 POL · Gebühr 250 bps · Royalty 500 bps",
    "split.seller": "Verkäufer",
    "split.creator": "Royalty",
    "split.market": "Gebühr",
    "split.caption":
      "Gezeichnet aus denselben Basispunkten, die der Vertrag verwendet. Verschickt wird nichts. Alle drei Beträge werden gutgeschrieben, und jeder holt sie ab, wann es ihm passt.",

    "common.replay": "Nochmal",

    "pay.eyebrow": "Der Verkauf",
    "pay.title": "Ein Verkäufer, den man nicht bezahlen kann",
    "pay.body":
      "Manche Verkäufer sind Verträge, und ein Vertrag kann Geld ablehnen. Zahlt der Marktplatz während des Verkaufs aus, reißt diese Ablehnung den ganzen Verkauf mit. Den Fehler sieht der Käufer, und der Token wird unverkäuflich. Beide Spuren unten fahren denselben Verkauf mit demselben sperrigen Verkäufer.",
    "pay.sceneTitle": "Derselbe Verkauf, zwei Regeln",
    "pay.pushTitle": "Auszahlung im Verkauf",
    "pay.pushSub": "Der naheliegende Weg. Geld direkt in buy() schicken.",
    "pay.pullTitle": "Gutschrift, Abholung später",
    "pay.pullSub": "So macht es dieser Vertrag.",
    "pay.caption":
      "Der Verkäufer ist ein Vertrag, dessen receive() revertet. Nur eine dieser Spuren lässt den Käufer mit dem Token zurück.",

    "cap.eyebrow": "Die Royalty",
    "cap.title": "Fremder Code, gefragt nach Geld",
    "cap.body":
      "royaltyInfo steht in der Collection, nicht hier. Eine Collection kann mehr Royalty melden, als der Verkauf einbringt. Ohne Deckel unterläuft die Rechnung den Anteil des Verkäufers, und danach revertet jeder Verkauf dieser Collection. Schalte den Deckel ab und sieh zu.",
    "cap.sceneTitle": "Eine Collection fordert 200%",
    "cap.note": "MAX_ROYALTY_BPS = 1000",
    "cap.switch": "Royalty bei 10% deckeln",
    "cap.demanded": "Gefordert",
    "cap.paid": "Tatsächlich gezahlt",
    "cap.kept": "Verkäufer behält",
    "cap.caption":
      "Der Deckel hält den Verkauf am Leben und den Schaden in der Collection, die ihn verursacht hat. Für genau diese Collection gibt es einen Test.",

    "stale.eyebrow": "Das Listing",
    "stale.title": "Keine Verwahrung hat ihren Preis",
    "stale.body":
      "Der Token wandert nie zu diesem Vertrag, also kann der Verkäufer weiter damit machen, was er will. Genau das ist gewollt. Es heißt aber auch: ein Listing kann unerfüllbar werden, ohne dass es dem Marktplatz jemand sagt.",
    "stale.sceneTitle": "Ein Verkäufer schiebt den Token weiter",
    "stale.caption":
      "Ein veraltetes Listing darf jeder aufräumen, nicht nur der Verkäufer. Wer weitergezogen ist, kommt dafür nicht zurück.",

    "mut.eyebrow": "Der Beweis",
    "mut.title": "Absicherung löschen, Test rot werden sehen",
    "mut.body":
      "Ein Sicherheitstest, der auch gegen einen ungeschützten Vertrag durchläuft, ist eine Behauptung und keine Prüfung. Ansehen kann man den Unterschied nicht. Also bricht pnpm mutate jede Absicherung einzeln und schlägt fehl, wenn die Suite grün bleibt. Klick eine an.",
    "mut.sceneTitle": "Acht Absicherungen, acht Mutationen",
    "mut.note": "Ergebnisse aus einem echten Lauf",
    "mut.caption":
      "Beim ersten Lauf hat das zwei hohle Tests gefunden. Der Reentrancy-Test lief auch ohne Guard durch, weil der Vertrag nur hielt, was dem Angreifer zustand. Der Reihenfolge-Test lief auch mit vertauschter Reihenfolge durch, weil eine andere Prüfung die Arbeit machte.",

    "status.eyebrow": "Stand der Dinge",
    "status.title": "Fertig, und bewusst nicht fertig",
    "status.done": "fertig",
    "status.next": "offen",
    "status.p1": "Marktplatz, Collection, 70 Tests, Mutationstest in der CI",
    "status.p2": "Pull Payments, gedeckelte Royalties, veraltete Listings",
    "status.p3": "Beide READMEs, Englisch und Deutsch",
    "status.p4": "Deployment auf Amoy, Seite liest echte Listings",
    "status.p5": "Auktionen und Angebote",
    "status.caption":
      "Einen Upgrade-Pfad gibt es nicht, und es wird auch keinen geben. Ein Proxy ließe den Owner die Abrechnungsregeln umschreiben, nachdem Leute ihnen bereits vertraut haben.",

    "foot.built": "Gebaut von",
    "foot.deps": "OpenZeppelin, und zur Laufzeit sonst nichts",
  },
};

/**
 * Scene scripts. Kept out of STRINGS because they are arrays rather than
 * strings, and the translator writes textContent over anything it recognises.
 */
export const SCENES = {
  en: {
    push: [
      "buy() takes 1 POL from the buyer",
      "royalty and fee are worked out",
      "send 0.925 to the seller",
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
    pullVerdict: "Settled. The buyer holds the token; 0.925 waits for the seller.",
    stale: [
      "the seller lists token #7 for 1 POL",
      "the seller transfers #7 to a friend",
      "isFillable() now answers false",
      "buy() reverts with ListingStale",
      "anybody calls pruneListing()",
    ],
    staleVerdict: "Cleared. The buyer's money never moved.",
    // {cap} and {kept} are filled from the same arithmetic that draws the bar.
    // Written out by hand they drift, and a page claiming precision cannot
    // print a number its own contract would not produce.
    capOn: "Capped at {cap}. The sale completes and the seller keeps {kept}.",
    capOff: "Underflow. Every sale of this collection reverts, permanently.",
  },
  de: {
    push: [
      "buy() nimmt 1 POL vom Käufer",
      "Royalty und Gebühr werden berechnet",
      "0,925 gehen an den Verkäufer",
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
    pullVerdict: "Abgerechnet. Der Käufer hat den Token, 0,925 warten.",
    stale: [
      "der Verkäufer listet Token #7 für 1 POL",
      "der Verkäufer schiebt #7 weiter",
      "isFillable() antwortet jetzt false",
      "buy() revertet mit ListingStale",
      "irgendwer ruft pruneListing() auf",
    ],
    staleVerdict: "Aufgeräumt. Das Geld des Käufers hat sich nie bewegt.",
    capOn: "Gedeckelt auf {cap}. Der Verkauf läuft, der Verkäufer behält {kept}.",
    capOff: "Underflow. Jeder Verkauf dieser Collection revertet, dauerhaft.",
  },
};

/**
 * The eight mutations, with the test that catches each one.
 *
 * These are the real entries from `scripts/mutate.ts` and the real test names
 * from the suite. A page claiming precision must not print a number or a name
 * the software cannot produce.
 */
export const MUTATIONS = {
  en: [
    {
      what: "withdraw zeroes the balance before paying out",
      caught: "survives a seller that re-enters withdraw while being paid",
    },
    {
      what: "buy deletes the listing before the token moves",
      caught: "shows no listing to anyone reading it during the transfer",
    },
    {
      what: "the seller is credited rather than paid during the sale",
      caught: "sells for a seller that cannot receive ether",
    },
    {
      what: "a collection's royalty claim is capped",
      caught: "caps a collection demanding more than the sale price",
    },
    {
      what: "a royalty naming the zero address is refused",
      caught: "refuses to credit the zero address",
    },
    {
      what: "buy checks the listing can still be filled",
      caught: "says why, rather than failing somewhere inside the token",
    },
    {
      what: "the marketplace fee is bounded by a constant",
      caught: "refuses a fee above the cap",
    },
    {
      what: "payment must be exact, not merely sufficient",
      caught: "refuses payment above the asking price",
    },
  ],
  de: [
    {
      what: "withdraw nullt den Saldo vor der Auszahlung",
      caught: "übersteht einen Verkäufer, der beim Auszahlen erneut eintritt",
    },
    {
      what: "buy löscht das Listing, bevor der Token sich bewegt",
      caught: "zeigt während des Transfers niemandem mehr ein Listing",
    },
    {
      what: "der Verkäufer bekommt eine Gutschrift statt einer Auszahlung",
      caught: "verkauft auch für einen Verkäufer, der kein Ether annimmt",
    },
    {
      what: "die Royalty-Forderung einer Collection ist gedeckelt",
      caught: "deckelt eine Collection, die mehr als den Verkaufspreis fordert",
    },
    {
      what: "eine Royalty an die Nulladresse wird abgelehnt",
      caught: "schreibt der Nulladresse nichts gut",
    },
    {
      what: "buy prüft, ob das Listing noch erfüllbar ist",
      caught: "sagt warum, statt irgendwo im Token zu scheitern",
    },
    {
      what: "die Gebühr ist durch eine Konstante begrenzt",
      caught: "lehnt eine Gebühr über dem Deckel ab",
    },
    {
      what: "die Zahlung muss exakt sein, nicht nur ausreichend",
      caught: "lehnt eine Zahlung über dem Preis ab",
    },
  ],
};
