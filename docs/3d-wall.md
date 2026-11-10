# 3D-Ansicht der gespeicherten Wand

Stand: November 2026. Die Geometrie liegt in `three-dimensional/geometry/` und importiert kein React. Die Oberfläche ruft `buildWallGeometry` mit der gespeicherten Wand auf und zeichnet das Ergebnis. Es gibt keine zweite Konstruktion und keinen Eintrag in SQLite.

Dieselbe `SavedWall` speist den Konfigurator, die Materialberechnung und diese Ansicht. Ständerpositionen kommen aus `studOffsetsMm`. Der Prototyp aus Phase 2 bleibt unter `buildMetalStudWall` und wird von dieser Ansicht nicht benutzt.

## Einheiten

Intern bleiben alle Maße Millimeter. `toScene` teilt durch 1 000. Eine Three.js-Einheit ist ein Meter. Die Umrechnung passiert erst in `buildSceneGroup`.

## Was gezeichnet wird

UW-Profile für Boden, Decke und beide seitlichen Anschlüsse, CW-Ständer an den gespeicherten Positionen, jede Beplankungslage in ihrer Reihenfolge und die Dämmung in den Feldern zwischen den Ständern. Türöffnungen werden aus Beplankung und Dämmung ausgeschnitten. Sie beginnen an der Unterkante, weil keine Brüstungshöhe gespeichert ist.

Seite A liegt auf der positiven Z-Seite, Seite B auf der negativen. Die erste Lage sitzt am Profil, weitere Lagen liegen weiter außen. Plattenstärken kommen aus dem Katalog. OSB und Gipskarton behalten getrennte Farben.

Eine orangefarbene Markierung zeigt die gespeicherte Öffnung. Sie ist kein Profil.

## Annahmen, die nur die Darstellung betreffen

- Blech dünner als 2 mm wird mit 2 mm gezeichnet, damit es auf dem Telefon sichtbar bleibt. Die Katalogdicke bleibt in den Hinweisen stehen.
- Berührende Flächen haben 0,5 mm Abstand. Das ist kein Baumaß.
- Randständer rücken hinter den Anschlussflansch, damit sich die Körper nicht durchdringen. Die gespeicherte Position bleibt am Wandende.
- Der CW-Flansch wird aus der Typbezeichnung gelesen, wenn kein eigenes Flanschfeld existiert. Die Umbördelung fehlt im Katalog und wird nicht ergänzt.
- Fehlt ein Stegmaß, wird die Nennbreite gezeichnet.
- Schichten- und Explosionsansicht schieben die Lagen nur in der Ansicht auseinander.

## Was nicht gezeichnet wird

UA-Profile und Türstürze. Der Katalog nennt Querschnitte, aber nicht Anzahl, Lage und Anschluss an der konkreten Öffnung. Ständer, die in der Öffnung liegen, bleiben in voller Höhe. Sie werden nicht gekürzt und nicht ersetzt.

Fehlt eine Plattenstärke oder die Katalogzeile eines Profils, entsteht kein Ersatzmaß für den fehlenden Flansch. Überschneidende Öffnungen werden nicht ausgeschnitten.

Die Farben trennen nur die Bauteile. Sie sind keine Materialeigenschaft. Die Ansicht ist kein Schall-, Brand- oder Wärmeschutznachweis.

## Bedienung

Drehen, Zoomen und Verschieben laufen über denselben JavaScript-Responder wie der Prototyp. Ein kurzes Tippen wählt ein Bauteil, eine Bewegung ab etwa 12 px dreht, zwei Finger zoomen und verschieben. Im Web bleiben Maus, Mausrad und Umschalt-Ziehen. Perspektive und Parallelprojektion, Zurücksetzen und die sechs Ansichtsmodi ändern nur die Kamera und die Sichtbarkeit. Die Inspektion steht in [docs/3d-inspection.md](3d-inspection.md).

Schattenkarten sind aus. In Phase 2 waren sie auf Expo Go nicht zuverlässig, und eine flackernde Schattenkarte wäre eine Scheinlösung. Zwei gerichtete Lichter und ein Umgebungslicht modellieren die Körper.

Beim Verlassen der Ansicht werden Geometrien und Materialien freigegeben. Es kommt keine weitere Bibliothek hinzu. Expo Go bleibt der Weg über `expo-gl`, Three.js und React Three Fiber. `metro.config.js` löst `three` weiter auf `three.module.js` auf.
