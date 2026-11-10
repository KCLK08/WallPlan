import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { formatLength } from '@/calculations/units';
import { ChoiceCard } from '@/components/configurator/ChoiceCard';
import { WallSchematic } from '@/components/configurator/WallSchematic';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { constructionText, issueText, type ConstructionCopyKey } from '@/constants/constructionCopy';
import { translate } from '@/constants/i18n';
import type { BoardFormat } from '@/catalog/types';
import type { CladdingVariant, OpeningDraft, SideDraft, WallDraft, WallSideId } from '@/construction/wallModel';
import {
  compileWall,
  createStableId,
  formatsFor,
  gypsumBoardChoices,
  insulationChoices,
  lengthToInput,
  materialLabel,
  osbBoardChoices,
  parseLengthInput,
  profileChoices,
  profileSummary,
  replaceOpening,
  setLayerBoard,
  setLayerFormat,
  spacingChoices,
  thicknessChoices,
  validateOpening,
  validateStep,
  withVariant,
} from '@/construction/wallRules';
import { useSettingsStore } from '@/store/settingsStore';

const STEP_KEYS = ['stepName', 'stepSize', 'stepFrame', 'stepCladding', 'stepInsulation', 'stepOpenings', 'stepSummary'] as const;

type WallWizardProps = {
  draft: WallDraft;
  onChange: (draft: WallDraft) => void;
  onSave: () => void;
  saving: boolean;
  saveError: string;
};

export function WallWizard({ draft, onChange, onSave, saving, saveError }: WallWizardProps) {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const { width } = useWindowDimensions();
  const wide = width >= 840;
  const [step, setStep] = useState(1);
  const [issues, setIssues] = useState<ReturnType<typeof validateStep>>([]);
  const compiled = compileWall(draft);

  function goNext() {
    const nextIssues = validateStep(draft, step);
    setIssues(nextIssues);
    if (nextIssues.length === 0) {
      setStep((current) => Math.min(7, current + 1));
    }
  }

  const schematic = (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('schematicTitle')}</Text>
      <WallSchematic
        lengthMm={draft.lengthMm}
        heightMm={draft.heightMm}
        studOffsetsMm={compiled.ok ? compiled.wall.framing.studOffsetsMm : []}
        openings={draft.openings.flatMap((opening) =>
          opening.widthMm !== null && opening.heightMm !== null && opening.offsetFromLeftMm !== null
            ? [{ id: opening.id, widthMm: opening.widthMm, heightMm: opening.heightMm, offsetFromLeftMm: opening.offsetFromLeftMm }]
            : [],
        )}
        sideA={draft.sideA.layers.some((layer) => layer.catalogItemId) ? draft.sideA.variant : null}
        sideB={draft.sideB.layers.some((layer) => layer.catalogItemId) ? draft.sideB.variant : null}
        caption={text('schematicCaption')}
        missingLabel={text('schematicMissing')}
      />
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {STEP_KEYS.map((key, index) => {
          const number = index + 1;
          const active = number === step;
          return (
            <Button
              key={key}
              label={`${number}. ${text(key)}`}
              variant={active ? 'primary' : 'secondary'}
              onPress={() => {
                if (number <= step || compiled.ok) {
                  setIssues([]);
                  setStep(number);
                }
              }}
            />
          );
        })}
      </View>
      <Text style={{ color: theme.colors.steel, ...theme.type.label }}>
        {text('stepOf')} {step} / 7
      </Text>
      <View style={wide ? { flexDirection: 'row', gap: 20, alignItems: 'flex-start' } : { gap: 16 }}>
        <View style={{ flex: 1, gap: 16, width: '100%' }}>
          {step === 1 ? <NameStep draft={draft} onChange={onChange} /> : null}
          {step === 2 ? <SizeStep draft={draft} onChange={onChange} /> : null}
          {step === 3 ? <FrameStep draft={draft} onChange={onChange} /> : null}
          {step === 4 ? <CladdingStep draft={draft} onChange={onChange} /> : null}
          {step === 5 ? <InsulationStep draft={draft} onChange={onChange} /> : null}
          {step === 6 ? <OpeningStep draft={draft} onChange={onChange} /> : null}
          {step === 7 ? <SummaryStep draft={draft} onEdit={setStep} /> : null}
          {issues.map((issue, index) => (
            <Text key={`${issue.code}-${index}`} style={{ color: theme.colors.danger, ...theme.type.body }}>
              {issueText(language, issue)}
            </Text>
          ))}
          {saveError ? <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{saveError}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {step > 1 ? (
              <View style={{ flex: 1 }}>
                <Button label={text('backStep')} variant="secondary" onPress={() => { setIssues([]); setStep((current) => current - 1); }} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              {step < 7 ? (
                <Button label={text('nextStep')} onPress={goNext} />
              ) : (
                <Button label={saving ? t('saving') : t('save')} disabled={saving} onPress={onSave} />
              )}
            </View>
          </View>
        </View>
        {step >= 2 ? <View style={{ flex: 1, width: '100%' }}>{schematic}</View> : null}
      </View>
    </View>
  );
}

function NameStep({ draft, onChange }: { draft: WallDraft; onChange: (draft: WallDraft) => void }) {
  const language = useSettingsStore((state) => state.language);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  return (
    <View style={{ gap: 16 }}>
      <TextField
        label={text('constructionName')}
        value={draft.name}
        placeholder={text('constructionNamePlaceholder')}
        onChangeText={(value) => onChange({ ...draft, name: value.slice(0, 80) })}
      />
      <TextField
        label={text('constructionDescription')}
        value={draft.description}
        placeholder={text('constructionDescription')}
        multiline
        onChangeText={(value) => onChange({ ...draft, description: value.slice(0, 400) })}
      />
    </View>
  );
}

function SizeStep({ draft, onChange }: { draft: WallDraft; onChange: (draft: WallDraft) => void }) {
  const language = useSettingsStore((state) => state.language);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const theme = useAppTheme();
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('measureHint')}</Text>
      <MeasureField
        label={text('length')}
        mm={draft.lengthMm}
        onMillimetres={(lengthMm) => onChange({ ...draft, lengthMm })}
      />
      <MeasureField
        label={text('height')}
        mm={draft.heightMm}
        onMillimetres={(heightMm) => onChange({ ...draft, heightMm })}
      />
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('limits')}</Text>
    </View>
  );
}

