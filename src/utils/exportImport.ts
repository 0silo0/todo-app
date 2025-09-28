import { EncryptionService } from './encryption';
import type { AppData } from '@/types/todo';

/**
 * Сервис для экспорта и импорта данных приложения
 * Обеспечивает безопасную передачу данных через шифрование
 */
export class ExportImportService {
  /**
   * Экспортирует данные в зашифрованный файл
   * @param data - Данные приложения для экспорта
   * @param password - Пароль для шифрования
   * @throws Error при невалидном пароле или ошибках экспорта
   */
  static async exportData(data: AppData, password: string): Promise<void> {
    // Валидация сложности пароля перед шифрованием
    if (!EncryptionService.validatePassword(password)) {
      throw new Error('Пароль слишком простой. Используйте минимум 6 символов, буквы и цифры.');
    }

    try {
      const encryptedData = EncryptionService.encrypt(data, password);
      
      // Создаем бинарный файл для скачивания
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      // Создаем и запускаем скрытую ссылку для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.encrypted`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Освобождаем URL для избежания утечек памяти
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Ошибка экспорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Читает файл как текст (вспомогательный метод)
   * @param file - Файл для чтения
   * @returns Содержимое файла как строка
   */
  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  /**
   * Проверяем структуру импортных данных
   * @param data - Пришедшие данные
   * @returns Булевое значение
   */
  static validateImportedData(data: AppData) {
    return data && Array.isArray(data.projects) && 
      (!data.filters || typeof data.filters === 'object');
  }

  /**
   * Импортирует данные из зашифрованного файла
   * @param file - Файл с зашифрованными данными
   * @param password - Пароль для дешифрования
   * @returns Расшифрованные данные
   * @throws Error при неверном пароле или поврежденном файле
   */
  static async importData(file: File, password: string): Promise<object> {
    try {
      const encryptedData = await this.readFileAsText(file);
      console.log('🔐 Зашифрованные данные:', encryptedData.substring(0, 100) + '...');
      
      // Дешифруем данные
      const decryptedData = EncryptionService.decrypt(encryptedData, password);
      if (!this.validateImportedData(decryptedData)) {
        throw new Error('Некорректная структура импортированных данных');
      }
      console.log('🔓 Расшифрованные данные:', typeof decryptedData, decryptedData);
      
      console.log('🔍 Проверка структуры импортированных данных:', {
        hasProjects: Array.isArray(decryptedData.projects),
        projectsCount: decryptedData.projects?.length,
        version: decryptedData.version,
        keys: Object.keys(decryptedData)
      });
      
      return decryptedData;
    } catch (error) {
      console.error('❌ Ошибка при импорте данных:', error);
      if (error instanceof Error) {
        if (error.message.includes('Неверный пароль')) {
          throw new Error('Неверный пароль');
        }
        if (error.message.includes('JSON')) {
          throw new Error('Файл поврежден или имеет неверный формат');
        }
      }
      throw new Error('Ошибка при импорте данных: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  }
}