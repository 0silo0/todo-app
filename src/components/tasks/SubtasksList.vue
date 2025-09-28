<template>
  <div class="subtasks-section">
    <div class="subtasks-header">
      <button
        @click="$emit('toggle')"
        class="subtasks-toggle"
      >
        <span class="toggle-icon">{{ showSubtasks ? '▼' : '▶' }}</span>
        <span class="toggle-label">Подзадачи ({{ task.subtasks.length }})</span>
      </button>

      <button
        v-if="hasIncompleteSubtasks && task.status !== 'done'"
        @click="$emit('completeAll')"
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
          :available-tags="availableTags"
          :depth="depth + 1"
          @update="(taskId, updates) => $emit('subtaskUpdate', taskId, updates)"
          @delete="(taskId) => $emit('subtaskDelete', taskId)"
          @add-subtask="(parentId, title, tags) => $emit('subtaskAdd', parentId, title, tags)"
          @add-tag="(tag) => $emit('addTag', tag)"
          @status-changed="(taskId, newStatus) => $emit('subtaskStatusChange', taskId, newStatus)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Task, TaskStatus } from '@/types/todo';
import TaskItem from '../TaskItem.vue';

interface Props {
  task: Task;
  depth: number;
  availableTags: string[];
  showSubtasks: boolean;
}

interface Emits {
  (e: 'toggle'): void;
  (e: 'completeAll'): void;
  (e: 'subtaskUpdate', taskId: string, updates: Partial<Task>): void;
  (e: 'subtaskDelete', taskId: string): void;
  (e: 'subtaskAdd', parentId: string, title: string, tags: string[]): void;
  (e: 'subtaskStatusChange', taskId: string, newStatus: TaskStatus): void;
  (e: 'addTag', tag: string): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const hasIncompleteSubtasks = computed(() => {
  if (!props.task.subtasks || props.task.subtasks.length === 0) return false;

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
</script>

<style lang="scss" scoped>
@import '../../styles/task-item.scss';
</style>
