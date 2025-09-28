<template>
  <div class="task-item" :class="{'task-item--nested': depth > 0}">
    <div class="task-card" :class="taskCardClasses">
      <div class="task-header">
        <div class="task-main-content">
          <div class="status-selector-wrapper">
            <select 
                :value="task.status"
                @change="updateStatus($event)"
                :disabled="isStatusDisabled"
                class="status-select"
                :class="[statusTextClasses[task.status], isStatusDisabled ? 'status-select--disabled' : '']"
                :title="statusDisabledTitle"
            >
                <option value="todo">📝 К выполнению</option>
                <option value="in-progress">🔄 В процессе</option>
                <option value="done">✅ Завершено</option>
            </select>
            
            <div v-if="isStatusDisabled && task.status !== 'done'" 
                 class="status-warning-indicator"
                 :title="statusDisabledTitle">
              <span class="status-warning-icon">!</span>
            </div>
          </div>
          
          <div class="task-content">
            <div class="title-section">
              <input
                v-if="isEditing"
                v-model="editedTitle"
                @blur="saveEdit"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit"
                class="title-input"
                type="text"
                ref="titleInput"
              >
              <h3
                v-else
                @dblclick="startEdit"
                class="task-title"
                :class="titleClasses"
              >
                {{ task.title }}
                <span v-if="hasIncompleteSubtasks && task.status === 'done'" 
                      class="incomplete-subtasks-warning" 
                      title="Есть незавершенные подзадачи">
                  ⚠️
                </span>
              </h3>
            </div>

            <div v-if="hasSubtasks" class="subtasks-progress">
              <div class="progress-info">
                <span class="progress-label">Подзадачи:</span>
                <div class="progress-bar">
                  <div class="progress-fill" 
                       :style="{ width: subtaskProgress + '%' }"></div>
                </div>
                <span class="progress-stats">{{ completedSubtasks }}/{{ totalSubtasks }}</span>
                <span class="progress-percent">({{ Math.round(subtaskProgress) }}%)</span>
              </div>
            </div>

            <div class="tags-section">
              <TagInput
                :modelValue="task.tags"
                :availableTags="availableTags"
                @addTag="handleAddTag"
                @update:modelValue="updateTags"
              />
            </div>

            <div class="task-meta">
              <span class="meta-item">Создано: {{ formatDate(task.createdAt) }}</span>
              <span v-if="task.updatedAt !== task.createdAt" class="meta-item">
                Обновлено: {{ formatDate(task.updatedAt) }}
              </span>
              <span v-if="depth > 0" class="meta-item meta-item--level">
                Уровень: {{ depth + 1 }}/3
              </span>
            </div>
          </div>
        </div>

        <div class="task-actions">
          <button 
            v-if="canAddSubtask"
            @click="addSubtask"
            class="action-btn action-btn--add"
            :title="subtaskButtonTitle"
          >
            ➕
          </button>
          <button 
            v-else
            class="action-btn action-btn--disabled"
            title="Достигнут максимальный уровень вложенности"
          >
            ➕
          </button>
          
          <button 
            @click="$emit('delete', task.id)"
            class="action-btn action-btn--delete"
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>

      <div v-if="hasSubtasks" class="subtasks-section">
        <div class="subtasks-header">
          <button
            @click="showSubtasks = !showSubtasks"
            class="subtasks-toggle"
          >
            <span class="toggle-icon">{{ showSubtasks ? '▼' : '▶' }}</span>
            <span class="toggle-label">Подзадачи ({{ task.subtasks.length }})</span>
          </button>

          <button 
            v-if="hasIncompleteSubtasks && task.status !== 'done'"
            @click="completeAllSubtasks"
            class="complete-all-btn"
            title="Завершить все подзадачи"
          >
            ✅ Завершить все
          </button>
        </div>

        <transition name="subtasks-slide">
          <div v-if="showSubtasks" class="subtasks-container">
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
        </transition>
      </div>

      <transition name="subtask-form-slide">
        <div v-if="addingSubtask" class="add-subtask-form">
          <div class="form-header">
            <span class="depth-info">
              {{ depth + 1 }}/3 уровень вложенности
            </span>
            <span v-if="!canAddSubtask" class="depth-warning">
              ❌ Достигнут максимум
            </span>
          </div>
          
          <div class="form-controls">
            <input
              v-model="newSubtaskTitle"
              @keyup.enter="confirmAddSubtask"
              @keyup.escape="cancelAddSubtask"
              placeholder="Введите подзадачу..."
              class="subtask-input"
              :disabled="!canAddSubtask"
              ref="subtaskInput"
            >
            <button
              @click="confirmAddSubtask"
              :disabled="!newSubtaskTitle.trim() || !canAddSubtask"
              class="btn btn--primary"
              :title="!canAddSubtask ? 'Достигнут максимальный уровень вложенности' : 'Добавить подзадачу'"
            >
              Добавить
            </button>
            <button
              @click="cancelAddSubtask"
              class="btn btn--secondary"
            >
              Отмена
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import type { Task, TaskStatus } from '@/types/todo';
import { formatDate } from '@/utils/helpers';
import TagInput from './TagInput.vue';
import { useTodos } from '@/composables/useTodos';
import { useModal } from '@/composables/useModal';

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
  'todo': 'status--todo',
  'in-progress': 'status--in-progress',
  'done': 'status--done'
};

