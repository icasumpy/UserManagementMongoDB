import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import { colors } from '../components/ui/theme';

export default function RootLayout() {
  return (
    <AdminAuthProvider>
      <AuthenticatedNavigator />
    </AdminAuthProvider>
  );
}

function AuthenticatedNavigator() {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!admin}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(admin)}>
        <Stack.Screen name="users" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
