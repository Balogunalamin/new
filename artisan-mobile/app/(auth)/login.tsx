import { useRouter } from 'expo-router';
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
  View,
} from 'react-native';
import { ApiError, api } from '../../lib/api';
import type { Role } from '../../lib/types';

const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('+234');
  const [role, setRole] = useState<Extract<Role, 'client' | 'artisan'>>('client');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (): Promise<void> => {
    const trimmed = phone.trim();
    if (!PHONE_RE.test(trimmed)) {
      Alert.alert('Invalid phone', 'Enter a phone number like +2348012345678.');
      return;
    }
    setLoading(true);
    try {
      await api.requestOtp(trimmed);
      router.push({ pathname: '/(auth)/verify', params: { phone: trimmed, role } });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not send code. Try again.';
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
      <Text style={styles.title}>Welcome to Artisan</Text>
      <Text style={styles.subtitle}>
        Enter your phone number to get started. We&apos;ll send you a 6-digit code.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="+2348012345678"
        keyboardType="phone-pad"
        autoComplete="tel"
        autoCapitalize="none"
        value={phone}
        onChangeText={setPhone}
      />

      <View style={styles.roleRow}>
        <RoleButton label="I need a service" active={role === 'client'} onPress={() => setRole('client')} />
        <RoleButton label="I&apos;m an artisan" active={role === 'artisan'} onPress={() => setRole('artisan')} />
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send code</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function RoleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.roleButton, active && styles.roleButtonActive]}>
      <Text style={active ? styles.roleTextActive : styles.roleText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 10,
    padding: 14,
    fontSize: 17,
    marginBottom: 16,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4d4d4',
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: '#111', backgroundColor: '#111' },
  roleText: { color: '#333' },
  roleTextActive: { color: '#fff', fontWeight: '600' },
  button: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
