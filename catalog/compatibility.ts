import { findMaterial } from './materials';
import type { CompatibilityFinding, CompatibilityStatus, FastenerKind, MaterialItem, ProfileFamily } from './types';

const gypsumFamilies = new Set(['gypsum-a', 'gypsum-h2', 'gypsum-f', 'acoustic', 'hard-gypsum']);

const ceilingHangers = new Set([
  'hanger-direct-cd',
  'hanger-u-direct-cd',
  'hanger-nonius-upper',
  'hanger-nonius-lower',
  'hanger-nonius-clip',
  'hanger-wire',
  'hanger-quick-anchor',
  'hanger-cross-cd',
  'hanger-longitudinal-cd',
]);

export type FastenerUse = 'gypsum-on-thin-metal' | 'gypsum-on-thick-metal' | 'gypsum-on-timber' | 'osb-on-metal';

export type FastenerOffer = {
  id: string;
  status: CompatibilityStatus;
  summaryDe: string;
  summaryEn: string;
};

export function assessCompatibility(leftId: string, rightId: string): CompatibilityFinding {
  if (leftId === rightId) {
    return finding('not-assessed', 'same-item', 'Ein Material wird nicht mit sich selbst kombiniert.', 'A material is not combined with itself.', []);
  }
  const left = findMaterial(leftId);
  const right = findMaterial(rightId);
  if (!left || !right) {
    return finding('not-assessed', 'missing-item', 'Mindestens eine Material-ID ist nicht im Katalog.', 'At least one material id is not in the catalog.', []);
  }
  return (
    assessProfiles(left, right) ??
    assessHanger(left, right) ??
    assessInsulation(left, right) ??
    assessFastenerAndBoard(left, right) ??
    assessFastenerAndProfile(left, right) ??
    assessBoards(left, right) ??
    finding(
      'not-assessed',
      'no-rule',
      'Für diese Kombination ist keine Regel hinterlegt. Sie gilt nicht als geeignet.',
      'No rule is stored for this combination. It is not treated as suitable.',
      [],
    )
  );
}

export function fastenersFor(use: FastenerUse): readonly FastenerOffer[] {
  const offers: Record<FastenerUse, readonly FastenerOffer[]> = {
    'gypsum-on-thin-metal': [
      offer('fastener-tn-fine', 'compatible', 'Feingewinde für Gipsplatten auf Metall bis 0,7 mm.', 'Fine thread for gypsum boards on metal up to 0.7 mm.'),
      offer('fastener-tb-drill', 'incompatible', 'Die Bohrschraube gilt ab 0,7 mm Blech, nicht für das übliche 0,6-mm-Profil.', 'The drill screw applies from 0.7 mm steel, not for the usual 0.6 mm profile.'),
      offer('fastener-tn-coarse', 'incompatible', 'Grobgewinde ist für Holz beschrieben, nicht für dünnes Metall.', 'Coarse thread is described for timber, not for thin metal.'),
    ],
    'gypsum-on-thick-metal': [
      offer('fastener-tb-drill', 'compatible', 'Bohrschraube für Gipsplatten auf Stahlblech von 0,7 bis 2,25 mm, unter anderem UA.', 'Drill screw for gypsum boards on steel sheet from 0.7 to 2.25 mm, including UA.'),
      offer('fastener-tn-fine', 'incompatible', 'Feingewinde ist nur bis 0,7 mm Blech beschrieben.', 'Fine thread is only described up to 0.7 mm steel.'),
    ],
    'gypsum-on-timber': [
      offer('fastener-tn-coarse', 'conditional', 'Grobgewinde ist für Gipsplatten auf Holz beschrieben. OSB ist damit nicht wörtlich genannt.', 'Coarse thread is described for gypsum boards on timber. OSB is not named literally.'),
      offer('fastener-tn-fine', 'incompatible', 'Feingewinde ist für Metall bis 0,7 mm beschrieben, nicht für Holz.', 'Fine thread is described for metal up to 0.7 mm, not for timber.'),
    ],
    'osb-on-metal': [
      offer('fastener-profile-unknown', 'not-assessed', 'Eine Schraube für OSB auf CW-Profilen ist nicht belegt.', 'A screw for OSB on CW studs is not documented.'),
      offer('fastener-tn-fine', 'incompatible', 'Feingewinde befestigt Gipsplatten, nicht die OSB-Platte.', 'Fine thread fixes gypsum boards, not the OSB board.'),
      offer('fastener-tn-coarse', 'incompatible', 'Grobgewinde befestigt Gipsplatten auf Holz, nicht die OSB-Platte auf Metall.', 'Coarse thread fixes gypsum boards to timber, not the OSB board to metal.'),
      offer('fastener-tb-drill', 'not-assessed', 'Die Bohrschraube ist für Gipsplatten auf dickerem Blech beschrieben, nicht für OSB.', 'The drill screw is described for gypsum boards on thicker steel, not for OSB.'),
    ],
  };
  return offers[use];
}

