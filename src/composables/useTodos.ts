import { ref, computed, readonly } from 'vue';
import type { Task, Project, Filters, AppData, TaskStatus, ProjectFilters } from '@/types/todo';
import { generateId, storage, debounce, generateColor } from '@/utils/helpers';

const STORAGE_KEY = 'todo_app_data';

const defaultState: AppData = {
  projects: [],
  filters: {
    statuses: ['todo', 'in-progress', 'done'],
    tags: [],
    search: ''
  },
  currentProjectId: '',
  projectFilters: {
    search: '',
    tags: [],
    status: 'all'
  }
};

const appData = ref<AppData>(defaultState);

/**
 * Загружает данные из localStorage с миграцией старых форматов
*/
const loadFromStorage = () => {
  const saved = storage.get(STORAGE_KEY);
  if (saved) {
    // Миграция: переносим глобальные теги в проекты
    saved.projects = saved.projects.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      // Добавляем availableTags к каждому проекту, если их нет
      availableTags: project.availableTags || (saved.availableTags || []).filter((tag: string) => 
        // Переносим только теги, которые используются в задачах проекта
        project.tasks?.some((task: any) => task.tags?.includes(tag))
      ),
      tasks: project.tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        subtasks: task.subtasks.map((subtask: any) => ({
          ...subtask,
          createdAt: new Date(subtask.createdAt),
          updatedAt: new Date(subtask.updatedAt)
        }))
      }))
    }));
    
    // Обновляем состояние с мигрированными данными
    appData.value = { 
      ...defaultState, 
      ...saved,
      currentProjectId: saved.currentProjectId || (saved.projects[0]?.id || ''),
      projectFilters: saved.projectFilters || defaultState.projectFilters
    };
  }
};

const saveToStorage = debounce(() => {
  storage.set(STORAGE_KEY, appData.value);
}, 300);

// Загружаем данные при инициализации
loadFromStorage();

