<template>
  <div class="status-selector-wrapper">
    <div class="custom-select-wrapper">
      <div
        class="custom-select-trigger"
        :class="[statusTextClasses[task.status], isDisabled ? 'custom-select--disabled' : '', isDisabled ? 'custom-select--dimmed' : '']"
        @click="toggleSelect"
        :title="disabledTitle"
        :disabled="isDisabled"
      >
        <span class="selected-value">
          {{ getStatusText(task.status) }}
        </span>
        <span class="dropdown-arrow" :class="{ 'dropdown-arrow--open': isOpen }">▼</span>
      </div>

      <transition name="select-dropdown">
        <div v-if="isOpen" class="custom-select-dropdown">
          <div
            v-for="option in statusOptions"
            :key="option.value"
            class="select-option"
            :class="{ 'select-option--selected': task.status === option.value }"
            @click="selectOption(option.value)"
          >
            <span class="option-icon">{{ option.icon }}</span>
            <span class="option-text">{{ option.text }}</span>
          </div>
        </div>
      </transition>

      <div v-if="isDisabled && task.status !== 'done'"
          class="status-warning-indicator"
          :title="disabledTitle">
        <span class="status-warning-icon">!</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Task, TaskStatus } from '@/types/todo';

interface Props {
  task: Task;
  hasIncompleteSubtasks: boolean;
  completedSubtasks: number;
  totalSubtasks: number;
  isDisabled: boolean;
}

interface Emits {
  (e: 'status-change', status: TaskStatus): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = ref(false);

const statusOptions: { value: TaskStatus; text: string; icon: string }[] = [
  { value: 'todo', text: 'К выполнению', icon: '📝' },
  { value: 'in-progress', text: 'В процессе', icon: '🔄' },
  { value: 'done', text: 'Завершено', icon: '✅' }
];

const statusTextClasses: Record<TaskStatus, string> = {
  'todo': 'status--todo',
  'in-progress': 'status--in-progress',
  'done': 'status--done'
};

const getStatusText = (status: TaskStatus) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option ? `${option.icon} ${option.text}` : '';
};

const disabledTitle = `Нельзя завершить: ${props.completedSubtasks}/${props.totalSubtasks} подзадач завершено`;

const toggleSelect = () => {
  if (!props.isDisabled) {
    isOpen.value = !isOpen.value;
  }
};

const selectOption = (status: TaskStatus) => {
  if (status === 'done' && props.hasIncompleteSubtasks) {
    alert(`Нельзя завершить задачу! Завершите сначала все подзадачи (${props.completedSubtasks}/${props.totalSubtasks})`);
    return;
  }

  emit('status-change', status);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.custom-select-wrapper')) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
@import '../../styles/task-item.scss';
</style>