function assessProfiles(left: MaterialItem, right: MaterialItem): CompatibilityFinding | null {
  if (!left.profile || !right.profile) {
    return null;
  }
  const pair = new Set<ProfileFamily>([left.profile.family, right.profile.family]);
  const sameDepth = left.profile.nominalDepthMm === right.profile.nominalDepthMm;
  const wallPair = has(pair, 'cw', 'uw') || has(pair, 'ua', 'uw') || has(pair, 'lintel', 'cw') || has(pair, 'lintel', 'ua');
  if (wallPair) {
    return sameDepth
      ? finding(
          'compatible',
          'profile-nominal-depth',
          'Die Nennbreiten stimmen überein. Das entspricht der Paarung in den Profilblättern.',
          'The nominal widths match. That follows the pairing in the profile sheets.',
          ['knauf-k621-cw', 'knauf-k625-uw', 'rigips-diy-2024'],
        )
      : finding(
          'incompatible',
          'profile-nominal-depth',
          'Die Nennbreiten stimmen nicht überein. CW, UA und Türsturz gehören zum UW derselben Nennbreite.',
          'The nominal widths do not match. CW, UA and the door lintel belong with a UW of the same nominal width.',
          ['knauf-k621-cw', 'knauf-k625-uw', 'rigips-diy-2024'],
        );
  }
  if (has(pair, 'cw', 'ua')) {
    return sameDepth
      ? finding(
          'conditional',
          'ua-beside-cw',
          'Gleiche Nennbreite. Das UA-Profil verstärkt Öffnungen und ersetzt nicht pauschal jeden CW-Ständer.',
          'Same nominal width. The UA profile stiffens openings and does not replace every CW stud by default.',
          ['rigips-diy-2024'],
        )
      : finding(
          'incompatible',
          'ua-beside-cw',
          'UA und CW haben unterschiedliche Nennbreiten und gehören nicht in dasselbe UW-Profil.',
          'UA and CW have different nominal widths and do not belong in the same UW track.',
          ['rigips-diy-2024'],
        );
  }
  if (has(pair, 'cd', 'ud')) {
    return finding(
      'compatible',
      'ceiling-profile-pair',
      'UD ist das Anschlussprofil zur CD-Decke 60/27.',
      'UD is the perimeter channel for a CD 60/27 ceiling.',
      ['rigips-diy-2024'],
    );
  }
  const ceiling = pair.has('cd') || pair.has('ud') || pair.has('hat');
  const wall = pair.has('cw') || pair.has('uw') || pair.has('ua') || pair.has('lintel');
  if (ceiling && wall) {
    return finding(
      'incompatible',
      'profile-system-mix',
      'Deckenprofile und Wandprofile sind verschiedene Systeme und werden nicht ineinander gestellt.',
      'Ceiling profiles and wall profiles are different systems and are not mixed.',
      ['rigips-diy-2024', 'knauf-k621-cw'],
    );
  }
  return null;
}

function assessHanger(left: MaterialItem, right: MaterialItem): CompatibilityFinding | null {
  const hanger = left.category === 'hangers' ? left : right.category === 'hangers' ? right : null;
  const other = hanger === left ? right : hanger === right ? left : null;
  if (!hanger || !other?.profile) {
    return null;
  }
  if (hanger.id === 'hanger-angle-unknown') {
    return null;
  }
  if (other.profile.family === 'cd' && ceilingHangers.has(hanger.id)) {
    return finding(
      'compatible',
      'hanger-for-cd',
      'Der Abhänger ist für CD-Decken beschrieben.',
      'The hanger is described for CD ceilings.',
      ['rigips-diy-2024'],
    );
  }
  if (other.profile.family === 'cw' || other.profile.family === 'uw' || other.profile.family === 'ua') {
    return finding(
      'incompatible',
      'hanger-not-for-wall',
      'Deckenabhänger sind nicht die Befestigung einer CW-Ständerwand.',
      'Ceiling hangers are not the fixing of a CW stud partition.',
      ['rigips-diy-2024'],
    );
  }
  return null;
}