function FrameStep({ draft, onChange }: { draft: WallDraft; onChange: (draft: WallDraft) => void }) {
  const language = useSettingsStore((state) => state.language);
  const unit = useSettingsStore((state) => state.units);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const theme = useAppTheme();
  const selected = profileChoices().find((choice) => choice.nominalDepthMm === draft.nominalDepthMm);
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('profileWidth')}</Text>
      {profileChoices().map((choice) => (
        <ChoiceCard
          key={choice.nominalDepthMm}
          title={`${choice.nominalDepthMm} mm`}
          body={`${materialLabel(choice.uwCatalogId, language)} · ${materialLabel(choice.cwCatalogId, language)}`}
          selected={draft.nominalDepthMm === choice.nominalDepthMm}
          onPress={() => onChange({ ...draft, nominalDepthMm: choice.nominalDepthMm })}
        />
      ))}
      {selected ? <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{profileSummary(selected, language)}</Text> : null}
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('profileSpacing')}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('spacingNote')}</Text>
      {spacingChoices().map((choice) => (
        <ChoiceCard
          key={choice.spacingMm}
          title={formatLength(choice.spacingMm, unit, language)}
          body={`${text('statusLine')}: ${statusName(choice.status, language)}`}
          selected={draft.spacingMm === choice.spacingMm}
          onPress={() => onChange({ ...draft, spacingMm: choice.spacingMm })}
        />
      ))}
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('connections')}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('connectionsBody')}</Text>
    </View>
  );
}

function CladdingStep({ draft, onChange }: { draft: WallDraft; onChange: (draft: WallDraft) => void }) {
  return (
    <View style={{ gap: 20 }}>
      <SideEditor side={draft.sideA} onSide={(sideA) => onChange({ ...draft, sideA })} />
      <SideEditor side={draft.sideB} onSide={(sideB) => onChange({ ...draft, sideB })} />
    </View>
  );
}

