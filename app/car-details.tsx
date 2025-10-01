import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';

const STORAGE_KEY = 'cars';

type Car = {
  id: string;
  vin: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  features?: string;
};

export default function CarDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterParts, setFilterParts] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'mileage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadCar = async () => {
    setLoading(true);
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const cars: Car[] = json ? JSON.parse(json) : [];
      const found = cars.find(c => c.id === id);
      setCar(found || null);
    } catch {
      setCar(null);
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    try {
      const key = `serviceHistory_${id}`;
      const json = await AsyncStorage.getItem(key);
      setHistory(json ? JSON.parse(json) : []);
    } catch {
      setHistory([]);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCar();
      loadHistory();
    }, [id])
  );

  // Функция для конвертации даты в единый формат ДД-ММ-ГГГГ
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Если дата уже в формате ДД-ММ-ГГГГ
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Если дата в формате ГГГГ-ММ-ДД
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}-${month}-${year}`;
    }
    
    return dateStr; // Возвращаем как есть, если формат неизвестен
  };

  // Функция для парсинга даты для сортировки
  const parseDate = (dateStr: string): Date => {
    const normalized = normalizeDate(dateStr);
    const [day, month, year] = normalized.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Функция для нормализации пробега
  const normalizeMileage = (mileage: any): number => {
    if (typeof mileage === 'number') return mileage;
    if (typeof mileage === 'string') {
      // Убираем все символы кроме цифр
      const cleaned = mileage.replace(/[^\d]/g, '');
      return parseInt(cleaned) || 0;
    }
    return 0;
  };

  const filteredAndSortedHistory = history
    .filter(item => {
      const normalizedDate = normalizeDate(item.date);
      const dateMatch = filterDate ? normalizedDate.includes(filterDate) : true;
      const partsMatch = filterParts ? (item.parts || '').toLowerCase().includes(filterParts.toLowerCase()) : true;
      return dateMatch && partsMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        comparison = dateA.getTime() - dateB.getTime();
      } else if (sortBy === 'mileage') {
        const mileageA = normalizeMileage(a.mileage);
        const mileageB = normalizeMileage(b.mileage);
        comparison = mileageA - mileageB;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />;
  }
  if (!car) {
    return <Text style={{ textAlign: 'center', marginTop: 32 }}>Автомобиль не найден</Text>;
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{car.brand} {car.model} ({car.year})</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push({ pathname: '/add-service', params: { carId: car.id } })}>
          <Ionicons name="add-circle" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Гос номер:</Text>
      <Text style={styles.value}>{car.plate}</Text>
      <Text style={styles.label}>VIN/Frame номер:</Text>
      <Text style={styles.value}>{car.vin}</Text>
      <Text style={styles.label}>Особенности комплектации:</Text>
      <Text style={styles.value}>{car.features || '-'}</Text>
      <Text style={[styles.title, { fontSize: 20, marginTop: 28 }]}>История обслуживания</Text>
      
      <View style={styles.filterRow}>
        <TextInput
          style={styles.filterInput}
          placeholder="Фильтр по дате (01-10-2025)"
          value={filterDate}
          onChangeText={setFilterDate}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Фильтр по запчастям"
          value={filterParts}
          onChangeText={setFilterParts}
        />
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
          onPress={() => {
            if (sortBy === 'date') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('date');
              setSortOrder('desc');
            }
          }}
        >
          <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
            Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'mileage' && styles.sortButtonActive]}
          onPress={() => {
            if (sortBy === 'mileage') {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy('mileage');
              setSortOrder('desc');
            }
          }}
        >
          <Text style={[styles.sortButtonText, sortBy === 'mileage' && styles.sortButtonTextActive]}>
            Пробег {sortBy === 'mileage' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Text>
        </TouchableOpacity>
      </View>
      {filteredAndSortedHistory.length === 0 ? (
        <Text style={{ color: '#888', marginTop: 8 }}>Пока нет записей о ТО</Text>
      ) : (
        filteredAndSortedHistory.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.serviceItem}
            onPress={() => router.push({ 
              pathname: '/service-detail', 
              params: { carId: id, serviceId: item.id } 
            })}
          >
            <Text style={styles.serviceDate}>{normalizeDate(item.date)} | {normalizeMileage(item.mileage).toLocaleString()} км</Text>
            <Text style={styles.serviceWorks}>{item.works}</Text>
            <Text style={styles.serviceParts}>Запчасти: {item.parts || '-'}</Text>
            {item.photo && (
              <Image source={{ uri: item.photo }} style={styles.servicePhoto} />
            )}
            <View style={styles.serviceItemFooter}>
              <Text style={styles.tapHint}>Нажмите для просмотра деталей</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  value: {
    fontSize: 18,
    color: '#222',
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: {
    marginLeft: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  serviceItem: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d0d0d0',
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  serviceDate: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  serviceWorks: {
    fontSize: 14,
    marginBottom: 2,
  },
  serviceParts: {
    fontSize: 13,
    color: '#555',
  },
  servicePhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
});