function assessInsulation(left: MaterialItem, right: MaterialItem): CompatibilityFinding | null {
  const insulation = left.insulation ? left : right.insulation ? right : null;
  const profile = insulation === left ? right.profile : insulation === right ? left.profile : null;
  if (!insulation?.insulation || !profile) {
    return null;
  }
  if (profile.family !== 'cw' && profile.family !== 'uw' && profile.family !== 'ua') {
    return null;
  }
  const options = insulation.insulation.thicknessOptionsMm;
  if (!options || options.length === 0) {
    return null;
  }
  const fits = options.filter((thickness) => thickness <= profile.nominalDepthMm);
  if (fits.length === 0) {
    return finding(
      'incompatible',
      'insulation-cavity',
      'Keine hinterlegte Dämmstoffdicke passt in die Profilnenntiefe. Das ist eine geometrische Annahme, kein Prüfzeugnis.',
      'No recorded insulation thickness fits the nominal profile depth. This is a geometric assumption, not a test report.',
      ['assumption-cavity'],
    );
  }
  return finding(
    'conditional',
    'insulation-cavity',
    `Nur Dicken bis ${profile.nominalDepthMm} mm liegen in der Profilnenntiefe. Brand- und Schallschutz des Systems ist damit nicht nachgewiesen.`,
    `Only thicknesses up to ${profile.nominalDepthMm} mm sit within the nominal profile depth. Fire and acoustic performance of the system is not proven by this.`,
    ['assumption-cavity', ...insulation.sourceIds.filter((id) => id !== 'assumption-cavity')],
  );
}

function assessFastenerAndBoard(left: MaterialItem, right: MaterialItem): CompatibilityFinding | null {
  const fastener = left.fastener ? left : right.fastener ? right : null;
  const board = fastener === left ? right.board : fastener === right ? left.board : null;
  if (!fastener?.fastener || !board) {
    return null;
  }
  const kind = fastener.fastener.kind;
  if (board.family === 'osb') {
    if (kind === 'fine-thread' || kind === 'coarse-thread') {
      return finding(
        'incompatible',
        'screw-not-for-osb',
        'Diese Schraube ist für Gipsplatten beschrieben, nicht für die Befestigung der OSB-Platte.',
        'This screw is described for gypsum boards, not for fixing the OSB board.',
        ['knauf-screws-pi108'],
      );
    }
    return finding(
      'not-assessed',
      'osb-screw-missing',
      'Für OSB auf Metall ist mit dieser Schraube keine Eignung belegt.',
      'This screw has no documented suitability for OSB on metal.',
      ['en-300', 'knauf-screws-pi108'],
    );
  }
  if (gypsumFamilies.has(board.family)) {
    return gypsumScrewFinding(kind);
  }
  if (board.family === 'gypsum-fibre') {
    return finding(
      'not-assessed',
      'fibre-screw-missing',
      'fermacell nennt eigene Schrauben. Die Knauf-TN-Schraube ist damit nicht als Gipsfaser-Schraube belegt.',
      'fermacell names its own screws. The Knauf TN screw is therefore not documented as the gypsum-fibre screw.',
      ['fermacell-gipsfaser', 'knauf-screws-pi108'],
    );
  }
  return null;
}

