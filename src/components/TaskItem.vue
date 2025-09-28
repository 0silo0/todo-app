<template>
  <div class="task-item" :class="{'task-item--nested': depth > 0}">
    <div class="task-card" :class="taskCardClasses">
      <div class="task-header">
        <div class="task-main-content">
          <TaskStatusSelector
            :task="task"
            :has-incomplete-subtasks="hasIncompleteSubtasks"
            :completed-subtasks="completedSubtasks"
            :total-subtasks="totalSubtasks"
            :is-disabled="isStatusDisabled"
            @status-change="handleStatusChange"
          />

          <div class="task-content">
            <TaskTitle
              :task="task"
              :is-editing="isEditing"
              :edited-title="editedTitle"
              @edit-start="startEdit"
              @edit-save="saveEdit"
              @edit-cancel="cancelEdit"
              @update:edited-title="editedTitle = $event"
            />

            <TaskProgress
              v-if="hasSubtasks"
              :completed-subtasks="completedSubtasks"
              :total-subtasks="totalSubtasks"
              :progress="subtaskProgress"
            />

            <div class="tags-section">
              <TagInput
                :model-value="task.tags"
                :available-tags="availableTags"
                @add-tag="handleAddTag"
                @update:model-value="updateTags"
              />
            </div>

            <TaskMeta :task="task" :depth="depth" />
          </div>
        </div>

        <TaskActions
          :task="task"
          :depth="depth"
          :can-add-subtask="canAddSubtask"
          @add-subtask="addSubtask"
          @delete="$emit('delete', task.id)"
        />
      </div>

      <SubtasksList
        v-if="hasSubtasks"
        :task="task"
        :depth="depth"
        :available-tags="availableTags"
        :show-subtasks="showSubtasks"
        @toggle="showSubtasks = !showSubtasks"
        @complete-all="completeAllSubtasks"
        @subtask-update="handleSubtaskUpdate"
        @subtask-delete="handleSubtaskDelete"
        @subtask-add="handleSubtaskAddSubtask"
        @subtask-status-change="handleSubtaskStatusChange"
        @add-tag="handleAddTag"
      />

      <transition name="subtask-form-slide">
        <AddSubtaskForm
          v-if="addingSubtask"
          :depth="depth"
          :new-subtask-title="newSubtaskTitle"
          :is-visible="addingSubtask"
          @confirm="confirmAddSubtask"
          @cancel="cancelAddSubtask"
          @update:title="newSubtaskTitle = $event"
        />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Task, TaskStatus } from '@/types/todo';
import { useTaskLogic } from '@/composables/useTaskLogic';
import TaskStatusSelector from './tasks/TaskStatusSelector.vue';
import TaskTitle from './tasks/TaskTitle.vue';
import TaskProgress from './tasks/TaskProgress.vue';
import TaskActions from './tasks/TaskActions.vue';
import TaskMeta from './tasks/TaskMeta.vue';
import SubtasksList from './tasks/SubtasksList.vue';
import AddSubtaskForm from './tasks/AddSubtaskForm.vue';
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

// Логика работы с задачами
const {
  isEditing,
  editedTitle,
  showSubtasks,
  addingSubtask,
  newSubtaskTitle,
  hasSubtasks,
  hasIncompleteSubtasks,
  completedSubtasks,
  totalSubtasks,
  subtaskProgress,
  isStatusDisabled,
  canAddSubtask,
  taskCardClasses,
  startEdit,
  saveEdit,
  cancelEdit,
  addSubtask,
  confirmAddSubtask,
  cancelAddSubtask,
  completeAllSubtasks
} = useTaskLogic(props, emit);

// Обработчики событий
const handleStatusChange = (status: TaskStatus) => {
  emit('update', props.task.id, { status });
  emit('status-changed', props.task.id, status);
};

const updateTags = (tags: string[]) => {
  emit('update', props.task.id, { tags });
};

const handleAddTag = (tag: string) => {
  addTag(tag);
  emit('addTag', tag);
};

const handleSubtaskStatusChange = (subtaskId: string, newStatus: TaskStatus) => {
  if (props.task.status === 'done' && newStatus !== 'done') {
    emit('update', props.task.id, { status: 'in-progress' });
    emit('status-changed', props.task.id, 'in-progress');
  } else if (newStatus !== 'todo' && props.task.status === 'todo') {
    emit('update', props.task.id, { status: 'in-progress' });
    emit('status-changed', props.task.id, 'in-progress');
  }
  emit('status-changed', subtaskId, newStatus);
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
@import '../styles/task-item.scss';
</style>