const canAddSubtask = computed(() => props.depth < MAX_DEPTH);

const subtaskButtonTitle = computed(() => {
  if (canAddSubtask.value) {
    return `Добавить подзадачу (уровень ${props.depth + 1}/3)`;
  }
  return 'Достигнут максимальный уровень вложенности';
});

const titleClasses = computed(() => ({
  'task-title--completed': props.task.status === 'done',
  'task-title--active': props.task.status !== 'done'
}));

const taskCardClasses = computed(() => ({
  'task-card--completed': props.task.status === 'done',
  'task-card--active': props.task.status !== 'done'
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

<style lang="scss" scoped>
$primary-color: #3b82f6;
$primary-color-light: #dbeafe;
$success-color: #10b981;
$success-color-light: #d1fae5;
$warning-color: #f59e0b;
$warning-color-light: #fef3c7;
$error-color: #ef4444;
$error-color-light: #fee2e2;

$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;
$gray-900: #111827;

$border-radius: 0.5rem;
$border-radius-lg: 0.75rem;
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

$transition-fast: 0.15s ease-in-out;
$transition-base: 0.2s ease-in-out;
$transition-slow: 0.3s ease-in-out;

// Анимации
@keyframes taskSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes progressFill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

// Основные стили
.task-item {
  animation: taskSlideIn 0.3s ease-out;
  
  &--nested {
    margin-left: 2rem;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: -1rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, transparent 0%, $gray-300 15%, $gray-300 85%, transparent 100%);
    }
  }
}

.task-card {
  background: white;
  border-radius: $border-radius-lg;
  border: 1px solid $gray-200;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all $transition-slow;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: $gray-300;
    transition: background-color $transition-base;
  }
  
  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-1px);
    
    .task-actions {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &--completed {
    background: $gray-50;
    
    &::before {
      background: $success-color;
    }
    
    .task-title--completed {
      color: $gray-500;
      text-decoration: line-through;
    }
  }
  
  &--active {
    &::before {
      background: $primary-color;
    }
  }
}

.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.task-main-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.status-selector-wrapper {
  position: relative;
  flex-shrink: 0;
}

