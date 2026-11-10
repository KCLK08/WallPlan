# Projektverwaltung

Stand: Schemaversion 2, November 2026.

## Datenmodell

`Project` in `types/project.ts`:

| Feld | Bedeutung |
| --- | --- |
| `id` | Stabile ID. Sie ändert sich beim Bearbeiten nicht. |
| `name` | Pflicht, ohne Leerzeichen am Rand |
| `description` | Optional |
| `status` | Derzeit immer `active` |
| `createdAt`, `updatedAt` | ISO-Zeitstempel |
| `constructions` | Liste späterer Konstruktionen, in dieser Phase leer |

`ConstructionRecord` hat ID, Projektbezug, Typ, Namen und Zeitstempel. Die Tabelle `constructions` enthält `data_json`. Eine Metallständerwand liegt dort als Konfigurationsversion 1. Leeres `{}` bleibt eine Konstruktion ohne lesbare Wanddaten. Das Modell steht in [wall-configurator.md](wall-configurator.md).

## SQLite

Datei: `wallplan.db` auf dem Gerät.

`database/migrate.ts` plant die Schritte anhand der vorhandenen Spalten:

1. Basistabellen `settings`, `projects` und `app_meta`, falls sie fehlen. Das ist das Schema aus Phase 2 und 3.
2. Spalte `projects.status` mit Standard `active`, falls sie fehlt.
3. Tabelle `constructions` und ein Index auf `project_id`.

Danach speichert `app_meta.schema_version` den Wert `2`. `catalog_version` bleibt unabhängig.

Löschen entfernt zuerst die Konstruktionszeilen des Projekts und dann das Projekt. Die ID ist der Primärschlüssel, ein zweites Speichern derselben ID schlägt fehl und legt kein Duplikat an.

Fehler beim Lesen oder Schreiben werden als `ProjectWriteError` weitergegeben. Die Oberfläche zeigt dann eine Meldung und behält die bisherigen Daten. Schlägt das Laden beim Start fehl, bleibt eine Hinweisansicht stehen.

## Oberfläche

Die Startseite zeigt die zuletzt geänderten Projekte und eine kompakte Liste. „Alle Projekte“ öffnet die Übersicht. Suche filtert Name und Beschreibung. Löschen fragt nach. „Konstruktion hinzufügen“ ist deaktiviert und legt nichts an.

Zustand hält die sortierte Liste. Nach dem Start kommt sie aus SQLite. Anlegen, Speichern und Löschen schreiben zuerst in die Datenbank und aktualisieren danach den Speicher.
