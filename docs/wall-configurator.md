# Metallständer-Konfigurator

Stand: Konfigurationsversion 1, SQLite-Schema 2, November 2026.

Der Konfigurator plant eine Metallständer-Trennwand innerhalb eines Projekts. Er schreibt in die vorhandene Spalte `constructions.data_json`. Eine neue Schema-Migration war dafür nicht nötig. Die Zeilen-ID der Konstruktion bleibt beim Bearbeiten gleich.

Die Berechnung liegt in `construction/wallRules.ts`. Die Oberfläche ruft diese Funktionen nur auf. Der Materialkatalog bleibt die einzige Materialquelle. `assessCompatibility` und `fastenersFor` entscheiden die Status.

## Schritte

1. Name und optionale Beschreibung.
2. Wandlänge und Wandhöhe in der Maßeinheit aus den Einstellungen. Gespeichert wird Millimeter.
3. Profilbreite, Profilabstand und Anschlüsse.
4. Beplankung von Seite A und Seite B.
5. Dämmung oder keine Dämmung.
6. Türöffnungen.
7. Überblick. Jeder Bereich lässt sich erneut öffnen.

Andere Bauarten stehen in der Auswahl, lassen sich aber nicht starten. Die Doppelständerwand ist als Typ `double-stud-partition` vorgesehen. Abstand, Kopplung und zweite Ständerreihe sind im Katalog nicht belegt und werden nicht erfunden. `DOUBLE_STUD_SUPPORT` hält nur diese Absage fest.

## Eingabegrenzen

| Maß | Minimum | Maximum |
| --- | --- | --- |
| Wandlänge | 200 mm | 20 000 mm |
| Wandhöhe | 200 mm | 8 000 mm |
| Türöffnung, Breite und Höhe | 300 mm | innerhalb der Wand |

Das sind Grenzen gegen leere, negative und absurde Eingaben. Sie sind keine Tragfähigkeit und keine Lieferlänge. Null, negative Werte und Buchstaben werden abgewiesen.

## Profile und Abstände

Angeboten werden nur UW- und CW-Paare derselben Nennbreite, deren Katalogstatus `compatible` ist. Im Katalog sind das 50, 75, 100, 125 und 150 mm. Boden, Decke und beide seitlichen Anschlüsse verwenden dieses UW-Profil.

Die Abstände 312,5 mm, 417 mm und 625 mm teilen eine Plattenbreite von 1 250 mm. Der Katalog enthält dafür keine geprüfte Systemregel. Der Status bleibt `not-assessed` mit der Regel `spacing-grid-1250`.

Die Ständerpositionen kommen aus `studOffsetsMm`: Anfang, Raster und das Wandende. Sie stehen im gespeicherten Feld `studOffsetsMm`.

Nur der Katalogeintrag `board-fibre-12-5` nennt die Herstellerregel „höchstens Plattendicke mal 50“. Für 12,5 mm sind das 625 mm. Dickere Abstände werden für diese Platte abgelehnt. Die Regel wird nicht auf Gipskarton übertragen. Andere Gipsfaserplatten nennen diese Zahl im Katalog nicht.

## Beplankung

Jede Seite hat eine eigene Variante:

| Variante | Schichten |
| --- | --- |
| Eine Lage Gipskarton | eine Finish-Lage |
| Zwei Lagen Gipskarton | Lage 1 an der Unterkonstruktion, Lage 2 außen, getrennte IDs, `staggerJoints` |
| OSB und Gipskarton | OSB als `backing`, Gipskarton als `finish`, getrennte IDs |

Platten müssen `suitableFor` die Metallständerwand enthalten. Die 9,5-mm-Platte Typ A ist nur für Vorsatzschalen hinterlegt und erscheint nicht. Liegen Formate im Katalog, muss eines gewählt werden. Fehlt das Format, bleibt es leer und wird so angezeigt.

## OSB auf Metall

Die Kombination ist als Planungsvariante wählbar. `assessCompatibility` zwischen OSB und Gipskarton bleibt `conditional`. `fastenersFor('osb-on-metal')` hat keinen kompatiblen Eintrag. Deshalb speichert die OSB-Lage:

- `fastening.catalogItemId: null`
- `fastening.status: not-assessed`
- `fastening.offered: false`
- `fastening.ruleId: osb-screw-missing`

Die äußere Gipslage auf OSB ist ebenfalls `not-assessed` (`gypsum-over-osb-untested`). Die App zeigt „Technisch noch nicht vollständig geprüft“, nennt keine Schraube und behauptet keine Tragfähigkeit. Eine Freigabe setzt eine belastbare Quelle für die Befestigung von OSB auf Metall voraus.

Für Gipskarton direkt auf dem 0,6-mm-Profil wird die Katalogpaarung mit `fastener-tn-fine` gespeichert. Die Schraubenlänge wird nicht gewählt und nicht als Empfehlung ausgegeben. Gipsfaser bleibt ohne Schraube, weil fermacell eigene Schrauben nennt.

## Dämmung

Angeboten werden nur Katalogdämmstoffe mit hinterlegten Dicken und Eignung für die Metallständerwand: Steinwolle-Trennwandplatte und Mineralwolle KP 034. Glaswolle ohne Kennwerte wird nicht angeboten.

Eine Dicke ist wählbar, wenn sie höchstens der Profilnenntiefe entspricht. Das ist die geometrische Annahme `assumption-cavity`. Der Status dieser Paarung ist `conditional`. `systemStatus` der Dämmung bleibt `not-assessed`. Die App verspricht keinen Schall- oder Brandschutz der fertigen Wand.

## Öffnungen

Eine Tür speichert Breite, Höhe, Abstand vom linken Rand und eine optionale Bezeichnung. Abgelehnt werden negative Abstände, Nullwerte, Öffnungen unter 300 mm, Öffnungen außerhalb der Wand und Überschneidungen. Kanten dürfen sich berühren.

Passende UA- und Türsturz-IDs werden nur als Katalogverweis gespeichert. `executionStatus` bleibt `not-assessed`, weil keine Einbauregel für Anzahl, Anschluss und Sturz hinterlegt ist. Die Öffnung beeinflusst spätere Mengen, weil sie in der Geometrie liegt. Diese Phase rechnet noch keine Stücklisten.

## Gespeicherte Wand

`SavedWall` enthält Name, Beschreibung, Maße, Unterkonstruktion, berechnete Ständerpositionen, Seite A, Seite B, Schichten mit stabilen IDs, Dämmung, Öffnungen, Material-IDs und die Kompatibilitätsstatus. `systemStatus` der Wand ist `not-assessed`.

Die schematische Ansicht zeigt Länge, Höhe, Ständerstriche, Öffnungen und einen Farbstreifen je Beplankungsvariante. Sie ersetzt nicht die 3D-Ansicht des Prototyps und ändert deren Code nicht.
