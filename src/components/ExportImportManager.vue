<template>
    <div class="export-import-manager">
      <div class="flex space-x-3 mb-4">
        <button
          @click="showExportModal = true"
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          📤 Экспорт
        </button>
        <button
          @click="showImportModal = true"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          📥 Импорт
        </button>
        <button
          @click="downloadTemplate"
          class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          title="Скачать шаблон для импорта"
        >
          📋 Шаблон
        </button>
      </div>
  
      <AppModal
        v-model:show="showExportModal"
        title="📤 Экспорт данных"
        type="info"
        size="md"
        :show-cancel="true"
        :show-confirm="true"
        confirm-text="Экспортировать"
        cancel-text="Отмена"
        :loading="isExporting"
        loading-text="Экспорт..."
        @confirm="handleExport"
        @cancel="closeExportModal"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Пароль для шифрования
              <button
                @click="generateNewPassword"
                class="ml-2 text-xs text-blue-600 hover:text-blue-800"
                type="button"
              >
                Сгенерировать
              </button>
            </label>
            <input
              v-model="exportPassword"
              type="password"
              placeholder="Введите пароль..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              @keyup.enter="handleExport"
            />
            <div v-if="exportPassword && !validatePassword(exportPassword)" class="text-red-500 text-xs mt-1">
              Пароль слишком простой. Используйте минимум 6 символов, буквы и цифры.
            </div>
          </div>
          
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-sm text-blue-700">
              💡 Сохраните пароль в надежном месте! Без него невозможно восстановить данные.
            </p>
          </div>
        </div>
      </AppModal>
  
      <AppModal
        v-model:show="showImportModal"
        title="📥 Импорт данных"
        type="warning"
        size="md"
        :show-cancel="true"
        :show-confirm="true"
        confirm-text="Импортировать"
        cancel-text="Отмена"
        :loading="isImporting"
        loading-text="Импорт..."
        @confirm="handleImport"
        @cancel="closeImportModal"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Файл для импорта
            </label>
            <div class="flex items-center space-x-2">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept=".encrypted"
                class="hidden"
              />
              <button
                @click="selectFile"
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex-1 text-left"
              >
                {{ selectedFile ? selectedFile.name : 'Выберите файл...' }}
              </button>
              <button
                v-if="selectedFile"
                @click="clearFile"
                class="text-red-500 hover:text-red-700 p-2"
                title="Очистить"
              >
                ×
              </button>
            </div>
          </div>
  
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Пароль для дешифрования
            </label>
            <input
              v-model="importPassword"
              type="password"
              placeholder="Введите пароль..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              @keyup.enter="handleImport"
            />
          </div>
  
          <div class="bg-yellow-50 p-3 rounded-lg">
            <p class="text-sm text-yellow-700">
              ⚠️ Внимание: Импорт данных полностью заменит текущие задачи и настройки!
            </p>
          </div>
        </div>
      </AppModal>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { useExportImport } from '@/composables/useExportImport';
  import { useModal } from '@/composables/useModal';
  import { ExportImportService } from '@/utils/exportImport';
  import AppModal from './AppModal.vue';
  
  const {
    isExporting,
    isImporting,
    exportData,
    importData,
    generatePassword: generatePasswordFn,
    validatePassword,
  } = useExportImport();
  
  const modal = useModal();
  
  const showExportModal = ref(false);
  const showImportModal = ref(false);
  const exportPassword = ref('');
  const importPassword = ref('');
  const selectedFile = ref<File | null>(null);
  const fileInput = ref<HTMLInputElement>();
  
  const handleExport = async () => {
    if (!exportPassword.value || !validatePassword(exportPassword.value)) {
      modal.showError('Пожалуйста, введите надежный пароль');
      return;
    }
  
    try {
      await exportData(exportPassword.value);
      modal.showSuccess('Данные успешно экспортированы! Файл скачан автоматически.');
      closeExportModal();
    } catch (error) {
      console.error('Export error:', error);
    }
  };
  
  const handleImport = async () => {
    if (!selectedFile.value) {
      modal.showError('Пожалуйста, выберите файл для импорта');
      return;
    }
  
    if (!importPassword.value) {
      modal.showError('Пожалуйста, введите пароль для дешифрования');
      return;
    }
  
    const confirmed = await modal.confirmAction(
      'Вы уверены, что хотите импортировать данные? Все текущие задачи и настройки будут заменены.',
      'Подтверждение импорта'
    );
  
    if (!confirmed) return;
  
    try {
      const success = await importData(selectedFile.value, importPassword.value);
      if (success) {
        modal.showSuccess('Данные успешно импортированы!');
        closeImportModal();
      }
    } catch (error) {
      console.error('Import error:', error);
    }
  };
  
  const selectFile = () => {
    fileInput.value?.click();
  };
  
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      selectedFile.value = target.files[0];
    }
  };
  
  const clearFile = () => {
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  };
  
  const generateNewPassword = () => {
    const newPassword = generatePasswordFn();
    exportPassword.value = newPassword;
  };
  
  const downloadTemplate = () => {
    ExportImportService.downloadTemplate();
    modal.showInfo('Шаблон для импорта скачан. Вы можете заполнить его и зашифровать для импорта.');
  };
  
  const closeExportModal = () => {
    showExportModal.value = false;
    exportPassword.value = '';
  };
  
  const closeImportModal = () => {
    showImportModal.value = false;
    importPassword.value = '';
    clearFile();
  };
  </script>
  
  <style scoped>
  .export-import-manager {
    position: relative;
  }
  </style>