function SideEditor({ side, onSide }: { side: SideDraft; onSide: (side: SideDraft) => void }) {
  const language = useSettingsStore((state) => state.language);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const theme = useAppTheme();
  const variants: { id: CladdingVariant; label: ConstructionCopyKey }[] = [
    { id: 'single-gypsum', label: 'variantSingle' },
    { id: 'double-gypsum', label: 'variantDouble' },
    { id: 'osb-gypsum', label: 'variantOsb' },
  ];
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>
        {side.side === 'A' ? text('sideA') : text('sideB')}
      </Text>
      {variants.map((variant) => (
        <ChoiceCard
          key={variant.id}
          title={text(variant.label)}
          selected={side.variant === variant.id}
          onPress={() => onSide(withVariant(side, variant.id))}
        />
      ))}
      {side.variant === 'double-gypsum' ? <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('staggerNote')}</Text> : null}
      {side.variant === 'osb-gypsum' ? <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{text('osbWarning')}</Text> : null}
      {side.layers.map((layer, index) => (
        <LayerPicker key={layer.id} side={side} index={index} onSide={onSide} />
      ))}
    </View>
  );
}

function LayerPicker({ side, index, onSide }: { side: SideDraft; index: number; onSide: (side: SideDraft) => void }) {
  const language = useSettingsStore((state) => state.language);
  const theme = useAppTheme();
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const layer = side.layers[index];
  const boards = side.variant === 'osb-gypsum' && index === 0 ? osbBoardChoices() : gypsumBoardChoices();
  const formats = layer.catalogItemId ? formatsFor(layer.catalogItemId) : [];
  const title = side.variant === 'single-gypsum' ? text('layerOnly') : index === 0 ? text('layerInner') : text('layerOuter');
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' }}>{title}</Text>
      {boards.map((board) => (
        <ChoiceCard
          key={board.id}
          title={language === 'de' ? board.nameDe : board.nameEn}
          selected={layer.catalogItemId === board.id}
          onPress={() => onSide(setLayerBoard(side, layer.id, board.id))}
        />
      ))}
      {layer.catalogItemId && formats.length === 0 ? (
        <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('formatMissing')}</Text>
      ) : null}
      {formats.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{text('format')}</Text>
          {formats.map((format) => (
            <ChoiceCard
              key={`${format.widthMm}x${format.lengthMm}`}
              title={formatLabel(format, language)}
              selected={layer.format?.widthMm === format.widthMm && layer.format.lengthMm === format.lengthMm}
              onPress={() => onSide(setLayerFormat(side, layer.id, format))}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function InsulationStep({ draft, onChange }: { draft: WallDraft; onChange: (draft: WallDraft) => void }) {
  const language = useSettingsStore((state) => state.language);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const theme = useAppTheme();
  const depth = draft.nominalDepthMm;
  return (
    <View style={{ gap: 12 }}>
      <ChoiceCard
        title={text('noInsulation')}
        selected={!draft.insulationCatalogId}
        onPress={() => onChange({ ...draft, insulationCatalogId: null, insulationThicknessMm: null })}
      />
      {insulationChoices().map((item) => (
        <ChoiceCard
          key={item.id}
          title={language === 'de' ? item.nameDe : item.nameEn}
          selected={draft.insulationCatalogId === item.id}
          onPress={() => onChange({ ...draft, insulationCatalogId: item.id, insulationThicknessMm: null })}
        />
      ))}
      {draft.insulationCatalogId && depth ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('insulationThickness')}</Text>
          {thicknessChoices(draft.insulationCatalogId, depth).map((choice) => (
            <ChoiceCard
              key={choice.thicknessMm}
              title={`${choice.thicknessMm} mm`}
              body={choice.fits ? text('insulationFit') : text('insulationMiss')}
              selected={draft.insulationThicknessMm === choice.thicknessMm}
              disabled={!choice.fits}
              onPress={choice.fits ? () => onChange({ ...draft, insulationThicknessMm: choice.thicknessMm }) : undefined}
            />
          ))}
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('insulationSystem')}</Text>
        </View>
      ) : null}
    </View>
  );
}

function OpeningStep({ draft, onChange }: { draft: WallDraft; onChange: (draft: WallDraft) => void }) {
  const language = useSettingsStore((state) => state.language);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const theme = useAppTheme();
  const [form, setForm] = useState<OpeningDraft>(blankOpening);
  const [message, setMessage] = useState('');
  const wallReady = draft.lengthMm !== null && draft.heightMm !== null;

  function commit() {
    if (!wallReady || draft.lengthMm === null || draft.heightMm === null) {
      setMessage(issueText(language, { code: 'length', reason: 'not-numeric' }));
      return;
    }
    const reason = validateOpening(form, { lengthMm: draft.lengthMm, heightMm: draft.heightMm }, draft.openings);
    if (reason) {
      setMessage(issueText(language, { code: 'opening', id: form.id, reason }));
      return;
    }
    onChange({ ...draft, openings: replaceOpening(draft.openings, { ...form, name: form.name.trim() }) });
    setForm(blankOpening());
    setMessage('');
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('doorExecution')}</Text>
      {draft.openings.length === 0 ? <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('noDoors')}</Text> : null}
      {draft.openings.map((opening) => (
        <ChoiceCard
          key={opening.id}
          title={opening.name || text('addDoor')}
          body={opening.widthMm !== null ? `${opening.widthMm} × ${opening.heightMm} mm` : ''}
          onPress={() => setForm(opening)}
        />
      ))}
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('addDoor')}</Text>
      <TextField label={text('doorName')} value={form.name} placeholder={text('doorNamePlaceholder')} onChangeText={(name) => setForm({ ...form, name })} />
      <MeasureField label={text('doorWidth')} mm={form.widthMm} onMillimetres={(widthMm) => setForm({ ...form, widthMm })} />
      <MeasureField label={text('doorHeight')} mm={form.heightMm} onMillimetres={(heightMm) => setForm({ ...form, heightMm })} />
      <MeasureField label={text('doorOffset')} mm={form.offsetFromLeftMm} onMillimetres={(offsetFromLeftMm) => setForm({ ...form, offsetFromLeftMm })} />
      {message ? <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{message}</Text> : null}
      <Button label={text('saveDoor')} variant="secondary" onPress={commit} />
      {draft.openings.some((opening) => opening.id === form.id) ? (
        <Button
          label={text('removeDoor')}
          variant="danger"
          onPress={() => {
            onChange({ ...draft, openings: draft.openings.filter((opening) => opening.id !== form.id) });
            setForm(blankOpening());
            setMessage('');
          }}
        />
      ) : null}
    </View>
  );
}

