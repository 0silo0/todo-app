<template>
  <div class="export-import-manager">
    <div class="action-buttons">
      <button
        @click="showExportModal = true"
        class="export-btn"
      >
        📤 Экспорт
      </button>
      <button
        @click="showImportModal = true"
        class="import-btn"
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
      <div class="modal-content-wrapper">
        <div class="form-group">
          <label class="form-label">
            Пароль для шифрования
          </label>
          <input
            v-model="exportPassword"
            type="password"
            placeholder="Введите пароль..."
            class="form-input"
            @keyup.enter="handleExport"
          />
          <div v-if="exportPassword && !validatePassword(exportPassword)" class="validation-error">
            Пароль слишком простой. Используйте минимум 6 символов, буквы и цифры.
          </div>
        </div>
        
        <div class="info-banner info-blue">
          <p class="info-text">
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
      <div class="modal-content-wrapper">
        <div class="form-group">
          <label class="form-label">
            Файл для импорта
          </label>
          <div class="file-input-wrapper">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept=".encrypted"
              class="file-input"
            />
            <button
              @click="selectFile"
              class="file-select-btn"
            >
              {{ selectedFile ? selectedFile.name : 'Выберите файл...' }}
            </button>
            <button
              v-if="selectedFile"
              @click="clearFile"
              class="file-clear-btn"
              title="Очистить"
            >
              ×
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            Пароль для дешифрования
          </label>
          <input
            v-model="importPassword"
            type="password"
            placeholder="Введите пароль..."
            class="form-input"
            @keyup.enter="handleImport"
          />
        </div>

        <div class="info-banner info-yellow">
          <p class="info-text">
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
      <div class="confirmation-content">
        <p class="confirmation-text">
          Вы уверены, что хотите импортировать данные?
        </p>
        <div class="warning-banner">
          <p class="warning-text">
            ⚠️ Внимание: Все текущие задачи и настройки будут полностью заменены!
          </p>
        </div>
        <p class="confirmation-note">
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

<style lang="scss" scoped>
$primary-color: #3b82f6;
$primary-color-dark: #2563eb;
$primary-color-light: #dbeafe;

$success-color: #10b981;
$success-color-dark: #0da271;
$success-color-light: #d1fae5;

$warning-color: #f59e0b;
$warning-color-dark: #d97706;
$warning-color-light: #fef3c7;

$error-color: #ef4444;
$error-color-dark: #dc2626;
$error-color-light: #fca5a5;

$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-500: #6b7280;
$gray-700: #374151;

$blue-50: #eff6ff;
$blue-700: #1d4ed8;

$yellow-50: #fefce8;
$yellow-700: #a16207;

$red-50: #fef2f2;
$red-700: #b91c1c;

$border-radius: 0.5rem;
$transition: all 0.2s ease-in-out;

.export-import-manager {
  .action-buttons {
    @apply flex space-x-3 mb-4;

    .export-btn,
    .import-btn {
      @apply text-white px-4 py-2 rounded-lg transition-colors flex items-center;
      
      padding: 0.5rem 1rem;
      border-radius: $border-radius;
      transition: $transition;
      display: flex;
      align-items: center;
      font-weight: 500;
      border: none;
      cursor: pointer;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      &:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
      }
    }

    .export-btn {
      background-color: $success-color;
      
      &:hover {
        background-color: $success-color-dark;
      }
    }

    .import-btn {
      background-color: $primary-color;
      
      &:hover {
        background-color: $primary-color-dark;
      }
    }
  }

  .modal-content-wrapper {
    @apply space-y-4;
  }

  .form-group {
    margin-bottom: 1rem;

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: $gray-700;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      border: 1px solid $gray-300;
      border-radius: $border-radius;
      padding: 0.5rem 0.75rem;
      transition: $transition;
      font-size: 0.875rem;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      &::placeholder {
        color: $gray-500;
      }
    }

    .validation-error {
      color: $error-color;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
  }

  .file-input-wrapper {
    @apply flex items-center space-x-2;

    .file-input {
      display: none;
    }

    .file-select-btn {
      background-color: $gray-100;
      color: $gray-700;
      padding: 0.5rem 1rem;
      border-radius: $border-radius;
      transition: $transition;
      flex: 1;
      text-align: left;
      border: 1px solid transparent;
      font-size: 0.875rem;
      cursor: pointer;
      
      &:hover {
        background-color: $gray-200;
        border-color: $gray-300;
      }
    }

    .file-clear-btn {
      color: $error-color;
      padding: 0.5rem;
      border-radius: 50%;
      transition: $transition;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
      
      &:hover {
        color: $red-700;
        background-color: $red-50;
      }
    }
  }

  .info-banner {
    padding: 0.75rem;
    border-radius: $border-radius;
    font-size: 0.875rem;
    
    &.info-blue {
      background-color: $blue-50;
      
      .info-text {
        color: $blue-700;
        margin: 0;
      }
    }
    
    &.info-yellow {
      background-color: $yellow-50;
      
      .info-text {
        color: $yellow-700;
        margin: 0;
      }
    }
  }

  .confirmation-content {
    @apply space-y-3;

    .confirmation-text {
      color: $gray-700;
      line-height: 1.5;
      margin: 0;
    }

    .warning-banner {
      background-color: $red-50;
      border: 1px solid $error-color-light;
      border-radius: $border-radius;
      padding: 0.75rem;
      
      .warning-text {
        color: $red-700;
        font-size: 0.875rem;
        font-weight: 500;
        margin: 0;
      }
    }

    .confirmation-note {
      font-size: 0.875rem;
      color: $gray-500;
      margin: 0;
    }
  }
}

// Адаптивность
@media (max-width: 640px) {
  .export-import-manager {
    .action-buttons {
      @apply flex-col space-x-0 space-y-2;
      
      .export-btn,
      .import-btn {
        @apply w-full justify-center;
      }
    }
    
    .file-input-wrapper {
      @apply flex-col space-x-0 space-y-2;
      
      .file-select-btn {
        @apply w-full;
      }
    }
  }
}

// Анимации
@keyframes button-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.export-btn:focus,
.import-btn:focus {
  animation: button-pulse 0.3s ease-in-out;
}

// Состояния disabled
.export-btn:disabled,
.import-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  
  &:hover {
    transform: none !important;
    box-shadow: none !important;
    background-color: inherit !important;
  }
}

.form-input:disabled,
.file-select-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: $gray-100;
}

// Плавные переходы для всех интерактивных элементов
button, input, .file-select-btn {
  transition: $transition;
}
</style>