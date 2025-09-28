import { ref, computed, nextTick } from 'vue';
import type { Task, TaskStatus } from '@/types/todo';

export const useTaskLogic = (props: any, emit: any) => {
  const isEditing = ref(false);
  const editedTitle = ref('');
  const showSubtasks = ref(true);
  const addingSubtask = ref(false);
  const newSubtaskTitle = ref('');

  const MAX_DEPTH = 2;

  // Computed properties
  const hasSubtasks = computed(() =>
    props.task.subtasks && props.task.subtasks.length > 0
  );

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

  const isStatusDisabled = computed(() =>
    props.task.status !== 'done' && hasIncompleteSubtasks.value
  );

  const canAddSubtask = computed(() => props.depth < MAX_DEPTH);

  const taskCardClasses = computed(() => ({
    'task-card--completed': props.task.status === 'done',
    'task-card--active': props.task.status !== 'done'
  }));

  // Methods
  const startEdit = async () => {
    if (props.task.status !== 'done') {
      editedTitle.value = props.task.title;
      isEditing.value = true;
      await nextTick();
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

  const addSubtask = async () => {
    if (!canAddSubtask.value) {
      alert('Достигнут максимальный уровень вложенности (3 уровня)!');
      return;
    }

    addingSubtask.value = true;
    await nextTick();
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

  return {
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
  };
};
