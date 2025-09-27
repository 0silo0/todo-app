import { ref } from 'vue';
import { ExportImportService } from '@/utils/exportImport';
import { EncryptionService } from '@/utils/encryption';
import type { AppData } from '@/types/todo';
import { useTodos } from './useTodos';
import { useModal } from './useModal';

export const useExportImport = () => {
  const { appData, replaceData } = useTodos();
  const modal = useModal();
  
  const isExporting = ref(false);
  const isImporting = ref(false);

  const exportData = async (password: string): Promise<boolean> => {
    try {
      isExporting.value = true;
      
      const dataToExport: AppData = JSON.parse(JSON.stringify(appData.value));
      
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

  const importData = async (file: File, password: string): Promise<boolean> => {
    try {
      isImporting.value = true;
      
      const importedData = await ExportImportService.importData(file, password);
      
      replaceData(importedData);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка импорта';
      
      if (errorMessage.includes('Неверный пароль') || errorMessage.includes('пароль')) {
        modal.showError('Неверный пароль. Проверьте правильность введенных данных.');
      } else {
        modal.showError(`Ошибка импорта: ${errorMessage}`);
      }
      
      return false;
    } finally {
      isImporting.value = false;
    }
  };

  const generatePassword = (): string => {
    return EncryptionService.generatePassword();
  };

  const validatePassword = (password: string): boolean => {
    return EncryptionService.validatePassword(password);
  };

  return {
    isExporting,
    isImporting,
    exportData,
    importData,
    generatePassword,
    validatePassword
  };
};