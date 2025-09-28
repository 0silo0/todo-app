<template>
  <div class="subtasks-progress">
    <div class="progress-info">
      <span class="progress-label">Подзадачи:</span>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
      <span class="progress-stats">{{ completedSubtasks }}/{{ totalSubtasks }}</span>
      <span class="progress-percent">({{ Math.round(progress) }}%)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  completedSubtasks: number;
  totalSubtasks: number;
  progress: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
@import '../../styles/task-item.scss';
</style>
