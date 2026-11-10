# 3D-Technologiebewertung

Stand: 10. November 2026. Diese Bewertung gehört zu Phase 2. Sie beschreibt, was installiert und was tatsächlich ausgeführt wurde.

## Entscheidung

Für den Prototyp wird **Three.js über React Three Fiber auf `expo-gl`** verwendet.

Die Szene ist echte 3D-Geometrie: zwei UW-Profile, sechs CW-Profile im Abstand von 625 mm und eine Gipskartonplatte. Die Platte lässt sich ausblenden. Die Kamera lässt sich drehen, zoomen und verschieben.

Ein Wechsel auf eine Development-Build-Umgebung wurde nicht vorgenommen. `react-native-webgpu` bleibt ausgeschlossen, weil es nicht in Expo Go läuft.

## Getestete Bibliotheken

| Paket | Version | Rolle |
| --- | --- | --- |
| `expo` | 58.0.23 | SDK, passend zu Expo Go 58 |
| `react` | 19.3.0 | UI |
| `react-native` | 0.88.1 | Native Laufzeit |
| `expo-gl` | 58.0.4 | OpenGL-ES-Fläche, in Expo Go enthalten |
| `three` | 0.187.0 | Geometrie und Materialien |
| `@react-three/fiber` | 9.8.2 | Deklarative Szene, Native-Einstieg `@react-three/fiber/native` |
| `react-native-gesture-handler` | 3.3.0 | Touch-Steuerung |
| `@types/three` | 0.187.0 | Typen, Three.js 0.187 liefert keine eigenen mit |

Nicht installiert, weil sie für den Prototyp nicht nötig waren:

- `@react-three/drei`
- `expo-three`
- `react-native-webgpu`

`expo-gl` 58.0.4 behebt einen Fehler, bei dem WebGL-2-Kontexte für Three.js ab r163 wie WebGL 1 aussahen. Deshalb ist ein aktuelles Three.js auf diesem SDK der passende Stand und nicht ein künstlich altes Paket.

## Expo-SDK und Expo Go

Phase 1 hatte SDK 54 als konservativen Start genannt. Im November 2026 öffnet die Expo-Go-App aus dem Play Store nur noch SDK 58. Ein SDK-54-Projekt würde dort mit „Project is incompatible with this version of Expo Go“ abgewiesen. SDK 58 ist deshalb die Version, die zur Anforderung „Expo Go auf Android“ passt.

Die App hängt nicht von einem nativen Modul außerhalb des Expo-Go-Bundles ab. `expo-gl` und `expo-sqlite` sind Bestandteil von Expo Go.

## Was ausgeführt wurde

### Geometrie ohne Grafikkarte

`npm test` baut die Wand in Node und prüft die Szene:

- Objekte `uw-bottom` und `uw-top`
- sechs Ständer `cw-0` bis `cw-5`
- Objekt `gypsum-board`
- 25 Meshes: je drei Kästen für zwei Schienen und sechs Ständer, plus eine Platte

Die Ständerpositionen für 3000 mm Länge und 625 mm Raster sind `0, 625, 1250, 1875, 2500, 3000`.

### Android-Bundle

`npx expo export --platform android` hat den Hermes-Bundle erfolgreich erzeugt, einschließlich `@react-three/fiber/native` und `expo-gl`. Das prüft, dass Metro die native 3D-Einstiegstelle auflöst. Es zeigt keine Pixel auf einem Gerät.

### Web mit WebGL

`npx expo start --web` liefert die App. In der Browserumgebung des Agenten ohne funktionierendes WebGL erschien die vorgesehene Fehlermeldung „Die 3D-Ansicht konnte nicht gestartet werden.“ Ursache war `THREE.WebGLRenderer: Error creating WebGL context` auf dem Software-Renderer llvmpipe. Die übrige App blieb bedienbar.

Mit Chrome und SwiftShader (`--enable-unsafe-swiftshader`) entstand ein WebGL-2-Kontext. Dort wurde die Prototyp-Seite geprüft:

- Die Platte ist ein Körper mit sichtbarer Kante auf einem Raster, keine flache Grafik.
- Ziehen mit der Maus ändert die Kameraposition.
- Das Mausrad ändert den Abstand.
- Umschalt-Ziehen verschiebt den Blickpunkt.
- „Gipskarton ausblenden“ entfernt die Platte. Danach sind die senkrechten CW-Profile und die beiden UW-Schienen sichtbar. Die Beschriftung wechselt auf „Gipskarton einblenden“.

