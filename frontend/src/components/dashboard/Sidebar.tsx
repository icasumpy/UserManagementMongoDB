import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../ui/AppIcon';
import { BrandMark } from '../ui/BrandMark';
import { colors, radius } from '../ui/theme';

type SidebarProps = { onNavigate?: () => void; mobile?: boolean };

export function Sidebar({ onNavigate, mobile = false }: SidebarProps) {
  return (
    <View style={[styles.sidebar, mobile && styles.mobileSidebar]}>
      <BrandMark compact />

      <Text style={styles.sectionLabel}>MENU</Text>
      <Link href="/users" asChild>
        <Pressable
          accessibilityRole="link"
          onPress={onNavigate}
          style={({ pressed }) => [styles.navItem, styles.navItemActive, pressed && styles.navPressed]}
        >
          <AppIcon color={colors.primaryText} name="users" size={19} />
          <Text style={[styles.navText, styles.navTextActive]}>Người dùng</Text>
        </Pressable>
      </Link>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTitle}>User Management</Text>
          <Text style={styles.footerCopy}>Khu vực Admin</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { backgroundColor: colors.surface, borderRightColor: colors.border, borderRightWidth: 1, minHeight: '100%', paddingHorizontal: 18, paddingTop: 22, width: 230 },
  mobileSidebar: { borderBottomColor: colors.border, borderBottomWidth: 1, borderRightWidth: 0, minHeight: 0, paddingBottom: 16, paddingTop: 15, width: '100%' },
  sectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 10, marginTop: 30, paddingHorizontal: 10 },
  navItem: { alignItems: 'center', backgroundColor: 'transparent', borderRadius: radius.small, flexDirection: 'row', gap: 12, minHeight: 46, paddingHorizontal: 12 },
  navItemActive: { backgroundColor: colors.lightGreen },
  navPressed: { backgroundColor: colors.neutral },
  navText: { color: colors.textMuted, flex: 1, fontSize: 14, fontWeight: '600' },
  navTextActive: { color: colors.primaryText, fontWeight: '800' },
  footer: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 'auto', paddingBottom: 16, paddingTop: 16 },
  footerTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  footerCopy: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
});
