import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ManagedUser, UserInput } from '../../services/usersApi';
import { pickUserImage } from '../../services/pickUserImage';
import { AppIcon } from '../ui/AppIcon';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { colors, radius, shadow } from '../ui/theme';
import { UserAvatar } from './UserAvatar';

type UserFormModalProps = {
  visible: boolean;
  user?: ManagedUser | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (input: UserInput) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function utf8ByteLength(value: string): number {
  return Array.from(value).reduce((total, character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return total + (codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4);
  }, 0);
}

export function UserFormModal({ visible, user, busy, error, onClose, onSave }: UserFormModalProps) {
  const editing = Boolean(user);
  const [email, setEmail] = useState(user?.email ?? '');
  const [hoten, setHoten] = useState(user?.hoten ?? '');
  const [matkhau, setMatkhau] = useState('');
  const [hinhanh, setHinhanh] = useState(user?.hinhanh ?? '');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const [validationError, setValidationError] = useState('');

  async function handlePickImage() {
    setImageBusy(true);
    setImageError('');
    try {
      const image = await pickUserImage();
      if (image !== null) {
        setHinhanh(image);
        setImageError('');
      }
    } catch (pickError) {
      setImageError(pickError instanceof Error ? pickError.message : 'Không thể chọn ảnh.');
    } finally {
      setImageBusy(false);
    }
  }

  function handleSave() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = hoten.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      setValidationError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!normalizedName || normalizedName.length > 100) {
      setValidationError('Họ tên không được để trống và tối đa 100 ký tự.');
      return;
    }
    if (!editing && matkhau.length < 8) {
      setValidationError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (matkhau && utf8ByteLength(matkhau) > 72) {
      setValidationError('Mật khẩu vượt quá giới hạn độ dài.');
      return;
    }
    const input: UserInput = { email: normalizedEmail, hoten: normalizedName, hinhanh };
    if (!editing || matkhau) input.matkhau = matkhau;
    onSave(input);
  }

  const content = (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable accessibilityLabel="Đóng hộp thoại" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>HỒ SƠ NGƯỜI DÙNG</Text>
              <Text style={styles.title}>{editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</Text>
            </View>
            <Pressable accessibilityLabel="Đóng" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <AppIcon color={colors.text} name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.imageBlock}>
              <UserAvatar size={74} source={hinhanh} />
              <View style={styles.imageActions}>
                <Button disabled={imageBusy} icon="image" loading={imageBusy} onPress={() => void handlePickImage()} title={hinhanh ? 'Đổi ảnh' : 'Chọn ảnh'} variant="secondary" />
                {hinhanh ? <Button onPress={() => setHinhanh('')} title="Gỡ ảnh" variant="quiet" /> : null}
                <Text style={styles.helper}>JPG, PNG hoặc WebP. Ảnh được nén trước khi lưu.</Text>
              </View>
            </View>
            <TextField autoCapitalize="none" autoComplete="email" icon="email" keyboardType="email-address" label="Email" onChangeText={(value) => { setEmail(value); setValidationError(''); }} placeholder="ten@vidu.vn" value={email} />
            <TextField autoCapitalize="words" icon="person" label="Họ và tên" onChangeText={(value) => { setHoten(value); setValidationError(''); }} placeholder="Nhập họ tên" value={hoten} />
            <TextField
              autoCapitalize="none"
              autoComplete={editing ? 'new-password' : 'new-password'}
              icon="lock"
              label={editing ? 'Mật khẩu mới (không bắt buộc)' : 'Mật khẩu'}
              onChangeText={(value) => { setMatkhau(value); setValidationError(''); }}
              placeholder={editing ? 'Để trống nếu không đổi' : 'Ít nhất 8 ký tự'}
              rightAccessory={(
                <Pressable accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} accessibilityRole="button" onPress={() => setPasswordVisible((value) => !value)} style={styles.visibilityButton}>
                  <AppIcon color={colors.textMuted} name={passwordVisible ? 'visibilityOff' : 'visibility'} size={19} />
                </Pressable>
              )}
              secureTextEntry={!passwordVisible}
              value={matkhau}
            />
            {imageError || validationError || error ? (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <AppIcon color={colors.accentText} name="activity" size={17} />
                <Text style={styles.errorText}>{imageError || validationError || error}</Text>
              </View>
            ) : null}
            <View style={styles.footer}>
              <Button disabled={busy || imageBusy} onPress={onClose} title="Hủy" variant="secondary" />
              <Button disabled={busy || imageBusy} loading={busy} onPress={handleSave} title={editing ? 'Lưu thay đổi' : 'Tạo người dùng'} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
  );

  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>{content}</Modal>;
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: '#172B25A8', flex: 1, justifyContent: 'center', padding: 18 },
  dialog: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.large, borderWidth: 1, maxHeight: '92%', maxWidth: 560, padding: 24, width: '100%', ...shadow },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  headerCopy: { gap: 4 },
  eyebrow: { color: colors.primaryText, fontSize: 12, fontWeight: '700' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  closeButton: { alignItems: 'center', backgroundColor: colors.neutral, borderRadius: 9, height: 38, justifyContent: 'center', width: 38 },
  form: { gap: 17, paddingBottom: 2 },
  imageBlock: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.medium, borderWidth: 1, flexDirection: 'row', gap: 15, padding: 14 },
  imageActions: { alignItems: 'flex-start', flex: 1, gap: 6 },
  helper: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  visibilityButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 36 },
  errorBox: { alignItems: 'center', backgroundColor: colors.accentLight, borderColor: '#FCA5A5', borderRadius: radius.small, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 11 },
  errorText: { color: colors.accentText, flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 2 },
});
