<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <nav class="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <router-link to="/projects" class="hover:text-blue-600 transition-colors">
          📂 Проекты
        </router-link>
        <span class="text-gray-400">›</span>
        <span class="text-gray-800 font-medium truncate">{{ currentProject.name }}</span>
      </nav>

      <header class="bg-white rounded-xl shadow-lg p-6 mb-6" :style="{ borderLeft: `4px solid ${currentProject.color}` }">
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-3 mb-2">
              <h1 class="text-3xl font-bold text-gray-800 truncate">{{ currentProject.name }}</h1>
              <span class="px-2 py-1 text-xs rounded-full text-white" :style="{ backgroundColor: currentProject.color }">
                {{ getProjectTaskCount(currentProject.id) }} задач
              </span>
            </div>
            <p v-if="currentProject.description" class="text-gray-600 mb-4">
              {{ currentProject.description }}
            </p>
            <div class="flex items-center space-x-4 text-sm text-gray-500">
              <span>Создан: {{ formatDateTime(currentProject.createdAt) }}</span>
              <span v-if="currentProject.updatedAt">
                Обновлен: {{ formatDateTime(currentProject.updatedAt) }}
              </span>
              <span>Прогресс: {{ getProjectProgress(currentProject.id) }}%</span>
            </div>
          </div>
          <div class="flex space-x-2 ml-4">
            <button
              @click="editProject"
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              ✏️ Редактировать
            </button>
            <button
              @click="goBack"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Назад
            </button>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1">
        <div class="mb-6">
          <ExportImportManager />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h3 class="font-semibold text-lg mb-4">Фильтры и статистика</h3>
            
            <div class="mb-6">
              <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span>Прогресс проекта</span>
                <span>{{ getProjectProgress(currentProject.id) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :style="{
                    width: getProjectProgress(currentProject.id) + '%',
                    backgroundColor: currentProject.color
                  }"
                ></div>
              </div>
            </div>

            <div class="space-y-3 text-sm mb-6">
              <div class="flex justify-between">
                <span class="text-gray-600">Всего задач:</span>
                <span class="font-medium">{{ totalTasks }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-yellow-600">К выполнению:</span>
                <span class="font-medium">{{ todoTasks }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-600">В процессе:</span>
                <span class="font-medium">{{ inProgressTasks }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-green-600">Завершено:</span>
                <span class="font-medium">{{ doneTasks }}</span>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">🔍 Поиск</label>
                <input
                  v-model="filters.search"
                  @input="handleSearch"
                  placeholder="Поиск задач..."
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">📊 Статусы</label>
                <div class="space-y-2">
                  <label v-for="status in statusOptions" :key="status.value" class="flex items-center">
                    <input
                      type="checkbox"
                      :value="status.value"
                      v-model="selectedStatuses"
                      @change="updateStatusFilter"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    >
                    <span class="ml-2 text-sm">{{ status.label }}</span>
                  </label>
                </div>
              </div>

              <div>
                <TagFilter
                  :availableTags="availableTags"
                  :modelValue="filters.tags"
                  :tagCounts="tagCounts"
                  :noTagCount="noTagCount"
                  @update:modelValue="updateTagFilter"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3">
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="flex flex-col space-y-4">
              <div class="flex space-x-3">
                <input
                  v-model="newTaskTitle"
                  @keyup.enter="addNewTask"
                  placeholder="Что нужно сделать в этом проекте?..."
                  class="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                >
                <button
                  @click="addNewTask"
                  :disabled="!newTaskTitle.trim()"
                  class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                  :style="{ backgroundColor: currentProject.color }"
                >
                  Добавить
                </button>
              </div>
              
              <div class="flex flex-wrap gap-2">
                <span class="text-sm text-gray-600 mr-2">Быстрые теги:</span>
                <button
                  v-for="tag in quickTags"
                  :key="tag"
                  @click="addQuickTag(tag)"
                  class="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="tasks.length" class="space-y-4">
            <TaskItem
              v-for="task in tasks"
              :key="task.id"
              :task="task"
              :availableTags="currentProjectAvailableTags"
              @update="handleTaskUpdate"
              @delete="handleTaskDelete"
              @addSubtask="handleAddSubtask"
              @addTag="handleAddTag"
              @status-changed="handleTaskStatusChange"
            />
          </div>
          
          <div v-else class="text-center py-16 bg-white rounded-xl shadow-lg">
            <div class="text-6xl mb-4">📋</div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Задач пока нет</h3>
            <p class="text-gray-600 mb-6">Добавьте первую задачу чтобы начать работу</p>
          </div>

          <ProjectEditModal
            v-if="currentProject"
            :show="showEditModal"
            :project="currentProject"
            @update:show="showEditModal = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { debounce } from '@/utils/helpers';
  import TaskItem from '@/components/TaskItem.vue';
  import TagFilter from '@/components/TagFilter.vue';
  import { useTodos } from '@/composables/useTodos';
  import type { TaskStatus } from '@/types/todo';
  import { formatDateTime } from '@/utils/helpers';
  import ExportImportManager from '@/components/ExportImportManager.vue';
  import ProjectEditModal from '@/components/ProjectEditModal.vue';
  
  const router = useRouter();
  const route = useRoute();
  
  const { 
    currentProject: currentProjectComputed,
    setCurrentProject,
    tasks, 
    filters, 
    availableTags, 
    addTask, 
    updateTask, 
    deleteTask, 
    addSubtask, 
    addTag,
    tagCounts,
    noTagCount,
    updateFilters,
    getProjectTaskCount,
    getProjectProgress
  } = useTodos();
  
  const newTaskTitle = ref('');
  const selectedStatuses = ref<TaskStatus[]>(filters.value.statuses);
  const showEditModal = ref(false);
  
  // Инициализация при монтировании
  onMounted(() => {
    const projectId = route.params.projectId as string;
    if (projectId) {
      setCurrentProject(projectId);
    }
  });
  
  // Отслеживание изменения параметра маршрута
  watch(() => route.params.projectId, (newProjectId) => {
    if (newProjectId) {
      setCurrentProject(newProjectId as string);
    }
  });
  
  const currentProject = computed(() => currentProjectComputed.value);
  
  // Вычислимые свойства для статистики
  const totalTasks = computed(() => tasks.value.length);
  const todoTasks = computed(() => tasks.value.filter(t => t.status === 'todo').length);
  const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in-progress').length);
  const doneTasks = computed(() => tasks.value.filter(t => t.status === 'done').length);
  
  const statusOptions = computed(() => [
    { value: 'todo', label: '📝 К выполнению' },
    { value: 'in-progress', label: '🔄 В процессе' },
    { value: 'done', label: '✅ Завершено' }
  ]);
  
  const quickTags = computed(() => availableTags.value.slice(0, 5));

  const currentProjectAvailableTags = computed(() => {
    return currentProjectComputed.value?.availableTags || [];
  });
  
  const debouncedSearch = debounce((search: string) => {
    updateFilters({ search });
  }, 300);
  
  const handleSearch = () => {
    debouncedSearch(filters.value.search);
  };
  
  const addNewTask = () => {
    if (newTaskTitle.value.trim()) {
      addTask(newTaskTitle.value.trim());
      newTaskTitle.value = '';
    }
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    console.log(`Статус задачи ${taskId} изменен на: ${newStatus}`);
  };
  
  const addQuickTag = (tag: string) => {
    if (newTaskTitle.value.trim()) {
      addTask(newTaskTitle.value.trim(), [tag]);
      newTaskTitle.value = '';
    }
  };
  
  const handleTaskUpdate = (taskId: string, updates: any) => {
    updateTask(taskId, updates);
  };
  
  const handleTaskDelete = (taskId: string) => {
    if (confirm('Удалить задачу?')) {
      deleteTask(taskId);
    }
  };
  
  const handleAddSubtask = (parentId: string, title: string, tags: string[]) => {
    addSubtask(parentId, title, tags);
  };
  
  const handleAddTag = (tag: string) => {
    addTag(tag);
  };
  
  const updateStatusFilter = () => {
    updateFilters({ statuses: selectedStatuses.value });
  };
  
  const goBack = () => {
    router.push('/projects');
  };
  
  const editProject = () => {
    showEditModal.value = true;
  };

  const updateTagFilter = (tags: string[]) => {
    updateFilters({ tags });
  };
  
  // Синхронизация выбранных статусов с фильтрами
  watch(() => filters.value.statuses, (newStatuses) => {
    selectedStatuses.value = newStatuses;
  }, { immediate: true });
</script>