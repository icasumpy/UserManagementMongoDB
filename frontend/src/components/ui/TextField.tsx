import { ReactNode, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View } from 'react-native';

import { AppIcon, AppIconName } from './AppIcon';
import { colors, radius } from './theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  icon: AppIconName;
  rightAccessory?: ReactNode;
  inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>;
};

export function TextField({ label, icon, rightAccessory, inputRef, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputFrame, focused && styles.inputFrameFocused]}>
        <AppIcon color={colors.textMuted} name={icon} size={18} />
        <TextInput
          ref={inputRef}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          placeholderTextColor={colors.textPlaceholder}
          selectionColor={colors.primary}
          style={[styles.input, Platform.OS === 'web' && styles.webInput]}
          {...inputProps}
        />
        {rightAccessory}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  inputFrame: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.small, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 49, paddingHorizontal: 13 },
  inputFrameFocused: { borderColor: colors.primary, borderWidth: 2 },
  input: { color: colors.text, flex: 1, fontSize: 14, minHeight: 46, paddingHorizontal: 0, paddingVertical: 9 },
  webInput: { outlineStyle: 'none' } as unknown as TextStyle,
});
