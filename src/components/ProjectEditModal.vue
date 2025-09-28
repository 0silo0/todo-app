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
    <div class="space-y-6">
      <!-- Основная информация -->
      <div class="space-y-4">
        <h3 class="font-semibold text-gray-800">Основная информация</h3>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Название проекта
          </label>
          <input
            v-model="localProject.name"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Введите название проекта"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Описание проекта
          </label>
          <textarea
            v-model="localProject.description"
            rows="3"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Описание проекта (необязательно)"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Цвет проекта
          </label>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="color in colorOptions"
              :key="color"
              @click="localProject.color = color"
              class="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110"
              :class="[localProject.color === color ? 'border-gray-800' : 'border-gray-300']"
              :style="{ backgroundColor: color }"
              :title="color"
            />
          </div>
        </div>
      </div>

      <!-- Теги проекта -->
      <div class="border-t pt-6">
        <h3 class="font-semibold text-gray-800 mb-4">🏷️ Теги проекта</h3>
        <p class="text-sm text-gray-600 mb-4">
          Используйте теги для организации и фильтрации проектов
        </p>
        
        <div class="bg-blue-50 rounded-lg p-4">
          <TagInput
            v-model="localProject.tags"
            :availableTags="allProjectTags"
          />
        </div>
      </div>

      <!-- Управление тегами задач проекта -->
      <div class="border-t pt-6">
        <h3 class="font-semibold text-gray-800 mb-4">📋 Теги задач проекта</h3>
        <p class="text-sm text-gray-600 mb-4">
          Эти теги будут доступны для использования в задачах этого проекта
        </p>
        
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm text-gray-600">
              Тегов в проекте: {{ localProject.availableTags?.length || 0 }}
            </span>
            <button
              @click="showAddTaskTag = !showAddTaskTag"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {{ showAddTaskTag ? 'Отмена' : '+ Добавить тег' }}
            </button>
          </div>

          <!-- Форма добавления тега для задач -->
          <div v-if="showAddTaskTag" class="mb-4 p-3 bg-white rounded-lg border">
            <div class="flex space-x-2">
              <input
                v-model="newTaskTagName"
                @keyup.enter="addNewTaskTag"
                placeholder="Введите название тега..."
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                maxlength="20"
              />
              <button
                @click="addNewTaskTag"
                :disabled="!newTaskTagName.trim()"
                class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Добавить
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Максимум 20 символов, нельзя использовать &lt; &gt;
            </p>
          </div>

          <!-- Список тегов задач проекта -->
          <div v-if="taskTags.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="tag in taskTags"
              :key="tag"
              class="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full transition-colors hover:bg-blue-200"
            >
              {{ tag }}
              <span class="text-xs text-blue-600 ml-1 bg-blue-200 px-1 rounded">
                {{ getTagUsageCount(tag) }}
              </span>
              <button
                @click="removeTaskTag(tag)"
                class="ml-1 text-blue-600 hover:text-blue-800 text-lg leading-none"
                :title='`Удалить тег "${tag}" из проекта`'
              >
                ×
              </button>
            </span>
          </div>
          
          <div v-else class="text-center py-4 text-gray-500 text-sm">
            В проекте пока нет тегов для задач. Добавьте первый тег!
          </div>

          <!-- Статистика использования тегов -->
          <div v-if="taskTags.length > 0" class="mt-4 pt-4 border-t">
            <h4 class="font-medium text-gray-700 mb-2 text-sm">Использование тегов в задачах:</h4>
            <div class="space-y-2">
              <div 
                v-for="tag in taskTags" 
                :key="tag + '-stats'"
                class="flex justify-between items-center text-xs"
              >
                <span class="text-gray-600">{{ tag }}</span>
                <span class="font-medium">{{ getTagUsageCount(tag) }} задач</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Статистика проекта -->
      <div class="border-t pt-6">
        <h3 class="font-semibold text-gray-800 mb-4">Статистика проекта</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Всего задач:</span>
            <span class="font-medium">{{ taskStats.all }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-yellow-600">К выполнению:</span>
            <span class="font-medium">{{ taskStats.todo }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-blue-600">В процессе:</span>
            <span class="font-medium">{{ taskStats['in-progress'] }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-green-600">Завершено:</span>
            <span class="font-medium">{{ taskStats.done }}</span>
          </div>
        </div>
        
        <!-- Дополнительная статистика по тегам проекта -->
        <div v-if="localProject.tags.length > 0" class="mt-4 pt-4 border-t">
          <h4 class="font-medium text-gray-700 mb-2 text-sm">Теги проекта:</h4>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in localProject.tags"
              :key="tag"
              class="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Опасная зона - удаление задач -->
      <div class="border-t pt-6">
        <h3 class="font-semibold text-gray-800 mb-4 text-red-600">Опасная зона</h3>
        
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 class="font-medium text-red-800 mb-3">Удаление задач</h4>
          <p class="text-sm text-red-600 mb-4">
            Выберите какие задачи хотите удалить из этого проекта
          </p>
          
          <div class="space-y-3">
            <label class="flex items-center p-3 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer">
              <input
                v-model="deleteOption"
                type="radio"
                value="all"
                class="text-red-600 focus:ring-red-500"
              />
              <span class="ml-3">
                <span class="font-medium">Удалить все задачи</span>
                <span class="text-sm text-red-600 ml-2">({{ taskStats.all }} задач)</span>
              </span>
            </label>
            
            <label class="flex items-center p-3 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer">
              <input
                v-model="deleteOption"
                type="radio"
                value="todo"
                class="text-red-600 focus:ring-red-500"
              />
              <span class="ml-3">
                <span class="font-medium">Удалить только "К выполнению"</span>
                <span class="text-sm text-red-600 ml-2">({{ taskStats.todo }} задач)</span>
              </span>
            </label>
            
            <label class="flex items-center p-3 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer">
              <input
                v-model="deleteOption"
                type="radio"
                value="in-progress"
                class="text-red-600 focus:ring-red-500"
              />
              <span class="ml-3">
                <span class="font-medium">Удалить только "В процессе"</span>
                <span class="text-sm text-red-600 ml-2">({{ taskStats['in-progress'] }} задач)</span>
              </span>
            </label>
            
            <label class="flex items-center p-3 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer">
              <input
                v-model="deleteOption"
                type="radio"
                value="done"
                class="text-red-600 focus:ring-red-500"
              />
              <span class="ml-3">
                <span class="font-medium">Удалить только "Завершено"</span>
                <span class="text-sm text-red-600 ml-2">({{ taskStats.done }} задач)</span>
              </span>
            </label>
            
            <label class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer">
              <input
                v-model="deleteOption"
                type="radio"
                value="none"
                class="text-gray-600 focus:ring-gray-500"
              />
              <span class="ml-3 text-gray-700">Не удалять задачи</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="handleClose"
        class="modal-btn modal-btn-cancel"
        :disabled="isSaving"
      >
        Отмена
      </button>
      <button
        @click="handleSave"
        :disabled="!localProject.name.trim() || isSaving"
        class="modal-btn modal-btn-confirm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <span v-if="isSaving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

<style scoped>
.modal-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  min-width: 5rem;
}

.modal-btn-cancel {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-btn-cancel:hover {
  background-color: #e5e7eb;
}

.modal-btn-confirm {
  color: white;
}
</style>