<template>
  <div class="task-meta">
    <span class="meta-item">Создано: {{ formatDate(task.createdAt) }}</span>
    <span v-if="task.updatedAt !== task.createdAt" class="meta-item">
      Обновлено: {{ formatDate(task.updatedAt) }}
    </span>
    <span v-if="depth > 0" class="meta-item meta-item--level">
      Уровень: {{ depth + 1 }}/3
    </span>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/helpers';
import type { Task } from '@/types/todo';

interface Props {
  task: Task;
  depth: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
@import '../../styles/task-item.scss';
</style>
