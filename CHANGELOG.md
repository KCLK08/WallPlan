# Changelog

## [0.6.0] - 2026-11-10

### Added

- Materialberechnung für eine gespeicherte Metallständerwand, Berechnungsversion 1
- Materialliste mit Unterkonstruktion, Beplankung, Dämmung, Befestigung und unvollständigen Positionen
- Die Liste wird beim Öffnen neu gerechnet und nicht in SQLite gespeichert

## [0.5.0] - 2026-11-10

### Added

- Konfigurator für eine Metallständer-Trennwand mit Maßen, Profilen, Beplankung, Dämmung und Türöffnungen
- Speicherung in `constructions.data_json`, Konfigurationsversion 1
- Schematische Wandansicht, getrennt von der späteren 3D-Ansicht

## [0.4.0] - 2026-11-10

### Added

- Lokale Projektverwaltung: anlegen, öffnen, bearbeiten, umbenennen und bestätigt löschen
- SQLite-Migration auf Schema 2 mit Statusspalte und leerer Konstruktionstabelle
- Startseite mit zuletzt bearbeiteten Projekten

## [0.3.0] - 2026-11-10

### Added

- Offline-Materialkatalog 3.0.0 mit 88 Einträgen, Suche und Detailansicht
- Kompatibilitätsregeln für Profile, Platten, Schrauben, Dämmung und Abhänger
- Quellen- und Datenmodelldokumentation unter `docs/`

## [0.2.0] - 2026-11-10

### Added

- Expo-SDK-58-Grundgerüst mit React Native, TypeScript, Expo Router, Zustand und Expo SQLite
- Startseite, Projektliste, neues Projekt und Einstellungen
- Lokales Speichern von Projektname, Beschreibung und Einstellungen
- 3D-Prototyp einer Metallständer-Trennwand mit Three.js und React Three Fiber
- Drehen, Zoomen, Verschieben und Ein-/Ausblenden der Gipskartonplatte
- Bewertung der 3D-Technologie in `docs/3d-technology-evaluation.md`
