import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useState } from 'react';

import { AppIcon, AppIconName } from './AppIcon';
import { colors, radius } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  icon?: AppIconName;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isUnavailable = disabled || loading;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const iconColor = variant === 'primary' || variant === 'danger' ? colors.white : colors.text;
  const stateStyles = {
    primary: { disabled: styles.disabledPrimary, pressed: styles.pressedPrimary, hovered: styles.hoverPrimary, focused: styles.focusedOnDark },
    secondary: { disabled: styles.disabledSecondary, pressed: styles.pressedSecondary, hovered: styles.hoverSecondary, focused: styles.focusedOnLight },
    quiet: { disabled: styles.disabledQuiet, pressed: styles.pressedQuiet, hovered: styles.hoverQuiet, focused: styles.focusedOnLight },
    danger: { disabled: styles.disabledDanger, pressed: styles.pressedDanger, hovered: styles.hoverDanger, focused: styles.focusedOnDark },
  }[variant];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      disabled={isUnavailable}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        focused && stateStyles.focused,
        isUnavailable && stateStyles.disabled,
        pressed && !isUnavailable && stateStyles.pressed,
        hovered && !isUnavailable && !pressed && stateStyles.hovered,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={iconColor} size="small" /> : null}
      {!loading && icon ? <AppIcon color={iconColor} name={icon} size={17} /> : null}
      <Text style={[styles.label, (variant === 'primary' || variant === 'danger') && styles.primaryLabel]}>{title}</Text>
      {!loading && variant === 'primary' && !icon ? (
        <View style={styles.endIcon}><AppIcon color={colors.white} name="arrowRight" size={17} /></View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', borderRadius: radius.small, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  quiet: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.accentText },
  focusedOnDark: { borderColor: colors.white, borderWidth: 2 },
  focusedOnLight: { borderColor: colors.primary, borderWidth: 2 },
  disabledPrimary: { backgroundColor: colors.textMuted },
  disabledSecondary: { backgroundColor: colors.neutral, borderColor: colors.border },
  disabledQuiet: { backgroundColor: colors.neutral },
  disabledDanger: { backgroundColor: colors.textMuted },
  pressedPrimary: { backgroundColor: '#1E40AF' },
  pressedSecondary: { backgroundColor: colors.neutral },
  pressedQuiet: { backgroundColor: colors.neutral },
  pressedDanger: { backgroundColor: '#7F1D1D' },
  hoverPrimary: { backgroundColor: '#1D4ED8' },
  hoverSecondary: { backgroundColor: colors.neutral, borderColor: colors.textMuted },
  hoverQuiet: { backgroundColor: colors.neutral },
  hoverDanger: { backgroundColor: '#991B1B' },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  primaryLabel: { color: colors.white },
  endIcon: { marginLeft: 1 },
});
