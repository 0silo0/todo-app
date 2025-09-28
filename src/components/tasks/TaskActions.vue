<template>
  <div class="task-actions">
    <button
      v-if="canAddSubtask"
      @click="$emit('addSubtask')"
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
      @click="$emit('delete')"
      class="action-btn action-btn--delete"
      title="Удалить"
    >
      🗑️
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '@/types/todo';

interface Props {
  task: Task;
  depth: number;
  canAddSubtask: boolean;
}

interface Emits {
  (e: 'addSubtask'): void;
  (e: 'delete'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const subtaskButtonTitle = computed(() => {
  if (props.canAddSubtask) {
    return `Добавить подзадачу (уровень ${props.depth + 1}/3)`;
  }
  return 'Достигнут максимальный уровень вложенности';
});
</script>

<style lang="scss" scoped>
@import '../../styles/task-item.scss';
</style>
