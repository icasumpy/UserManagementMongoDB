import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

import { colors } from './theme';

export type AppIconName =
  | 'activity'
  | 'arrowRight'
  | 'dashboard'
  | 'email'
  | 'image'
  | 'lock'
  | 'logout'
  | 'menu'
  | 'search'
  | 'shield'
  | 'users'
  | 'visibility'
  | 'visibilityOff'
  | 'close'
  | 'chevronRight'
  | 'person'
  | 'add'
  | 'edit'
  | 'delete'
  | 'refresh'
  | 'check';

const symbolNames: Record<AppIconName, { ios: string; android: string; web: string }> = {
  activity: { ios: 'waveform.path.ecg', android: 'monitoring', web: 'monitoring' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  dashboard: { ios: 'square.grid.2x2.fill', android: 'dashboard', web: 'dashboard' },
  email: { ios: 'envelope', android: 'mail', web: 'mail' },
  image: { ios: 'photo', android: 'image', web: 'image' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  menu: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  shield: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
  users: { ios: 'person.2', android: 'group', web: 'group' },
  visibility: { ios: 'eye', android: 'visibility', web: 'visibility' },
  visibilityOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  person: { ios: 'person', android: 'person', web: 'person' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
};

type AppIconProps = {
  name: AppIconName;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, color = colors.text, size = 20, style }: AppIconProps) {
  return (
    <SymbolView
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      name={symbolNames[name] as SymbolViewProps['name']}
      size={size}
      style={[{ width: size, height: size }, style]}
      tintColor={color}
      weight="medium"
    />
  );
}
