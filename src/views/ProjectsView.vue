<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
          📂 Мои проекты
        </h1>
        <p class="text-gray-600">Управляйте вашими проектами и задачами</p>
      </header>

      <!-- Панель поиска и фильтров -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              🔍 Поиск проектов
            </label>
            <input
              v-model="searchQuery"
              @input="handleSearch"
              placeholder="Поиск по названию или описанию..."
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              📊 Статус
            </label>
            <div class="custom-select-wrapper">
              <div 
                class="custom-select-trigger"
                @click="toggleStatusSelect"
              >
                <span class="selected-value">
                  {{ getStatusLabel(statusFilter) }}
                </span>
                <span class="dropdown-arrow" :class="{ 'dropdown-arrow--open': isStatusSelectOpen }">▼</span>
              </div>
              
              <transition name="select-dropdown">
                <div v-if="isStatusSelectOpen" class="custom-select-dropdown">
                  <div 
                    v-for="option in statusOptions" 
                    :key="option.value"
                    class="select-option"
                    :class="{ 'select-option--selected': statusFilter === option.value }"
                    @click="selectStatusOption(option.value as any)"
                  >
                    <span class="option-text">{{ option.label }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
          
          <div class="flex items-end">
            <button
              @click="clearFilters"
              :disabled="!hasActiveFilters"
              class="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
        
        <div class="mt-4 pt-4 border-t border-gray-200">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            🏷️ Теги проектов
          </label>
          <ProjectTagFilter
            v-model="selectedTags"
            :availableTags="allProjectTags"
          />
        </div>
        
        <!-- Статистика фильтров -->
        <div v-if="hasActiveFilters" class="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            Найдено: {{ filteredProjects.length }} из {{ totalProjects }} проектов
          </span>
          <span class="flex items-center space-x-2">
            <span v-if="searchQuery">🔍 "{{ searchQuery }}"</span>
            <span v-if="statusFilter !== 'all'">📊 {{ statusLabels[statusFilter] }}</span>
            <span v-if="selectedTags.length">🏷️ {{ selectedTags.length }} тег(ов)</span>
          </span>
        </div>
      </div>

      <div class="text-center mb-8">
        <button
          @click="showProjectForm = true"
          class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center mx-auto"
        >
          <span class="text-lg mr-2">+</span>
          Создать новый проект
        </button>
      </div>

      <!-- Форма создания проекта -->
      <div v-if="showProjectForm" class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 class="text-xl font-semibold mb-4">Создать проект</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Название проекта</label>
            <input
              v-model="newProject.name"
              placeholder="Введите название проекта..."
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              v-model="newProject.description"
              placeholder="Описание проекта (необязательно)"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              rows="3"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Теги проекта</label>
            <TagInput
              v-model="newProject.tags"
              :availableTags="allProjectTags"
            />
            <p class="text-xs text-gray-500 mt-1">
              Добавьте теги для удобной организации проектов
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Цвет проекта</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in availableColors"
                :key="color"
                @click="newProject.color = color"
                class="w-8 h-8 rounded-full border-2 transition-transform"
                :class="{ 'scale-110 border-gray-800': newProject.color === color, 'border-transparent': newProject.color !== color }"
                :style="{ backgroundColor: color }"
                :title="color"
              />
            </div>
          </div>
          <div class="flex space-x-3 pt-2">
            <button
              @click="createProject"
              :disabled="!newProject.name.trim()"
              class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Создать проект
            </button>
            <button
              @click="cancelProject"
              class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>

      <!-- Сетка проектов -->
      <div v-if="filteredProjects.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          @click="openProject(project.id)"
        >
          <!-- Цветная полоса -->
          <div class="h-2" :style="{ backgroundColor: project.color }"></div>
          
          <div class="p-6">
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-xl font-semibold text-gray-800 truncate">{{ project.name }}</h3>
              <button
                @click.stop="deleteProject(project.id)"
                class="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Удалить проект"
              >
                🗑️
              </button>
            </div>
            
            <p v-if="project.description" class="text-gray-600 text-sm mb-4 line-clamp-2">
              {{ project.description }}
            </p>
            
            <!-- Теги проекта -->
            <div v-if="project.tags.length" class="mb-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in project.tags.slice(0, 3)"
                  :key="tag"
                  class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                >
                  {{ tag }}
                </span>
                <span v-if="project.tags.length > 3" class="text-gray-400 text-xs">
                  +{{ project.tags.length - 3 }}
                </span>
              </div>
            </div>
            
            <div class="flex justify-between items-center text-sm text-gray-500">
              <span>Задач: {{ getProjectTaskCount(project.id) }}</span>
              <span>Создан: {{ formatDate(project.createdAt) }}</span>
            </div>
            
            <!-- Прогресс проекта -->
            <div class="mt-4">
              <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>Прогресс</span>
                <span>{{ getProjectProgress(project.id) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :style="{
                    width: getProjectProgress(project.id) + '%',
                    backgroundColor: project.color
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Пустое состояние при фильтрации -->
      <div v-else-if="hasActiveFilters" class="text-center py-16 bg-white rounded-xl shadow-lg">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Проекты не найдены</h3>
        <p class="text-gray-600 mb-6">Попробуйте изменить параметры поиска или фильтры</p>
      </div>

      <!-- Пустое состояние без проектов -->
      <div v-else-if="!showProjectForm" class="text-center py-16 bg-white rounded-xl shadow-lg">
        <div class="text-6xl mb-4">🏗️</div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Проектов пока нет</h3>
        <p class="text-gray-600 mb-6">Создайте первый проект чтобы начать работу</p>
      </div>
      
      <!-- Кастомная модалка с подтверждением -->
      <AppModal
        :show="modal.modalState.value.show"
        :title="modal.modalState.value.title"
        :message="modal.modalState.value.message"
        :type="modal.modalState.value.type"
        :confirm-text="modal.modalState.value.confirmText"
        :cancel-text="modal.modalState.value.cancelText"
        @confirm="modal.confirm"
        @cancel="modal.cancel"
        @close="modal.close"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTodos } from '@/composables/useTodos';
import { formatDate } from '@/utils/helpers';
import { useModal } from '@/composables/useModal';
import AppModal from '@/components/AppModal.vue';
import ProjectTagFilter from '@/components/ProjectTagFilter.vue';
import TagInput from '@/components/TagInput.vue';

const modal = useModal();
const router = useRouter();
const { 
  projects, 
  filteredProjects,
  allProjectTags,
  projectFilters,
  addProject: addProjectAction, 
  deleteProject: deleteProjectAction,
  getProjectTaskCount,
  getProjectProgress,
  updateProjectFilters,
  clearProjectFilters
} = useTodos();

const showProjectForm = ref(false);
const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'completed'>('all');
const selectedTags = ref<string[]>([]);

const newProject = ref({
  name: '',
  description: '',
  color: '#3B82F6',
  tags: [] as string[]
});

const availableColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const statusLabels = {
  all: 'Все',
  active: 'Активные',
  completed: 'Завершенные'
};

const isStatusSelectOpen = ref(false);

const statusOptions = [
  { value: 'all', label: 'Все проекты' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Завершенные' }
];

const getStatusLabel = (status: string) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option ? option.label : 'Все проекты';
};

const toggleStatusSelect = () => {
  isStatusSelectOpen.value = !isStatusSelectOpen.value;
};

const selectStatusOption = (status: 'all' | 'active' | 'completed') => {
  statusFilter.value = status;
  isStatusSelectOpen.value = false;
  updateFilters();
};

// Закрытие при клике вне селектора
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.custom-select-wrapper')) {
    isStatusSelectOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const totalProjects = computed(() => projects.value.length);
const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || 
         statusFilter.value !== 'all' || 
         selectedTags.value.length > 0;
});

