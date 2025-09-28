<template>
  <div class="task-item group" :class="{'ml-8': depth > 0}">
    <div class="bg-white rounded-lg border p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200">
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3 flex-1 min-w-0">
          <div class="relative">
            <select 
                :value="task.status"
                @change="updateStatus($event)"
                :disabled="isStatusDisabled"
                class="text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                :class="[statusTextClasses[task.status], isStatusDisabled ? 'opacity-70' : '']"
                :title="statusDisabledTitle"
            >
                <option value="todo">📝 К выполнению</option>
                <option value="in-progress">🔄 В процессе</option>
                <option value="done">✅ Завершено</option>
            </select>
            
            <div v-if="isStatusDisabled && task.status !== 'done'" 
                 class="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center cursor-help"
                 :title="statusDisabledTitle">
              <span class="text-xs text-white">!</span>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <input
                v-if="isEditing"
                v-model="editedTitle"
                @blur="saveEdit"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
                class="flex-1 border-b-2 border-blue-500 outline-none px-1 bg-transparent text-lg font-medium"
                type="text"
                ref="titleInput"
              >
              <h3
                v-else
                @dblclick="startEdit"
                class="text-lg font-medium cursor-text px-1 rounded hover:bg-gray-50 transition-colors"
                :class="titleClasses"
              >
                {{ task.title }}
                <span v-if="hasIncompleteSubtasks && task.status === 'done'" 
                      class="ml-2 text-yellow-500 text-sm" 
                      title="Есть незавершенные подзадачи">
                  ⚠️
                </span>
              </h3>
            </div>

            <div v-if="hasSubtasks" class="mt-1">
              <div class="flex items-center space-x-2 text-xs">
                <span class="text-gray-500">Подзадачи:</span>
                <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div class="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                       :style="{ width: subtaskProgress + '%' }"></div>
                </div>
                <span class="text-gray-600 font-medium">{{ completedSubtasks }}/{{ totalSubtasks }}</span>
                <span class="text-gray-500">({{ Math.round(subtaskProgress) }}%)</span>
              </div>
            </div>

            <div class="mt-2">
              <TagInput
                :modelValue="task.tags"
                :availableTags="availableTags"
                @addTag="handleAddTag"
                @update:modelValue="updateTags"
              />
            </div>

            <div class="flex space-x-4 mt-2 text-xs text-gray-500">
              <span>Создано: {{ formatDate(task.createdAt) }}</span>
              <span v-if="task.updatedAt !== task.createdAt">
                Обновлено: {{ formatDate(task.updatedAt) }}
              </span>
              <span v-if="depth > 0" class="text-blue-600">
                Уровень: {{ depth + 1 }}/3
              </span>
            </div>
          </div>
        </div>

        <div class="flex space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            v-if="canAddSubtask"
            @click="addSubtask"
            class="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
            :title="subtaskButtonTitle"
          >
            ➕
          </button>
          <button 
            v-else
            class="text-gray-400 p-2 rounded-lg cursor-not-allowed"
            title="Достигнут максимальный уровень вложенности"
          >
            ➕
          </button>
          
          <button 
            @click="$emit('delete', task.id)"
            class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>

      <div v-if="hasSubtasks" class="mt-3 pt-3 border-t border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <button
            @click="showSubtasks = !showSubtasks"
            class="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>{{ showSubtasks ? '▼' : '▶' }}</span>
            <span>Подзадачи ({{ task.subtasks.length }})</span>
          </button>

          <button 
            v-if="hasIncompleteSubtasks && task.status !== 'done'"
            @click="completeAllSubtasks"
            class="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
            title="Завершить все подзадачи"
          >
            ✅ Завершить все
          </button>
        </div>

        <div v-if="showSubtasks" class="subtasks-space">
          <TaskItem
            v-for="subtask in task.subtasks"
            :key="subtask.id"
            :task="subtask"
            :availableTags="availableTags"
            :depth="depth + 1"
            @update="handleSubtaskUpdate"
            @delete="handleSubtaskDelete"
            @addSubtask="handleSubtaskAddSubtask"
            @addTag="handleAddTag"
            @status-changed="handleSubtaskStatusChange"
          />
        </div>
      </div>

      <div v-if="addingSubtask" class="mt-3 pt-3 border-t border-gray-100">
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-sm text-gray-600">
              {{ depth + 1 }}/3 уровень вложенности
            </span>
            <span v-if="!canAddSubtask" class="text-red-500 text-sm">
              ❌ Достигнут максимум
            </span>
          </div>
          
          <div class="flex space-x-2">
            <input
              v-model="newSubtaskTitle"
              @keyup.enter="confirmAddSubtask"
              @keyup.escape="cancelAddSubtask"
              placeholder="Введите подзадачу..."
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              :disabled="!canAddSubtask"
              ref="subtaskInput"
            >
            <button
              @click="confirmAddSubtask"
              :disabled="!newSubtaskTitle.trim() || !canAddSubtask"
              class="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              :title="!canAddSubtask ? 'Достигнут максимальный уровень вложенности' : 'Добавить подзадачу'"
            >
              Добавить
            </button>
            <button
              @click="cancelAddSubtask"
              class="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-400 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import type { Task, TaskStatus } from '@/types/todo';
