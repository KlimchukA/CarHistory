// API сервис для получения данных о марках и моделях автомобилей
// Источник: https://api.cars-base.ru/full

export interface CarBrand {
  id: string;
  name: string;
  cyrillic_name: string;
  numeric_id: number;
  year_from: number;
  year_to: number;
  popular: number;
  country: string;
  updated_at: string;
  models: CarModel[];
}

export interface CarModel {
  id: string;
  mark_id: string;
  name: string;
  cyrillic_name: string;
  year_from: number;
  year_to: number;
  class: string | null;
  updated_at: string;
}

export interface CarsApiResponse {
  data: CarBrand[];
  meta: {
    total: number;
    count: number;
    pageSize: number;
    after_id: string | null;
    next_after_id: string | null;
    demoMode: boolean;
    duration_ms: number;
  };
}

class CarsApiService {
  private baseUrl = 'https://api.cars-base.ru';
  private cache: { [key: string]: any } = {};
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 часа

  // Получить все марки и модели
  async getAllCars(): Promise<CarBrand[]> {
    const cacheKey = 'all_cars';
    
    // Проверяем кэш
    if (this.cache[cacheKey] && this.isCacheValid(cacheKey)) {
      return this.cache[cacheKey];
    }

    try {
      const response = await fetch(`${this.baseUrl}/full`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CarsApiResponse = await response.json();
      
      // Сохраняем в кэш
      this.cache[cacheKey] = {
        data: data.data,
        timestamp: Date.now()
      };
      
      return data.data;
    } catch (error) {
      console.error('Ошибка при получении данных о автомобилях:', error);
      throw new Error('Не удалось загрузить список автомобилей. Проверьте подключение к интернету.');
    }
  }

  // Получить только марки (бренды)
  async getBrands(): Promise<CarBrand[]> {
    const allCars = await this.getAllCars();
    return allCars.map(brand => ({
      ...brand,
      models: [] // Убираем модели для экономии памяти
    }));
  }

  // Получить модели конкретной марки
  async getModelsByBrand(brandId: string): Promise<CarModel[]> {
    const allCars = await this.getAllCars();
    const brand = allCars.find(b => b.id === brandId);
    return brand ? brand.models : [];
  }

  // Поиск марок по названию
  async searchBrands(query: string): Promise<CarBrand[]> {
    const allBrands = await this.getBrands();
    const lowerQuery = query.toLowerCase();
    
    return allBrands.filter(brand => 
      brand.name.toLowerCase().includes(lowerQuery) ||
      brand.cyrillic_name.toLowerCase().includes(lowerQuery)
    );
  }

  // Поиск моделей по названию в рамках марки
  async searchModels(brandId: string, query: string): Promise<CarModel[]> {
    const models = await this.getModelsByBrand(brandId);
    const lowerQuery = query.toLowerCase();
    
    return models.filter(model => 
      model.name.toLowerCase().includes(lowerQuery) ||
      model.cyrillic_name.toLowerCase().includes(lowerQuery)
    );
  }

  // Проверка валидности кэша
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache[cacheKey];
    if (!cached || !cached.timestamp) {
      return false;
    }
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTimeout;
  }

  // Очистка кэша
  clearCache(): void {
    this.cache = {};
  }

  // Получить популярные марки (если есть поле popular)
  async getPopularBrands(): Promise<CarBrand[]> {
    const allBrands = await this.getBrands();
    return allBrands
      .filter(brand => brand.popular > 0)
      .sort((a, b) => b.popular - a.popular);
  }
}

export const carsApiService = new CarsApiService();

