import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { useAdminAuth } from '../context/AdminAuthContext';
import { AppIcon } from '../components/ui/AppIcon';
import { BrandMark } from '../components/ui/BrandMark';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { colors, radius, shadow } from '../components/ui/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const passwordInput = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (isSubmitting) return;
    setError('');
    if (!email.trim() || !password) {
      setError('Nhập email và mật khẩu để tiếp tục.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/users');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.shell, isDesktop && styles.desktopShell]}>
      {isDesktop ? <LoginStory /> : null}

      <ScrollView
        contentContainerStyle={[styles.formScroll, isDesktop ? styles.desktopFormScroll : styles.mobileFormScroll]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.formPane}
      >
        {!isDesktop ? <View style={styles.mobileBrand}><BrandMark compact /></View> : null}

        <View style={[styles.card, isDesktop && styles.desktopCard]}>
          <View style={styles.cardTop}>
            <View style={styles.adminBadge}>
              <AppIcon color={colors.primary} name="shield" size={15} />
              <Text style={styles.adminBadgeText}>KHU VỰC QUẢN TRỊ</Text>
            </View>
            <Text style={styles.heading}>Đăng nhập Admin</Text>
            <Text style={styles.description}>Nhập thông tin quản trị viên để truy cập không gian làm việc.</Text>
          </View>

          <View style={styles.form}>
            <TextField
              autoCapitalize="none"
              autoComplete="email"
              icon="email"
              keyboardType="email-address"
              label="Email quản trị"
              onChangeText={setEmail}
              onSubmitEditing={() => passwordInput.current?.focus()}
              placeholder="admin@example.com"
              returnKeyType="next"
              value={email}
            />

            <TextField
              autoCapitalize="none"
              autoComplete="current-password"
              icon="lock"
              inputRef={passwordInput}
              label="Mật khẩu"
              onChangeText={setPassword}
              onSubmitEditing={() => void handleSubmit()}
              placeholder="Nhập mật khẩu của bạn"
              returnKeyType="go"
              rightAccessory={(
                <Pressable
                  accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.visibilityButton}
                >
                  <AppIcon color={colors.textMuted} name={passwordVisible ? 'visibilityOff' : 'visibility'} size={19} />
                </Pressable>
              )}
              secureTextEntry={!passwordVisible}
              value={password}
            />

            {error ? (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <View style={styles.errorIcon}><AppIcon color={colors.accentText} name="activity" size={16} /></View>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              disabled={isSubmitting}
              loading={isSubmitting}
              onPress={() => void handleSubmit()}
              title={isSubmitting ? 'Đang xác thực…' : 'Đăng nhập'}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.secureNote}>
            <AppIcon color={colors.primary} name="lock" size={15} />
            <Text style={styles.secureNoteText}>Phiên làm việc chỉ dành cho Admin</Text>
          </View>
        </View>

        <Text style={styles.footer}>UserManagementMongoDB <Text style={styles.footerDot}>·</Text> Secure Admin Access</Text>
      </ScrollView>
    </View>
  );
}

