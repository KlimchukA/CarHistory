import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

function generateId() {
  return Math.random().toString(36).substring(2, 12) + Date.now();
}

const WORKS_OPTIONS = [
  'Замена масла ДВС',
  'Замена тех жидкостей',
  'Замена фильтров',
  'Плановое ТО',
  'Ввести вручную',
];

type Car = {
  id: string;
  vin: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  features?: string;
};

export default function AddServiceScreen() {
  const router = useRouter();
  const { carId: initialCarId } = useLocalSearchParams<{ carId: string }>();
  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [worksOption, setWorksOption] = useState(WORKS_OPTIONS[0]);
  const [worksManual, setWorksManual] = useState('');
  const [parts, setParts] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(initialCarId || '');
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadCars = async () => {
      try {
        const json = await AsyncStorage.getItem('cars');
        const carsData: Car[] = json ? JSON.parse(json) : [];
        setCars(carsData);
        if (carsData.length > 0 && !selectedCarId) {
          setSelectedCarId(carsData[0].id);
        }
      } catch (e) {
        console.error('Error loading cars:', e);
      }
      setLoading(false);
    };
    loadCars();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const selectedCar = cars.find(car => car.id === selectedCarId);

  function isValidDate(str: string) {
    // DD-MM-YYYY
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(str)) return false;
    
    const [day, month, year] = str.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  }

  function isValidMileage(str: string) {
    return /^\d+$/.test(str);
  }

  const handleSave = async () => {
    if (!selectedCarId) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите автомобиль.');
      return;
    }
    if (!date || !isValidDate(date)) {
      Alert.alert('Ошибка', 'Введите корректную дату в формате ДД-ММ-ГГГГ.');
      return;
    }
    if (!mileage || !isValidMileage(mileage)) {
      Alert.alert('Ошибка', 'Введите корректный пробег (только число).');
      return;
    }
    let works = worksOption;
    if (worksOption === 'Ввести вручную') {
      if (!worksManual.trim()) {
        Alert.alert('Ошибка', 'Пожалуйста, введите выполненные работы.');
        return;
      }
      works = worksManual;
    }
    setSaving(true);
    try {
      const record = {
        id: generateId(),
        date,
        mileage,
        works,
        parts,
        photo,
      };
      const key = `serviceHistory_${selectedCarId}`;
      const json = await AsyncStorage.getItem(key);
      const history = json ? JSON.parse(json) : [];
      history.unshift(record); // новые сверху
      await AsyncStorage.setItem(key, JSON.stringify(history));
      router.back();
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить запись ТО.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Добавить запись ТО</Text>
      
      <Text style={styles.label}>Автомобиль</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCarPicker(true)}>
        <Text style={styles.pickerButtonText}>
          {selectedCar ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.plate})` : 'Выберите автомобиль'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Дата (например, 01-10-2025)" value={date} onChangeText={setDate} />
      <TextInput style={styles.input} placeholder="Пробег, км" value={mileage} onChangeText={setMileage} keyboardType="numeric" />
      <Text style={styles.label}>Выполненные работы</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.pickerButtonText}>{worksOption}</Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {worksOption === 'Ввести вручную' && (
        <TextInput
          style={styles.input}
          placeholder="Опишите выполненные работы"
          value={worksManual}
          onChangeText={setWorksManual}
          multiline
        />
      )}
      <TextInput style={styles.input} placeholder="Запчасти (текст)" value={parts} onChangeText={setParts} multiline />
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        <Ionicons name="camera" size={24} color="#007AFF" />
        <Text style={styles.photoButtonText}>{photo ? 'Изменить фото' : 'Добавить фото запчасти'}</Text>
      </TouchableOpacity>
      {photo && (
        <Image source={{ uri: photo }} style={styles.photoPreview} />
      )}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Ionicons name="checkmark-circle" size={28} color="#fff" />
        <Text style={styles.saveButtonText}>{saving ? 'Сохраняю...' : 'Сохранить'}</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите тип работ</Text>
            {WORKS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setWorksOption(option);
                  setShowPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
                {worksOption === option && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPicker(false)}>
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCarPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите автомобиль</Text>
            {cars.map(car => (
              <TouchableOpacity
                key={car.id}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCarId(car.id);
                  setShowCarPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{car.brand} {car.model} ({car.plate})</Text>
                {selectedCarId === car.id && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCarPicker(false)}>
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#222',
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});