function SummaryStep({ draft, onEdit }: { draft: WallDraft; onEdit: (step: number) => void }) {
  const language = useSettingsStore((state) => state.language);
  const unit = useSettingsStore((state) => state.units);
  const text = (key: ConstructionCopyKey) => constructionText(language, key);
  const theme = useAppTheme();
  const compiled = compileWall(draft);
  const wall = compiled.ok ? compiled.wall : null;
  const rows: { label: string; value: string; step: number }[] = [
    { label: text('summaryType'), value: text('typeMetal'), step: 1 },
    { label: text('constructionName'), value: draft.name.trim() || text('none'), step: 1 },
    { label: text('length'), value: draft.lengthMm === null ? text('none') : formatLength(draft.lengthMm, unit, language), step: 2 },
    { label: text('height'), value: draft.heightMm === null ? text('none') : formatLength(draft.heightMm, unit, language), step: 2 },
    { label: text('profileWidth'), value: draft.nominalDepthMm === null ? text('none') : `${draft.nominalDepthMm} mm`, step: 3 },
    { label: text('summarySpacing'), value: draft.spacingMm === null ? text('none') : formatLength(draft.spacingMm, unit, language), step: 3 },
    { label: text('sideA'), value: sideLine(draft.sideA, language), step: 4 },
    { label: text('sideB'), value: sideLine(draft.sideB, language), step: 4 },
    {
      label: text('stepInsulation'),
      value: draft.insulationCatalogId ? `${materialLabel(draft.insulationCatalogId, language)}, ${draft.insulationThicknessMm ?? '–'} mm` : text('noInsulation'),
      step: 5,
    },
    {
      label: text('summaryOpenings'),
      value: draft.openings.length === 0 ? text('none') : draft.openings.map((opening) => opening.name || `${opening.widthMm} mm`).join(', '),
      step: 6,
    },
  ];
  return (
    <View style={{ gap: 12 }}>
      {rows.map((row) => (
        <View key={row.label} style={{ gap: 4 }}>
          <Text style={{ color: theme.colors.steel, ...theme.type.label }}>{row.label}</Text>
          <Text style={{ color: theme.colors.ink, ...theme.type.body }}>{row.value}</Text>
          <Pressable accessibilityRole="button" onPress={() => onEdit(row.step)} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
            <Text style={{ color: theme.colors.accentPressed, fontSize: 15, lineHeight: 20, fontWeight: '700' }}>{text('editSection')}</Text>
          </Pressable>
        </View>
      ))}
      {wall
        ? (['A', 'B'] as const).flatMap((side) =>
            wall.sides[side].layers.map((layer) => (
              <Text key={layer.id} style={{ color: theme.colors.steel, ...theme.type.body }}>
                {side}: {materialLabel(layer.catalogItemId, language)} · {statusName(layer.fastening.status, language)}
                {layer.fastening.status === 'compatible' && layer.fastening.catalogItemId
                  ? ` · ${materialLabel(layer.fastening.catalogItemId, language)}`
                  : ''}
              </Text>
            )),
          )
        : null}
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('technicalNotes')}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('systemNote')}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('spacingNote')}</Text>
      {wall?.sides.A.variant === 'osb-gypsum' || wall?.sides.B.variant === 'osb-gypsum' ? (
        <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{text('osbWarning')}</Text>
      ) : null}
      {wall?.insulation.enabled ? <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('insulationSystem')}</Text> : null}
      {(wall?.openings.length ?? 0) > 0 ? <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{text('doorExecution')}</Text> : null}
      <Text style={{ color: theme.colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>{text('unchecked')}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{statusName('not-assessed', language)}</Text>
    </View>
  );
}

