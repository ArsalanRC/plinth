# consign

[English](./README.md) · **Deutsch**

### [→ Ansehen, wie abgerechnet wird](https://arsalanrc.github.io/consign)

Ein Kommissions-Marktplatz für ERC-721-Token. Der Verkäufer behält den Token,
und der Vertrag hält nichts außer dem Geld des Käufers, und das nur so lange,
bis es jemand abholt.

Solidity 0.8.28, Hardhat 3, OpenZeppelin. 70 Tests. Jede Absicherung darin wurde
absichtlich gelöscht, um zu prüfen, ob ein Test das überhaupt merkt.

---

## Die vier Entscheidungen

Jede steht hier, weil die naheliegende Alternative leise scheitert.

### Der Verkäufer behält den Token

Ein Listing erteilt ein Approval. Bewegt wird nichts, bis jemand kauft.

Ein Marktplatz mit Verwahrung kann den Token hinter dem eigenen Bug einsperren,
und das ist der schlimmere Fehler, weil er das Einzige trifft, was dem Verkäufer
wirklich gehört. Der Preis dafür, sich herauszuhalten: ein Listing kann
veralten. Also prüft `buy` genau das, bevor irgendetwas abgerechnet wird. Der
Verkäufer muss den Token noch besitzen. Das Approval muss noch stehen.

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
Read-only Reentrancy hat auf genau dieser Form schon echtes Geld gekostet.

### Royalties sind bei zehn Prozent gedeckelt

`royaltyInfo` ist fremder Code, der eine Frage über Geld beantwortet.

Eine Collection kann mehr Royalty melden, als der Verkauf überhaupt einbringt.
Ohne Deckel unterläuft die Rechnung den Anteil des Verkäufers, und danach
revertet jeder Verkauf dieser Collection, dauerhaft. Kaputt aussehen würde dabei
der Marktplatz. Der Deckel hält den Verkauf am Leben, und er hält den Schaden in
der Collection, die ihn verursacht hat.

Eine Royalty an die Nulladresse wird ebenfalls abgelehnt, denn das wäre keine
fehlgeschlagene Zahlung, sondern eine erfolgreiche, die niemand jemals abholen
kann.

---

## Der Mutationstest

Ein Sicherheitstest, der auch gegen einen ungeschützten Vertrag durchläuft, ist
eine Behauptung und keine Prüfung, und ansehen kann man den Unterschied nicht.
Also löscht `pnpm mutate` jede Absicherung einzeln. Bleibt die Suite grün,
schlägt der Lauf fehl.

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

Acht Mutationen. Alle acht gefangen.

```bash
pnpm mutate
```

---

## Ausführen

```bash
git clone https://github.com/ArsalanRC/consign.git
cd consign
pnpm install

pnpm test      # 70 Tests
pnpm mutate    # 8 Mutationen, jede muss auffallen
pnpm check     # Lint, Typen, Tests
```

Hardhat 3 braucht Node 22 oder neuer. Die CI fährt 22 und 24.

---

## Wo was liegt

| Pfad | Inhalt |
|---|---|
| `contracts/Consign.sol` | Der Marktplatz: Listing, Kauf, Abrechnung, Gebühr |
| `contracts/ConsignCollection.sol` | Das ERC-721, mit Royalty und fester Obergrenze |
| `contracts/mocks/` | Verträge, die sich absichtlich schlecht benehmen |
| `test/specs/` | Die Suite, eine Datei pro Thema |
| `scripts/mutate.ts` | Löscht jede Absicherung und prüft, ob ein Test es merkt |
| `scripts/deploy.ts` | Deployment, von Hand ausgeführt, nie durch die CI |

Das ERC-721 selbst kommt von OpenZeppelin. Ein eigenes zu schreiben ist kein
Kunststück, sondern eine Stelle für einen Bug, der jemanden seinen Token kostet.
Das Urteilsvermögen steckt in dem, was um den Standard herum liegt.

---

## Deployment auf Amoy

Amoy ist das Testnet von Polygon, und das POL dafür gibt es gratis aus einem
Faucet.

```bash
pnpm hardhat keystore set AMOY_RPC_URL
pnpm hardhat keystore set AMOY_PRIVATE_KEY
pnpm deploy:amoy
```

Der Key liegt in Hardhats verschlüsseltem Keystore. Nichts in diesem Repository
liest einen Key aus einer Dotfile oder aus einer Umgebungsvariable, die es
selbst setzt. Nutze eine Wallet, in der nichts liegt, das dir fehlen würde.

Das Skript liest beide Verträge nach dem Deployment zurück, denn ein
Konstruktor, der revertet, hinterlässt trotzdem eine Adresse, und eine Quittung
ist kein Beweis.

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