import { formatDate } from '@/utils/helpers';
import TagInput from './TagInput.vue';
import { useTodos } from '@/composables/useTodos';

interface Props {
  task: Task;
  availableTags: string[];
  depth?: number;
}

interface Emits {
  (e: 'update', taskId: string, updates: Partial<Task>): void;
  (e: 'delete', taskId: string): void;
  (e: 'addSubtask', parentId: string, title: string, tags: string[]): void;
  (e: 'addTag', tag: string): void;
  (e: 'status-changed', taskId: string, newStatus: TaskStatus): void;
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
});
const emit = defineEmits<Emits>();

const { addTag } = useTodos();

const isEditing = ref(false);
const editedTitle = ref('');
const titleInput = ref<HTMLInputElement>();
const showSubtasks = ref(true);
const addingSubtask = ref(false);
const newSubtaskTitle = ref('');
const subtaskInput = ref<HTMLInputElement>();
const isStatusAutoUpdated = ref(false);
const wasReopened = ref(false);

const MAX_DEPTH = 2;

const hasSubtasks = computed(() => props.task.subtasks && props.task.subtasks.length > 0);

const totalSubtasks = computed(() => {
  if (!hasSubtasks.value) return 0;
  
  const countSubtasks = (tasks: Task[]): number => {
    return tasks.reduce((count, task) => {
      return count + 1 + (task.subtasks ? countSubtasks(task.subtasks) : 0);
    }, 0);
  };
  
  return countSubtasks(props.task.subtasks);
});

const completedSubtasks = computed(() => {
  if (!hasSubtasks.value) return 0;
  
  const countCompleted = (tasks: Task[]): number => {
    return tasks.reduce((count, task) => {
      const taskCount = task.status === 'done' ? 1 : 0;
      const subtasksCount = task.subtasks ? countCompleted(task.subtasks) : 0;
      return count + taskCount + subtasksCount;
    }, 0);
  };
  
  return countCompleted(props.task.subtasks);
});

const subtaskProgress = computed(() => {
  if (totalSubtasks.value === 0) return 100;
  return (completedSubtasks.value / totalSubtasks.value) * 100;
});

const hasIncompleteSubtasks = computed(() => {
  if (!hasSubtasks.value) return false;
  
  const hasIncomplete = (tasks: Task[]): boolean => {
    return tasks.some(task => {
      if (task.status !== 'done') return true;
      if (task.subtasks && task.subtasks.length > 0) {
        return hasIncomplete(task.subtasks);
      }
      return false;
    });
  };
  
  return hasIncomplete(props.task.subtasks);
});

const allSubtasksCompleted = computed(() => subtaskProgress.value === 100);

const isStatusDisabled = computed(() => {
  return props.task.status !== 'done' && hasIncompleteSubtasks.value;
});

const statusDisabledTitle = computed(() => {
  if (isStatusDisabled.value) {
    return `Нельзя завершить: ${completedSubtasks.value}/${totalSubtasks.value} подзадач завершено`;
  }
  return '';
});

const statusTextClasses: Record<TaskStatus, string> = {
  'todo': 'text-yellow-700',
  'in-progress': 'text-blue-700',
  'done': 'text-green-700'
};

const canAddSubtask = computed(() => props.depth < MAX_DEPTH);

const subtaskButtonTitle = computed(() => {
  if (canAddSubtask.value) {
    return `Добавить подзадачу (уровень ${props.depth + 1}/3)`;
  }
  return 'Достигнут максимальный уровень вложенности';
});

const titleClasses = computed(() => ({
  'line-through text-gray-500': props.task.status === 'done',
  'text-gray-900': props.task.status !== 'done'
}));

