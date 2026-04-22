import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { ApiError, api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Role } from '../../lib/types';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone: string; role: string }>();
  const phone = params.phone ?? '';
  const role = (params.role === 'artisan' ? 'artisan' : 'client') as Extract<Role, 'client' | 'artisan'>;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const onSubmit = async (): Promise<void> => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid code', 'Enter the 6-digit code we sent.');
      return;
    }
    setLoading(true);
    try {
      await api.verifyOtp(phone, otp, role);
      await refresh();
      // _layout's effect will redirect into (tabs) once status flips to signed-in.
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not verify code.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Enter the 6-digit code</Text>
      <Text style={styles.subtitle}>Sent to {phone}</Text>

      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/\D/g, ''))}
        autoFocus
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 10,
    padding: 14,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: { backgroundColor: '#111', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
