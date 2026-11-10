import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../ui/AppIcon';
import { Button } from '../ui/Button';
import { colors, radius, shadow } from '../ui/theme';

type ConfirmDeleteModalProps = { name: string; visible: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void };

export function ConfirmDeleteModal({ name, visible, busy, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Đóng hộp thoại xác nhận" onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View style={styles.dialog}>
          <View style={styles.iconTile}><AppIcon color={colors.accentText} name="delete" size={23} /></View>
          <Text style={styles.title}>Xóa người dùng này?</Text>
          <Text style={styles.description}>Tài khoản của <Text style={styles.name}>{name}</Text> sẽ bị xóa vĩnh viễn.</Text>
          <View style={styles.footer}>
            <Button disabled={busy} onPress={onCancel} title="Giữ lại" variant="secondary" />
            <Button disabled={busy} icon="delete" loading={busy} onPress={onConfirm} title="Xóa người dùng" variant="danger" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: '#172B25A8', flex: 1, justifyContent: 'center', padding: 18 },
  dialog: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.large, borderWidth: 1, maxWidth: 440, padding: 27, width: '100%', ...shadow },
  iconTile: { alignItems: 'center', backgroundColor: '#FBEFEA', borderRadius: 25, height: 50, justifyContent: 'center', width: 50 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 16 },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 23, marginTop: 8, textAlign: 'center' },
  name: { color: colors.text, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 23, width: '100%' },
});
