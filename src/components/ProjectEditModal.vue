<template>
  <AppModal
    :show="show"
    @update:show="$emit('update:show', $event)"
    title="Редактирование проекта"
    icon="✏️"
    size="lg"
    :persistent="true"
    :showFooter="false"
    :showConfirm="false"
    :showCancel="false"
  >
    <div class="edit-project-content">
      <!-- Основная информация -->
      <div class="section">
        <h3 class="section-title">Основная информация</h3>
        
        <div class="form-group">
          <label class="form-label">
            Название проекта
          </label>
          <input
            v-model="localProject.name"
            type="text"
            class="form-input"
            placeholder="Введите название проекта"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">
            Описание проекта
          </label>
          <textarea
            v-model="localProject.description"
            rows="3"
            class="form-input"
            placeholder="Описание проекта (необязательно)"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">
            Цвет проекта
          </label>
          <div class="color-picker">
            <button
              v-for="color in colorOptions"
              :key="color"
              @click="localProject.color = color"
              class="color-option"
              :class="{ 'color-option--selected': localProject.color === color }"
              :style="{ backgroundColor: color }"
              :title="color"
            />
          </div>
        </div>
      </div>

      <!-- Теги проекта -->
      <div class="section">
        <h3 class="section-title">🏷️ Теги проекта</h3>
        <p class="section-description">
          Используйте теги для организации и фильтрации проектов
        </p>
        
        <div class="tag-input-container">
          <TagInput
            v-model="localProject.tags"
            :availableTags="allProjectTags"
          />
        </div>
      </div>

      <!-- Управление тегами задач проекта -->
      <div class="section">
        <h3 class="section-title">📋 Теги задач проекта</h3>
        <p class="section-description">
          Эти теги будут доступны для использования в задачах этого проекта
        </p>
        
        <div class="task-tags-container">
          <div class="task-tags-header">
            <span class="task-tags-count">
              Тегов в проекте: {{ localProject.availableTags?.length || 0 }}
            </span>
            <button
              @click="showAddTaskTag = !showAddTaskTag"
              class="add-tag-btn"
            >
              {{ showAddTaskTag ? 'Отмена' : '+ Добавить тег' }}
            </button>
          </div>

          <!-- Форма добавления тега для задач -->
          <div v-if="showAddTaskTag" class="add-tag-form">
            <div class="add-tag-input-group">
              <input
                v-model="newTaskTagName"
                @keyup.enter="addNewTaskTag"
                placeholder="Введите название тега..."
                class="add-tag-input"
                maxlength="20"
              />
              <button
                @click="addNewTaskTag"
                :disabled="!newTaskTagName.trim()"
                class="add-tag-submit"
              >
                Добавить
              </button>
            </div>
            <p class="add-tag-hint">
              Максимум 20 символов, нельзя использовать &lt; &gt;
            </p>
          </div>

          <!-- Список тегов задач проекта -->
          <div v-if="taskTags.length > 0" class="task-tags-list">
            <span
              v-for="tag in taskTags"
              :key="tag"
              class="task-tag"
            >
              {{ tag }}
              <span class="task-tag-count">
                {{ getTagUsageCount(tag) }}
              </span>
              <button
                @click="removeTaskTag(tag)"
                class="task-tag-remove"
                :title='`Удалить тег "${tag}" из проекта`'
              >
                ×
              </button>
            </span>
          </div>
          
          <div v-else class="empty-tags">
            В проекте пока нет тегов для задач. Добавьте первый тег!
          </div>

          <!-- Статистика использования тегов -->
          <div v-if="taskTags.length > 0" class="tag-stats">
            <h4 class="tag-stats-title">Использование тегов в задачах:</h4>
            <div class="tag-stats-list">
              <div 
                v-for="tag in taskTags" 
                :key="tag + '-stats'"
                class="tag-stat-item"
              >
                <span class="tag-stat-name">{{ tag }}</span>
                <span class="tag-stat-count">{{ getTagUsageCount(tag) }} задач</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Статистика проекта -->
      <div class="section">
        <h3 class="section-title">Статистика проекта</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Всего задач:</span>
            <span class="stat-value">{{ taskStats.all }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label stat-label--todo">К выполнению:</span>
            <span class="stat-value">{{ taskStats.todo }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label stat-label--in-progress">В процессе:</span>
            <span class="stat-value">{{ taskStats['in-progress'] }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label stat-label--done">Завершено:</span>
            <span class="stat-value">{{ taskStats.done }}</span>
          </div>
        </div>
        
        <!-- Дополнительная статистика по тегам проекта -->
        <div v-if="localProject.tags.length > 0" class="project-tags">
          <h4 class="project-tags-title">Теги проекта:</h4>
          <div class="project-tags-list">
            <span
              v-for="tag in localProject.tags"
              :key="tag"
              class="project-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Опасная зона - удаление задач -->
      <div class="section">
        <h3 class="danger-zone-title">Опасная зона</h3>
        
        <div class="danger-zone">
          <h4 class="danger-zone-subtitle">Удаление задач</h4>
          <p class="danger-zone-description">
            Выберите какие задачи хотите удалить из этого проекта
          </p>
          
          <div class="delete-options">
            <label class="delete-option">
              <input
                v-model="deleteOption"
                type="radio"
                value="all"
                class="delete-option-input"
              />
              <span class="delete-option-label">
                <span class="delete-option-text">Удалить все задачи</span>
                <span class="delete-option-count">({{ taskStats.all }} задач)</span>
              </span>
            </label>
            
            <label class="delete-option">
              <input
                v-model="deleteOption"
                type="radio"
                value="todo"
                class="delete-option-input"
              />
              <span class="delete-option-label">
                <span class="delete-option-text">Удалить только "К выполнению"</span>
                <span class="delete-option-count">({{ taskStats.todo }} задач)</span>
              </span>
            </label>
            
            <label class="delete-option">
              <input
                v-model="deleteOption"
                type="radio"
                value="in-progress"
                class="delete-option-input"
              />
              <span class="delete-option-label">
                <span class="delete-option-text">Удалить только "В процессе"</span>
                <span class="delete-option-count">({{ taskStats['in-progress'] }} задач)</span>
              </span>
            </label>
            
            <label class="delete-option">
              <input
                v-model="deleteOption"
                type="radio"
                value="done"
                class="delete-option-input"
              />
              <span class="delete-option-label">
                <span class="delete-option-text">Удалить только "Завершено"</span>
                <span class="delete-option-count">({{ taskStats.done }} задач)</span>
              </span>
            </label>
            
            <label class="delete-option">
              <input
                v-model="deleteOption"
                type="radio"
                value="none"
                class="delete-option-input"
              />
              <span class="delete-option-label delete-option-label--safe">
                Не удалять задачи
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="handleClose"
        class="modal-btn modal-btn--cancel"
        :disabled="isSaving"
      >
        Отмена
      </button>
      <button
        @click="handleSave"
        :disabled="!localProject.name.trim() || isSaving"
        class="modal-btn modal-btn--save"
      >
        <span v-if="isSaving" class="save-button-loading">
          <svg class="save-button-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="save-button-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="save-button-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Сохранение...
        </span>
        <span v-else>Сохранить изменения</span>
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import AppModal from '@/components/AppModal.vue';
import TagInput from '@/components/TagInput.vue';
import { useTodos } from '@/composables/useTodos';
import { useModal } from '@/composables/useModal';
import type { Project, Task } from '@/types/todo';

interface Props {
  show: boolean;
  project: Project;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
  currentProject,
  updateProject, 
  deleteTasksByFilter, 
  getTaskStatsForDeletion,
  addTagToProject,
  removeTagFromProject,
  allProjectTags
} = useTodos();

const modal = useModal();

const localProject = ref<Project>({ ...props.project });
const deleteOption = ref<'none' | 'all' | 'todo' | 'in-progress' | 'done'>('none');
const isSaving = ref(false);
const showAddTaskTag = ref(false);
const newTaskTagName = ref('');

const colorOptions = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#f43f5e', '#0ea5e9', '#d946ef'
];

const taskStats = computed(() => getTaskStatsForDeletion(props.project.id));

// Теги для задач проекта
const taskTags = computed(() => {
  return currentProject.value?.availableTags || [];
});

// Подсчет использования тега в задачах проекта
const getTagUsageCount = (tag: string): number => {
  let count = 0;
  
  const countTagInTasks = (tasks: Task[]) => {
    tasks.forEach(task => {
      if (task.tags?.includes(tag)) {
        count++;
      }
      if (task.subtasks?.length > 0) {
        countTagInTasks(task.subtasks);
      }
    });
  };
  
  if (currentProject.value?.tasks) {
    countTagInTasks(currentProject.value.tasks);
  }
  
  return count;
};

// Валидация тега для задач
const validateTag = (tag: string): boolean => {
  const maxLength = 20;
  const forbiddenChars = /[<>]/;
  return tag.length > 0 && tag.length <= maxLength && !forbiddenChars.test(tag);
};

// Добавление нового тега для задач проекта
const addNewTaskTag = async () => {
  const tag = newTaskTagName.value.trim();
  
  if (!validateTag(tag)) {
    modal.showError('Тег не прошел валидацию. Длина должна быть от 1 до 20 символов и не содержать < >');
    return;
  }
  
  if (localProject.value.availableTags?.includes(tag)) {
    modal.showError('Этот тег уже есть в проекте');
    return;
  }
  
  // Добавляем тег в проект для задач
  addTagToProject(currentProject.value.id, tag);
  newTaskTagName.value = '';
  showAddTaskTag.value = false;
  
  modal.showSuccess(`Тег "${tag}" добавлен в проект для задач`);
};

// Удаление тега из задач проекта
const removeTaskTag = async (tag: string) => {
  removeTagFromProject(localProject.value.id, tag);
};

watch(() => props.project, (newProject) => {
  localProject.value = { ...newProject };
}, { immediate: true });

watch(() => currentProject.value, (newCurrentProject) => {
  if (newCurrentProject && newCurrentProject.id === localProject.value.id) {
    // Обновляем localProject при изменении currentProject
    localProject.value = { ...newCurrentProject };
  }
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    localProject.value = { ...props.project };
    deleteOption.value = 'none';
    isSaving.value = false;
    showAddTaskTag.value = false;
    newTaskTagName.value = '';
  }
});

const handleClose = () => {
  if (!isSaving.value) {
    emit('update:show', false);
  }
};

const handleSave = async () => {
  if (!localProject.value.name.trim() || isSaving.value) return;

  isSaving.value = true;

  try {
    // Сохраняем изменения проекта, включая теги проекта
    updateProject(props.project.id, {
      name: localProject.value.name.trim(),
      description: localProject.value.description,
      color: localProject.value.color,
      tags: localProject.value.tags
    });

    if (deleteOption.value !== 'none') {
      deleteTasksByFilter(props.project.id, deleteOption.value);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    
    emit('saved');
    emit('update:show', false);
  } catch (error) {
    console.error('Ошибка при сохранении проекта:', error);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
$primary-color: #3b82f6;
$primary-color-dark: #2563eb;
$success-color: #10b981;
$warning-color: #f59e0b;
$error-color: #ef4444;
$error-color-light: #fca5a5;

$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;

$blue-50: #eff6ff;
$blue-100: #dbeafe;
$blue-200: #90CAF9;
$blue-500: #3b82f6;
$blue-600: #2563eb;
$blue-800: #4F46E5;

$red-50: #fef2f2;
$red-100: #fee2e2;
$red-600: #dc2626;
$red-700: #b91c1c;

$yellow-50: #fefce8;
$yellow-100: #fef3c7;

$green-100: #d1fae5;
$green-800: #065f46;

$border-radius: 0.5rem;
$transition: all 0.2s ease-in-out;

.edit-project-content {
  @apply space-y-6;
}

.section {
  @apply space-y-4;

  & + & {
    @apply border-t pt-6;
  }

  .section-title {
    font-weight: 600;
    color: $gray-800;
    font-size: 1rem;
    margin: 0;
  }

  .section-description {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0 0 1rem 0;
  }
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
}

.color-picker {
  @apply flex flex-wrap gap-3;

  .color-option {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 2px solid $gray-300;
    transition: $transition;
    cursor: pointer;
    
    &:hover {
      transform: scale(1.1);
    }
    
    &--selected {
      border-color: $gray-800;
      transform: scale(1.1);
    }
  }
}

.tag-input-container {
  background-color: $blue-50;
  border-radius: $border-radius;
  padding: 1rem;
}

.task-tags-container {
  background-color: $gray-50;
  border-radius: $border-radius;
  padding: 1rem;

  .task-tags-header {
    @apply flex justify-between items-center mb-3;

    .task-tags-count {
      font-size: 0.875rem;
      color: $gray-600;
    }

    .add-tag-btn {
      color: $blue-600;
      font-size: 0.875rem;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;
      
      &:hover {
        color: $blue-800;
      }
    }
  }

  .add-tag-form {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background-color: white;
    border-radius: $border-radius;
    border: 1px solid $gray-200;

    .add-tag-input-group {
      @apply flex space-x-2;

      .add-tag-input {
        flex: 1;
        border: 1px solid $gray-300;
        border-radius: $border-radius;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        
        &:focus {
          outline: none;
          border-color: $primary-color;
        }
      }

      .add-tag-submit {
        background-color: $primary-color;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: $border-radius;
        font-size: 0.875rem;
        border: none;
        cursor: pointer;
        transition: $transition;
        
        &:hover:not(:disabled) {
          background-color: $primary-color-dark;
        }
        
        &:disabled {
          background-color: $gray-400;
          cursor: not-allowed;
        }
      }
    }

    .add-tag-hint {
      font-size: 0.75rem;
      color: $gray-500;
      margin: 0.25rem 0 0 0;
    }
  }

  .task-tags-list {
    @apply flex flex-wrap gap-2;

    .task-tag {
      @apply inline-flex items-center;
      background-color: $blue-100;
      color: $blue-600;
      font-size: 0.875rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      transition: $transition;
      cursor: pointer;
      
      &:hover {
        background-color: $blue-200;
      }

      .task-tag-count {
        font-size: 0.75rem;
        color: $blue-600;
        margin-left: 0.25rem;
        background-color: $blue-200;
        padding: 0 0.25rem;
        border-radius: 0.25rem;
      }

      .task-tag-remove {
        color: $blue-600;
        margin-left: 0.25rem;
        font-size: 1.125rem;
        line-height: 1;
        background: none;
        border: none;
        cursor: pointer;
        
        &:hover {
          color: $blue-800;
        }
      }
    }
  }

  .empty-tags {
    @apply text-center py-4;
    color: $gray-500;
    font-size: 0.875rem;
  }

  .tag-stats {
    @apply mt-4 pt-4 border-t;

    .tag-stats-title {
      font-weight: 500;
      color: $gray-700;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .tag-stats-list {
      @apply space-y-2;

      .tag-stat-item {
        @apply flex justify-between items-center;
        font-size: 0.75rem;

        .tag-stat-name {
          color: $gray-600;
        }

        .tag-stat-count {
          font-weight: 500;
        }
      }
    }
  }
}

.stats-grid {
  @apply grid grid-cols-2 gap-4;
  font-size: 0.875rem;

  .stat-item {
    @apply flex justify-between items-center;

    .stat-label {
      color: $gray-600;
      
      &--todo {
        color: #d97706;
      }
      
      &--in-progress {
        color: $blue-600;
      }
      
      &--done {
        color: $success-color;
      }
    }

    .stat-value {
      font-weight: 500;
    }
  }
}

.project-tags {
  @apply mt-4 pt-4 border-t;

  .project-tags-title {
    font-weight: 500;
    color: $gray-700;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .project-tags-list {
    @apply flex flex-wrap gap-2;

    .project-tag {
      @apply inline-flex items-center;
      background-color: $green-100;
      color: $green-800;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
    }
  }
}

.danger-zone-title {
  font-weight: 600;
  color: $error-color;
  font-size: 1rem;
  margin: 0 0 1rem 0;
}

.danger-zone {
  background-color: $red-50;
  border: 1px solid $error-color-light;
  border-radius: $border-radius;
  padding: 1rem;

  .danger-zone-subtitle {
    font-weight: 500;
    color: $red-700;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }

  .danger-zone-description {
    font-size: 0.875rem;
    color: $red-600;
    margin-bottom: 1rem;
  }

  .delete-options {
    @apply space-y-3;

    .delete-option {
      @apply flex items-center p-3 rounded-lg border cursor-pointer;
      border-color: $error-color-light;
      transition: $transition;
      
      &:hover {
        background-color: $red-100;
      }

      .delete-option-input {
        color: $error-color;
        
        &:focus {
          --tw-ring-color: rgba(239, 68, 68, 0.5);
        }
      }

      .delete-option-label {
        @apply ml-3;
        
        .delete-option-text {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .delete-option-count {
          font-size: 0.75rem;
          color: $error-color;
          margin-left: 0.5rem;
        }

        &--safe {
          color: $gray-700;
          font-size: 0.875rem;
        }
      }
    }
  }
}

// Кнопки модалки
.modal-btn {
  padding: 0.5rem 1rem;
  border-radius: $border-radius;
  font-weight: 500;
  transition: $transition;
  border: none;
  cursor: pointer;
  min-width: 5rem;
  font-size: 0.875rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--cancel {
    background-color: $gray-100;
    color: $gray-700;
    
    &:hover:not(:disabled) {
      background-color: $gray-200;
    }
  }

  &--save {
    background-color: $primary-color;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: $primary-color-dark;
    }
    
    &:disabled {
      background-color: $gray-400;
    }
  }
}

.save-button-loading {
  @apply flex items-center;
}

.save-button-spinner {
  animation: spin 1s linear infinite;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;

  .save-button-spinner-circle {
    opacity: 0.25;
  }

  .save-button-spinner-path {
    opacity: 0.75;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Адаптивность
@media (max-width: 640px) {
  .stats-grid {
    @apply grid-cols-1;
  }
  
  .task-tags-header {
    @apply flex-col items-start space-y-2;
  }
  
  .add-tag-input-group {
    @apply flex-col space-x-0 space-y-2;
    
    .add-tag-submit {
      @apply w-full;
    }
  }
}
</style>