.status-select {
  font-size: 0.875rem;
  background: white;
  border: 1px solid $gray-300;
  border-radius: $border-radius;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  transition: all $transition-base;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &:disabled {
    background: $gray-100;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  &--disabled {
    animation: shake 0.5s ease-in-out;
  }
  
  &.status--todo {
    color: #92400e;
    border-color: #f59e0b;
  }
  
  &.status--in-progress {
    color: #1e40af;
    border-color: $primary-color;
  }
  
  &.status--done {
    color: #065f46;
    border-color: $success-color;
  }
}

.status-warning-indicator {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  background: $warning-color;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  animation: pulseGlow 2s infinite;
  
  .status-warning-icon {
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
    line-height: 1;
  }
}

.task-content {
  flex: 1;
  min-width: 0;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.title-input {
  flex: 1;
  border-bottom: 2px solid $primary-color;
  outline: none;
  padding: 0.25rem;
  background: transparent;
  font-size: 1.125rem;
  font-weight: 500;
  transition: all $transition-base;
  
  &:focus {
    background: $primary-color-light;
    border-radius: 0.25rem;
  }
}

.task-title {
  font-size: 1.125rem;
  font-weight: 500;
  cursor: text;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all $transition-base;
  margin: 0;
  
  &:hover {
    background: $gray-50;
  }
  
  &--active {
    color: $gray-900;
  }
  
  &--completed {
    color: $gray-500;
    text-decoration: line-through;
  }
}

.incomplete-subtasks-warning {
  margin-left: 0.5rem;
  color: $warning-color;
  font-size: 0.875rem;
}

.subtasks-progress {
  margin: 0.5rem 0;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.progress-label {
  color: $gray-500;
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  background: $gray-200;
  border-radius: 0.75rem;
  height: 0.375rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $success-color;
  border-radius: 0.75rem;
  transition: width 0.5s ease-in-out;
  animation: progressFill 0.8s ease-out;
  transform-origin: left;
}

.progress-stats {
  color: $gray-600;
  font-weight: 500;
  white-space: nowrap;
}

.progress-percent {
  color: $gray-500;
  white-space: nowrap;
}

.tags-section {
  margin: 0.5rem 0;
}

.task-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: $gray-500;
  flex-wrap: wrap;
}

.meta-item {
  &--level {
    color: $primary-color;
    font-weight: 500;
  }
}

.task-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transform: translateX(10px);
  transition: all $transition-base;
  flex-shrink: 0;
}

.action-btn {
  padding: 0.5rem;
  border-radius: $border-radius;
  border: none;
  cursor: pointer;
  transition: all $transition-base;
  font-size: 1rem;
  line-height: 1;
  
  &--add {
    color: $success-color;
    
    &:hover {
      color: #065f46;
      background: $success-color-light;
    }
  }
  
  &--delete {
    color: $error-color;
    
    &:hover {
      color: #b91c1c;
      background: $error-color-light;
    }
  }
  
  &--disabled {
    color: $gray-400;
    cursor: not-allowed;
    
    &:hover {
      color: $gray-400;
      background: transparent;
    }
  }
}

.subtasks-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid $gray-100;
}

.subtasks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.subtasks-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: $gray-600;
  font-size: 0.875rem;
  transition: color $transition-base;
  padding: 0.25rem;
  border-radius: 0.25rem;
  
  &:hover {
    color: $gray-800;
    background: $gray-50;
  }
  
  .toggle-icon {
    transition: transform $transition-base;
  }
}

.complete-all-btn {
  background: $success-color;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: $border-radius;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
}

// Анимации для подзадач
.subtasks-slide-enter-active,
.subtasks-slide-leave-active {
  transition: all 0.3s ease-in-out;
}

.subtasks-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.subtasks-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.subtasks-container {
  border-left: 2px solid $gray-300;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -2px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, transparent 0%, $gray-300 20%, $gray-300 80%, transparent 100%);
  }
}

// Анимации для формы добавления подзадачи
.subtask-form-slide-enter-active,
.subtask-form-slide-leave-active {
  transition: all 0.25s ease-in-out;
}

.subtask-form-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.subtask-form-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.add-subtask-form {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid $gray-100;
  background: $gray-50;
  border-radius: $border-radius;
  padding: 0.75rem;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.depth-info {
  color: $gray-600;
}

.depth-warning {
  color: $error-color;
}

.form-controls {
  display: flex;
  gap: 0.5rem;
}

.subtask-input {
  flex: 1;
  border: 1px solid $gray-300;
  border-radius: $border-radius;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: all $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &:disabled {
    background: $gray-100;
    cursor: not-allowed;
  }
}

.btn {
  padding: 0.5rem 0.75rem;
  border-radius: $border-radius;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all $transition-base;
  
  &--primary {
    background: $primary-color;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: $gray-400;
      cursor: not-allowed;
    }
  }
  
  &--secondary {
    background: $gray-300;
    color: $gray-700;
    
    &:hover {
      background: $gray-400;
    }
  }
}

// Адаптивность
@media (max-width: 640px) {
  .task-item--nested {
    margin-left: 1rem;
  }
  
  .task-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .task-actions {
    opacity: 1;
    transform: none;
    align-self: flex-end;
  }
  
  .task-main-content {
    width: 100%;
  }
  
  .task-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .form-controls {
    flex-direction: column;
  }
  
  .subtasks-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>