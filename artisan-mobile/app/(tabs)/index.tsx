import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, api } from '../../lib/api';
import type { ArtisanSummary, Category } from '../../lib/types';

interface Coord {
  lat: number;
  lng: number;
}

export default function BrowseScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [artisans, setArtisans] = useState<ArtisanSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [coord, setCoord] = useState<Coord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        // Non-fatal. We fall back to a non-geo browse.
      }
    })();
  }, []);

  const load = async (): Promise<void> => {
    setError(null);
    try {
      const [cats, list] = await Promise.all([
        api.categories(),
        api.browseArtisans({
          categoryId: selectedCategory,
          lat: coord?.lat,
          lng: coord?.lng,
          radiusKm: coord ? 10 : undefined,
          limit: 30,
        }),
      ]);
      setCategories(cats);
      setArtisans(list);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not load artisans.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, coord?.lat, coord?.lng]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{ paddingBottom: 24 }}
      data={artisans}
      keyExtractor={(a) => a.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>
            {coord ? 'Artisans near you' : 'Top artisans'}
          </Text>
          <FlatList
            horizontal
            data={[{ id: 'all', name: 'All', slug: 'all' } as Category, ...categories]}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const active =
                item.id === 'all' ? !selectedCategory : selectedCategory === item.id;
              return (
                <Pressable
                  onPress={() => setSelectedCategory(item.id === 'all' ? undefined : item.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={active ? styles.chipTextActive : styles.chipText}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/artisan/${item.id}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.full_name ?? 'Unnamed artisan'}</Text>
            <Text style={styles.meta}>
              {item.avg_rating ? `★ ${item.avg_rating}` : 'No rating yet'} · {item.total_jobs} jobs
              {typeof item.distance_m === 'number' && item.distance_m !== null
                ? ` · ${(item.distance_m / 1000).toFixed(1)} km`
                : ''}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No artisans match that filter yet.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d4d4d4',
    marginHorizontal: 4,
  },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { color: '#666', marginTop: 4 },
  chevron: { fontSize: 24, color: '#aaa' },
  empty: { textAlign: 'center', padding: 24, color: '#777' },
  error: { color: '#b00020', padding: 16 },
});
