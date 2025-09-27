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
  availableTags: string[];
  currentProjectId: string;
  version?: string;
}