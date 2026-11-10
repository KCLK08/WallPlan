import type { OpeningError, WallIssue } from '@/construction/wallRules';
import { PLANNER_LIMITS } from '@/construction/wallModel';
import type { Language } from '@/types/settings';

const de = {
  chooseType: 'Konstruktion wählen',
  typeMetal: 'Metallständer-Trennwand',
  typeMetalBody: 'Eine Ständerreihe aus UW- und CW-Profilen, zwei Wandseiten, optional Dämmung und Türöffnungen.',
  typeDouble: 'Doppelständerwand',
  typeLining: 'Vorsatzschale',
  typeCeiling: 'Abgehängte Decke',
  typeTimber: 'Holzständerwand',
  typeUnavailable: 'Noch nicht verfügbar. Es werden keine Maße angenommen.',
  typeDoubleBody: 'Zwei Ständerreihen. Abstand und Kopplung sind im Katalog nicht belegt.',
  stepOf: 'Schritt',
  stepName: 'Angaben',
  stepSize: 'Maße',
  stepFrame: 'Unterkonstruktion',
  stepCladding: 'Beplankung',
  stepInsulation: 'Dämmung',
  stepOpenings: 'Öffnungen',
  stepSummary: 'Überblick',
  constructionName: 'Name der Konstruktion',
  constructionNamePlaceholder: 'Zum Beispiel Trennwand Wohnzimmer',
  constructionDescription: 'Beschreibung',
  length: 'Wandlänge',
  height: 'Wandhöhe',
  measureHint: 'Eingabe in der eingestellten Maßeinheit. Intern rechnet die App in Millimetern.',
  limits: `Planungsgrenzen: Länge ${PLANNER_LIMITS.minLengthMm}–${PLANNER_LIMITS.maxLengthMm} mm, Höhe ${PLANNER_LIMITS.minHeightMm}–${PLANNER_LIMITS.maxHeightMm} mm. Das ist keine Tragfähigkeitsangabe.`,
  schematicTitle: 'Schematische Ansicht',
  schematicCaption: 'Nur ein Schema für Maße, Profile und Öffnungen. Die 3D-Ansicht der gespeicherten Wand ist davon getrennt.',
  schematicMissing: 'Maße fehlen noch.',
  profileWidth: 'Profilbreite',
  profileSpacing: 'Profilabstand',
  spacingNote: '312,5 mm, 417 mm und 625 mm teilen eine Plattenbreite von 1 250 mm. Eine geprüfte Systemregel für den Achsabstand liegt im Katalog nicht vor.',
  connections: 'Wandanschlüsse',
  connectionsBody: 'Boden, Decke und beide seitlichen Anschlüsse verwenden das UW-Profil derselben Nennbreite.',
  sideA: 'Seite A',
  sideB: 'Seite B',
  variantSingle: 'Eine Lage Gipskarton',
  variantDouble: 'Zwei Lagen Gipskarton',
  variantOsb: 'OSB und Gipskarton',
  layerInner: 'Lage an der Unterkonstruktion',
  layerOuter: 'Äußere Lage',
  layerOnly: 'Gipskartonlage',
  board: 'Platte',
  format: 'Plattenformat',
  formatMissing: 'Für diese Platte ist kein Format hinterlegt.',
  staggerNote: 'Die beiden Gipslagen bleiben getrennt. Die Stöße können später versetzt dargestellt werden.',
  osbWarning: 'Technisch noch nicht vollständig geprüft. Für OSB auf Metall ist keine Schraube belegt. Es gibt keine Schraubenempfehlung und keine Aussage zur Tragfähigkeit.',
  noInsulation: 'Ohne Dämmung',
  insulationProduct: 'Dämmstoff',
  insulationThickness: 'Dämmstärke',
  insulationFit: 'passt in die Profilnenntiefe',
  insulationMiss: 'passt geometrisch nicht in die Profilnenntiefe',
  insulationSystem: 'Geometrische Passform ist keine Schall- oder Brandschutzfreigabe der fertigen Wand.',
  addDoor: 'Türöffnung hinzufügen',
  doorWidth: 'Breite',
  doorHeight: 'Höhe',
  doorOffset: 'Abstand vom linken Rand',
  doorName: 'Bezeichnung',
  doorNamePlaceholder: 'Optional, zum Beispiel Wohnzimmer',
  saveDoor: 'Öffnung übernehmen',
  removeDoor: 'Öffnung entfernen',
  doorExecution: 'UA-Profil und Türsturz stehen bei passender Nennbreite im Katalog. Der konkrete Einbau ist nicht geprüft und wird nicht als Lösung angeboten.',
  noDoors: 'Noch keine Öffnung.',
  summaryType: 'Konstruktionstyp',
  summarySpacing: 'Profilabstand',
  summaryOpenings: 'Öffnungen',
  none: 'Keine',
  technicalNotes: 'Technische Hinweise',
  unchecked: 'Noch nicht geprüfte Punkte',
  systemNote: 'Die App prüft Katalogregeln und Geometrie. Schall- und Brandschutz der fertigen Wand sind nicht nachgewiesen.',
  backStep: 'Zurück',
  nextStep: 'Weiter',
  editSection: 'Ändern',
  openConstruction: 'Konstruktion öffnen',
  deleteConstruction: 'Konstruktion löschen',
  deleteConstructionTitle: 'Konstruktion löschen?',
  deleteConstructionBody: 'Die Konstruktion wird aus diesem Projekt entfernt. Das lässt sich nicht rückgängig machen.',
  constructionInvalid: 'Die Konstruktion ist noch nicht vollständig.',
  renameConstruction: 'Konstruktion umbenennen',
  dataMissing: 'Die gespeicherten Konstruktionsdaten konnten nicht gelesen werden.',
  statusLine: 'Status',
};

