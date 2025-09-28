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
    </div>

    <!-- Локальная модалка экспорта -->
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

    <!-- Локальная модалка импорта -->
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

    <!-- Модалка подтверждения -->
    <AppModal
      v-model:show="showConfirmImportModal"
      title="⚠️ Подтверждение импорта"
      type="warning"
      size="md"
      :show-cancel="true"
      :show-confirm="true"
      confirm-text="Да, импортировать"
      cancel-text="Отмена"
      :loading="isImporting"
      @confirm="confirmImport"
      @cancel="cancelImport"
    >
      <div class="space-y-3">
        <p class="text-gray-700">
          Вы уверены, что хотите импортировать данные?
        </p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-700 text-sm font-medium">
            ⚠️ Внимание: Все текущие задачи и настройки будут полностью заменены!
          </p>
        </div>
        <p class="text-sm text-gray-600">
          Это действие нельзя отменить.
        </p>
      </div>
    </AppModal>

    <AppModal
      :show="modal.modalState.value.show"
      :title="modal.modalState.value.title"
      :message="modal.modalState.value.message"
      :type="modal.modalState.value.type"
      :confirm-text="modal.modalState.value.confirmText"
      :cancel-text="modal.modalState.value.cancelText"
      @confirm="modal.confirm"
      @cancel="modal.cancel"
      @close="modal.close"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useExportImport } from '@/composables/useExportImport';
import { useModal } from '@/composables/useModal';
import AppModal from './AppModal.vue';

/**
 * КОМПОНЕНТ УПРАВЛЕНИЯ ЭКСПОРТОМ И ИМПОРТОМ ДАННЫХ
 * 
 * Особенности:
 * - Двухэтапный процесс импорта с подтверждением
 * - Валидация паролей в реальном времени
 * - Защита от потери данных при импорте
 * - Детальное логирование для отладки
*/

const {
  isExporting,
  isImporting,
  exportData,
  importData,
  validatePassword,
} = useExportImport();

const modal = useModal();

const showExportModal = ref(false);
const showImportModal = ref(false);
const showConfirmImportModal = ref(false);

// Данные форм
const exportPassword = ref('');
const importPassword = ref('');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement>();

// Временное хранение данных для импорта (между модалками)
const pendingImportData = ref<{
  file: File | null;
  password: string;
}>({
  file: null,
  password: ''
});

/**
 * Обрабатывает экспорт данных с валидацией пароля
*/
const handleExport = async () => {
  if (!exportPassword.value || !validatePassword(exportPassword.value)) {
    modal.showError('Пожалуйста, введите надежный пароль');
    return;
  }

  try {
    const success = await exportData(exportPassword.value);
    if (success) {
      modal.showSuccess('Данные успешно экспортированы! Файл скачан автоматически.');
      closeExportModal();
    }
  } catch (error) {
    console.error('Export error:', error);
  }
};

/**
 * Начало процесса импорта - валидация и переход к подтверждению
*/
const handleImport = async () => {
  if (!selectedFile.value) {
    modal.showError('Пожалуйста, выберите файл для импорта');
    return;
  }

  if (!importPassword.value) {
    modal.showError('Пожалуйста, введите пароль для дешифрования');
    return;
  }

  // Сохраняем данные для следующего шага
  pendingImportData.value = {
    file: selectedFile.value,
    password: importPassword.value
  };
  
  showConfirmImportModal.value = true;
};

/**
 * Финальное подтверждение и выполнение импорта
*/
const confirmImport = async () => {
  try {
    if (!pendingImportData.value.file || !pendingImportData.value.password) {
      throw new Error('Данные для импорта не найдены');
    }

    const success = await importData(
      pendingImportData.value.file, 
      pendingImportData.value.password
    );
    
    console.log('🎯 Результат импорта:', success);
    
    if (success) {
      showConfirmImportModal.value = false;
      closeImportModal();
      modal.showSuccess('Данные успешно импортированы!');
    } else {
      modal.showError('Ошибка при импорте данных. Проверьте файл и пароль.');
    }
  } catch (error) {
    console.error('💥 Ошибка при импорте:', error);
    showConfirmImportModal.value = false;
    closeImportModal();
  }
};

const cancelImport = () => {
  showConfirmImportModal.value = false;
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

const closeExportModal = () => {
  showExportModal.value = false;
  exportPassword.value = '';
};

const closeImportModal = () => {
  showImportModal.value = false;
  showConfirmImportModal.value = false;
  importPassword.value = '';
  clearFile();
  pendingImportData.value = { file: null, password: '' };
};
</script>