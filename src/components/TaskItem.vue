<template>
    <div class="task-item group" :class="{'ml-8': depth > 0}">
      <div class="bg-white rounded-lg border p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3 flex-1 min-w-0">
            <select 
                :value="task.status"
                @change="updateStatus($event)"
                class="text-sm border-0 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                :class="statusClasses[task.status]"
            >
                <option value="todo">📝 Сделать</option>
                <option value="in-progress">🔄 В процессе</option>
                <option value="done">✅ Готово</option>
            </select>
            
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
                </h3>
              </div>
  
              <div class="mt-2">
                <TagInput
                  v-model="localTags"
                  :availableTags="availableTags"
                  @addTag="$emit('addTag', $event)"
                  @update:modelValue="updateTags"
                />
              </div>
  
              <div class="flex space-x-4 mt-2 text-xs text-gray-500">
                <span>Создано: {{ formatDate(task.createdAt) }}</span>
                <span v-if="task.updatedAt !== task.createdAt">
                  Обновлено: {{ (task.updatedAt) }}
                </span>
              </div>
            </div>
          </div>
  
          <div class="flex space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              @click="addSubtask"
              class="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
              title="Добавить подзадачу"
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
  
        <div v-if="task.subtasks.length" class="mt-3 pt-3 border-t border-gray-100">
          <button
            @click="showSubtasks = !showSubtasks"
            class="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>{{ showSubtasks ? '▼' : '▶' }}</span>
            <span>Подзадачи ({{ task.subtasks.length }})</span>
          </button>
        </div>
      </div>
  
      <div v-if="showSubtasks && task.subtasks.length" class="subtasks-space">
        <TaskItem
          v-for="subtask in task.subtasks"
          :key="subtask.id"
          :task="subtask"
          :availableTags="availableTags"
          :depth="depth + 1"
          @update="(id, updates) => $emit('update', id, updates)"
          @delete="$emit('delete', $event)"
          @addTag="$emit('addTag', $event)"
          class="mt-2"
        />
      </div>
  
      <div v-if="addingSubtask" class="ml-8 mt-2">
        <div class="bg-gray-50 rounded-lg p-3 border">
          <div class="flex space-x-2">
            <input
              v-model="newSubtaskTitle"
              @keyup.enter="confirmAddSubtask"
              @keyup.escape="cancelAddSubtask"
              placeholder="Введите подзадачу..."
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              ref="subtaskInput"
            >
            <button
              @click="confirmAddSubtask"
              class="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
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
  </template>
  
  <script setup lang="ts">
  import { ref, nextTick, computed } from 'vue';
  import type { Task, TaskStatus } from '@/types/todo';
  import { formatDate } from '@/utils/helpers';
  import TagInput from './TagInput.vue';
  
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
  }
  
  const props = withDefaults(defineProps<Props>(), {
    depth: 0
  });
  const emit = defineEmits<Emits>();
  
  const isEditing = ref(false);
  const editedTitle = ref('');
  const titleInput = ref<HTMLInputElement>();
  const showSubtasks = ref(true);
  const addingSubtask = ref(false);
  const newSubtaskTitle = ref('');
  const subtaskInput = ref<HTMLInputElement>();
  const localTags = ref<string[]>(props.task.tags);
  
  const statusClasses: Record<TaskStatus, string> = {
    'todo': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'done': 'bg-green-100 text-green-800 border-green-200'
  };
  
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
    if (target && ['todo', 'in-progress', 'done'].includes(target.value)) {
        emit('update', props.task.id, { status: target.value as TaskStatus });
    }
  };
  
  const updateTags = (tags: string[]) => {
    emit('update', props.task.id, { tags });
  };
  
  const addSubtask = async () => {
    addingSubtask.value = true;
    await nextTick();
    subtaskInput.value?.focus();
  };
  
  const confirmAddSubtask = () => {
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