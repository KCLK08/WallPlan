# WallPlan

Private Offline-App zur 3D-Planung von Trockenbaukonstruktionen. Es gibt kein Konto, kein Backend und keine Cloud. Projekte und Einstellungen liegen in einer lokalen SQLite-Datenbank.

Der fachliche Ausbau der Metallständer-Trennwand folgt in späteren Phasen. Diese Version enthält das Expo-Grundgerüst, die ersten Screens, einen 3D-Prototypen mit festen Testmaßen und den lokalen Materialkatalog 3.0.0.

## Technologiestack

| Bereich | Version |
| --- | --- |
| Expo SDK | 58.0.23 |
| React | 19.3.0 |
| React Native | 0.88.1 |
| Expo Router | 58.0.30 |
| TypeScript | 6.0.3 |
| Zustand | 5.1.0 |
| Expo SQLite | 58.0.15 |
| Expo GL | 58.0.4 |
| Three.js | 0.187.0 |
| React Three Fiber | 9.8.2 |

SDK 58 ist die Version, die Expo Go aus dem Play Store im November 2026 öffnet. Die Bewertung der 3D-Lösung steht in [docs/3d-technology-evaluation.md](docs/3d-technology-evaluation.md). Die Architekturentscheidung aus Phase 1 steht in [docs/PHASE-1-ANALYSE.md](docs/PHASE-1-ANALYSE.md).

Der Materialkatalog ist nur lesbar, offline und ohne Preise. Quellen, Datenmodell und Kompatibilität stehen in [docs/material-catalog-sources.md](docs/material-catalog-sources.md), [docs/material-catalog-data-model.md](docs/material-catalog-data-model.md) und [docs/material-compatibility.md](docs/material-compatibility.md).

## Installation

```bash
npm install
```

## App starten

```bash
npx expo start
```

Im Terminal:

- `w` öffnet die Web-Ansicht
- der QR-Code öffnet das Projekt in Expo Go

Weitere Skripte:

```bash
npm run android
npm run web
npm run typecheck
npm test
```

## Start mit Expo Go

1. Expo Go für SDK 58 installieren. Die Fassung aus dem Play Store ist passend, solange sie SDK 58 enthält. Eine andere SDK-Version weist das Projekt ab.
2. Im Projektordner `npx expo start` ausführen.
3. Den QR-Code mit Expo Go auf einem Android-Gerät scannen. Telefon und Rechner müssen dasselbe Netz erreichen.

In dieser Entwicklungsumgebung konnte Expo Go auf einem Android-Gerät nicht ausgeführt werden. Der Android-JavaScript-Bundle lässt sich erzeugen. Details stehen in der 3D-Bewertung.

## Projektstruktur

```text
app/                 Screens und Navigation (Expo Router)
components/          Wiederverwendbare Oberfläche
features/            Anwendungsfälle, derzeit Projekte anlegen
construction/        Konstruktionsdaten des Prototyps
catalog/             Lokaler Materialkatalog, Version und Kompatibilitätsregeln
calculations/        Ständerabstände und Maßangaben
three-dimensional/   Geometrie, Kamera und 3D-Ansicht
database/            SQLite-Schema und Zugriffe
store/               Zustand für Einstellungen und Projektliste
types/               TypeScript-Typen
constants/           Farben, Typografie, Texte
docs/                Technische Dokumentation
```

## Erste Screens

- Startseite mit neuem Projekt, eigenen Projekten und zuletzt bearbeitetem Projekt
- Projektliste, inklusive leerer Ansicht
- Neues Projekt mit Name und optionaler Beschreibung
- Einstellungen für Sprache, Maßeinheit und Hell-/Dunkelmodus
- 3D-Prototyp einer Metallständer-Trennwand
- Materialkatalog mit Suche, Kategorien und technischen Details

## Materialkatalog

Version 3.0.0, 88 Einträge, mit der App ausgeliefert. SQLite merkt sich nur die Katalogversion in `app_meta`. Die Einträge selbst liegen nicht ein zweites Mal in der Datenbank.

Der Katalog unterscheidet belegte Herstellerwerte, Normklassen und leere Felder. Ungeprüfte Kombinationen gelten nicht als geeignet. OSB und Gipskarton sind getrennte Schichten. Eine Schraube für OSB auf Metall ist nicht belegt und wird nicht als passend angeboten.
