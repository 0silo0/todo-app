export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  tags: string[];
  subtasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  tasks: Task[];
  updatedAt?: Date;
  availableTags: string[];
  tags: string[];
}

export interface ProjectFilters {
  search: string;
  tags: string[];
  status: 'all' | 'active' | 'completed';
}

export interface Filters {
  statuses: TaskStatus[];
  tags: string[];
  search: string;
  projectId?: string;
}

export interface AppData {
  projects: Project[];
  filters: Filters;
  currentProjectId: string;
  version?: string;
  projectFilters: ProjectFilters;
}