import { Image, StyleSheet, View } from 'react-native';

import { AppIcon } from '../ui/AppIcon';
import { colors } from '../ui/theme';

type UserAvatarProps = { source: string; size?: number };

export function UserAvatar({ source, size = 46 }: UserAvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {source ? <Image source={{ uri: source }} resizeMode="cover" style={styles.image} /> : <AppIcon color={colors.primaryText} name="person" size={size * 0.47} />}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.lightGreen, justifyContent: 'center', overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
});
