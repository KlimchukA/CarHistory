import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { carsApiService, CarBrand, CarModel } from '../src/services/carsApi';

const STORAGE_KEY = 'cars';

function generateId() {
  return Math.random().toString(36).substring(2, 12) + Date.now();
}

export default function AddCarScreen() {
  const router = useRouter();
  const [vin, setVin] = useState('');
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [features, setFeatures] = useState('');
  const [saving, setSaving] = useState(false);
  
  // API состояния
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<CarBrand[]>([]);
  const [filteredModels, setFilteredModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandLoading, setBrandLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  
  // Модальные окна
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  
  // Выбранные элементы
  const [selectedBrand, setSelectedBrand] = useState<CarBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadBrands();
  }, []);

  // Загрузка списка марок
  const loadBrands = async () => {
    try {
      setLoading(true);
      const brandsData = await carsApiService.getBrands();
      setBrands(brandsData);
      setFilteredBrands(brandsData.slice(0, 50)); // Показываем первые 50 для производительности
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить список марок автомобилей.');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка моделей для выбранной марки
  const loadModels = async (brandId: string) => {
    try {
      setModelLoading(true);
      const modelsData = await carsApiService.getModelsByBrand(brandId);
      setModels(modelsData);
      setFilteredModels(modelsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить список моделей.');
    } finally {
      setModelLoading(false);
    }
  };

  // Поиск марок
  const searchBrands = async (query: string) => {
    setBrandSearch(query);
    if (query.length < 2) {
      setFilteredBrands(brands.slice(0, 50));
      return;
    }
    
    try {
      const searchResults = await carsApiService.searchBrands(query);
      setFilteredBrands(searchResults);
    } catch (error) {
      console.error('Ошибка поиска марок:', error);
    }
  };

  // Поиск моделей
  const searchModels = async (query: string) => {
    setModelSearch(query);
    if (!selectedBrand || query.length < 2) {
      setFilteredModels(models);
      return;
    }
    
    try {
      const searchResults = await carsApiService.searchModels(selectedBrand.id, query);
      setFilteredModels(searchResults);
    } catch (error) {
      console.error('Ошибка поиска моделей:', error);
    }
  };

  // Выбор марки
  const selectBrand = (brand: CarBrand) => {
    setSelectedBrand(brand);
    setBrand(brand.cyrillic_name || brand.name);
    setShowBrandPicker(false);
    setBrandSearch('');
    
    // Сбрасываем модель
    setSelectedModel(null);
    setModel('');
    setModels([]);
    setFilteredModels([]);
    
    // Загружаем модели для выбранной марки
    loadModels(brand.id);
  };

  // Выбор модели
  const selectModel = (model: CarModel) => {
    setSelectedModel(model);
    setModel(model.cyrillic_name || model.name);
    setShowModelPicker(false);
    setModelSearch('');
  };

  const handleSave = async () => {
    if (!vin || !plate || !brand || !model || !year) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля.');
      return;
    }
    
    // Валидация года
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректный год выпуска.');
      return;
    }
    
    setSaving(true);
    try {
      const car = {
        id: generateId(),
        vin,
        plate,
        brand,
        model,
        year,
        features,
        brandId: selectedBrand?.id,
        modelId: selectedModel?.id,
      };
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const cars = json ? JSON.parse(json) : [];
      cars.push(car);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
      router.back();
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить автомобиль.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка списка марок...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Добавить автомобиль</Text>
      
      <TextInput style={styles.input} placeholder="VIN/Frame номер" value={vin} onChangeText={setVin} />
      <TextInput style={styles.input} placeholder="Гос номер" value={plate} onChangeText={setPlate} />
      
      {/* Выбор марки */}
      <Text style={styles.label}>Марка автомобиля *</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowBrandPicker(true)}>
        <Text style={styles.pickerButtonText}>
          {selectedBrand ? (selectedBrand.cyrillic_name || selectedBrand.name) : 'Выберите марку'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      {/* Выбор модели */}
      <Text style={styles.label}>Модель автомобиля *</Text>
      <TouchableOpacity 
        style={[styles.pickerButton, !selectedBrand && styles.pickerButtonDisabled]} 
        onPress={() => selectedBrand && setShowModelPicker(true)}
        disabled={!selectedBrand}
      >
        <Text style={[styles.pickerButtonText, !selectedBrand && styles.pickerButtonTextDisabled]}>
          {selectedModel ? (selectedModel.cyrillic_name || selectedModel.name) : 
           selectedBrand ? 'Выберите модель' : 'Сначала выберите марку'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={selectedBrand ? "#666" : "#ccc"} />
      </TouchableOpacity>
      
      <TextInput style={styles.input} placeholder="Год выпуска" value={year} onChangeText={setYear} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Особенности комплектации" value={features} onChangeText={setFeatures} multiline />
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Ionicons name="checkmark-circle" size={28} color="#fff" />
        <Text style={styles.saveButtonText}>{saving ? 'Сохраняю...' : 'Сохранить'}</Text>
      </TouchableOpacity>

      {/* Модальное окно выбора марки */}
      <Modal visible={showBrandPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите марку автомобиля</Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск марки..."
              value={brandSearch}
              onChangeText={searchBrands}
            />
            
            <ScrollView style={styles.modalList}>
              {filteredBrands.map(brand => (
                <TouchableOpacity
                  key={brand.id}
                  style={styles.modalOption}
                  onPress={() => selectBrand(brand)}
                >
                  <Text style={styles.modalOptionText}>
                    {brand.cyrillic_name || brand.name}
                  </Text>
                  <Text style={styles.modalOptionSubtext}>
                    {brand.country} ({brand.year_from}-{brand.year_to})
                  </Text>
                  {selectedBrand?.id === brand.id && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowBrandPicker(false)}>
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Модальное окно выбора модели */}
      <Modal visible={showModelPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите модель</Text>
            
            {selectedBrand && (
              <Text style={styles.modalSubtitle}>
                {selectedBrand.cyrillic_name || selectedBrand.name}
              </Text>
            )}
            
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск модели..."
              value={modelSearch}
              onChangeText={searchModels}
            />
            
            {modelLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Загрузка моделей...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {filteredModels.map(model => (
                  <TouchableOpacity
                    key={model.id}
                    style={styles.modalOption}
                    onPress={() => selectModel(model)}
                  >
                    <Text style={styles.modalOptionText}>
                      {model.cyrillic_name || model.name}
                    </Text>
                    <Text style={styles.modalOptionSubtext}>
                      {model.year_from}-{model.year_to} {model.class && `• ${model.class}`}
                    </Text>
                    {selectedModel?.id === model.id && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModelPicker(false)}>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
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
  pickerButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#222',
  },
  pickerButtonTextDisabled: {
    color: '#999',
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
  // Модальные окна
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalList: {
    maxHeight: 300,
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
    flex: 1,
  },
  modalOptionSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
});
