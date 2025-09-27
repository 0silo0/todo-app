import { ref, computed, watch, readonly } from 'vue';
import type { Task, Project, Filters, AppData } from '@/types/todo';
import { generateId, storage, debounce, generateColor } from '@/utils/helpers';

const STORAGE_KEY = 'todo_app_data';

const defaultState: AppData = {
  projects: [
    {
      id: generateId(),
      name: 'Личные задачи',
      description: 'Задачи для личных дел',
      color: '#3B82F6',
      createdAt: new Date(),
      tasks: []
    },
    {
      id: generateId(),
      name: 'Работа',
      description: 'Рабочие задачи',
      color: '#10B981',
      createdAt: new Date(),
      tasks: []
    },
    {
      id: generateId(),
      name: 'Проект X',
      description: 'Специальный проект',
      color: '#8B5CF6',
      createdAt: new Date(),
      tasks: []
    }
  ],
  filters: {
    statuses: ['todo', 'in-progress', 'done'],
    tags: [],
    search: ''
  },
  availableTags: ['Важное', 'Работа', 'Личное', 'Срочно', 'Идея'],
  currentProjectId: ''
};

const appData = ref<AppData>(defaultState);

const loadFromStorage = () => {
  const saved = storage.get(STORAGE_KEY);
  if (saved) {
    saved.projects = saved.projects.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
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
    
    appData.value = { 
      ...defaultState, 
      ...saved,
      currentProjectId: saved.currentProjectId || (saved.projects[0]?.id || '')
    };
  } else {
    appData.value.currentProjectId = appData.value.projects[0]?.id || '';
  }
};

const saveToStorage = debounce(() => {
  storage.set(STORAGE_KEY, appData.value);
}, 300);

loadFromStorage();

export const useTodos = () => {
  const projects = computed(() => appData.value.projects);
  const currentProjectId = computed(() => appData.value.currentProjectId);
  const currentProject = computed(() => 
    projects.value.find(p => p.id === currentProjectId.value) || projects.value[0]
  );
  const tasks = computed(() => currentProject.value?.tasks || []);
  const filters = computed(() => appData.value.filters);
  const availableTags = computed(() => appData.value.availableTags);

  const addProject = (name: string, description: string = '', color?: string) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      color: color || generateColor(),
      createdAt: new Date(),
      tasks: []
    };
    
    projects.value.push(newProject);
    setCurrentProject(newProject.id);
    saveToStorage();
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const project = projects.value.find(p => p.id === projectId);
    if (project) {
      Object.assign(project, updates);
      saveToStorage();
    }
  };

  const deleteProject = (projectId: string) => {
    const index = projects.value.findIndex(p => p.id === projectId);
    if (index !== -1) {
      if (projects.value.length > 1) {
        projects.value.splice(index, 1);
        if (currentProjectId.value === projectId) {
          setCurrentProject(projects.value[0]?.id || '');
        }
        saveToStorage();
      }
    }
  };

  const setCurrentProject = (projectId: string) => {
    appData.value.currentProjectId = projectId;
    saveToStorage();
  };

  const createTask = (title: string, tags: string[] = [], parentId?: string): Task => {
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

  const addTask = (title: string, tags: string[] = [], parentId?: string) => {
    if (!currentProject.value) return;
    
    const newTask = createTask(title, tags);
    
    if (parentId) {
      const parentTask = findTaskById(tasks.value, parentId);
      if (parentTask) {
        parentTask.subtasks.push(newTask);
        parentTask.updatedAt = new Date();
      }
    } else {
      tasks.value.push(newTask);
    }
    saveToStorage();
  };

  const findTaskById = (taskList: Task[], id: string): Task | null => {
    for (const task of taskList) {
      if (task.id === id) return task;
      const found = findTaskById(task.subtasks, id);
      if (found) return found;
    }
    return null;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const task = findTaskById(tasks.value, taskId);
    if (task) {
      Object.assign(task, { ...updates, updatedAt: new Date() });
      saveToStorage();
    }
  };

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
    if (!availableTags.value.includes(tag)) {
      availableTags.value.push(tag);
      saveToStorage();
    }
  };

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

  return {
    projects,
    currentProject,
    currentProjectId,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    
    tasks: filteredTasks,
    filters,
    availableTags,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    addTag,
    updateFilters,

    getProjectTaskCount,
    getProjectProgress,

    replaceData,
    appData: readonly(appData)
  };
};