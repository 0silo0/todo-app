import { EncryptionService } from './encryption';
import type { AppData } from '@/types/todo';

export class ExportImportService {
  static async exportData(data: AppData, password: string): Promise<void> {
    if (!EncryptionService.validatePassword(password)) {
      throw new Error('Пароль слишком простой. Используйте минимум 6 символов, буквы и цифры.');
    }

    try {
      const encryptedData = EncryptionService.encrypt(data, password);
      
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.encrypted`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Ошибка экспорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  static async importData(file: File, password: string): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const encryptedData = e.target?.result as string;
          if (!encryptedData) {
            reject(new Error('Файл пустой или поврежден'));
            return;
          }

          const decryptedData = EncryptionService.decrypt(encryptedData, password);
          
          if (!this.validateDataStructure(decryptedData)) {
            reject(new Error('Неверная структура данных в файле'));
            return;
          }

          resolve(decryptedData as AppData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };

      reader.readAsText(file);
    });
  }

  private static validateDataStructure(data: any): data is AppData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.projects) &&
      typeof data.filters === 'object' &&
      Array.isArray(data.availableTags) &&
      typeof data.currentProjectId === 'string'
    );
  }

  static downloadTemplate(): void {
    const template = {
      projects: [],
      filters: {
        statuses: ['todo', 'in-progress', 'done'],
        tags: [],
        search: ''
      },
      availableTags: ['Важное', 'Работа', 'Личное'],
      currentProjectId: ''
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'todo-template.json';
    a.click();
    
    URL.revokeObjectURL(url);
  }
}