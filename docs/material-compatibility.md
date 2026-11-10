# Kompatibilität

Die Prüfung steht in `catalog/compatibility.ts`. `assessCompatibility` vergleicht zwei Katalog-IDs und liefert genau einen Status:

| Status | Bedeutung |
| --- | --- |
| `compatible` | Die ausgewerteten Unterlagen beschreiben diese Paarung. |
| `conditional` | Es gibt eine eingeschränkte Regel. Ohne den konkreten Aufbau ist das keine Freigabe. |
| `incompatible` | Die Unterlagen oder die Nennmaße schließen die Paarung aus. |
| `not-assessed` | Keine Regel. Das wird nicht als geeignet angezeigt. |

## Hinterlegte Regeln

- CW, UA und Türsturz passen zum UW derselben Nennbreite. Unterschiedliche Nennbreiten sind nicht kompatibel.
- UA neben CW derselben Breite ist bedingt kompatibel: Verstärkung einer Öffnung, kein pauschaler Ersatz jedes Ständers.
- CD und UD gehören zusammen. CD oder UD neben CW, UW oder UA ist nicht kompatibel.
- Direktabhänger, U-Direktabhänger, Nonius, Draht, Schnellabhänger, Kreuz- und Längsverbinder gelten für CD-Decken. An einer CW-Wand sind sie nicht kompatibel. Der Winkelverbinder für Abhänger hat keine Maße und bleibt ungeprüft.
- Dämmplatten mit hinterlegten Dicken werden mit der Profilnenntiefe verglichen. Das ist die Annahme `assumption-cavity`. Passende Dicken sind bedingt kompatibel, weil Brand und Schall damit nicht nachgewiesen sind.
- TN-Feingewinde und eine Gipsplatte sind bedingt kompatibel, solange das Metall fehlt. Zusammen mit einem CW- oder UW-Profil bis 0,7 mm ist die Paarung kompatibel. An einem UA-Profil ist Feingewinde nicht kompatibel.
- TN-Grobgewinde ist für Gips auf Holz bedingt geeignet und an CW oder UW nicht kompatibel. Es befestigt nicht die OSB-Platte.
- TB-Bohrschraube und UA sind kompatibel. An 0,6-mm-Profilen ist die Bohrschraube nicht kompatibel.
- OSB und Gipskarton sind bedingt kompatibel als zwei getrennte Schichten. Ein Systemprüfzeugnis dafür liegt nicht vor.
- Für OSB auf Metall gibt `fastenersFor('osb-on-metal')` keine kompatible Schraube zurück.
- Gipsfaser und die Knauf-TN-Schraube bleiben ungeprüft, weil fermacell eigene Schrauben nennt.
- Alles ohne Regel, etwa Acryl an einer Platte, ist `not-assessed`.

## OSB und Gipskarton

| Schicht | ID | Rolle |
| --- | --- | --- |
| 1, an der Unterkonstruktion | `board-osb3-15` | `backing` |
| 2, raumseitig | `gk-12-5` | `finish` |

Weitere OSB-Dicken sind `board-osb3-12` und `board-osb3-18`. Die Gipslage kann später auf eine andere Gips-ID zeigen. Die Schraube der OSB-Lage und die Schraube der Gipslage sind getrennte Katalogeinträge.
