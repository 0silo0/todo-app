<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
          📂 Мои проекты
        </h1>
        <p class="text-gray-600">Управляйте вашими проектами и задачами</p>
      </header>

      <!-- Кнопка создания проекта -->
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
      <div v-if="projects.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projects"
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

      <!-- Пустой состояние -->
      <div v-else class="text-center py-16 bg-white rounded-xl shadow-lg">
        <div class="text-6xl mb-4">🏗️</div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Проектов пока нет</h3>
        <p class="text-gray-600 mb-6">Создайте первый проект чтобы начать работу</p>
        <button
          @click="showProjectForm = true"
          class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Создать проект
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTodos } from '../composables/useTodos';
import { formatDate } from '@/utils/helpers';

const router = useRouter();
const { 
  projects, 
  addProject: addProjectAction, 
  deleteProject: deleteProjectAction,
  getProjectTaskCount,
  getProjectProgress 
} = useTodos();

const showProjectForm = ref(false);
const newProject = ref({
  name: '',
  description: '',
  color: '#3B82F6'
});

const availableColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const openProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const createProject = () => {
  if (newProject.value.name.trim()) {
    addProjectAction(newProject.value.name, newProject.value.description, newProject.value.color);
    newProject.value = { name: '', description: '', color: '#3B82F6' };
    showProjectForm.value = false;
  }
};

const cancelProject = () => {
  showProjectForm.value = false;
  newProject.value = { name: '', description: '', color: '#3B82F6' };
};

const deleteProject = (projectId: string) => {
  if (confirm('Удалить проект и все его задачи?')) {
    deleteProjectAction(projectId);
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>