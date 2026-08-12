# plinth

[English](./README.md) · **Deutsch**

### [→ Marktplatz öffnen](https://arsalanrc.github.io/plinth)

Ein NFT-Marktplatz auf Polygon. Token minten, einstellen, den von jemand
anderem kaufen. Die Grafik entsteht on chain, der Verkäufer behält den Token bis
zum Verkauf, und während des Verkaufs wird niemand ausgezahlt.

Kein Server, kein Konto, keine Datenbank. Die Seite ist statisch, und sie redet
ganz ohne Wallet-Library mit der Chain.

Solidity 0.8.28, Hardhat 3, OpenZeppelin. 100 Tests.

---

## Ohne Wallet ausprobieren

Kaum jemand installiert eine Browser-Extension, nur um sich ein Portfolio-Stück
anzusehen. Also läuft der ganze Marktplatz auf erfundenen Daten, solange niemand
eine verbindet. Jeder Knopf funktioniert, und jede Ablehnung ist die des
Vertrags: den eigenen Token zu kaufen scheitert dort aus demselben Grund wie on
chain.

Eine Demo, die nur den guten Fall zeigt, bringt einem etwas Falsches bei.

---

## Die vier Entscheidungen

Jede steht hier, weil die naheliegende Alternative leise scheitert.

### Der Verkäufer behält den Token

Ein Listing erteilt ein Approval. Bewegt wird nichts, bis jemand kauft.

Ein Marktplatz mit Verwahrung kann den Token hinter dem eigenen Bug einsperren,
und das ist der schlimmere Fehler, weil er das Einzige trifft, was dem Verkäufer
wirklich gehört. Der Preis dafür, sich herauszuhalten: ein Listing kann
veralten. Also prüft `buy` genau das. Der Verkäufer muss den Token noch
besitzen. Das Approval muss noch stehen.

Ein veraltetes Listing darf jeder aufräumen. Verkäufer, die weitergezogen sind,
kommen dafür nicht zurück, und bis es jemand anderes tut, steht das Angebot in
jedem Frontend, als wäre es echt.

### Während des Verkaufs wird niemand ausgezahlt

`buy` schreibt gut. Verkäufer rufen `withdraw` auf, wenn sie das Geld wollen.

Wer im Verkauf auszahlt, gibt dem Verkäufer die Macht, das eigene Listing zu
zerstören. Ein Vertrag, dessen `receive` revertet, lässt jeden Kauf seiner Token
scheitern, und den Fehler sieht am Ende der Käufer. Gutschreiben lässt den
Fehler dort, wo er entstanden ist. Ein Test verkauft für genau diesen Verkäufer
trotzdem.

### Das Listing wird gelöscht, bevor der Token sich bewegt

`safeTransferFrom` ruft den Käufer zurück. Was dort läuft, bestimmt der Käufer.

Jeder Vertrag, der ein Listing bepreist oder beleiht, lässt sich in genau diesem
Moment zum Lesen bringen. Löscht man erst danach, sieht jeder dieser Leser einen
Token, den sein alter Besitzer immer noch zum Verkauf anbietet, obwohl er ihm
längst nicht mehr gehört. Das ist eine wahre Antwort auf die falsche Frage.
Read-only Reentrancy hat auf genau diesem Fehler schon echtes Geld gekostet.

### Royalties sind bei zehn Prozent gedeckelt

`royaltyInfo` ist fremder Code, der eine Frage über Geld beantwortet.

Eine Collection kann mehr Royalty melden, als der Verkauf überhaupt einbringt.
Ohne Deckel unterläuft die Rechnung den Anteil des Verkäufers, und danach
revertet jeder Verkauf dieser Collection, dauerhaft. Der Deckel hält den Verkauf
am Leben, und er hält den Schaden in der Collection, die ihn verursacht hat.

Eine Royalty an die Nulladresse wird ebenfalls abgelehnt, denn das wäre keine
fehlgeschlagene Zahlung, sondern eine erfolgreiche, die niemand jemals abholen
kann.

---

## Die Grafik liegt on chain

`tokenURI` liefert ein base64-JSON-Dokument mit dem Bild darin. Kein IPFS-Hash,
kein Pinning-Dienst, kein Gateway. Das Bild entsteht bei jedem Aufruf neu aus
der Token-ID und hält damit genau so lange wie die Chain.

Angefangen hat das als der übliche Link zu IPFS. Der zeigte auf nichts, und das
ist derselbe echte Defekt wie eine Install-Zeile, die nie veröffentlicht wurde.

Jeder Token zeichnet seine eigene Royalty: ein Balken, geteilt dort, wo der
Anteil des Creators liegt. Ein Test stellt sicher, dass Bild und `royaltyInfo`
niemals auseinanderlaufen. Eine Grafik, die eine Zahl behauptet, die ihr eigener
Vertrag nicht einlöst, ist Dekoration im Kostüm von Daten.

Sie zeichnet die Royalty und sonst nichts, mit Absicht. Eine Gebühr gäbe das
bessere Bild, und die Collection kann sie unmöglich kennen.

---

## Keine Wallet-Library

`site/abi.js` kodiert Aufrufe und dekodiert Rückgaben von Hand. Kein ethers,
kein viem, nichts von einem CDN. Ein Marktplatz-Frontend zieht sonst hundert
Kilobyte fremden Code, um Hexadezimal zu formatieren.

Die Selektoren sind Konstanten statt berechnet, denn berechnen bräuchte
keccak256, und das gibt es im Browser nicht. Eine Hash-Implementierung
auszuliefern, um siebenundzwanzig Hex-Strings nicht tippen zu müssen, ist ein
schlechter Tausch.

