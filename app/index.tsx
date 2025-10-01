import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

const STORAGE_KEY = 'cars';

export default function CarListScreen() {
  const router = useRouter();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCars = async () => {
    setLoading(true);
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      setCars(json ? JSON.parse(json) : []);
    } catch (e) {
      setCars([]);
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCars();
    }, [])
  );

  const renderItem = ({ item }: { item: { id: string; vin: string; plate: string; brand: string; model: string; year: string; features?: string } }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: '/car-details', params: { id: item.id } })}>
      <View style={styles.carItem}>
        <Text style={styles.carTitle}>{item.brand} {item.model} ({item.year})</Text>
        <Text style={styles.carSub}>{item.plate} | VIN: {item.vin}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Мои автомобили</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/add-car')}>
            <Ionicons name="add-circle" size={28} color="#007AFF" />
            <Text style={styles.headerButtonText}>Добавить авто</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, cars.length === 0 && styles.headerButtonDisabled]} 
            onPress={() => {
              if (cars.length > 0) {
                router.push('/add-service');
              }
            }}
            disabled={cars.length === 0}
          >
            <Ionicons name="construct" size={28} color={cars.length === 0 ? "#ccc" : "#007AFF"} />
            <Text style={[styles.headerButtonText, cars.length === 0 && styles.headerButtonTextDisabled]}>Запись ТО</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={cars}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Нет добавленных автомобилей</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  headerButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  headerButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  headerButtonTextDisabled: {
    color: '#ccc',
  },
  carItem: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  carSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