const en: { [Key in keyof typeof de]: string } = {
  chooseType: 'Choose a construction',
  typeMetal: 'Metal stud partition',
  typeMetalBody: 'One row of UW and CW profiles, two wall sides, optional insulation and door openings.',
  typeDouble: 'Double stud wall',
  typeLining: 'Independent lining',
  typeCeiling: 'Suspended ceiling',
  typeTimber: 'Timber stud wall',
  typeUnavailable: 'Not available yet. No dimensions are assumed.',
  typeDoubleBody: 'Two stud rows. Spacing and coupling are not recorded in the catalog.',
  stepOf: 'Step',
  stepName: 'Details',
  stepSize: 'Size',
  stepFrame: 'Framing',
  stepCladding: 'Cladding',
  stepInsulation: 'Insulation',
  stepOpenings: 'Openings',
  stepSummary: 'Summary',
  constructionName: 'Construction name',
  constructionNamePlaceholder: 'For example Living room partition',
  constructionDescription: 'Description',
  length: 'Wall length',
  height: 'Wall height',
  measureHint: 'Enter the value in the unit from Settings. The app stores millimetres.',
  limits: `Planning limits: length ${PLANNER_LIMITS.minLengthMm}–${PLANNER_LIMITS.maxLengthMm} mm, height ${PLANNER_LIMITS.minHeightMm}–${PLANNER_LIMITS.maxHeightMm} mm. This is not a load rating.`,
  schematicTitle: 'Schematic view',
  schematicCaption: 'A diagram of size, profiles and openings only. The 3D view of the saved wall is separate.',
  schematicMissing: 'Dimensions are still missing.',
  profileWidth: 'Profile width',
  profileSpacing: 'Stud spacing',
  spacingNote: '312.5 mm, 417 mm and 625 mm divide a 1,250 mm board. The catalog has no tested system rule for this spacing.',
  connections: 'Wall connections',
  connectionsBody: 'Floor, ceiling and both side connections use the UW track of the same nominal width.',
  sideA: 'Side A',
  sideB: 'Side B',
  variantSingle: 'One gypsum layer',
  variantDouble: 'Two gypsum layers',
  variantOsb: 'OSB and gypsum',
  layerInner: 'Layer on the framing',
  layerOuter: 'Outer layer',
  layerOnly: 'Gypsum layer',
  board: 'Board',
  format: 'Board format',
  formatMissing: 'No format is recorded for this board.',
  staggerNote: 'The two gypsum layers stay separate. Joints can be drawn offset later.',
  osbWarning: 'Not fully assessed yet. No screw is documented for OSB on metal. There is no screw recommendation and no claim about load capacity.',
  noInsulation: 'No insulation',
  insulationProduct: 'Insulation',
  insulationThickness: 'Insulation thickness',
  insulationFit: 'fits the nominal profile depth',
  insulationMiss: 'does not fit the nominal profile depth',
  insulationSystem: 'A geometric fit is not a fire or acoustic approval of the finished wall.',
  addDoor: 'Add a door opening',
  doorWidth: 'Width',
  doorHeight: 'Height',
  doorOffset: 'Distance from the left edge',
  doorName: 'Label',
  doorNamePlaceholder: 'Optional, for example Living room',
  saveDoor: 'Save opening',
  removeDoor: 'Remove opening',
  doorExecution: 'A UA profile and a lintel exist in the catalog at the matching nominal width. The actual installation is not assessed and is not offered as a solution.',
  noDoors: 'No opening yet.',
  summaryType: 'Construction type',
  summarySpacing: 'Stud spacing',
  summaryOpenings: 'Openings',
  none: 'None',
  technicalNotes: 'Technical notes',
  unchecked: 'Items not yet assessed',
  systemNote: 'The app checks catalog rules and geometry. Fire and acoustic performance of the finished wall is not established.',
  backStep: 'Back',
  nextStep: 'Next',
  editSection: 'Change',
  openConstruction: 'Open construction',
  deleteConstruction: 'Delete construction',
  deleteConstructionTitle: 'Delete construction?',
  deleteConstructionBody: 'The construction is removed from this project. This cannot be undone.',
  constructionInvalid: 'The construction is not complete yet.',
  renameConstruction: 'Rename construction',
  dataMissing: 'The stored construction data could not be read.',
  statusLine: 'Status',
};

