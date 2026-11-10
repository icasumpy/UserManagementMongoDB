import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from './theme';

type BrandMarkProps = { inverse?: boolean; compact?: boolean };

export function BrandMark({ inverse = false, compact = false }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, inverse && styles.markInverse, compact && styles.markCompact]}>
        <Text style={[styles.markText, inverse && styles.markTextInverse, compact && styles.markTextCompact]}>U</Text>
      </View>
      <View>
        <Text style={[styles.name, inverse && styles.nameInverse, compact && styles.nameCompact]}>USER MANAGEMENT</Text>
        {!compact ? <Text style={[styles.caption, inverse && styles.captionInverse]}>ADMIN CONSOLE</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  mark: { alignItems: 'center', backgroundColor: colors.lightGreen, borderRadius: radius.medium, height: 42, justifyContent: 'center', width: 42 },
  markInverse: { backgroundColor: '#FFFFFF1F', borderColor: '#FFFFFF4D', borderWidth: 1 },
  markCompact: { borderRadius: 10, height: 38, width: 38 },
  markText: { color: colors.primaryText, fontSize: 22, fontWeight: '800' },
  markTextInverse: { color: colors.white },
  markTextCompact: { fontSize: 20 },
  name: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  nameInverse: { color: colors.white },
  nameCompact: { fontSize: 11, letterSpacing: 0.8 },
  caption: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 4 },
  captionInverse: { color: colors.white },
});
