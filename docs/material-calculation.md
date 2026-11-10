# Materialberechnung

Stand: Berechnungsversion 1, November 2026.

Die Materialliste wird beim Öffnen aus der gespeicherten Wand berechnet. Sie wird nicht in SQLite geschrieben. Das Schema bleibt Version 2, die Konstruktionsdaten in `constructions.data_json` bleiben die Quelle. Eine ältere Liste kann deshalb nicht als aktuell angezeigt werden.

Die Rechnung liegt in `calculations/material/` und importiert kein React. Die Oberfläche ruft nur `calculateMaterials` auf. Ständerpositionen kommen aus dem gespeicherten Feld `studOffsetsMm`, das der Konfigurator mit `studOffsetsMm` erzeugt hat. Die Berechnung legt das Raster nicht ein zweites Mal aus.

## Status

| Status | Bedeutung |
| --- | --- |
| `calculable` | Menge aus gespeicherten Maßen und Katalogdaten |
| `conditional` | Menge mit einer ausdrücklich genannten Annahme |
| `incomplete` | Menge fehlt, weil eine Regel oder ein Maß fehlt |
| `not-applicable` | Das Material ist für diese Wand nicht gewählt |

Eine unvollständige Position hat keine Menge. Sie bleibt in der Liste unter „Noch nicht vollständig berechenbar“.

## Was gerechnet wird

UW-Profile für Boden, Decke und beide seitlichen Anschlüsse ergeben Meter über die volle Länge oder Höhe. Liegt eine Tür in der Wand, bleibt der Bodenanschluss als bedingt gekennzeichnet: eine Unterbrechung des Bodenprofils ist nicht hinterlegt.

CW-Ständer ergeben Stückzahl mal Wandhöhe, aus den gespeicherten Positionen. Die beiden Enden stecken schon in dieser Liste und werden nicht noch einmal addiert. Die Abstände 312,5 mm, 417 mm und 625 mm bleiben `not-assessed`. Die Meter sind Geometrie, keine Systemfreigabe. Ständer in einer Türöffnung werden nicht entfernt und nicht gekürzt.

Beplankung wird je Seite und je Lage als Nettofläche gerechnet: Wandfläche minus Türöffnungen, solange sich die Öffnungen nicht überschneiden. Eine zweite Lage wird separat und als Flächensumme ausgegeben. Die Summe ist keine Fugenversetzung. `staggerJoints` merkt nur vor, dass eine spätere Ansicht die Stöße versetzen kann.

Eine Stückzahl gibt es nur, wenn das gewählte Format in der gespeicherten Lage oder beim Dämmstoff hinterlegt ist. Theoretisch ist das die Nettofläche geteilt durch dieses Format. Die Planungsmenge ist die Aufrundung auf ganze Platten. Das ist kein Zuschnitt und kein Verschnitt. Fehlt das Format, bleibt die Fläche stehen und die Stückzahl unvollständig. OSB-Flächen werden so gerechnet. Eine Schraube für OSB auf Metall bleibt unvollständig.

Dämmung ohne Auswahl ist nicht anwendbar. Mit Auswahl sind Fläche und Volumen bedingt: das Volumen ist Nettofläche mal gewählte Dicke. Die Dicke ist nur die Planungsdicke im Vergleich zur Profilnenntiefe. Daraus folgt kein U-Wert und kein Schall- oder Brandschutz der Wand.

## Was nicht gerechnet wird

Schrauben, Dübel, UA-Profile, Türstürze und die Befestigung der Anschlussprofile am Baukörper haben keinen hinterlegten Verbrauch. Ihre Menge bleibt leer. Es werden keine Schraubenabstände, Schraubenlängen oder OSB-Metall-Schrauben erfunden.

Lieferlängen werden nicht in Stück umgerechnet, auch wenn ein Profil welche im Katalog hat. Dafür fehlt ein Zuschnitt.

Es gibt keinen Verschnittprozentsatz. Verschnitt steckt nicht in der theoretischen Menge.

Überschneiden sich Öffnungen, werden Fläche, Dämmung und Volumen nicht ausgegeben. Der Konfigurator lässt so eine Wand nicht speichern. Die Rechnung schützt trotzdem davor, dieselbe Fläche zweimal abzuziehen.

Preise, Kosten und Einkauf sind nicht Teil der Berechnung.