const startEdit = async () => {
  if (props.task.status !== 'done') {
    editedTitle.value = props.task.title;
    isEditing.value = true;
    await nextTick();
    titleInput.value?.focus();
  }
};

const saveEdit = () => {
  if (editedTitle.value.trim() && editedTitle.value !== props.task.title) {
    emit('update', props.task.id, { title: editedTitle.value.trim() });
  }
  isEditing.value = false;
};

const cancelEdit = () => {
  isEditing.value = false;
  editedTitle.value = props.task.title;
};

const updateStatus = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (!target) return;
  
  const newStatus = target.value as TaskStatus;
  
  if (newStatus === 'done' && hasIncompleteSubtasks.value) {
    alert(`Нельзя завершить задачу! Завершите сначала все подзадачи (${completedSubtasks.value}/${totalSubtasks.value})`);
    target.value = props.task.status;
    return;
  }
  
  if (newStatus === 'done' && hasSubtasks.value) {
    if (confirm('Завершить также все подзадачи этой задачи?')) {
      completeAllSubtasks();
    }
  }
  
  isStatusAutoUpdated.value = false;
  wasReopened.value = false;
  
  emit('update', props.task.id, { status: newStatus });
  emit('status-changed', props.task.id, newStatus);
};

const updateTags = (tags: string[]) => {
  emit('update', props.task.id, { tags });
};

const handleAddTag = (tag: string) => {
  addTag(tag);
  emit('addTag', tag);
};

const addSubtask = async () => {
  if (!canAddSubtask.value) {
    alert('Достигнут максимальный уровень вложенности (3 уровня)!');
    return;
  }
  
  addingSubtask.value = true;
  await nextTick();
  subtaskInput.value?.focus();
};

const confirmAddSubtask = () => {
  if (!canAddSubtask.value) {
    alert('Достигнут максимальный уровень вложенности!');
    cancelAddSubtask();
    return;
  }
  
  if (newSubtaskTitle.value.trim()) {
    emit('addSubtask', props.task.id, newSubtaskTitle.value.trim(), []);
    newSubtaskTitle.value = '';
    addingSubtask.value = false;
    showSubtasks.value = true;
  }
};

const cancelAddSubtask = () => {
  addingSubtask.value = false;
  newSubtaskTitle.value = '';
};

const completeAllSubtasks = () => {
  try {
    const completeRecursive = (tasks: Task[]) => {
      tasks.forEach(task => {
        emit('update', task.id, { status: 'done' });
        if (task.subtasks) completeRecursive(task.subtasks);
      });
    };
    if (props.task.subtasks) completeRecursive(props.task.subtasks);
  } catch (error) {
    console.error('Ошибка при завершении подзадач:', error);
  }
};

const handleSubtaskStatusChange = (subtaskId: string, newStatus: TaskStatus) => {
  // Если родитель завершен, но подзадача меняет статус на не "Завершено", переоткрываем родителя
  if (props.task.status === 'done' && newStatus !== 'done') {
    wasReopened.value = true;
    isStatusAutoUpdated.value = true;
    emit('update', props.task.id, { status: 'in-progress' });
    emit('status-changed', props.task.id, 'in-progress');
  }
  
  // Если у подзадачи статус отличный от "К выполнению", ставим родителя в "В процессе"
  else if (newStatus !== 'todo' && props.task.status === 'todo') {
    isStatusAutoUpdated.value = true;
    emit('update', props.task.id, { status: 'in-progress' });
    emit('status-changed', props.task.id, 'in-progress');
  }
  
  // Если все подзадачи завершены, завершаем родителя
  else if (newStatus === 'done' && allSubtasksCompleted.value && props.task.status !== 'done') {
    isStatusAutoUpdated.value = true;
    emit('update', props.task.id, { status: 'done' });
    emit('status-changed', props.task.id, 'done');
  }
};

const handleSubtaskUpdate = (taskId: string, updates: Partial<Task>) => {
  emit('update', taskId, updates);
};

const handleSubtaskDelete = (taskId: string) => {
  emit('delete', taskId);
};

const handleSubtaskAddSubtask = (parentId: string, title: string, tags: string[]) => {
  emit('addSubtask', parentId, title, tags);
};
</script>

<style scoped>
.subtasks-space {
  border-left: 2px solid #e5e7eb;
  margin-left: 1rem;
  padding-left: 1rem;
}

.task-item:hover .opacity-0 {
  opacity: 1 !important;
}
</style>