import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { drawingText } from '@/constants/drawingCopy';
import { materialText } from '@/constants/materialCopy';
import { modelText } from '@/constants/modelCopy';
import { useSettingsStore } from '@/store/settingsStore';

type Destination = 'materials' | 'model' | 'drawing';

export function ConstructionSwitch({
  projectId,
  constructionId,
  current,
}: {
  projectId: string;
  constructionId: string;
  current?: Destination;
}) {
  const language = useSettingsStore((state) => state.language);
  const links: { id: Destination; label: string }[] = [
    { id: 'materials', label: materialText(language, 'openList') },
    { id: 'model', label: modelText(language, 'openModel') },
    { id: 'drawing', label: drawingText(language, 'openDrawing') },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
      {links
        .filter((link) => link.id !== current)
        .map((link) => (
          <View key={link.id} style={{ flexGrow: 1, minWidth: 140 }}>
            <Button
              label={link.label}
              variant="secondary"
              onPress={() => router.push(`/project/${projectId}/construction/${constructionId}/${link.id}`)}
            />
          </View>
        ))}
    </View>
  );
}
