import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/auth';

/**
 * Root entry. The layout effect takes over once auth resolves; this screen
 * only renders during the first moment while we load tokens from secure store.
 */
export default function Index() {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return status === 'signed-in' ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}