function LoginStory() {
  return (
    <View accessibilityElementsHidden style={styles.storyPane}>
      <View style={styles.illustration}>
        <View style={styles.illustrationHalo} />
        <View style={styles.illustrationBlob} />
        <View style={styles.sparkleOne}><AppIcon color={colors.primary} name="add" size={20} /></View>
        <View style={styles.sparkleTwo}><AppIcon color={colors.success} name="check" size={18} /></View>

        <View style={styles.mascotAntenna}><View style={styles.antennaTip} /></View>
        <View style={styles.mascot}>
          <View style={styles.mascotFace}>
            <View style={styles.mascotEyes}><View style={styles.mascotEye} /><View style={styles.mascotEye} /></View>
            <View style={styles.mascotSmile} />
            <View style={[styles.mascotCheek, styles.mascotCheekLeft]} />
            <View style={[styles.mascotCheek, styles.mascotCheekRight]} />
          </View>
          <View style={styles.mascotBody}><AppIcon color={colors.white} name="lock" size={26} /></View>
        </View>

        <View style={styles.shieldBadge}><AppIcon color={colors.white} name="shield" size={29} /></View>
        <View style={styles.userBadge}><AppIcon color={colors.primary} name="users" size={23} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: colors.background, flex: 1 },
  desktopShell: { flexDirection: 'row' },
  storyPane: { alignItems: 'center', backgroundColor: colors.background, borderRightColor: colors.border, borderRightWidth: 1, justifyContent: 'center', overflow: 'hidden', padding: 28, width: '42%' },
  illustration: { alignItems: 'center', height: 390, justifyContent: 'center', maxWidth: 430, position: 'relative', width: '100%' },
  illustrationHalo: { backgroundColor: colors.lightGreen, borderRadius: 190, height: 340, position: 'absolute', width: 340 },
  illustrationBlob: { backgroundColor: '#DBEAFE', borderRadius: 125, height: 250, position: 'absolute', right: 18, top: 27, transform: [{ rotate: '18deg' }], width: 250 },
  sparkleOne: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, height: 42, justifyContent: 'center', left: 44, position: 'absolute', top: 62, width: 42 },
  sparkleTwo: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, bottom: 62, height: 42, justifyContent: 'center', position: 'absolute', right: 42, width: 42 },
  mascotAntenna: { backgroundColor: colors.primary, borderRadius: 3, height: 43, position: 'absolute', top: 62, width: 6 },
  antennaTip: { backgroundColor: colors.accent, borderColor: colors.surface, borderRadius: 10, borderWidth: 3, height: 21, left: -7, position: 'absolute', top: -12, width: 21 },
  mascot: { alignItems: 'center', backgroundColor: colors.primary, borderColor: '#1D4ED8', borderRadius: 70, borderWidth: 5, height: 226, justifyContent: 'center', paddingTop: 10, width: 196 },
  mascotFace: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 35, height: 107, justifyContent: 'center', position: 'relative', width: 150 },
  mascotEyes: { flexDirection: 'row', gap: 34, marginTop: 6 },
  mascotEye: { backgroundColor: colors.text, borderRadius: 6, height: 12, width: 12 },
  mascotSmile: { borderBottomColor: colors.primary, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, borderBottomWidth: 3, height: 12, marginTop: 3, width: 24 },
  mascotCheek: { backgroundColor: '#FECACA', borderRadius: 8, height: 9, position: 'absolute', top: 61, width: 16 },
  mascotCheekLeft: { left: 12 },
  mascotCheekRight: { right: 12 },
  mascotBody: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 23, height: 50, justifyContent: 'center', marginTop: 12, width: 70 },
  shieldBadge: { alignItems: 'center', backgroundColor: colors.success, borderColor: colors.surface, borderRadius: 25, borderWidth: 4, bottom: 70, height: 62, justifyContent: 'center', position: 'absolute', right: 82, width: 62 },
  userBadge: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, height: 54, justifyContent: 'center', left: 64, position: 'absolute', top: 225, width: 54 },
  formPane: { flex: 1 },
  formScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 34 },
  desktopFormScroll: { alignItems: 'center' },
  mobileFormScroll: { paddingHorizontal: 22 },
  mobileBrand: { alignSelf: 'center', marginBottom: 23, marginTop: 12 },
  card: { alignSelf: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.medium, borderWidth: 1, maxWidth: 470, padding: 28, width: '100%', ...shadow },
  desktopCard: { padding: 36 },
  cardTop: { marginBottom: 25 },
  adminBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.lightGreen, borderRadius: 20, flexDirection: 'row', gap: 7, paddingHorizontal: 10, paddingVertical: 7 },
  adminBadgeText: { color: colors.primaryText, fontSize: 12, fontWeight: '700' },
  heading: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, marginTop: 19 },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 370 },
  form: { gap: 18 },
  visibilityButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 36 },
  errorBox: { alignItems: 'center', backgroundColor: colors.accentLight, borderColor: '#F1D4CA', borderRadius: radius.small, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 11 },
  errorIcon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 7, height: 27, justifyContent: 'center', width: 27 },
  errorText: { color: colors.accentText, flex: 1, fontSize: 12, lineHeight: 18 },
  submitButton: { marginTop: 2, minHeight: 49 },
  secureNote: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 23, paddingTop: 18 },
  secureNoteText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  footer: { alignSelf: 'center', color: colors.textMuted, fontSize: 12, marginTop: 18, textAlign: 'center' },
  footerDot: { color: colors.textMuted, fontWeight: '800' },
});
