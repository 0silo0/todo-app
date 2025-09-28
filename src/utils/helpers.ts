/**
 * Генерирует уникальный ID используя Web Crypto API
 * @returns UUID v4 строку
*/
export const generateId = (): string => {
    return crypto.randomUUID();
};

/**
 * Форматирует дату в русском формате DD.MM.YYYY
 * @param date - Дата для форматирования
 * @returns Отформатированная строка даты
*/
export const formatDate = (date: Date | string | null | undefined): string => {
  const dateObj = date ? new Date(date) : null;
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Дата не указана';
  }
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Неверная дата';
  }
};

/**
 * Форматирует дату и время в расширенном формате
 * @param date - Дата для форматирования
 * @returns Полную строку даты и времени
*/
export const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return 'Неизвестно';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Обертка для работы с localStorage с обработкой ошибок
*/
export const storage = {
    /**
     * Получает данные из localStorage
     * @param key - Ключ для получения
     * @returns Распарсенные данные или null при ошибке
    */
    get: (key: string) => {
        try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
        } catch {
        return null;
        }
    },

    /**
     * Сохраняет данные в localStorage
     * @param key - Ключ для сохранения
     * @param value - Значение для сохранения
     * @returns true при успешном сохранении, false при ошибке
    */
    set: (key: string, value: object) => {
        try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
        } catch {
        return false;
        }
    }
};

// Функция для дебаунса
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: number | undefined;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

export const generateColor = (): string => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };