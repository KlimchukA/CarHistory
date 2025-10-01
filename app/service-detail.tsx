import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Car = {
  id: string;
  vin: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  features?: string;
};

type ServiceRecord = {
  id: string;
  date: string;
  mileage: number;
  works: string;
  parts: string;
  photo?: string;
};

export default function ServiceDetailScreen() {
  const { carId, serviceId } = useLocalSearchParams<{ carId: string; serviceId: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [serviceRecord, setServiceRecord] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем информацию об автомобиле
        const carsJson = await AsyncStorage.getItem('cars');
        const cars: Car[] = carsJson ? JSON.parse(carsJson) : [];
        const foundCar = cars.find(c => c.id === carId);
        setCar(foundCar || null);

        // Загружаем запись ТО
        const historyKey = `serviceHistory_${carId}`;
        const historyJson = await AsyncStorage.getItem(historyKey);
        const history: ServiceRecord[] = historyJson ? JSON.parse(historyJson) : [];
        const foundService = history.find(s => s.id === serviceId);
        setServiceRecord(foundService || null);
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    };

    loadData();
  }, [carId, serviceId]);

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
    
    return dateStr;
  };

  // Функция для нормализации пробега
  const normalizeMileage = (mileage: any): number => {
    if (typeof mileage === 'number') return mileage;
    if (typeof mileage === 'string') {
      const cleaned = mileage.replace(/[^\d]/g, '');
      return parseInt(cleaned) || 0;
    }
    return 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  if (!car || !serviceRecord) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>Запись ТО не найдена</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Заголовок с информацией об автомобиле */}
      <View style={styles.header}>
        <Text style={styles.carTitle}>{car.brand} {car.model} ({car.year})</Text>
        <Text style={styles.carPlate}>{car.plate}</Text>
      </View>

      {/* Основная информация о записи ТО */}
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.serviceDate}>{normalizeDate(serviceRecord.date)}</Text>
        </View>

        <View style={styles.serviceInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="speedometer" size={20} color="#666" />
            <Text style={styles.infoLabel}>Пробег:</Text>
            <Text style={styles.infoValue}>{normalizeMileage(serviceRecord.mileage).toLocaleString()} км</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="construct" size={20} color="#666" />
            <Text style={styles.infoLabel}>Выполненные работы:</Text>
          </View>
          <Text style={styles.worksText}>{serviceRecord.works}</Text>

          {serviceRecord.parts && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="hardware-chip" size={20} color="#666" />
                <Text style={styles.infoLabel}>Запчасти:</Text>
              </View>
              <Text style={styles.partsText}>{serviceRecord.parts}</Text>
            </>
          )}
        </View>
      </View>

      {/* Фото запчасти */}
      {serviceRecord.photo && (
        <View style={styles.photoSection}>
          <Text style={styles.photoTitle}>Фото запчасти</Text>
          <Image 
            source={{ uri: serviceRecord.photo }} 
            style={styles.photo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Дополнительная информация об автомобиле */}
      <View style={styles.carInfoSection}>
        <Text style={styles.sectionTitle}>Информация об автомобиле</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="card" size={20} color="#666" />
          <Text style={styles.infoLabel}>Гос номер:</Text>
          <Text style={styles.infoValue}>{car.plate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="barcode" size={20} color="#666" />
          <Text style={styles.infoLabel}>VIN:</Text>
          <Text style={styles.infoValue}>{car.vin}</Text>
        </View>

        {car.features && (
          <View style={styles.infoRow}>
            <Ionicons name="settings" size={20} color="#666" />
            <Text style={styles.infoLabel}>Комплектация:</Text>
            <Text style={styles.infoValue}>{car.features}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  carTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  carPlate: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  serviceCard: {
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  serviceDate: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#007AFF',
  },
  serviceInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  worksText: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  partsText: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#34c759',
  },
  photoSection: {
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  carInfoSection: {
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
});