function assessFastenerAndProfile(left: MaterialItem, right: MaterialItem): CompatibilityFinding | null {
  const fastener = left.fastener ? left : right.fastener ? right : null;
  const profile = fastener === left ? right.profile : fastener === right ? left.profile : null;
  if (!fastener?.fastener || !profile) {
    return null;
  }
  const steel = profile.steelThicknessMm;
  const kind: FastenerKind = fastener.fastener.kind;
  if (kind === 'fine-thread' && steel !== undefined && steel <= 0.7 && profile.family !== 'ua') {
    return finding(
      'compatible',
      'fine-thread-thin-steel',
      'Feingewinde ist für Gipsplatten auf Metall bis 0,7 mm beschrieben. Die Schraubenlänge hängt von der Beplankungsdicke ab.',
      'Fine thread is described for gypsum boards on metal up to 0.7 mm. Screw length depends on the cladding thickness.',
      ['knauf-screws-pi108', 'rigips-diy-2024'],
    );
  }
  if (kind === 'fine-thread' && (profile.family === 'ua' || (steel !== undefined && steel > 0.7))) {
    return finding(
      'incompatible',
      'fine-thread-thick-steel',
      'Feingewinde ist nicht für die 2-mm-UA-Profile beschrieben.',
      'Fine thread is not described for the 2 mm UA profiles.',
      ['knauf-screws-pi108', 'rigips-diy-2024'],
    );
  }
  if (kind === 'drill' && profile.family === 'ua') {
    return finding(
      'compatible',
      'drill-for-ua',
      'Die Bohrschraube ist für dickeres Blech einschließlich UA-Aussteifungen beschrieben.',
      'The drill screw is described for thicker steel, including UA stiffeners.',
      ['knauf-screws-pi108', 'knauf-tb-product'],
    );
  }
  if (kind === 'drill' && steel !== undefined && steel < 0.7) {
    return finding(
      'incompatible',
      'drill-for-thin-steel',
      'Für 0,6-mm-Profile ist das Feingewinde beschrieben, nicht die Bohrschraube.',
      'Fine thread, not the drill screw, is described for 0.6 mm profiles.',
      ['knauf-screws-pi108', 'knauf-tb-product'],
    );
  }
  if (kind === 'coarse-thread' && (profile.family === 'cw' || profile.family === 'uw')) {
    return finding(
      'incompatible',
      'coarse-on-metal-stud',
      'Grobgewinde ist für Holz beschrieben, nicht für CW- oder UW-Blech.',
      'Coarse thread is described for timber, not for CW or UW steel.',
      ['knauf-screws-pi108'],
    );
  }
  if (kind === 'system' && profile.family === 'ua') {
    return finding(
      'compatible',
      'm8-for-ua',
      'Die M8-Schraube gehört zum UA-Montagesatz und nicht in die Gipsplatte.',
      'The M8 screw belongs to the UA fixing set and not in the gypsum board.',
      ['rigips-diy-2024'],
    );
  }
  return null;
}

function assessBoards(left: MaterialItem, right: MaterialItem): CompatibilityFinding | null {
  if (!left.board || !right.board) {
    return null;
  }
  const families = new Set([left.board.family, right.board.family]);
  if (families.has('osb') && (families.has('gypsum-a') || families.has('gypsum-h2') || families.has('gypsum-f'))) {
    return finding(
      'conditional',
      'osb-plus-gypsum',
      'Beide Platten können als getrennte Schichten gespeichert werden. Ein geprüfter Systemaufbau OSB plus Gipskarton liegt in den ausgewerteten Blättern nicht vor.',
      'Both boards can be stored as separate layers. A tested OSB-plus-gypsum system is not in the evaluated sheets.',
      ['en-300', 'knauf-gkb'],
    );
  }
  return null;
}

function gypsumScrewFinding(kind: FastenerKind): CompatibilityFinding | null {
  if (kind === 'fine-thread') {
    return finding(
      'conditional',
      'fine-thread-needs-metal',
      'Die Schraube passt zu Gipsplatten, wenn das Metall höchstens 0,7 mm dick ist. Ohne Profil ist das nur die halbe Prüfung.',
      'The screw matches gypsum boards when the metal is at most 0.7 mm thick. Without a profile this is only half of the check.',
      ['knauf-screws-pi108'],
    );
  }
  if (kind === 'coarse-thread') {
    return finding(
      'conditional',
      'coarse-thread-on-timber',
      'Grobgewinde ist für Gipsplatten auf Holz beschrieben. Liegt unter der Gipsplatte OSB, ist das nur eine Übertragung dieser Holzregel.',
      'Coarse thread is described for gypsum boards on timber. If OSB is under the gypsum, this only transfers that timber rule.',
      ['knauf-screws-pi108'],
    );
  }
  if (kind === 'drill') {
    return finding(
      'conditional',
      'drill-needs-thick-metal',
      'Die Bohrschraube befestigt Gipsplatten auf Blech von 0,7 bis 2,25 mm.',
      'The drill screw fixes gypsum boards to steel sheet from 0.7 to 2.25 mm.',
      ['knauf-tb-product'],
    );
  }
  if (kind === 'system') {
    return finding(
      'incompatible',
      'm8-not-for-board',
      'Die M8-Schraube des UA-Satzes ist keine Beplankungsschraube.',
      'The M8 screw of the UA set is not a cladding screw.',
      ['rigips-diy-2024'],
    );
  }
  return null;
}

function has(pair: Set<ProfileFamily>, first: ProfileFamily, second: ProfileFamily): boolean {
  return pair.has(first) && pair.has(second);
}

function offer(id: string, status: CompatibilityStatus, summaryDe: string, summaryEn: string): FastenerOffer {
  return { id, status, summaryDe, summaryEn };
}

function finding(
  status: CompatibilityStatus,
  ruleId: string,
  summaryDe: string,
  summaryEn: string,
  sourceIds: readonly string[],
): CompatibilityFinding {
  return { status, ruleId, summaryDe, summaryEn, sourceIds };
}
