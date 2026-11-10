# 3D-Inspektion

Stand: November 2026. Die Auswahl liest die gespeicherte Wand und den Katalog. Sie schreibt nichts zurück und legt keine Tabelle an.

Die Logik liegt in `three-dimensional/inspection/` und importiert kein React. `selection.ts` vergibt die Identität und trifft den Strahl. `inspectionData.ts` baut die Texte. `measurementGeometry.ts` baut die Maßlinien. `SavedWallScene` zeichnet nur die Körper, die Hervorhebung und die Linien.

## Identität

Jedes Bauteil behält eine ID aus dem Konstruktionsmodell:

- `uw-floor`, `uw-ceiling`, `uw-left`, `uw-right`
- `cw-` plus die Position in `studOffsetsMm`
- `board-` plus Seite und gespeicherte Lagen-ID
- `insulation-` plus Feldnummer
- `opening-` plus die gespeicherte Öffnungs-ID

Steg und Flansch eines Profils, die Stücke einer Lage und die Kanten einer Öffnung teilen sich diese ID. Sie wird nicht bei jedem Rendern neu vergeben.

## Auswahl

Der bestehende Responder bleibt vor der Zeichenfläche. Erst ab etwa 12 px Bewegung dreht oder verschiebt er. Ein kurzer Kontakt ist ein Tippen. Der Strahl trifft die gerade sichtbaren Körper, inklusive der verschobenen Lage in Schichten- und Explosionsansicht. Ein Treffer hebt die vorige Auswahl auf. Dasselbe Bauteil oder eine leere Fläche hebt die Auswahl auf.

Die Hervorhebung ist eine eigene transparente Hülle, 16 mm größer als der Körper, plus eine Kontur auf den tatsächlichen Kanten. Farbe und Geometrie des Bauteils bleiben. Hülle und Kontur werden mit der Gruppe freigegeben.

Von vorn liegt die äußere Beplankung vor den Profilen, der Dämmung und der inneren Lage. Konstruktion, ausgeblendete Lagen oder eine seitliche Ansicht machen das dahinterliegende Bauteil erreichbar. Die Explosionsansicht schiebt nur die Zeichnung auseinander. Die Auswahl bleibt an derselben ID.

„Nur diese Lage“ schaltet die anderen Beplankungen in der Ansicht aus. „Alle Beplankungen“ schaltet sie wieder ein. Die gespeicherte Wand ändert sich nicht. Wechselt die Wand, wird die Auswahl gelöscht. Ein Ansichtswechsel lässt sie stehen.

## Angaben

Angezeigt wird nur, was Wand oder Katalog enthalten: Name, Kategorie, Material-ID, Seite, Schicht, gezeichnete Ausdehnung, gespeicherte Position, Profilbreite, Katalogdicke, Flansch, Format, Lagenzahl und die Tür, in der ein gespeicherter Ständer liegt. Fehlt ein Wert, steht „Nicht hinterlegt“.

Die gezeichnete 2-mm-Blechstärke ist keine Materialdicke. Im Panel steht die Katalogdicke, hier 0,6 mm. Der Flansch eines CW-Profils kommt aus der Typbezeichnung, wenn kein eigenes Feld existiert. λ, Brandverhalten und Tragfähigkeit der Katalogzeile werden nicht als Eigenschaft der Wand ausgegeben. UA und Sturz bleiben „Nicht als Einbau hinterlegt“.

## Maße

Die Maßlinien hängen an der unveränderten Geometrie, nicht an der Explosionsverschiebung. Intern sind sie Millimeter. Die Zahlen stehen in der Liste unter dem Schalter „Maße“, weil Expo Go dafür kein zusätzliches Schriftpaket bekommt. Die Linien sind dünne Markierungen.

Immer, solange der Schalter an ist: Wandlänge, Wandhöhe und Wandstärke. Die Wandstärke ist Nennbreite plus die bekannten Plattenstärken. Der 0,5-mm-Abstand der Darstellung zählt nicht mit. Eine fehlende Plattenstärke wird nicht geschätzt und nicht addiert.

Profilabstände nur, solange die CW-Ebene sichtbar ist. Sie sind die Differenzen der gespeicherten Positionen, auch wenn das letzte Feld kürzer ist. Türbreite, Türhöhe und der Abstand von links nur, solange die Öffnung oder eine Beplankung sichtbar ist. Ein Abstand von 0 mm bleibt in der Liste, bekommt aber keine Linie der Länge null. Schichtdicken nur für sichtbare Lagen. Der Maßschalter ist von den Ebenen unabhängig: ausgeblendete Bauteile nehmen ihre Linien mit, die übrigen Maße bleiben.

## Grenzen

Auf diesem Rechner gibt es kein Android-Gerät. Expo Go wurde nicht erneut auf Hardware geprüft. Die Geste ist dieselbe JavaScript-Schicht wie in Phase 7, mit einer zusätzlichen Schwelle, damit Tippen nicht dreht.

Schattenkarten bleiben aus. Es gibt keine WebView und keine neue native Abhängigkeit. Maßzahlen liegen neben der Ansicht, nicht als 3D-Text im Modell. Eine verdeckte Lage lässt sich von vorn nicht durch die äußere Platte hindurch antippen.
