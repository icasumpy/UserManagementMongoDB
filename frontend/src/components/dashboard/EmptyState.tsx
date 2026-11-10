import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppIconName } from '../ui/AppIcon';
import { colors, radius } from '../ui/theme';

type EmptyStateProps = { icon: AppIconName; title: string; description: string };

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconTile}><AppIcon color={colors.primary} name={icon} size={21} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.medium, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 218, padding: 24 },
  iconTile: { alignItems: 'center', backgroundColor: colors.lightGreen, borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  title: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: 420, textAlign: 'center' },
});