Die Blechstärke ist in der Darstellung 2 mm statt der realen 0,6 mm. Außenmaß 75 mm und Flansch 40 mm bleiben die Profilmaße. Ohne diese Verstärkung wäre das Blech auf dem Telefon nicht lesbar. Das Feld `steelThicknessMm` hält den realen Wert für die spätere Berechnung.

### Oberfläche und SQLite

Im Browser geprüft:

- Startseite, leere Zustände, Projekt anlegen, Liste und „Zuletzt bearbeitet“
- Sprache Deutsch/Englisch, Hell/Dunkel, Maßeinheit
- Schmale und breite Breite: eine Spalte unter 840 px, zwei Spalten darüber
- Nach einem Neuladen bleibt ein angelegtes Projekt erhalten

`npx expo-doctor` meldet 20 von 20 Prüfungen ohne Befund. `npx tsc --noEmit` ist ohne Fehler.

## Expo-Go-Import von Three.js

Three.js 0.187 leitet `require('three')` auf `three.cjs` um. Die erste Zeile ruft `process.emitWarning` auf. In Expo Go ist diese Funktion nicht vorhanden, der Import endet mit `undefined is not a function`. `metro.config.js` löst `three` deshalb auf `build/three.module.js` auf. Das ist derselbe ESM-Build, den der Web-Bundler bereits verwendet.

## Expo Go auf Android

**Nicht auf einem Gerät oder Emulator ausgeführt.** Diese Umgebung hat kein Android-SDK, keinen Emulator und kein angeschlossenes Telefon. Deshalb wird nicht behauptet, dass die 3D-Szene in Expo Go bereits gesehen wurde.

Was dafür spricht, dass derselbe Prototyp in Expo Go starten kann:

- Der Android-Bundle enthält den Native-Renderer.
- `expo-gl` 58 ist in Expo Go enthalten und für Three.js r163+ korrigiert.
- Die Geometrie und die Steuerung sind nicht an WebGL im Browser gebunden. Auf dem Gerät zeichnet `expo-gl`.

Was offen bleibt, bis ein Android-Gerät den QR-Code öffnet:

- Ob der GL-Kontext auf dem konkreten Gerät erscheint
- Ob Ein-Finger-Drehen, Zwei-Finger-Verschieben und Aufziehen flüssig sind
- Ob die New Architecture von React Native 0.88 auf diesem Gerät eine leere Fläche zeigt

Ein Fehlschlag auf dem Gerät wäre ein Grund, den Native-Einstieg auf eine imperative `GLView` mit demselben `buildMetalStudWall` umzustellen. Die Geometrie ist dafür schon von React Three Fiber getrennt.

## Performance

Die Prototyp-Szene hat 25 Meshes und eine einfache Beleuchtung. Auf SwiftShader hat jede Steuerungsaktion das Bild ohne erkennbare Wartezeit aktualisiert. Eine Bildrate auf Android wurde nicht gemessen. Für eine einzelne Testwand ist die Datenmenge klein. Mehrere Wände oder feine Profile können später zusammengefasste Geometrien brauchen.

## Einschränkungen

- Kein Nachweis auf echter Android-Hardware.
- iOS wurde nicht gebaut und nicht in Expo Go geöffnet.
- Die Web-Datenbank braucht in Metro die Dateiendung `.wasm` und die Header `Cross-Origin-Opener-Policy: same-origin` sowie `Cross-Origin-Embedder-Policy: credentialless`. Das steht in `metro.config.js` und betrifft nur die Web-Variante von `expo-sqlite`.
- Gesten auf dem Gerät sind an `react-native-gesture-handler` gebunden. Im Web ersetzen Maus, Mausrad und die Umschalttaste die Touch-Gesten.
- `@react-three/drei` wurde nicht aufgenommen. Die Kamera ist eine eigene Kugelkoordinaten-Steuerung, damit keine zusätzliche native Abhängigkeit entsteht.

## Empfehlung

React Three Fiber 9.8.2 mit Three.js 0.187 und `expo-gl` 58 beibehalten. Den nächsten praktischen Schritt auf einem Android-Telefon mit Expo Go 58 machen: QR-Code öffnen, Wand drehen, Platte ausblenden. Erst wenn diese Ansicht leer bleibt oder abstürzt, den Renderer auf imperatives Three.js in einer `GLView` umstellen. Die Konstruktionsdaten und `buildMetalStudWall` bleiben dabei unverändert.
