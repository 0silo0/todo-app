export const generateId = (): string => {
    return crypto.randomUUID();
};

export const formatDate = (date: Date | string | null | undefined): string => {
  // Проверяем, является ли аргумент допустимым объектом Date
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Дата не указана'; // или вернуть пустую строку, или значение по умолчанию
  }
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Неверная дата'; // Запасной вариант на случай ошибки
  }
};

export const storage = {
    get: (key: string) => {
        try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
        } catch {
        return null;
        }
    },

    set: (key: string, value: any) => {
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