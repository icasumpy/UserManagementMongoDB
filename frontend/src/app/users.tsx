import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ConfirmDeleteModal } from '../components/users/ConfirmDeleteModal';
import { UserAvatar } from '../components/users/UserAvatar';
import { UserDetailsModal } from '../components/users/UserDetailsModal';
import { UserFormModal } from '../components/users/UserFormModal';
import { AppIcon } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/dashboard/EmptyState';
import { PageHeader } from '../components/dashboard/PageHeader';
import { Sidebar } from '../components/dashboard/Sidebar';
import { TextField } from '../components/ui/TextField';
import { colors, radius, shadow } from '../components/ui/theme';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminToken } from '../services/tokenStorage';
import { createUser, deleteUser, listUsers, ManagedUser, updateUser, UserInput, UsersApiError } from '../services/usersApi';

export default function UsersScreen() {
  const { admin, logout } = useAdminAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const compact = width < 680;
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formUser, setFormUser] = useState<ManagedUser | null>(null);
  const [formError, setFormError] = useState('');
  const [detailsUser, setDetailsUser] = useState<ManagedUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<ManagedUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const requestSequence = useRef(0);

  const load = useCallback(async (search: string, showRefresh = false, clearNotice = true) => {
    const requestId = ++requestSequence.current;
    if (clearNotice) setMessage(null);
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const token = await getAdminToken();
      const result = await listUsers(search, token);
      if (requestId === requestSequence.current) setUsers(result);
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      if (error instanceof UsersApiError && error.status === 401) {
        await logout();
        router.replace('/');
        return;
      }
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Không thể tải danh sách người dùng.' });
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [logout]);

  useEffect(() => {
    const timer = setTimeout(() => void load(query), query ? 280 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  async function handleLogout() {
    setSigningOut(true);
    await logout();
  }

  async function handleSave(input: UserInput) {
    setSaving(true);
    setFormError('');
    try {
      const token = await getAdminToken();
      const saved = formUser
        ? await updateUser(formUser._id, input, token)
        : await createUser(input, token);
      setUsers((current) => formUser
        ? current.map((item) => item._id === saved._id ? saved : item)
        : [...current, saved].sort((left, right) => left.hoten.localeCompare(right.hoten, 'vi')));
      setFormVisible(false);
      setMessage({ kind: 'success', text: formUser ? 'Đã cập nhật người dùng.' : 'Đã thêm người dùng mới.' });
      void load(query, true, false);
    } catch (error) {
      if (error instanceof UsersApiError && error.status === 401) {
        await logout();
        router.replace('/');
        return;
      }
      setFormError(error instanceof Error ? error.message : 'Không thể lưu thông tin người dùng.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteUserTarget) return;
    setDeleting(true);
    try {
      const token = await getAdminToken();
      await deleteUser(deleteUserTarget._id, token);
      setUsers((current) => current.filter((user) => user._id !== deleteUserTarget._id));
      setDeleteUserTarget(null);
      setMessage({ kind: 'success', text: 'Đã xóa người dùng.' });
    } catch (error) {
      if (error instanceof UsersApiError && error.status === 401) {
        await logout();
        router.replace('/');
        return;
      }
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Không thể xóa người dùng.' });
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setFormUser(null);
    setFormError('');
    setFormVisible(true);
  }

  function openEdit(user: ManagedUser) {
    setDetailsUser(null);
    setFormUser(user);
    setFormError('');
    setFormVisible(true);
  }

  return (
    <View style={styles.app}>
      {wide ? <Sidebar /> : null}
      <View style={styles.mainColumn}>
        {!wide && menuOpen ? <Sidebar mobile onNavigate={() => setMenuOpen(false)} /> : null}
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <PageHeader
            compact={compact}
            email={admin?.email}
            eyebrow="ADMIN CONSOLE"
            menuOpen={menuOpen}
            onLogout={() => void handleLogout()}
            onMenuPress={() => setMenuOpen((open) => !open)}
            signingOut={signingOut}
            title="Quản lý người dùng"
          />

          <View style={styles.content}>
            <View style={[styles.pageTitleRow, compact && styles.pageTitleRowCompact]}>
              <View style={styles.pageTitleCopy}>
                <Text style={styles.pageTitle}>Người dùng</Text>
                <Text style={styles.subtitle}>Quản lý hồ sơ và thông tin tài khoản trong một nơi.</Text>
              </View>
              <Button icon="add" onPress={openCreate} title="Thêm người dùng" />
            </View>

            <View style={[styles.toolbar, compact && styles.toolbarCompact]}>
              <View style={styles.searchField}>
                <TextField icon="search" label="Tìm kiếm" onChangeText={setQuery} placeholder="Tìm theo họ tên hoặc email" returnKeyType="search" value={query} />
              </View>
              <Button disabled={loading || refreshing} icon="refresh" loading={refreshing} onPress={() => void load(query, true)} title="Làm mới" variant="secondary" />
            </View>

            {message ? (
              <View accessibilityRole="alert" style={[styles.notice, message.kind === 'error' ? styles.noticeError : styles.noticeSuccess]}>
                <AppIcon color={message.kind === 'error' ? colors.accentText : colors.success} name={message.kind === 'error' ? 'activity' : 'check'} size={17} />
                <Text style={[styles.noticeText, message.kind === 'error' ? styles.noticeErrorText : styles.noticeSuccessText]}>{message.text}</Text>
                <Pressable accessibilityLabel="Đóng thông báo" accessibilityRole="button" onPress={() => setMessage(null)}><AppIcon color={colors.textMuted} name="close" size={17} /></Pressable>
              </View>
            ) : null}

            <View style={styles.listCard}>
              <View style={styles.listHeading}>
                <View>
                  <Text style={styles.listTitle}>Danh sách tài khoản</Text>
                  <Text style={styles.listSubtitle}>{loading ? 'Đang tải dữ liệu…' : `${users.length} kết quả`}</Text>
                </View>
              </View>
              {!loading && users.length > 0 && !compact ? (
                <View style={styles.tableHeader}>
                  <Text style={[styles.columnLabel, styles.userColumn]}>NGƯỜI DÙNG</Text>
                  <Text style={[styles.columnLabel, styles.emailColumn]}>EMAIL</Text>
                  <Text style={[styles.columnLabel, styles.actionColumn]}>THAO TÁC</Text>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.loadingState}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>Đang tải danh sách…</Text></View>
              ) : users.length === 0 ? (
                <EmptyState
                  description={message?.kind === 'error' ? 'Hãy thử tải lại danh sách sau khi kiểm tra kết nối máy chủ.' : query ? 'Thử một từ khóa khác hoặc xóa nội dung tìm kiếm.' : 'Bắt đầu bằng cách thêm hồ sơ người dùng đầu tiên vào danh sách.'}
                  icon={message?.kind === 'error' ? 'activity' : query ? 'search' : 'users'}
                  title={message?.kind === 'error' ? 'Không tải được dữ liệu' : query ? 'Không tìm thấy kết quả' : 'Chưa có người dùng'}
                />
              ) : (
                <View>
                  {users.map((user) => (
                    <View key={user._id} style={[styles.userRow, compact && styles.userRowCompact]}>
                      <Pressable accessibilityRole="button" onPress={() => setDetailsUser(user)} style={[styles.userIdentity, styles.userColumn]}>
                        <UserAvatar source={user.hinhanh} />
                        <View style={styles.userNameGroup}>
                          <Text numberOfLines={1} style={styles.userName}>{user.hoten}</Text>
                          {compact ? <Text numberOfLines={1} style={styles.mobileEmail}>{user.email}</Text> : null}
                        </View>
                      </Pressable>
                      {!compact ? <Text numberOfLines={1} style={[styles.emailText, styles.emailColumn]}>{user.email}</Text> : null}
                      <View style={[styles.rowActions, styles.actionColumn, compact && styles.rowActionsCompact]}>
                        <Button icon="person" onPress={() => setDetailsUser(user)} title={compact ? '' : 'Chi tiết'} variant="quiet" accessibilityLabel={`Xem ${user.hoten}`} />
                        <Button icon="edit" onPress={() => openEdit(user)} title={compact ? '' : 'Sửa'} variant="secondary" accessibilityLabel={`Sửa ${user.hoten}`} />
                        <Button icon="delete" onPress={() => setDeleteUserTarget(user)} title={compact ? '' : 'Xóa'} variant="quiet" accessibilityLabel={`Xóa ${user.hoten}`} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.privacyNote}>Mật khẩu được mã hóa ở máy chủ và không hiển thị trong danh sách hoặc chi tiết hồ sơ.</Text>
          </View>
        </ScrollView>
      </View>

      {formVisible ? <UserFormModal
        key={formUser?._id ?? 'new-user'}
        busy={saving}
        error={formError}
        onClose={() => setFormVisible(false)}
        onSave={(input) => void handleSave(input)}
        user={formUser}
        visible
      /> : null}
      <UserDetailsModal onClose={() => setDetailsUser(null)} onEdit={() => detailsUser && openEdit(detailsUser)} user={detailsUser} />
      <ConfirmDeleteModal
        busy={deleting}
        name={deleteUserTarget?.hoten ?? ''}
        onCancel={() => setDeleteUserTarget(null)}
        onConfirm={() => void handleDelete()}
        visible={Boolean(deleteUserTarget)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { backgroundColor: colors.background, flex: 1, flexDirection: 'row' },
  mainColumn: { flex: 1, minWidth: 0 },
  scrollContent: { flexGrow: 1 },
  content: { alignSelf: 'center', gap: 19, maxWidth: 1320, paddingHorizontal: 29, paddingBottom: 30, paddingTop: 27, width: '100%' },
  pageTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  pageTitleRowCompact: { alignItems: 'flex-start', flexDirection: 'column' },
  pageTitleCopy: { flex: 1, gap: 5 },
  pageTitle: { color: colors.text, fontSize: 25, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  toolbar: { alignItems: 'flex-end', flexDirection: 'row', gap: 12 },
  toolbarCompact: { alignItems: 'stretch', flexDirection: 'column' },
  searchField: { flex: 1, maxWidth: 480 },
  notice: { alignItems: 'center', borderRadius: radius.small, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  noticeSuccess: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  noticeError: { backgroundColor: colors.accentLight, borderColor: '#FCA5A5' },
  noticeText: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '600' },
  noticeSuccessText: { color: colors.success },
  noticeErrorText: { color: colors.accentText },
  listCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.medium, borderWidth: 1, overflow: 'hidden', ...shadow },
  listHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 21, paddingVertical: 18 },
  listTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  listSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  tableHeader: { alignItems: 'center', backgroundColor: colors.background, borderBottomColor: colors.border, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 11 },
  columnLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  userColumn: { flex: 1.1, minWidth: 180 },
  emailColumn: { flex: 1, minWidth: 160 },
  actionColumn: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', minWidth: 235 },
  userRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 15, minHeight: 82, paddingHorizontal: 20, paddingVertical: 13 },
  userRowCompact: { alignItems: 'stretch', flexDirection: 'column', gap: 8, marginHorizontal: 13, marginVertical: 8, borderColor: colors.border, borderRadius: radius.small, borderWidth: 1, paddingHorizontal: 12 },
  userIdentity: { alignItems: 'center', flexDirection: 'row', gap: 12, minWidth: 0 },
  userNameGroup: { flex: 1, minWidth: 0 },
  userName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  mobileEmail: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  emailText: { color: colors.text, fontSize: 14, minWidth: 0 },
  rowActions: { gap: 2 },
  rowActionsCompact: { borderTopColor: colors.border, borderTopWidth: 1, justifyContent: 'flex-end', paddingTop: 7 },
  loadingState: { alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 230 },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  privacyNote: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
