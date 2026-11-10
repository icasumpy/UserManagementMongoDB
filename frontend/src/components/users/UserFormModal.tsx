import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmailOtpResult, EmailOtpVerification, ManagedUser, UploadedAvatar, UserInput } from '../../services/usersApi';
import { PickedUserImage, pickUserImage } from '../../services/pickUserImage';
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
  onSave: (input: UserInput) => Promise<boolean>;
  onUploadImage: (image: PickedUserImage) => Promise<UploadedAvatar>;
  onDeleteImage: (publicId: string) => Promise<void>;
  onSendEmailOtp: (email: string) => Promise<EmailOtpResult>;
  onVerifyEmailOtp: (email: string, otp: string) => Promise<EmailOtpVerification>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function utf8ByteLength(value: string): number {
  return Array.from(value).reduce((total, character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return total + (codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4);
  }, 0);
}

export function UserFormModal({ visible, user, busy, error, onClose, onSave, onUploadImage, onDeleteImage, onSendEmailOtp, onVerifyEmailOtp }: UserFormModalProps) {
  const editing = Boolean(user);
  const [email, setEmail] = useState(user?.email ?? '');
  const [hoten, setHoten] = useState(user?.hoten ?? '');
  const [matkhau, setMatkhau] = useState('');
  const [hinhanh, setHinhanh] = useState(user?.hinhanh ?? '');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [pendingPublicIds, setPendingPublicIds] = useState<string[]>([]);
  const [currentPendingPublicId, setCurrentPendingPublicId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendAfter, setResendAfter] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    if (!resendAfter && !otpExpiresAt) return undefined;
    const nextDeadline = Math.max(resendAfter ?? 0, otpExpiresAt ?? 0);
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      if (now >= nextDeadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendAfter, otpExpiresAt]);

  const normalizedEmail = email.trim().toLowerCase();
  const originalEmail = user?.email.trim().toLowerCase() ?? '';
  const emailChanged = editing && normalizedEmail !== originalEmail;
  const otpRequired = !editing || emailChanged;
  const emailVerified = !otpRequired || verifiedEmail === normalizedEmail;
  const resendSeconds = resendAfter ? Math.max(0, Math.ceil((resendAfter - currentTime) / 1000)) : 0;
  const otpExpired = Boolean(otpExpiresAt && currentTime >= otpExpiresAt);

  function handleEmailChange(value: string) {
    setEmail(value);
    setValidationError('');
    setVerifiedEmail(null);
    setOtp('');
    setOtpSent(false);
    setResendAfter(null);
    setOtpExpiresAt(null);
    setOtpError('');
  }

  async function handleSendOtp() {
    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      setOtpError('Vui lòng nhập email hợp lệ trước khi gửi mã.');
      return;
    }
    setOtpBusy(true);
    setOtpError('');
    try {
      const result = await onSendEmailOtp(normalizedEmail);
      setOtpSent(true);
      setOtp('');
      setVerifiedEmail(null);
      setResendAfter(Date.parse(result.resendAfter));
      setOtpExpiresAt(Date.parse(result.expiresAt));
      setCurrentTime(Date.now());
    } catch (requestError) {
      setOtpError(requestError instanceof Error ? requestError.message : 'Không thể gửi mã OTP.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleVerifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    setOtpBusy(true);
    setOtpError('');
    try {
      const result = await onVerifyEmailOtp(normalizedEmail, otp);
      setVerifiedEmail(result.email);
      setOtpError('');
    } catch (requestError) {
      setOtpError(requestError instanceof Error ? requestError.message : 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function handlePickImage() {
    setImageBusy(true);
    setImageError('');
    try {
      const image = await pickUserImage();
      if (image !== null) {
        const uploaded = await onUploadImage(image);
        setHinhanh(uploaded.url);
        const previousPending = currentPendingPublicId;
        setPendingPublicIds((current) => [...current, uploaded.publicId]);
        setCurrentPendingPublicId(uploaded.publicId);
        let cleanupFailed = false;
        if (previousPending) {
          try {
            await onDeleteImage(previousPending);
            setPendingPublicIds((current) => current.filter((id) => id !== previousPending));
          } catch {
            cleanupFailed = true;
            setImageError('Ảnh mới đã tải lên, nhưng chưa thể dọn ảnh tải lên trước đó.');
          }
        }
        if (!cleanupFailed) setImageError('');
      }
    } catch (pickError) {
      setImageError(pickError instanceof Error ? pickError.message : 'Không thể chọn ảnh.');
    } finally {
      setImageBusy(false);
    }
  }

  async function handleSave() {
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
    if (otpRequired && verifiedEmail !== normalizedEmail) {
      setValidationError('Hãy xác thực email hiện tại bằng OTP trước khi tạo người dùng.');
      return;
    }
    const input: UserInput = { email: normalizedEmail, hoten: normalizedName };
    if (!(editing && hinhanh === user?.hinhanh && hinhanh.startsWith('data:image/'))) input.hinhanh = hinhanh;
    if (!editing || matkhau) input.matkhau = matkhau;
    const orphanedUploads = pendingPublicIds.filter((id) => id !== currentPendingPublicId);
    for (const publicId of orphanedUploads) {
      try {
        await onDeleteImage(publicId);
        setPendingPublicIds((current) => current.filter((id) => id !== publicId));
      } catch {
        setImageError('Chưa thể dọn ảnh tải lên chưa sử dụng. Hãy thử lưu lại hoặc gỡ ảnh.');
        return;
      }
    }
    const saved = await onSave(input);
    if (saved) {
      setPendingPublicIds([]);
      setCurrentPendingPublicId(null);
      onClose();
    }
  }

  async function handleClose() {
    if (busy || imageBusy || closing) return;
    if (pendingPublicIds.length > 0) {
      setClosing(true);
      try {
        for (const publicId of pendingPublicIds) await onDeleteImage(publicId);
        setPendingPublicIds([]);
        setCurrentPendingPublicId(null);
      } catch {
        setImageError('Không thể dọn ảnh chưa lưu. Hãy thử lại trước khi đóng biểu mẫu.');
        setClosing(false);
        return;
      }
      setClosing(false);
    }
    onClose();
  }

  async function handleRemoveImage() {
    if (pendingPublicIds.length > 0) {
      try {
        for (const publicId of pendingPublicIds) await onDeleteImage(publicId);
        setPendingPublicIds([]);
        setCurrentPendingPublicId(null);
      } catch {
        setImageError('Không thể xóa ảnh vừa tải lên. Hãy thử lại.');
        return;
      }
    }
    setHinhanh('');
  }

  const content = (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable accessibilityLabel="Đóng hộp thoại" onPress={() => void handleClose()} style={StyleSheet.absoluteFill} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>HỒ SƠ NGƯỜI DÙNG</Text>
              <Text style={styles.title}>{editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</Text>
            </View>
            <Pressable accessibilityLabel="Đóng" accessibilityRole="button" disabled={busy || imageBusy || closing} onPress={() => void handleClose()} style={styles.closeButton}>
              <AppIcon color={colors.text} name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.imageBlock}>
              <UserAvatar size={74} source={hinhanh} />
              <View style={styles.imageActions}>
                <Button disabled={imageBusy} icon="image" loading={imageBusy} onPress={() => void handlePickImage()} title={hinhanh ? 'Đổi ảnh' : 'Chọn ảnh'} variant="secondary" />
                {hinhanh ? <Button disabled={imageBusy} onPress={() => void handleRemoveImage()} title="Gỡ ảnh" variant="quiet" /> : null}
                <Text style={styles.helper}>{imageBusy ? 'Đang tải ảnh lên…' : 'JPG, PNG hoặc WebP. Ảnh tối đa 5 MB.'}</Text>
              </View>
            </View>
            <TextField autoCapitalize="none" autoComplete="email" icon="email" keyboardType="email-address" label="Email" onChangeText={handleEmailChange} placeholder="ten@vidu.vn" value={email} />
            {otpRequired ? (
              <View style={styles.otpSection}>
                <Button
                  disabled={otpBusy || resendSeconds > 0 || emailVerified}
                  loading={otpBusy}
                  onPress={() => void handleSendOtp()}
                  title={emailVerified ? 'Email đã xác thực' : resendSeconds > 0 ? `Gửi lại mã sau ${resendSeconds}s` : otpSent ? 'Gửi lại mã OTP' : 'Gửi mã OTP'}
                  variant="secondary"
                />
                <Text style={[styles.otpStatus, emailVerified ? styles.otpVerified : null]}>
                  {emailVerified ? 'Email đã được xác thực.' : otpExpired ? 'Mã OTP đã hết hạn. Hãy gửi mã mới.' : otpSent ? 'Đang chờ xác thực email. Mã có hiệu lực 5 phút.' : 'Email chưa được xác thực.'}
                </Text>
                {otpSent && !emailVerified ? (
                  <View style={styles.otpVerifyRow}>
                    <View style={styles.otpInput}>
                      <TextField
                        autoCapitalize="none"
                        icon="lock"
                        keyboardType="number-pad"
                        label="Mã OTP 6 số"
                        maxLength={6}
                        onChangeText={(value) => { setOtp(value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                        placeholder="Nhập mã từ email"
                        value={otp}
                      />
                    </View>
                    <Button disabled={otpBusy || otp.length !== 6 || otpExpired} loading={otpBusy} onPress={() => void handleVerifyOtp()} title="Xác thực" />
                  </View>
                ) : null}
                {otpError ? <Text accessibilityRole="alert" style={styles.otpError}>{otpError}</Text> : null}
              </View>
            ) : null}
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
              <Button disabled={busy || imageBusy || closing} onPress={() => void handleClose()} title="Hủy" variant="secondary" />
              <Button disabled={busy || imageBusy || closing || (otpRequired && !emailVerified)} loading={busy} onPress={() => void handleSave()} title={editing ? 'Lưu thay đổi' : 'Tạo người dùng'} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
  );

  return <Modal animationType="fade" onRequestClose={() => void handleClose()} transparent visible={visible}>{content}</Modal>;
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
  otpSection: { gap: 8 },
  otpStatus: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  otpVerified: { color: colors.success, fontWeight: '700' },
  otpError: { color: colors.accentText, fontSize: 13, lineHeight: 18 },
  otpVerifyRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 10 },
  otpInput: { flex: 1 },
  visibilityButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 36 },
  errorBox: { alignItems: 'center', backgroundColor: colors.accentLight, borderColor: '#FCA5A5', borderRadius: radius.small, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 11 },
  errorText: { color: colors.accentText, flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 2 },
});
