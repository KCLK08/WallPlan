# Technische 2D-Zeichnung

Stand: November 2026. Die Zeichnung liest dieselbe gespeicherte Metallständerwand wie der Konfigurator, die Materialliste und die 3D-Ansicht. Sie speichert keine eigene Konstruktion und legt keine Tabelle an.

Die Darstellung ist eine geometrische Ansicht. Sie ist kein geprüfter Ausführungs- oder Montageplan.

## Geometrie

`buildWallGeometry` bleibt die einzige Ableitung der Körper. `two-dimensional/geometry/project.ts` projiziert diese `SceneBox`-Körper in die Blattebene. Die 2D-Logik importiert kein React.

Die Blattkoordinaten bleiben Millimeter, Y nach oben. Erst `rendering/scale.ts` rechnet sie in Bildschirmpositionen um:

`x = panX + (mmX - minX) * pxPerMm`

`y = panY + (maxY - mmY) * pxPerMm`

Die Bauteil-IDs sind dieselben wie in der 3D-Inspektion: `selectionIdForBox`. Ein Tippen ändert die Wand nicht. Das Informationspanel ist dasselbe Panel wie in der 3D-Ansicht.

| Ansicht | Blattachsen | Inhalt |
| --- | --- | --- |
| Vorderansicht | X Länge, Y Höhe | Seite A, Profile, Türöffnungen. Seite B und Dämmung sind zunächst aus. |
| Rückansicht | dieselben Achsen, nicht gespiegelt | Seite B. Links bleibt das gespeicherte linke Wandende. |
| Seitenansicht | Z Wandstärke, Y Höhe | Schnitt durch ein Feld. Der CW-Umriss ist der benachbarte Ständer, kein zusätzliches Profil. |
| Draufsicht | X Länge, Z Wandstärke | Profile, Schichten, seitliche UW-Profile, gestrichelte Türlage. |
| Konstruktion | wie die Vorderansicht | UW, CW, Dämmung und Öffnungen. Beide Beplankungen sind zunächst aus. |

Öffnungsmarker aus der 3D-Geometrie werden nicht als Profile gezeichnet. Die Tür ist das gespeicherte Rechteck, gestrichelt. In Vorder- und Rückansicht wird ein Bauteil gestrichelt und ohne Füllung gezeichnet, wenn eine vordere Platte es verdeckt. Ein Ständer, dessen Mitte in der Türöffnung liegt, bleibt voll gezeichnet. Ein Türsturz, ein UA-Profil, Schrauben und Anschlussdetails werden nicht ergänzt.

Der Schnitt liegt in der Mitte des ersten Feldes zwischen zwei CW-Stegen, das keine Tür trifft. Liegt jedes Feld in einer Tür, schneidet die Ansicht einen Ständer und sagt, dass kein Sturz ergänzt wird. Eine fehlende Dämmung bleibt ein Hinweis, keine geschätzte Fläche.

## Bemaßung

Die Zahlen kommen aus `measureLines` und `formatMillimetres`. Sie sind dieselben Millimeter wie in der 3D-Liste. Maßlinien und Maßhilfslinien sind getrennte Striche. Überlappende Maße derselben Seite bekommen eigene Bahnen. Die Maßzahlen stehen zusätzlich in der Liste unter der Zeichnung.

Dargestellt werden, soweit die Ansicht sie trägt: Wandlänge, Wandhöhe, Wandstärke, Türbreite, Türhöhe, Abstand der Tür zur linken Kante, Abstand zwischen gespeicherten CW-Positionen, die Position jedes gespeicherten Ständers und die Dicke jeder sichtbaren Beplankungslage. Ein Abstand von 0 mm bekommt keine Maßlinie. Ausgeblendete CW-Profile nehmen ihre Abstandsmaße mit. Ausgeblendete Öffnungen und beide Beplankungen nehmen die Türmaße mit. Die Wandstärke bleibt die Summe aus Nennbreite und den bekannten Plattenstärken, auch wenn eine Lage gerade ausgeblendet ist. Eine fehlende Katalogdicke wird nicht geschätzt.

## Maßstab

`pxPerMm = pxPerInch / (Maßstab * 25.4)`. Im Web wird 96 px je Zoll angenommen, auf dem Gerät `160 * PixelRatio`. „Angepasst“ füllt die Fläche abzüglich Rand. 1:10, 1:20, 1:25 und 1:50 behalten diesen Pixelabstand. Passt die Zeichnung nicht in die Fläche, bleibt sie in diesem Maßstab und lässt sich verschieben. Die Beschriftung sagt das.

Nach einem Zoom gilt der gewählte Maßstab nicht mehr. Die Beschriftung nennt dann den rechnerischen Maßstab aus der angenommenen Pixeldichte. Keine dieser Angaben ist ein Druckmaßstab, weil die physische Anzeigegröße nicht gemessen wird.

Ein Finger verschiebt die Zeichnung ab etwa 12 px. Zwei Finger zoomen am Mittelpunkt. Das Mausrad zoomt nur über der Zeichenfläche. „Ansicht zurücksetzen“ setzt Vorderansicht, Ebenen und den angepassten Maßstab zurück.

## Ebenen und Auswahl

Schalter gibt es für Beplankung A und B, jede gespeicherte Lage, UW, CW, Dämmung, Öffnungen, Maßlinien, Maßtext und Positionsmarken. Farben trennen nur die Körper. Sie sagen nichts über Material, Brandschutz oder Schallschutz.

„Nur diese Lage“ und „Alle Beplankungen“ wirken nur auf die Zeichnung, wie in der 3D-Ansicht. Die Hervorhebung ist ein kräftigerer Rand. Füllfarbe und Geometrie bleiben.

## Grenzen

- Keine UA-Profile, keine Türstürze, keine Schrauben, keine Anschlussdetails.
- Die 2-mm-Darstellung der Profile ist die vorhandene Zeichenstärke, keine Materialdicke.
- Der CW-Umriss im Feldschnitt ist der benachbarte Ständer.
- Endständer sind in der Zeichnung eingerückt. Die gespeicherte Position bleibt am Wandende und wird so bemaßt.
- Benannte Maßstäbe rechnen mit einer angenommenen Pixeldichte.
- Expo Go auf einem Android-Gerät wurde in dieser Umgebung nicht ausgeführt.
