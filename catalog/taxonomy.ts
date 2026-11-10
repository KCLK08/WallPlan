import type { MaterialCategory } from './types';

export type TaxonomyGroup = {
  id: string;
  nameDe: string;
  nameEn: string;
};

export type TaxonomyCategory = {
  id: MaterialCategory;
  nameDe: string;
  nameEn: string;
  groups: readonly TaxonomyGroup[];
};

export const CATALOG_TAXONOMY: readonly TaxonomyCategory[] = [
  {
    id: 'metal-profiles',
    nameDe: 'Metallprofile',
    nameEn: 'Metal profiles',
    groups: [
      { id: 'uw', nameDe: 'UW-Profile', nameEn: 'UW tracks' },
      { id: 'cw', nameDe: 'CW-Profile', nameEn: 'CW studs' },
      { id: 'ua', nameDe: 'UA-Profile', nameEn: 'UA stiffeners' },
      { id: 'door-lintel', nameDe: 'Türsturzprofile', nameEn: 'Door lintel profiles' },
      { id: 'door-connection', nameDe: 'Türanschluss', nameEn: 'Door connection' },
      { id: 'cd', nameDe: 'CD-Profile 60/27', nameEn: 'CD profiles 60/27' },
      { id: 'ud', nameDe: 'UD-Profile', nameEn: 'UD profiles' },
      { id: 'hat', nameDe: 'Hutprofile', nameEn: 'Hat profiles' },
      { id: 'profile-connector', nameDe: 'Profilverbinder', nameEn: 'Profile connectors' },
      { id: 'profile-extension', nameDe: 'Profilverlängerungen', nameEn: 'Profile extensions' },
      { id: 'angle-connector', nameDe: 'Winkelverbinder', nameEn: 'Angle connectors' },
      { id: 'fixing-angle', nameDe: 'Befestigungswinkel', nameEn: 'Fixing angles' },
    ],
  },
  {
    id: 'hangers',
    nameDe: 'Abhänger und Verbindungselemente',
    nameEn: 'Hangers and connectors',
    groups: [
      { id: 'direct', nameDe: 'Direktabhänger', nameEn: 'Direct hangers' },
      { id: 'u-direct', nameDe: 'U-Direktabhänger', nameEn: 'U-direct hangers' },
      { id: 'nonius-upper', nameDe: 'Nonius-Oberteile', nameEn: 'Nonius upper parts' },
      { id: 'nonius-lower', nameDe: 'Nonius-Unterteile', nameEn: 'Nonius lower parts' },
      { id: 'nonius-pin', nameDe: 'Nonius-Splinte und Sicherungen', nameEn: 'Nonius pins and clips' },
      { id: 'wire', nameDe: 'Drahtabhänger', nameEn: 'Wire hangers' },
      { id: 'quick', nameDe: 'Schnellabhänger', nameEn: 'Quick hangers' },
      { id: 'cross-connector', nameDe: 'Kreuzverbinder', nameEn: 'Cross connectors' },
      { id: 'longitudinal-connector', nameDe: 'Längsverbinder', nameEn: 'Longitudinal connectors' },
      { id: 'angle-connector', nameDe: 'Winkelverbinder', nameEn: 'Angle connectors' },
    ],
  },
  {
    id: 'boards',
    nameDe: 'Platten',
    nameEn: 'Boards',
    groups: [
      { id: 'gypsum-a', nameDe: 'Gipskarton Typ A', nameEn: 'Gypsum type A' },
      { id: 'gypsum-h2', nameDe: 'Imprägnierte Platten H2', nameEn: 'Impregnated boards H2' },
      { id: 'gypsum-f', nameDe: 'Brandschutzplatten Typ F', nameEn: 'Fire boards type F' },
      { id: 'gypsum-fibre', nameDe: 'Gipsfaserplatten', nameEn: 'Gypsum fibre boards' },
      { id: 'acoustic', nameDe: 'Schallschutzplatten', nameEn: 'Acoustic boards' },
      { id: 'hard-gypsum', nameDe: 'Hartgipsplatten', nameEn: 'Hard gypsum boards' },
      { id: 'cement', nameDe: 'Zementbauplatten', nameEn: 'Cement boards' },
      { id: 'osb', nameDe: 'OSB-Platten', nameEn: 'OSB boards' },
    ],
  },
  {
    id: 'insulation',
    nameDe: 'Dämmstoffe',
    nameEn: 'Insulation',
    groups: [
      { id: 'glass-wool', nameDe: 'Glaswolle', nameEn: 'Glass wool' },
      { id: 'stone-wool', nameDe: 'Steinwolle', nameEn: 'Stone wool' },
      { id: 'mineral-wool', nameDe: 'Mineralwolle', nameEn: 'Mineral wool' },
      { id: 'mat', nameDe: 'Dämmmatten', nameEn: 'Insulation mats' },
      { id: 'board', nameDe: 'Dämmplatten', nameEn: 'Insulation boards' },
    ],
  },
  {
    id: 'fasteners',
    nameDe: 'Befestigungsmittel',
    nameEn: 'Fasteners',
    groups: [
      { id: 'fine-thread', nameDe: 'Feingewinde', nameEn: 'Fine thread' },
      { id: 'coarse-thread', nameDe: 'Grobgewinde', nameEn: 'Coarse thread' },
      { id: 'drill-screw', nameDe: 'Bohrschrauben', nameEn: 'Drill screws' },
      { id: 'sheet-metal', nameDe: 'Blechschrauben', nameEn: 'Sheet-metal screws' },
      { id: 'profile-screw', nameDe: 'Profilverbindungsschrauben', nameEn: 'Profile connector screws' },
      { id: 'frame-anchor', nameDe: 'Rahmendübel', nameEn: 'Frame anchors' },
      { id: 'universal-anchor', nameDe: 'Universaldübel', nameEn: 'Universal anchors' },
      { id: 'ceiling-fixing', nameDe: 'Deckenbefestigungen', nameEn: 'Ceiling fixings' },
      { id: 'system-fastener', nameDe: 'Systembefestigung', nameEn: 'System fasteners' },
    ],
  },
  {
    id: 'joint-compounds',
    nameDe: 'Fugen und Spachtel',
    nameEn: 'Jointing and fillers',
    groups: [
      { id: 'joint-filler', nameDe: 'Fugenspachtel', nameEn: 'Joint filler' },
      { id: 'gypsum-compound', nameDe: 'Gips-Spachtelmasse', nameEn: 'Gypsum compound' },
      { id: 'surface-filler', nameDe: 'Flächenspachtel', nameEn: 'Surface filler' },
      { id: 'ready-mix', nameDe: 'Fertigspachtel', nameEn: 'Ready-mix filler' },
      { id: 'glass-tape', nameDe: 'Glasfaser-Bewehrungsstreifen', nameEn: 'Glass-fibre tape' },
      { id: 'paper-tape', nameDe: 'Papier-Fugendeckstreifen', nameEn: 'Paper joint tape' },
      { id: 'corner-bead', nameDe: 'Eckschutzprofile', nameEn: 'Corner beads' },
      { id: 'edge-protection', nameDe: 'Kantenschutzprofile', nameEn: 'Edge profiles' },
    ],
  },
  {
    id: 'sealing',
    nameDe: 'Anschluss und Dichtung',
    nameEn: 'Connections and seals',
    groups: [
      { id: 'partition-tape', nameDe: 'Trennwand-Dichtung', nameEn: 'Partition seal' },
      { id: 'connection-tape', nameDe: 'Anschlussdichtband', nameEn: 'Connection seal' },
      { id: 'acrylic', nameDe: 'Acryl', nameEn: 'Acrylic' },
      { id: 'sealant', nameDe: 'Dichtstoffe', nameEn: 'Sealants' },
      { id: 'adhesive-tape', nameDe: 'Klebebänder', nameEn: 'Adhesive tapes' },
      { id: 'vapor-barrier', nameDe: 'Dampfbremse', nameEn: 'Vapour control layer' },
      { id: 'vapor-tape', nameDe: 'Dampfbremsenklebebänder', nameEn: 'Vapour-barrier tapes' },
      { id: 'connection-other', nameDe: 'Weitere Anschlüsse', nameEn: 'Other connections' },
    ],
  },
  {
    id: 'accessories',
    nameDe: 'Zubehör',
    nameEn: 'Accessories',
    groups: [
      { id: 'access-panel', nameDe: 'Revisionsklappen', nameEn: 'Access panels' },
      { id: 'cavity-box', nameDe: 'Hohlwanddosen', nameEn: 'Cavity boxes' },
      { id: 'reinforcement', nameDe: 'Verstärkungsprofile', nameEn: 'Reinforcement profiles' },
      { id: 'noggin', nameDe: 'Traversen', nameEn: 'Noggins' },
      { id: 'mounting', nameDe: 'Montageelemente', nameEn: 'Mounting parts' },
      { id: 'wall-connection', nameDe: 'Wandanschlussprofile', nameEn: 'Wall connection profiles' },
      { id: 'corner-finish', nameDe: 'Eck- und Abschlussprofile', nameEn: 'Corner and finish profiles' },
    ],
  },
];
