import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../ui/AppIcon';
import { Button } from '../ui/Button';
import { colors, radius } from '../ui/theme';

type PageHeaderProps = {
  title?: string;
  eyebrow?: string;
  email?: string;
  compact: boolean;
  menuOpen: boolean;
  onMenuPress: () => void;
  onLogout: () => void;
  signingOut: boolean;
};

export function PageHeader({ title = 'Người dùng', eyebrow = 'ADMIN CONSOLE', email, compact, menuOpen, onMenuPress, onLogout, signingOut }: PageHeaderProps) {
  const initial = email?.trim().charAt(0).toUpperCase() || 'A';

  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.titleGroup}>
        {compact ? (
          <Pressable accessibilityLabel={menuOpen ? 'Đóng menu' : 'Mở menu'} accessibilityRole="button" onPress={onMenuPress} style={styles.menuButton}>
            <AppIcon color={colors.text} name={menuOpen ? 'close' : 'menu'} size={20} />
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.profile}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          {!compact ? (
            <View style={styles.profileCopy}>
              <Text style={styles.profileLabel}>Đang đăng nhập</Text>
              <Text numberOfLines={1} style={styles.email}>{email}</Text>
            </View>
          ) : null}
        </View>
        <Button icon="logout" loading={signingOut} onPress={onLogout} title={compact ? '' : 'Đăng xuất'} variant="secondary" accessibilityLabel="Đăng xuất" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 78, paddingHorizontal: 30, paddingVertical: 12 },
  headerCompact: { minHeight: 68, paddingHorizontal: 14 },
  titleGroup: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  menuButton: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.small, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  eyebrow: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 3 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  profile: { alignItems: 'center', flexDirection: 'row', gap: 9, maxWidth: 230 },
  avatar: { alignItems: 'center', backgroundColor: colors.lightGreen, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  avatarText: { color: colors.primaryText, fontSize: 13, fontWeight: '800' },
  profileCopy: { flexShrink: 1 },
  profileLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 2 },
  email: { color: colors.text, fontSize: 12, fontWeight: '700' },
});