function MeasureField({ label, mm, onMillimetres }: { label: string; mm: number | null; onMillimetres: (value: number | null) => void }) {
  const language = useSettingsStore((state) => state.language);
  const unit = useSettingsStore((state) => state.units);
  const [text, setText] = useState(mm === null ? '' : lengthToInput(mm, unit, language));
  const [error, setError] = useState('');
  return (
    <TextField
      label={`${label} (${unit})`}
      value={text}
      keyboardType="decimal-pad"
      error={error || undefined}
      onChangeText={(value) => {
        setText(value);
        if (!value.trim()) {
          setError('');
          onMillimetres(null);
          return;
        }
        const parsed = parseLengthInput(value, unit);
        if (!parsed.ok) {
          setError(issueText(language, { code: 'length', reason: parsed.error === 'below-min' || parsed.error === 'above-max' ? 'not-numeric' : parsed.error }));
          onMillimetres(null);
          return;
        }
        setError('');
        onMillimetres(parsed.mm);
      }}
    />
  );
}

function blankOpening(): OpeningDraft {
  return { id: createStableId(), name: '', widthMm: null, heightMm: null, offsetFromLeftMm: null };
}

function sideLine(side: SideDraft, language: 'de' | 'en'): string {
  const names = side.layers.map((layer) => materialLabel(layer.catalogItemId, language) || '–').join(' + ');
  return `${constructionText(language, side.variant === 'single-gypsum' ? 'variantSingle' : side.variant === 'double-gypsum' ? 'variantDouble' : 'variantOsb')}: ${names}`;
}

function formatLabel(format: BoardFormat, language: 'de' | 'en'): string {
  return `${formatLength(format.widthMm, 'mm', language)} × ${formatLength(format.lengthMm, 'mm', language)}`;
}

function statusName(
  status: 'compatible' | 'conditional' | 'incompatible' | 'not-assessed',
  language: 'de' | 'en',
): string {
  const key =
    status === 'compatible'
      ? 'statusCompatible'
      : status === 'conditional'
        ? 'statusConditional'
        : status === 'incompatible'
          ? 'statusIncompatible'
          : 'statusNotAssessed';
  return translate(language, key);
}
