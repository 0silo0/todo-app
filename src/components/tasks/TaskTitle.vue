<template>
  <div class="title-section">
    <input
      v-if="isEditing"
      :value="editedTitle"
      @input="handleInput"
      @blur="$emit('editSave')"
      @keyup.enter="$emit('editSave')"
      @keyup.escape="$emit('editCancel')"
      class="title-input"
      type="text"
      ref="titleInput"
    >
    <h3
      v-else
      @dblclick="$emit('editStart')"
      class="task-title"
      :class="titleClasses"
    >
      {{ task.title }}
      <span
        v-if="hasIncompleteSubtasks && task.status === 'done'"
        class="incomplete-subtasks-warning"
        title="Есть незавершенные подзадачи"
      >
        ⚠️
      </span>
    </h3>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Task } from '@/types/todo';

interface Props {
  task: Task;
  isEditing: boolean;
  editedTitle: string;
  hasIncompleteSubtasks?: boolean;
}

interface Emits {
  (e: 'update:editedTitle', value: string): void;
  (e: 'editStart'): void;
  (e: 'editSave'): void;
  (e: 'editCancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  hasIncompleteSubtasks: false
});

const emit = defineEmits<Emits>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target) {
    emit('update:editedTitle', target.value);
  }
};

const titleClasses = computed(() => ({
  'task-title--completed': props.task.status === 'done',
  'task-title--active': props.task.status !== 'done'
}));
</script>

<style lang="scss" scoped>
@import '../../styles/task-item.scss';
</style>
