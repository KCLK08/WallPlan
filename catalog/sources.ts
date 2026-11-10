export type CatalogSource = {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
  usedFor: string;
};

export const CATALOG_SOURCES: readonly CatalogSource[] = [
  {
    id: 'knauf-k621-cw',
    title: 'K621.at Knauf CW-Profile, Technisches Blatt 11/2020',
    publisher: 'Knauf',
    date: '2020-11',
    url: 'https://knauf.com/api/download-center/v1/assets/6cba7de7-aee4-4af6-89c7-f547abd4f037?country=at&download=true&locale=de-AT',
    usedFor: 'CW-Nennbreiten 50 bis 150, Blech 0,6 mm und 1,0 mm, Stahl DX51D+Z, EN 14195 und DIN 18182-1',
  },
  {
    id: 'knauf-k625-uw',
    title: 'K625.at Knauf UW-Profile, Technisches Blatt 11/2020',
    publisher: 'Knauf',
    date: '2020-11',
    url: 'https://knauf.com/api/download-center/v1/assets/deea1ec9-996b-4c41-b6a2-b90494fcd6cc?download=true',
    usedFor: 'UW 50 bis 150, Flansch 40 mm, Blech 0,6 mm',
  },
  {
    id: 'knauf-cw50-product',
    title: 'Knauf Produktseite CW-Profil 50/50/0,6',
    publisher: 'Knauf Gips KG',
    date: '2026',
    url: 'https://knauf.com/de-DE/p/produkt/cw-profil-50-50-0-6-10095_0010',
    usedFor: 'Lieferlängen des CW 50/50/0,6',
  },
  {
    id: 'knauf-gkb',
    title: 'Knauf Produkt-Datenblatt Bauplatte GKB, 09/2025',
    publisher: 'Knauf',
    date: '2025-09',
    url: 'https://knauf.com/api/download-center/v1/assets/753948d7-984c-4e81-bc16-bd350722e25d?country=de&download=true',
    usedFor: 'GKB Typ A, 9,5 und 12,5 mm, Formate, Rohdichte, Wärmeleitfähigkeit',
  },
  {
    id: 'knauf-screws-pi108',
    title: 'Knauf Produktinformation Schnellbauschrauben, Stand 01/2020',
    publisher: 'Knauf',
    date: '2020-01',
    url: 'https://knauf.com/api/download-center/v1/assets/bb0113ff-5511-4a85-89ec-4ab241d0dc78?country=de&download=true',
    usedFor: 'TN-Feingewinde, TN-Grobgewinde und TB-Bohrspitze',
  },
  {
    id: 'knauf-tb-product',
    title: 'Knauf Produktseite Schnellbauschraube TB mit Bohrspitze',
    publisher: 'Knauf Gips KG',
    date: '2026',
    url: 'https://knauf.com/de-DE/p/produkt/schnellbauschraube-tb-mit-bohrspitze-10823_0010',
    usedFor: 'TB 3,5 mm für Stahlblech 0,7 bis 2,25 mm, Längen 25 bis 55 mm',
  },
  {
    id: 'siniat-lagyp',
    title: 'Siniat Produktdatenblatt LaGyp',
    publisher: 'Siniat',
    date: 'ohne Datum im Blatt',
    url: 'https://media.siniat.de/doc_920083_at/original/1011683806/siniat-at_pdb_lagyp.pdf?brand=siniat&market=at',
    usedFor: 'Typ A, 9,5 und 12,5 mm, Breite 1.250 mm',
  },
  {
    id: 'siniat-lagyp-dop',
    title: 'Siniat Leistungserklärung LaGyp SI-GY-1607001',
    publisher: 'Siniat',
    date: '2023-03',
    url: 'https://media.siniat.de/pi49754/original/468002303/siniat-leistungserkl---lagyp-gkb---si-gy-1607001.pdf',
    usedFor: 'LaGyp als Typ A auch in 15 und 18 mm, λ 0,21 W/(m·K)',
  },
  {
    id: 'siniat-lagyp-h2',
    title: 'Siniat Produktdatenblatt LaGyp imprägniert',
    publisher: 'Siniat',
    date: 'ohne Datum im Blatt',
    url: 'https://media.siniat.de/doc_920013_at/original/-1582676283/siniat-at_pdb_lagyp_impragniert.pdf?brand=siniat&market=at',
    usedFor: 'Typ H2, 12,5 mm, Wasseraufnahme und Feuchtraumklasse W3',
  },
  {
    id: 'siniat-laflamm',
    title: 'Siniat Produktdatenblatt LaFlamm',
    publisher: 'Siniat',
    date: 'ohne Datum im Blatt',
    url: 'https://media.siniat.de/pi351184/original/2645195/siniat-pdb_laflamm.pdf',
    usedFor: 'Feuerschutzplatte Typ DF, 15 und 18 mm',
  },
  {
    id: 'fermacell-gipsfaser',
    title: 'fermacell Gipsfaserplatten im Trockenbau, Planung und Verarbeitung',
    publisher: 'fermacell',
    date: 'Ausgabe im Händlerarchiv, ETA-03/0050',
    url: 'https://www.fermacell.com/de-de/produkte/wand/gipsfaserplatten',
    usedFor: 'Dicken 10, 12,5, 15 und 18 mm, Formate, Rohdichte, λ 0,32 W/(m·K)',
  },
  {
    id: 'rigips-diy-2024',
    title: 'Rigips DIY Lieferprogramm, Stand 03/2024',
    publisher: 'Saint-Gobain Rigips',
    date: '2024-03',
    url: 'https://www.rigips-heimwerker.de/documents/infomaterial-broschuren-flyer/rigips-diy-lieferprogramm-010324.pdf',
    usedFor: 'UA, Türsturz, CD, UD, Hutprofil, Abhänger, Schraubenlängen, Platten Die Blaue und Die Harte, Eckschutz, Anschlussdichtungen',
  },
  {
    id: 'rigips-uw-at',
    title: 'Rigips Produktseite U-Wandprofil',
    publisher: 'Rigips Austria',
    date: '2026',
    url: 'https://www.rigips.at/produkte/u-wandprofil',
    usedFor: 'UW-Nenndicke 0,6 mm und Beispielmaße UW 50, 75 und 100',
  },
  {
    id: 'knauf-tw-2014',
    title: 'Knauf Insulation Trennwand-Dämmplatte TW, Produktdatenblatt 04/2014',
    publisher: 'Knauf Insulation',
    date: '2014-04',
    url: 'https://s3-website-fra.23m.com/kraftwebshop/Datenblaetter/KNAUF_90790/DB_2060610447.pdf',
    usedFor: 'Steinwolle, λD 0,040 W/(m·K), Dicken 40 bis 140 mm, Format 1.200 × 625 mm',
  },
  {
    id: 'knauf-kp034-2026',
    title: 'Knauf Insulation Mineral Plus KP 034, Produkt-Datenblatt 09/2026',
    publisher: 'Knauf Insulation',
    date: '2026-09',
    url: 'https://knauf.com/api/download-center/v1/assets/43faa881-000a-4ba4-909e-ac48a33b9efe?country=de&download=true',
    usedFor: 'Mineralwolleplatte, λD 0,034 W/(m·K), Dicken 30 bis 140 mm, Format 1.250 × 625 mm',
  },
  {
    id: 'en-300',
    title: 'DIN EN 300, Klassifizierung von OSB',
    publisher: 'Norm, nicht einer der vier Trockenbauhersteller',
    date: 'Produktnorm',
    url: '',
    usedFor: 'OSB/3 als Klasse für tragende Zwecke im Feuchtbereich. Keine Pflichtstärke und keine Schraubenregel übernommen.',
  },
  {
    id: 'not-in-evaluated-sheets',
    title: 'Kein belegtes Datenblatt in der ausgewerteten Auswahl',
    publisher: 'WallPlan',
    date: '2026-11-10',
    url: '',
    usedFor: 'Die Kategorie ist im Grundkatalog vorhanden. Dicke, Format oder Kennwert wurden nicht gefunden und sind deshalb nicht gespeichert.',
  },
  {
    id: 'assumption-cavity',
    title: 'WallPlan-Annahme Hohlraum',
    publisher: 'WallPlan',
    date: '2026-11-10',
    url: '',
    usedFor: 'Eine Dämmplatte kann nur dann geometrisch in einer Einfachständerwand liegen, wenn ihre Dicke nicht größer als die Profilnenntiefe ist. Das ist keine Systemprüfung.',
  },
];

export function findSource(id: string): CatalogSource | undefined {
  return CATALOG_SOURCES.find((source) => source.id === id);
}
