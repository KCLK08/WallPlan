import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Text, View } from 'react-native';

import { formatLength, formatTimestamp } from '@/calculations/units';
import { WallSchematic } from '@/components/configurator/WallSchematic';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { TopBar } from '@/components/TopBar';
import { useAppTheme } from '@/components/useAppTheme';
import { useTranslation } from '@/components/useTranslation';
import { constructionText } from '@/constants/constructionCopy';
import { materialText } from '@/constants/materialCopy';
import type { WallDraft } from '@/construction/wallModel';
import { materialLabel } from '@/construction/wallRules';
import {
  ConstructionValidationError,
  editableDraft,
  removeConstruction,
  renameConstruction,
  saveConstruction,
} from '@/features/constructions/actions';
import { WallWizard } from '@/features/constructions/WallWizard';
import { useProjectsStore } from '@/store/projectsStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function ConstructionScreen() {
  const theme = useAppTheme();
  const t = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const unit = useSettingsStore((state) => state.units);
  const db = useSQLiteContext();
  const { id, constructionId } = useLocalSearchParams<{ id: string; constructionId: string }>();
  const project = useProjectsStore((state) => state.projects.find((entry) => entry.id === id));
  const construction = project?.constructions.find((entry) => entry.id === constructionId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WallDraft | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!project || !construction) {
    return (
      <Screen>
        <TopBar title={t('projectsTitle')} back />
        <EmptyState title={t('projectNotFoundTitle')} body={t('projectNotFoundBody')} />
      </Screen>
    );
  }

  async function onSave() {
    if (!draft) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveConstruction(db, draft);
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof ConstructionValidationError ? constructionText(language, 'constructionInvalid') : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function onRename() {
    if (!id || !construction) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await renameConstruction(db, id, construction.id, name);
      setRenaming(false);
    } catch (caught) {
      setError(caught instanceof ConstructionValidationError ? t('nameRequired') : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!id || !construction) {
      return;
    }
    setConfirming(false);
    try {
      await removeConstruction(db, id, construction.id);
      router.replace(`/project/${id}`);
    } catch {
      setError(t('saveFailed'));
    }
  }

  if (editing && draft) {
    return (
      <Screen>
        <TopBar title={construction.name} back />
        <WallWizard draft={draft} onChange={setDraft} onSave={() => void onSave()} saving={saving} saveError={error} />
      </Screen>
    );
  }

  const wall = construction.data;

  return (
    <Screen>
      <TopBar title={construction.name} back />
      <Text style={{ color: theme.colors.ink, ...theme.type.title }}>{construction.name}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{wall?.description || t('noDescription')}</Text>
      <Text style={{ color: theme.colors.steel, ...theme.type.body }}>
        {t('updatedOn')} {formatTimestamp(construction.updatedAt, language)}
      </Text>
      {wall ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.ink, ...theme.type.body }}>
            {formatLength(wall.dimensions.lengthMm, unit, language)} × {formatLength(wall.dimensions.heightMm, unit, language)}
          </Text>
          <Text style={{ color: theme.colors.ink, ...theme.type.body }}>
            {materialLabel(wall.framing.uwCatalogId, language)} · {materialLabel(wall.framing.cwCatalogId, language)} ·{' '}
            {formatLength(wall.framing.spacingMm, unit, language)}
          </Text>
          <WallSchematic
            lengthMm={wall.dimensions.lengthMm}
            heightMm={wall.dimensions.heightMm}
            studOffsetsMm={wall.framing.studOffsetsMm}
            openings={wall.openings}
            sideA={wall.sides.A.variant}
            sideB={wall.sides.B.variant}
            caption={constructionText(language, 'schematicCaption')}
            missingLabel={constructionText(language, 'schematicMissing')}
          />
          <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{constructionText(language, 'systemNote')}</Text>
          <Button
            label={materialText(language, 'openList')}
            onPress={() => router.push(`/project/${id}/construction/${construction.id}/materials`)}
          />
        </View>
      ) : (
        <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{constructionText(language, 'dataMissing')}</Text>
      )}
      {renaming ? (
        <View style={{ gap: 12 }}>
          <TextField label={t('projectName')} value={name} onChangeText={(value) => setName(value.slice(0, 80))} />
          <Button label={saving ? t('saving') : t('save')} disabled={saving} onPress={() => void onRename()} />
        </View>
      ) : null}
      {error ? <Text style={{ color: theme.colors.danger, ...theme.type.body }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ flexGrow: 1, minWidth: 160 }}>
          <Button
            label={t('editProject')}
            variant="secondary"
            disabled={!wall}
            onPress={() => {
              const next = editableDraft(construction);
              if (!next) {
                return;
              }
              setDraft(next);
              setEditing(true);
            }}
          />
        </View>
        <View style={{ flexGrow: 1, minWidth: 160 }}>
          <Button
            label={t('renameProject')}
            variant="secondary"
            onPress={() => {
              setName(construction.name);
              setRenaming(true);
            }}
          />
        </View>
      </View>
      <Button label={constructionText(language, 'deleteConstruction')} variant="danger" onPress={() => setConfirming(true)} />
      <ConfirmDialog
        visible={confirming}
        title={constructionText(language, 'deleteConstructionTitle')}
        body={`${construction.name}. ${constructionText(language, 'deleteConstructionBody')}`}
        confirmLabel={t('confirmDelete')}
        cancelLabel={t('cancel')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void onDelete()}
      />
    </Screen>
  );
}