Vertretbar macht das erst der Test. `test/specs/abi.ts` deployt beide Verträge
auf eine echte Chain, schickt echte Call-Daten durch diesen Codec und vergleicht
jede Antwort mit dem typisierten Vertrag. Ein falscher Encoder wirft nämlich
nicht. Er erzeugt sauberes Hexadezimal, das der Node falsch liest, und gegen
sich selbst getestet beweist er gar nichts.

---

## Der Mutationstest

Ein Sicherheitstest, der auch gegen einen ungeschützten Vertrag durchläuft, ist
eine Behauptung und keine Prüfung. Ansehen kann man den Unterschied nicht. Also
löscht `pnpm mutate` jede Absicherung einzeln. Bleibt die Suite grün, schlägt
der Lauf fehl.

Beim ersten Lauf hat er zwei hohle Tests gefunden. Beide sahen gut aus.

**Der Reentrancy-Test lief auch ohne Guard durch.** Der Marktplatz hielt nur
das, was dem Angreifer zustand, also scheiterte die verschachtelte Auszahlung am
fehlenden Guthaben, und gearbeitet hat die Arithmetik. Jetzt werden vorher drei
fremde Token verkauft. Ein Drain nähme damit fremdes Geld, und die Assertion
sieht es verschwinden.

**Der Reihenfolge-Test lief auch mit vertauschter Reihenfolge durch.** Die
Staleness-Prüfung weist den verschachtelten Kauf schon vorher ab, also kam es
auf die Reihenfolge nie an. Was sie wirklich schützt, ist ein Vertrag, der
während des Callbacks liest. Genau das prüft `SaleObserver` jetzt.

Acht Mutationen. Alle acht gefangen, bei jedem Push.

---

## Ausführen

```bash
git clone https://github.com/ArsalanRC/plinth.git
cd plinth
pnpm install

pnpm test      # 100 Tests
pnpm mutate    # 8 Mutationen, jede muss auffallen
pnpm check     # Lint, Typen, Tests
```

Hardhat 3 braucht Node 22 oder neuer. Die CI fährt 22 und 24.

Zum Ausliefern der Seite reicht jeder statische Server:

```bash
cd site && python3 -m http.server 8000
```

---

## Wo was liegt

| Pfad | Inhalt |
|---|---|
| `contracts/Plinth.sol` | Der Marktplatz: Listing, Kauf, Abrechnung, Gebühr |
| `contracts/PlinthCollection.sol` | Das ERC-721, feste Obergrenze, Royalty pro Token |
| `contracts/Art.sol` | Bild und Metadaten, beide aus der Token-ID gebaut |
| `contracts/mocks/` | Verträge, die sich absichtlich schlecht benehmen |
| `site/abi.js` | Der Codec, getestet gegen einen echten Node |
| `site/chain.js` | Wallet und Chain, über `window.ethereum` |
| `site/demo.js` | Der Marktplatz ohne fremde Wallet |
| `scripts/mutate.ts` | Löscht jede Absicherung und prüft, ob ein Test es merkt |

Das ERC-721 selbst kommt von OpenZeppelin. Ein eigenes zu schreiben ist kein
Kunststück, sondern eine Stelle für einen Bug, der jemanden seinen Token kostet.
Das Urteilsvermögen steckt in dem, was um den Standard herum liegt.

---

## Selbst deployen

Amoy ist das Testnet von Polygon, und das POL dafür gibt es gratis aus
[dem Faucet](https://faucet.polygon.technology).

```bash
pnpm hardhat keystore set AMOY_RPC_URL       # https://rpc-amoy.polygon.technology
pnpm hardhat keystore set AMOY_PRIVATE_KEY   # eine Wegwerf-Wallet, keine echte
pnpm deploy:amoy
```

Die beiden ausgegebenen Adressen kommen in `site/config.js`, dann läuft die
Seite gegen dein Deployment.

Der Key liegt in Hardhats verschlüsseltem Keystore. Nichts in diesem Repository
liest einen Key aus einer Dotfile oder aus einer Umgebungsvariable, die es
selbst setzt. Das Skript liest beide Verträge nach dem Deployment zurück, denn
ein Konstruktor, der revertet, hinterlässt trotzdem eine Adresse, und eine
Quittung ist kein Beweis.

---

## Ist eine statische Seite dafür sicher?

Ja, und es ist der übliche Weg.

MetaMask injiziert einen Provider in die Seite. Die Seite bittet um eine
Signatur, die Extension zeigt dir den Dialog und behält deinen Key. Nichts hier
sieht jemals einen Private Key, und es gibt keinen Server, auf dem einer liegen
könnte. Lesezugriffe gehen an einen öffentlichen RPC, und das ist ein
öffentlicher Lesezugriff.

Kein Backend zu haben ist hier das Sicherheitsargument, kein Zugeständnis.

---

## Bewusst nicht enthalten

Auktionen, Angebote, Bundles, ein Orderbuch. Alles echte Features, und keines
davon würde etwas an dem ändern, worum es diesem Repository geht.

Einen Upgrade-Pfad gibt es ebenfalls nicht. Ein Proxy ließe den Owner die
Abrechnungsregeln umschreiben, nachdem Leute ihnen bereits vertraut haben. Der
Deckel auf der Gebühr ist nur etwas wert, weil ihn niemand später anheben kann.

---

## Autor

Gebaut von Arsalan Khadim.

[LinkedIn](https://www.linkedin.com/in/muhammad-arsalan-khadim-b87550259/) ·
[GitHub](https://github.com/ArsalanRC) ·
[Portfolio](https://arsalanrc.github.io)

## Lizenz

MIT. Siehe [LICENSE](./LICENSE).
