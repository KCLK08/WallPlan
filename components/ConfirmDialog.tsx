import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAppTheme } from '@/components/useAppTheme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: 'rgba(28, 31, 36, 0.45)', justifyContent: 'center', padding: 24 }}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.card,
            padding: 20,
            gap: 16,
            borderWidth: 1,
            borderColor: theme.colors.line,
          }}
        >
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '700' }}>{title}</Text>
            <Text style={{ color: theme.colors.steel, ...theme.type.body }}>{body}</Text>
          </View>
          <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
          <Button label={confirmLabel} variant="danger" onPress={onConfirm} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
