import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError, api } from '../../lib/api';
import type { ArtisanDetail } from '../../lib/types';

export default function ArtisanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<ArtisanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        setDetail(await api.artisanDetail(id));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load artisan.');
      }
    })();
  }, [id]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const rating = detail.profile?.avg_rating ?? detail.review_summary.avg;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: detail.user.full_name ?? 'Artisan', headerShown: true }} />

      <Text style={styles.name}>{detail.user.full_name ?? 'Unnamed artisan'}</Text>
      <Text style={styles.meta}>
        {rating ? `★ ${rating}` : 'No rating yet'} · {detail.profile?.total_jobs ?? 0} jobs ·{' '}
        {detail.review_summary.count} reviews
      </Text>
      {detail.profile?.verification_status === 'approved' && (
        <Text style={styles.badge}>✓ Verified</Text>
      )}

      {detail.profile?.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.body}>{detail.profile.bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        {detail.categories.length === 0 && <Text style={styles.body}>No services listed.</Text>}
        {detail.categories.map((c) => (
          <View key={c.id} style={styles.serviceRow}>
            <Text style={styles.serviceName}>{c.name}</Text>
            <Text style={styles.servicePrice}>
              {c.price_min && c.price_max
                ? `₦${c.price_min} – ₦${c.price_max}`
                : c.price_min
                  ? `From ₦${c.price_min}`
                  : 'Contact for quote'}
            </Text>
          </View>
        ))}
      </View>

      {detail.portfolio.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <Text style={styles.body}>{detail.portfolio.length} photo(s).</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 26, fontWeight: '700' },
  meta: { color: '#666', marginTop: 4 },
  badge: { marginTop: 6, color: '#0a7c3f', fontWeight: '600' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 15, color: '#333', lineHeight: 22 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceName: { fontSize: 15, fontWeight: '500' },
  servicePrice: { color: '#555' },
  error: { color: '#b00020', padding: 16 },
});