const copy = { de, en };

export type ConstructionCopyKey = keyof typeof de;

export function constructionText(language: Language, key: ConstructionCopyKey): string {
  return copy[language][key];
}

export function issueText(language: Language, issue: WallIssue): string {
  const german = language === 'de';
  switch (issue.code) {
    case 'name-required':
      return german ? 'Bitte einen Namen eingeben.' : 'Enter a name.';
    case 'length':
    case 'height':
      return dimensionText(german, issue.code === 'length' ? (german ? 'Länge' : 'Length') : german ? 'Höhe' : 'Height', issue.reason);
    case 'profile-required':
    case 'profile-incompatible':
      return german ? 'Bitte eine passende Profilbreite wählen.' : 'Choose a matching profile width.';
    case 'spacing-required':
      return german ? 'Bitte einen Profilabstand wählen.' : 'Choose a stud spacing.';
    case 'spacing-rejected':
      return german
        ? `Der Abstand ist größer als die hinterlegte Grenze von ${issue.maxMm} mm für diese Gipsfaserplatte.`
        : `The spacing is above the recorded limit of ${issue.maxMm} mm for this gypsum fibre board.`;
    case 'layer-required':
      return german ? 'Bitte eine Platte wählen.' : 'Choose a board.';
    case 'layer-kind':
      return german ? 'Diese Platte passt nicht in die gewählte Lage.' : 'This board does not belong in the selected layer.';
    case 'format-required':
      return german ? 'Bitte ein hinterlegtes Plattenformat wählen.' : 'Choose a recorded board format.';
    case 'insulation-incomplete':
      return german ? 'Bitte Dämmstoff und Dicke wählen oder die Dämmung weglassen.' : 'Choose insulation and a thickness, or leave it out.';
    case 'insulation-fit':
      return german ? 'Die Dämmstärke passt nicht in die Profilnenntiefe.' : 'The insulation thickness does not fit the nominal profile depth.';
    case 'opening':
      return openingText(german, issue.reason);
    default:
      return german ? 'Die Eingabe ist ungültig.' : 'The input is not valid.';
  }
}

function dimensionText(german: boolean, label: string, reason: 'not-numeric' | 'not-positive' | 'below-min' | 'above-max'): string {
  if (reason === 'not-numeric') {
    return german ? `${label}: bitte eine Zahl eingeben.` : `${label}: enter a number.`;
  }
  if (reason === 'not-positive') {
    return german ? `${label}: null und negative Werte sind nicht möglich.` : `${label}: zero and negative values are not allowed.`;
  }
  if (reason === 'below-min') {
    return german ? `${label}: der Wert liegt unter der Planungsgrenze.` : `${label}: the value is below the planning limit.`;
  }
  return german ? `${label}: der Wert liegt über der Planungsgrenze.` : `${label}: the value is above the planning limit.`;
}

function openingText(german: boolean, reason: OpeningError): string {
  if (reason === 'negative') {
    return german ? 'Der Abstand vom linken Rand darf nicht negativ sein.' : 'The distance from the left edge cannot be negative.';
  }
  if (reason === 'not-positive' || reason === 'not-numeric') {
    return german ? 'Bitte Breite, Höhe und Abstand als positive Zahlen eingeben.' : 'Enter width, height and offset as positive numbers.';
  }
  if (reason === 'implausible') {
    return german
      ? `Öffnungen unter ${PLANNER_LIMITS.minOpeningMm} mm sind für eine Tür nicht vorgesehen.`
      : `Openings under ${PLANNER_LIMITS.minOpeningMm} mm are not provided for a door.`;
  }
  if (reason === 'outside') {
    return german ? 'Die Öffnung liegt außerhalb der Wand.' : 'The opening sits outside the wall.';
  }
  return german ? 'Die Öffnungen überschneiden sich.' : 'The openings overlap.';
}