/**
 * Основная композиция для управления задачами и проектами
 * Предоставляет полный CRUD функционал для Todo приложения
*/
export const useTodos = () => {
  const projects = computed(() => appData.value.projects);
  const currentProjectId = computed(() => appData.value.currentProjectId);
  const currentProject = computed(() => 
    projects.value.find(p => p.id === currentProjectId.value) || projects.value[0]
  );
  const tasks = computed(() => currentProject.value?.tasks || []);

  // Глобальные фильтры задач
  const filters = computed(() => appData.value.filters);
  const availableTags = computed(() => {
    return currentProject.value?.availableTags || [];
  });

  /**
   * Создает новый проект
  */
  const addProject = (name: string, description: string = '', color?: string, tags: string[] = []) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      color: color || generateColor(),
      createdAt: new Date(),
      tasks: [],
      availableTags: ['Важное', 'Работа', 'Личное', 'Срочно', 'Идея'], // Стандартные теги
      tags: tags
    };
    
    projects.value.push(newProject);
    setCurrentProject(newProject.id);
    saveToStorage();
  };

  /**
   * Обновляет фильтры проектов
  */
  const updateProjectFilters = (newFilters: Partial<ProjectFilters>) => {
    appData.value.projectFilters = { ...appData.value.projectFilters, ...newFilters };
    saveToStorage();
  };

  const clearProjectFilters = () => {
    appData.value.projectFilters = { ...defaultState.projectFilters };
    saveToStorage();
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const projectIndex = projects.value.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      projects.value[projectIndex] = { 
        ...projects.value[projectIndex], 
        ...updates,
        updatedAt: new Date()
      };
      saveToStorage();
    }
  };

  /**
   * Удаляет задачи проекта по фильтру статусов
  */
  const deleteTasksByFilter = (projectId: string, filter: 'all' | 'todo' | 'in-progress' | 'done') => {
    const project = projects.value.find(p => p.id === projectId);
    if (!project) return;

    if (filter === 'all') {
      // Удаляем все задачи проекта
      project.tasks = [];
    } else {
      // Удаляем задачи по статусу
      project.tasks = project.tasks.filter(task => task.status !== filter);
    }
    saveToStorage();
  };

  /**
   * Получает статистику задач для удаления
  */
  const getTaskStatsForDeletion = (projectId: string) => {
    const project = projects.value.find(p => p.id === projectId);
    if (!project) return { all: 0, todo: 0, 'in-progress': 0, done: 0 };

    const projectTasks = project.tasks;
    return {
      all: projectTasks.length,
      todo: projectTasks.filter(t => t.status === 'todo').length,
      'in-progress': projectTasks.filter(t => t.status === 'in-progress').length,
      done: projectTasks.filter(t => t.status === 'done').length
    };
  };

  const deleteProject = (projectId: string) => {
    const index = projects.value.findIndex(p => p.id === projectId);
    if (index !== -1) {
      projects.value.splice(index, 1);
      if (currentProjectId.value === projectId) {
        setCurrentProject(projects.value[0]?.id || '');
      }
      saveToStorage();
    }
  };

  const filteredProjects = computed(() => {
    return projects.value.filter(project => {
      const filters = appData.value.projectFilters;
      
      // Поиск по названию и описанию
      const matchesSearch = filters.search === '' || 
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(filters.search.toLowerCase()));
      
      // Фильтр по тегам проекта
      const matchesTags = filters.tags.length === 0 || 
        filters.tags.some(tag => project.tags?.includes(tag));
      
      // Фильтр по статусу (активность на основе прогресса)
      const progress = getProjectProgress(project.id);
      let matchesStatus = true;
      switch (filters.status) {
        case 'active':
          matchesStatus = progress < 100;
          break;
        case 'completed':
          matchesStatus = progress === 100;
          break;
        case 'all':
        default:
          matchesStatus = true;
      }
      
      return matchesSearch && matchesTags && matchesStatus;
    });
  });

  /**
   * Все уникальные теги из всех проектов
  */
  const allProjectTags = computed(() => {
    const tags = new Set<string>();
    projects.value.forEach(project => {
      project.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  });

  // Функции для работы с тегами проектов
  const addProjectTag = (projectId: string, tag: string) => {
    const project = projects.value.find(p => p.id === projectId);
    if (project && !project.tags.includes(tag)) {
      project.tags.push(tag);
      project.updatedAt = new Date();
      saveToStorage();
    }
  };

  const removeProjectTag = (projectId: string, tag: string) => {
    const project = projects.value.find(p => p.id === projectId);
    if (project) {
      project.tags = project.tags.filter(t => t !== tag);
      project.updatedAt = new Date();
      saveToStorage();
    }
  };

  /**
   * Устанавливает текущий активный проект
  */
  const setCurrentProject = (projectId: string) => {
    appData.value.currentProjectId = projectId;
    saveToStorage();
  };

  const createTask = (title: string, tags: string[] = []): Task => {
    return {
      id: generateId(),
      title,
      status: 'todo' as const,
      tags,
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: currentProjectId.value
    };
  };

  /**
   * Добавляет задачу в текущий проект
  */
  const addTask = (title: string, tags: string[] = [], parentId?: string) => {
    if (!currentProject.value) return;
    
    const newTask = createTask(title, tags);
    
    if (parentId) {
      // Рекурсивная функция для поиска родительской задачи
      const findParentTask = (taskList: Task[]): Task | null => {
        for (const task of taskList) {
          if (task.id === parentId) return task;
          const found = findParentTask(task.subtasks);
          if (found) return found;
        }
        return null;
      };
      
      const parentTask = findParentTask(currentProject.value.tasks);
      if (parentTask) {
        if (!parentTask.subtasks) {
          parentTask.subtasks = [];
        }
        parentTask.subtasks.push(newTask);
        parentTask.updatedAt = new Date();
      } else {
        // Если родительская задача не найдена, добавляем как корневую
        currentProject.value.tasks.push(newTask);
      }
    } else {
      currentProject.value.tasks.push(newTask);
    }
    saveToStorage();
  };

  /**
   * Рекурсивно ищет задачу по ID
  */
  const findTaskById = (taskList: Task[], id: string): Task | null => {
    for (const task of taskList) {
      if (task.id === id) return task;
      const found = findTaskById(task.subtasks, id);
      if (found) return found;
    }
    return null;
  };

/**
 * Автоматически обновляет статус родительской задачи на основе статусов подзадач
*/
const updateParentStatus = (taskId: string, currentStatus: TaskStatus) => {
  const findParent = (tasks: Task[], childId: string): Task | null => {
    for (const task of tasks) {
      if (task.subtasks.some(st => st.id === childId)) return task;
      const found = findParent(task.subtasks, childId);
      if (found) return found;
    }
    return null;
  };

  const updateParentRecursive = (childId: string, childNewStatus: TaskStatus) => {
    const parent = findParent(currentProject.value?.tasks || [], childId);
    if (!parent) return;

    // Проверяем статусы всех подзадач родителя
    const hasActiveChildren = parent.subtasks.some(child => 
      child.status === 'in-progress' || child.status === 'todo'
    );
    
    const allChildrenDone = parent.subtasks.every(child => 
      child.status === 'done'
    );

    let newParentStatus = parent.status;

    // Переоткрываем завершенного родителя если подзадача становится активной
    if (parent.status === 'done' && childNewStatus !== 'done') {
      newParentStatus = 'in-progress';
    }
    // Если все дети завершены, то завершаем родителя
    else if (allChildrenDone && parent.status !== 'done') {
      newParentStatus = 'done';
    }
    // Если есть активные дети и родитель еще не в процессе, то переводим в процесс
    else if (hasActiveChildren && parent.status === 'todo') {
      newParentStatus = 'in-progress';
    }

    // Если статус изменился, обновляем и продолжаем вверх по иерархии
    if (newParentStatus !== parent.status) {
      const updates: Partial<Task> = { status: newParentStatus };
      if (parent.status === 'done' && newParentStatus === 'in-progress') {
        updates.updatedAt = new Date(); // Обновляем дату изменения
      }
      
      updateTask(parent.id, updates);
      updateParentRecursive(parent.id, newParentStatus); // Рекурсивно обновляем родителя родителя
    }
  };

  updateParentRecursive(taskId, currentStatus);
};

/**
 * Обновляет задачу и автоматически синхронизирует статусы родителей
*/
const updateTask = (taskId: string, updates: Partial<Task>) => {
  const task = findTaskById(tasks.value, taskId);
  if (task) {
    const oldStatus = task.status;
    Object.assign(task, { ...updates, updatedAt: new Date() });
    saveToStorage();
    
    // Автоматически обновляем статусы родителей при изменении статуса
    if (updates.status && updates.status !== oldStatus) {
      updateParentStatus(taskId, updates.status);
    }
  }
};

  /**
   * Удаляет задачу (рекурсивно ищет в дереве задач)
  */
  const deleteTask = (taskId: string) => {
    const removeFromArray = (arr: Task[]): boolean => {
      const index = arr.findIndex(t => t.id === taskId);
      if (index !== -1) {
        arr.splice(index, 1);
        return true;
      }
      for (const task of arr) {
        if (removeFromArray(task.subtasks)) return true;
      }
      return false;
    };

    if (removeFromArray(tasks.value)) {
      saveToStorage();
    }
  };

  const addSubtask = (parentId: string, title: string, tags: string[] = []) => {
    addTask(title, tags, parentId);
  };

  const addTag = (tag: string) => {
    if (currentProject.value && !currentProject.value.availableTags.includes(tag)) {
      addTagToProject(currentProject.value.id, tag);
    }
  };

  const noTagCount = computed(() => {
    return currentProject.value?.tasks.filter(task => 
      task.tags.length === 0
    ).length || 0;
  });

  const tagCounts = computed(() => {
    const counts: Record<string, number> = {};
    
    currentProject.value?.tasks.forEach(task => {
      task.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    
    return counts;
  });

  const filteredTasks = computed(() => {
    const filterTasks = (taskList: Task[]): Task[] => {
      return taskList.filter(task => {
        const matchesStatus = filters.value.statuses.includes(task.status);
        const matchesSearch = task.title.toLowerCase().includes(filters.value.search.toLowerCase());
        
        let matchesTags = true;
        
        if (filters.value.tags.length > 0) {
          const hasNoTagOption = filters.value.tags.includes('__no_tag__');
          const normalTags = filters.value.tags.filter(tag => tag !== '__no_tag__');
          
          if (hasNoTagOption && normalTags.length > 0) {
            matchesTags = task.tags.length === 0 || normalTags.some(tag => task.tags.includes(tag));
          } else if (hasNoTagOption) {
            matchesTags = task.tags.length === 0;
          } else {
            matchesTags = normalTags.some(tag => task.tags.includes(tag));
          }
        }
        
        if (matchesStatus && matchesSearch && matchesTags) {
          return true;
        }
        
        const filteredSubtasks = filterTasks(task.subtasks);
        return filteredSubtasks.length > 0;
      }).map(task => ({
        ...task,
        subtasks: filterTasks(task.subtasks)
      }));
    };

    return filterTasks(tasks.value);
  });

  const updateFilters = (newFilters: Partial<Filters>) => {
    appData.value.filters = { ...appData.value.filters, ...newFilters };
    saveToStorage();
  };

  const getProjectTaskCount = (projectId: string): number => {
    const project = projects.value.find(p => p.id === projectId);
    return project ? project.tasks.length : 0;
  };
  
  const getProjectProgress = (projectId: string): number => {
    const project = projects.value.find(p => p.id === projectId);
    if (!project || project.tasks.length === 0) return 0;
    
    const doneTasks = project.tasks.filter(task => task.status === 'done').length;
    return Math.round((doneTasks / project.tasks.length) * 100);
  };

  /**
   * Полностью заменяет данные приложения (используется при импорте)
  */
  const replaceData = (newData: AppData) => {
    appData.value = { 
      ...defaultState, 
      ...newData,
      filters: {
        ...defaultState.filters,
        ...newData.filters
      }
    };
    saveToStorage();
    
    if (newData.currentProjectId) {
      setCurrentProject(newData.currentProjectId);
    }
  };

  const addTagToProject = (projectId: string, tag: string) => {
    const project = projects.value.find(p => p.id === projectId);
    if (project && !project.availableTags.includes(tag)) {
      project.availableTags.push(tag);
      project.updatedAt = new Date();
      saveToStorage();
    }
  };

  const removeTagFromProject = (projectId: string, tag: string) => {
    const project = projects.value.find(p => p.id === projectId);
    if (project) {
      // Создаем новый массив availableTags
      project.availableTags = project.availableTags.filter(t => t !== tag);
      
      // Рекурсивно создаем новые объекты задач с новыми массивами тегов
      const removeTagFromTasks = (tasks: Task[]): Task[] => {
        return tasks.map(task => ({
          ...task,
          tags: task.tags.filter(t => t !== tag), // Новый массив тегов
          updatedAt: new Date(),
          subtasks: removeTagFromTasks(task.subtasks)
        }));
      };
      
      // Заменяем массив задач полностью
      project.tasks = removeTagFromTasks(project.tasks);
      project.updatedAt = new Date();
      saveToStorage();
    }
  };

  return {
    projects,
    currentProject,
    currentProjectId,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    deleteTasksByFilter,
    getTaskStatsForDeletion,
    projectFilters: computed(() => appData.value.projectFilters),
    filteredProjects,
    allProjectTags,
    addProjectTag,
    removeProjectTag,
    updateProjectFilters,
    clearProjectFilters,
    
    tasks: filteredTasks,
    filters,
    availableTags,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    addTag,
    noTagCount,
    tagCounts,
    addTagToProject,
    updateFilters,

    getProjectTaskCount,
    getProjectProgress,

    replaceData,
    appData: readonly(appData),
    removeTagFromProject
  };
};