import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ManagedUser } from '../../services/usersApi';
import { AppIcon } from '../ui/AppIcon';
import { Button } from '../ui/Button';
import { colors, radius, shadow } from '../ui/theme';
import { UserAvatar } from './UserAvatar';

type UserDetailsModalProps = { user: ManagedUser | null; onClose: () => void; onEdit: () => void };

export function UserDetailsModal({ user, onClose, onEdit }: UserDetailsModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(user)}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Đóng chi tiết" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.dialog}>
          <Pressable accessibilityLabel="Đóng" accessibilityRole="button" onPress={onClose} style={styles.close}>
            <AppIcon color={colors.text} name="close" size={20} />
          </Pressable>
          <UserAvatar size={92} source={user?.hinhanh ?? ''} />
          <Text style={styles.name}>{user?.hoten}</Text>
          <Text style={styles.caption}>THÔNG TIN TÀI KHOẢN</Text>
          <View style={styles.detailRow}>
            <AppIcon color={colors.primaryText} name="email" size={18} />
            <Text selectable style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.footer}><Button onPress={onEdit} title="Chỉnh sửa" icon="edit" /><Button onPress={onClose} title="Đóng" variant="secondary" /></View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: '#172B25A8', flex: 1, justifyContent: 'center', padding: 18 },
  dialog: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.large, borderWidth: 1, maxWidth: 440, padding: 28, width: '100%', ...shadow },
  close: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: colors.neutral, borderRadius: 9, height: 38, justifyContent: 'center', marginBottom: 8, width: 38 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 15, textAlign: 'center' },
  caption: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 6 },
  detailRow: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.small, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 24, padding: 13, width: '100%' },
  email: { color: colors.text, flex: 1, fontSize: 15 },
  footer: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 22, width: '100%' },
});