// Обработчики фильтров
const handleSearch = () => {
  updateProjectFilters({ search: searchQuery.value });
};

const updateFilters = () => {
  updateProjectFilters({
    search: searchQuery.value,
    status: statusFilter.value,
    tags: selectedTags.value
  });
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  selectedTags.value = [];
  clearProjectFilters();
};

const openProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const createProject = () => {
  if (newProject.value.name.trim()) {
    addProjectAction(
      newProject.value.name, 
      newProject.value.description, 
      newProject.value.color,
      newProject.value.tags
    );
    newProject.value = { name: '', description: '', color: '#3B82F6', tags: [] };
    showProjectForm.value = false;
  }
};

const cancelProject = () => {
  showProjectForm.value = false;
  newProject.value = { name: '', description: '', color: '#3B82F6', tags: [] };
};

const deleteProject = async (projectId: string) => {
  // Использование кастомной модалки
  const status = await modal.confirmAction('Вы уверены, что хотите удалить проект? Все его данные будут стерты безвозвратно.', 'Удаление проекта')
  if (status) {
    deleteProjectAction(projectId);
  }
};

onMounted(async () => {  
  // Восстанавливаем значения из хранилища
  searchQuery.value = projectFilters.value.search;
  statusFilter.value = projectFilters.value.status;
  selectedTags.value = [...projectFilters.value.tags];
});

// Синхронизация при изменении фильтров из хранилища
watch(projectFilters, (newFilters) => {
  // Обновляем локальные значения только если они действительно отличаются
  if (newFilters.search !== searchQuery.value) {
    searchQuery.value = newFilters.search;
  }
  if (newFilters.status !== statusFilter.value) {
    statusFilter.value = newFilters.status;
  }
  if (JSON.stringify(newFilters.tags) !== JSON.stringify(selectedTags.value)) {
    selectedTags.value = [...newFilters.tags];
  }
}, { deep: true, immediate: true });

// Автоматическое сохранение при изменении локальных значений
watch([searchQuery, statusFilter, selectedTags], () => {
  updateProjectFilters({
    search: searchQuery.value,
    status: statusFilter.value,
    tags: selectedTags.value
  });
}, { deep: true });
</script>

<style lang="scss" scoped>
.custom-select-wrapper {
  position: relative;
  width: 100%;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  font-size: 0.875rem;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.selected-value {
  flex: 1;
}

.dropdown-arrow {
  transition: transform 0.2s ease-in-out;
  font-size: 0.75rem;
  color: #6b7280;
  
  &--open {
    transform: rotate(180deg);
  }
}

.custom-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 10;
  margin-top: 0.25rem;
  overflow: hidden;
}

.select-option {
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f9fafb;
  }
  
  &--selected {
    background: #dbeafe;
    color: #1e40af;
    font-weight: 500;
  }
}

.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition: all 0.2s ease-in-out;
}

.select-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>