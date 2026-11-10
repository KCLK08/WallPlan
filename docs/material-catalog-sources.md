# Quellen des Materialkatalogs

Stand: Katalogversion 3.0.0, 10. November 2026.

Der Katalog ist herstellerneutral. Herstellerprodukte dienen als Beleg für Maße und Klassen, nicht als Einkaufsliste. Preise aus den Unterlagen wurden nicht übernommen.

Es wird unterschieden zwischen:

1. Allgemein üblichen Klassen, etwa Typ A nach EN 520 oder OSB/3 nach EN 300.
2. Herstellerwerten aus einem Datenblatt, etwa λ oder eine Lieferlänge.
3. Systemregeln, etwa gleiche Nennbreite von CW und UW.
4. Eigenen Annahmen. Die einzige Annahme mit eigener Kennung ist `assumption-cavity`: eine Dämmplatte liegt geometrisch nur dann im Einfachständer, wenn ihre Dicke nicht größer als die Profilnenntiefe ist.

Was in den ausgewerteten Blättern fehlt, bleibt leer. Dafür gibt es die Quelle `not-in-evaluated-sheets`.

## Ausgewertete Unterlagen

| ID | Unterlage | Verwendet für |
| --- | --- | --- |
| `knauf-k621-cw` | Knauf K621.at, CW-Profile, Technisches Blatt 11/2020 | CW 50 bis 150, Blech 0,6 mm, zusätzlich 1,0 mm bei einem Teil der Breiten |
| `knauf-k625-uw` | Knauf K625.at, UW-Profile, Technisches Blatt 11/2020 | UW 50 bis 150, Flansch 40 mm, Blech 0,6 mm |
| `knauf-cw50-product` | Knauf Produktseite CW-Profil 50/50/0,6 | Lieferlängen nur dieser Breite |
| `knauf-gkb` | Knauf Produkt-Datenblatt Bauplatte GKB, 09/2025 | Typ A, 9,5 und 12,5 mm, Formate, Rohdichte, λ 0,21 |
| `knauf-screws-pi108` | Knauf Produktinformation Schnellbauschrauben, 01/2020 | TN-Feingewinde, TN-Grobgewinde, TB |
| `knauf-tb-product` | Knauf Produktseite TB mit Bohrspitze | Stahlblech 0,7 bis 2,25 mm, Längen 25 bis 55 mm |
| `siniat-lagyp` | Siniat Produktdatenblatt LaGyp | Typ A, 9,5 und 12,5 mm |
| `siniat-lagyp-dop` | Siniat Leistungserklärung LaGyp SI-GY-1607001 | Typ A auch in 15 und 18 mm |
| `siniat-lagyp-h2` | Siniat Produktdatenblatt LaGyp imprägniert | Typ H2, 12,5 mm, Wasseraufnahme ≤ 10 % |
| `siniat-laflamm` | Siniat Produktdatenblatt LaFlamm | Typ DF, 15 und 18 mm |
| `fermacell-gipsfaser` | fermacell Produktseite und Planung Gipsfaserplatten, ETA-03/0050 | 10, 12,5, 15 und 18 mm, Formate, Rohdichte, λ 0,32 |
| `rigips-diy-2024` | Rigips DIY Lieferprogramm, 03/2024 | UA, Türsturz, CD, UD, Hutprofil, Abhänger, Schraubenlängen, Die Blaue, Die Harte, Eckschutz, Anschlussdichtungen |
| `rigips-uw-at` | Rigips Produktseite U-Wandprofil | Nenndicke 0,6 mm, Längenbeispiel UW 50 |
| `knauf-tw-2014` | Knauf Insulation Trennwand-Dämmplatte TW, 04/2014 | Steinwolle, λD 0,040, Dicken 40 bis 140 mm, 1.200 × 625 mm |
| `knauf-kp034-2026` | Knauf Insulation Mineral Plus KP 034, 09/2026 | Mineralwolle, λD 0,034, Dicken 30 bis 140 mm, 1.250 × 625 mm |
| `en-300` | DIN EN 300 | Klasse OSB/3. Keine Pflichtstärke und keine Schraubenregel |
| `assumption-cavity` | WallPlan | Geometrischer Hohlraumvergleich |
| `not-in-evaluated-sheets` | WallPlan | Kategorie vorhanden, Kennwert bewusst leer |

Die Adressen stehen in `catalog/sources.ts`.

## Was nicht belegt wurde

- Eine Schraube, die OSB auf CW-Profilen befestigt, mit Durchmesser und Länge.
- Ein geprüfter Wandaufbau OSB plus Gipskarton bei Knauf, Rigips, Siniat oder fermacell.
- Zementbauplatten mit Dicke und Format.
- Glaswolle, Dämmmatte, Dampfbremse, Acryl, Rahmendübel und Universaldübel mit Kennwerten.
- Rohdichte der Trennwand-Dämmplatte TW.
- Blechdicke von CD 60/27 und UD 28. Die Zahl 0,6 in der Rigips-Tabelle ist das Gewicht in kg/m.
- Lieferlängen von CW und UW außer CW 50/50/0,6 und dem Rigips UW 50. Sie wurden nicht von einer Breite auf die nächste kopiert.
- 20-mm-Gipsplatten. In den ausgewerteten Blättern ist 20 mm für Typ A nicht genannt.
