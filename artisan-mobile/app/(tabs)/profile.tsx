import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Not signed in.</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.full_name ?? user.phone}</Text>
      <Text style={styles.role}>{user.role.toUpperCase()}</Text>
      <Text style={styles.field}>Phone: {user.phone}</Text>
      {user.email && <Text style={styles.field}>Email: {user.email}</Text>}

      {user.artisan && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Artisan profile</Text>
          <Text style={styles.field}>
            Verification: {user.artisan.verification_status}
          </Text>
          <Text style={styles.field}>Jobs completed: {user.artisan.total_jobs}</Text>
          {user.artisan.avg_rating && (
            <Text style={styles.field}>Rating: ★ {user.artisan.avg_rating}</Text>
          )}
        </View>
      )}

      <Pressable style={styles.signOut} onPress={() => void signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 26, fontWeight: '700' },
  role: { color: '#777', marginBottom: 16, letterSpacing: 1 },
  field: { fontSize: 15, marginVertical: 2, color: '#333' },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  signOut: {
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: '#b00020',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: { color: '#b00020', fontWeight: '600' },
});
