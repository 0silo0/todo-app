<template>
  <div v-if="isVisible" class="add-subtask-form">
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
        :value="newSubtaskTitle"
        @input="handleInput"
        @keyup.enter="$emit('confirm')"
        @keyup.escape="$emit('cancel')"
        placeholder="Введите подзадачу..."
        class="subtask-input"
        :disabled="!canAddSubtask"
        ref="subtaskInput"
      >
      <button
        @click="$emit('confirm')"
        :disabled="!newSubtaskTitle.trim() || !canAddSubtask"
        class="btn btn--primary"
        :title="!canAddSubtask ? 'Достигнут максимальный уровень вложенности' : 'Добавить подзадачу'"
      >
        Добавить
      </button>
      <button
        @click="$emit('cancel')"
        class="btn btn--secondary"
      >
        Отмена
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  depth: number;
  newSubtaskTitle: string;
  isVisible: boolean;
}

interface Emits {
  (e: 'update:title', value: string): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const MAX_DEPTH = 2;
const canAddSubtask = computed(() => props.depth < MAX_DEPTH);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target) {
    emit('update:title', target.value);
  }
};
</script>

<style lang="scss" scoped>
@import '../../styles/task-item.scss';
</style>
