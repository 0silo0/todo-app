import { ref } from 'vue';
import { ExportImportService } from '@/utils/exportImport';
import { EncryptionService } from '@/utils/encryption';
import type { AppData } from '@/types/todo';
import { useTodos } from './useTodos';
import { useModal } from './useModal';

/**
 * Композиция для управления экспортом и импортом данных приложения
 * Обеспечивает безопасную передачу данных с шифрованием
*/
export const useExportImport = () => {
  const { appData, replaceData } = useTodos();
  const modal = useModal();
  
  const isExporting = ref(false);
  const isImporting = ref(false);

  /**
   * Рекурсивно восстанавливает объекты Date из строк
   * После десериализации JSON даты становятся строками
   * @param data - Данные для восстановления дат
   * @returns Данные с восстановленными объектами Date
  */
  const restoreDates = (data: any): any => {
    if (Array.isArray(data)) {
      return data.map(item => restoreDates(item));
    }
    
    // Обработка объектов
    if (data && typeof data === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        if ((key === 'createdAt' || key === 'updatedAt') && typeof value === 'string') {
          result[key] = new Date(value);
        } else {
          result[key] = restoreDates(value);
        }
      }
      return result;
    }
    
    return data;
  };

  /**
   * Экспортирует данные приложения в зашифрованный файл
   * @param password - Пароль для шифрования
   * @returns Promise с результатом операции
  */
  const exportData = async (password: string): Promise<boolean> => {
    try {
      isExporting.value = true;
      
      // Просто копируем данные
      const dataToExport: AppData = JSON.parse(JSON.stringify(appData.value));
      console.log('📤 Данные для экспорта:', dataToExport);
      
      await ExportImportService.exportData(dataToExport, password);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка экспорта';
      modal.showError(`Ошибка экспорта: ${errorMessage}`);
      return false;
    } finally {
      isExporting.value = false;
    }
  };

  /**
   * Импортирует данные из зашифрованного файла
   * @param file - Файл с зашифрованными данными
   * @param password - Пароль для дешифрования
   * @returns Promise с результатом операции
  */
  const importData = async (file: File, password: string): Promise<boolean> => {
    try {
      isImporting.value = true;
      console.log('🚀 Начало импорта...');

      // Дешифруем данные из файла
      const importedData = await ExportImportService.importData(file, password);
      console.log('📦 Данные импортированы (сырые):', importedData);

      // Восстанавливаем даты
      const dataWithRestoredDates = restoreDates(importedData);
      console.log('📦 Данные с восстановленными датами:', dataWithRestoredDates);

      replaceData(dataWithRestoredDates);
      console.log('✅ Данные заменены в хранилище');
      
      return true;
    } catch (error) {
      console.error('💥 Ошибка импорта:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка импорта';
      
      if (errorMessage.includes('Неверный пароль') || errorMessage.includes('пароль')) {
        modal.showError('Неверный пароль. Проверьте правильность введенных данных.');
      } else if (errorMessage.includes('структур') || errorMessage.includes('формат')) {
        modal.showError('Файл имеет неверную структуру. Возможно, он поврежден или создан в другой версии приложения.');
      } else {
        modal.showError(`Ошибка импорта: ${errorMessage}`);
      }
      
      return false;
    } finally {
      isImporting.value = false;
    }
  };

  const validatePassword = (password: string): boolean => {
    return EncryptionService.validatePassword(password);
  };

  return {
    isExporting,
    isImporting,
    exportData,
    importData,
    validatePassword
  };
};