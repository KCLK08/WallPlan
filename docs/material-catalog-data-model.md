# Datenmodell des Materialkatalogs

Katalogversion `3.0.0`. Der Datensatz liegt in `catalog/` und wird mit der App ausgeliefert.

## Warum TypeScript und nicht eine zweite Datenbankkopie

Phase 1 sieht eine Tabelle `catalog_items` vor. Eine zweite, pflegbare Kopie neben dem Quelltext würde auseinanderlaufen. Deshalb gilt:

- Der versionierte Grunddatensatz ist TypeScript. IDs, Maße und Regeln werden vom Compiler und von den Tests geprüft.
- SQLite speichert in `app_meta` nur den Schlüssel `catalog_version`. Beim Start wird diese Version auf `3.0.0` gesetzt.
- Projekte bleiben unberührt. Sie sollen später die stabile `catalogItemId` speichern, nicht den Anzeigenamen.
- Eine Tabelle `catalog_items` wird nicht gefüllt. Sie kann später aus demselben TypeScript-Datensatz erzeugt werden, ohne die IDs zu ändern.

Es gibt keine Bearbeitung, kein Hinzufügen und kein Löschen durch den Nutzer und keine Preise.

## Eintrag

`MaterialItem` in `catalog/types.ts` trägt:

- `id`, `nameDe`, `nameEn`
- `category`, `subcategory`, `materialType`
- Beschreibung, optionale Dicke, optionale Längen und Formate
- `unit`
- `properties` nur mit belegtem Wert und `sourceId`
- `suitableFor`
- Einschränkungen
- `manufacturerReferences`
- `sourceIds`
- `catalogVersion`

Optionale Blöcke `profile`, `board`, `insulation` und `fastener` gibt es nur, wo sie die Prüfung brauchen. Leere Zahlenfelder werden nicht mit 0 gefüllt.

Die Prototyp-IDs `uw-75`, `cw-75` und `gk-12-5` sind dieselben IDs im neuen Katalog. `catalogName` liest sie von dort.

## Schichten

`CladdingLayerSpec` hat eine eigene ID, eine `catalogItemId`, `orderFromFraming` und eine Rolle `backing` oder `finish`. Seite A und Seite B bleiben getrennte Listen. `OSB_PLUS_GYPSUM_SIDE_A` zeigt OSB/3 15 mm direkt an der Unterkonstruktion und Gipskarton 12,5 mm davor. Das ist ein Datenbeispiel, kein geprüfter Systemaufbau.

## Auswahl für den späteren Konfigurator

`relevantMaterials` gibt nur Einträge zurück, deren `suitableFor` die Konstruktion enthält. Bei einer Nennbreite bleiben nur Profile dieser Breite übrig. Einträge ohne Kennwert, etwa Glaswolle oder die Zementbauplatte, haben kein `suitableFor` und erscheinen in dieser Auswahl nicht.

`fastenersFor` unterscheidet Gips auf dünnem Metall, Gips auf dickem Metall, Gips auf Holz und OSB auf Metall.
