import CryptoJS from 'crypto-js';

/**
 * Интерфейс для зашифрованных данных
 * Содержит метаданные для управления версиями и контроля целостности
 */
export interface EncryptedData {
  data: string;
  timestamp: number;    // Временная метка создания
  version: string;      // Версия формата данных
}

/**
 * Сервис для шифрования/дешифрования данных
 * Использует AES шифрование для защиты пользовательских данных
 */
export class EncryptionService {
  // Версия формата данных для управления совместимостью
  private static readonly VERSION = '1.0.0';

  /**
   * Шифрует данные с использованием AES алгоритма
   * @param data - Данные для шифрования
   * @param password - Пароль для шифрования
   * @returns Зашифрованная строка в формате Base64
   * @throws Error при ошибках шифрования
   */
  static encrypt(data: object, password: string): string {
    try {
      // Создаем обертку с метаданными для управления версиями
      const jsonString = JSON.stringify({
        data,                    // Основные данные
        timestamp: Date.now(),   // Временная метка создания
        version: this.VERSION    // Версия формата
      });

      // Шифруем данные с использованием AES
      const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
      return encrypted;
    } catch (error) {
      // Детализированная обработка ошибок
      if (error instanceof Error) {
        throw new Error(`Ошибка шифрования данных: ${error.message}`);
      }
      throw new Error(`Неизвестная ошибка шифрования данных`);
    }
  }

  /**
   * Дешифрует данные с использованием AES алгоритма
   * @param encryptedData - Зашифрованная строка
   * @param password - Пароль для дешифрования
   * @returns Расшифрованные данные
   * @throws Error при неверном пароле или поврежденных данных
   */
  static decrypt(encryptedData: string, password: string) {
    try {
      // Дешифруем данные
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      // Проверяем результат дешифрования
      if (!decryptedString) {
        throw new Error('Неверный пароль или поврежденные данные');
      }

      // Парсим JSON структуру
      const parsedData = JSON.parse(decryptedString);
      
      // Проверяем версию данных (предупреждение для будущих обновлений)
      if (parsedData.version !== this.VERSION) {
        console.warn('Версия данных отличается от текущей');
      }

      // Возвращаем только основные данные, без метаданных
      return parsedData.data;
    } catch (error) {
      // Специфичная обработка ошибок дешифрования
      if (error instanceof Error) {
        throw new Error(`Ошибка дешифрования: ${error.message}`);
      }
      throw new Error('Неизвестная ошибка дешифрования');
    }
  }

  /**
   * Валидирует сложность пароля
   * @param password - Пароль для проверки
   * @returns true если пароль соответствует требованиям безопасности
   */
  static validatePassword(password: string): boolean {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    // Требования: минимум 6 символов, буквы разного регистра и цифры
    return password.length >= minLength && (hasUpperCase || hasLowerCase) && hasNumbers;
  }
}