# 📝 Vue 3 ToDo List с шифрованием

![Vue 3](https://img.shields.io/badge/Vue.js-3.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-purple)
![Vite](https://img.shields.io/badge/Vite-7.x-orange)

Универсальное SPA приложение для управления задачами с мультитиповыми статусами, тегами, подзадачами и шифрованным экспортом данных.

## ✨ Особенности

### 🎯 Основной функционал
- ✅ **CRUD операции** с задачами и проектами
- 🏷️ **Система тегов** для гибкой организации
- 📂 **Иерархия проектов** с группировкой задач
- 🔄 **Три статуса задач**: К выполнению, В процессе, Завершено
- 📝 **Подзадачи** с поддержкой до 3 уровней вложенности

### 🔒 Безопасность и данные
- 🔐 **Шифрование AES** для экспорта/импорта
- 💾 **Локальное хранение** (LocalStorage)
- 📤 **Экспорт данных** в зашифрованном формате
- 📥 **Импорт данных** с проверкой целостности

### ⚡ Производительность
- 🚀 **Мгновенная реакция** интерфейса
- 📊 **Оптимизированные перерисовки** Vue 3
- 🎯 **Эффективное управление состоянием**

## 🛠 Технологический стек

| Технология | Назначение |
|------------|------------|
| **Vue 3** + Composition API | Основной фреймворк |
| **TypeScript** | Статическая типизация |
| **Tailwind CSS** | Утилитарные стили |
| **SCSS** | Кастомные стили и анимации |
| **Vite** | Сборка и разработка |
| **AES Encryption** | Шифрование данных |
| **LocalStorage** | Хранение данных |

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 20.19.0
- npm или yarn

### Установка и запуск

```bash
# Клонирование репозитория
git clone <your-repo-url>
cd todo-app

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для production
npm run build

# Проверка типов TypeScript
npm run type-check

# Линтинг кода
npm run lint

```

### Пример структуры storage
```json
{
  "projects": [
    {
      "id": "54b5e65f-aee6-4850-af4c-716cbf169356",
      "name": "Тестовый 1",
      "description": "Очень интересный проект",
      "color": "#8B5CF6",
      "tags": ["Работа", "Учеба", "Развлечения"],
      "availableTags": ["Важное", "Работа", "Личное", "Срочно", "Идея", "ффф", "ввв"],
      "tasks": [
        {
          "id": "572a5fdd-27db-4a1b-b742-e1fbc2ad3d35",
          "title": "Тест",
          "status": "in-progress",
          "tags": [],
          "subtasks": [],
          "createdAt": "2025-09-28T17:03:41.367Z",
          "updatedAt": "2025-09-28T17:03:41.367Z"
        }
      ],
      "createdAt": "2025-09-28T17:02:35.912Z",
      "updatedAt": "2025-09-28T17:03:41.367Z"
    }
  ],
  "currentProjectId": "54b5e65f-aee6-4850-af4c-716cbf169356",
  "filters": {
    "statuses": ["todo", "in-progress", "done"],
    "tags": [],
    "search": ""
  },
  "projectFilters": {
    "search": "",
    "tags": ["Учеба"],
    "status": "active"
  },
  "search": "",
  "status": "active",
  "tags": ["Учеба"]
}
```
### Страница с проектами
![alt text](https://github.com/0silo0/todo-app/blob/assets/projects-page.png)

### Страница создания проекта
![alt text](https://github.com/0silo0/todo-app/blob/assets/creating-project.png)

### Страница проекта
![alt text](https://github.com/0silo0/todo-app/blob/assets/project-page.png)

### Блок с задачами
![alt text](https://github.com/0silo0/todo-app/blob/assets/task-block.png)

### Настройки проекта
![alt text](https://github.com/0silo0/todo-app/blob/assets/project-settings1.png)

![alt text](https://github.com/0silo0/todo-app/blob/assets/project-settings2.png)

### Экспорт данных
![alt text](https://github.com/0silo0/todo-app/blob/assets/export-data.png)

### Импорт данных
![alt text](https://github.com/0silo0/todo-app/blob/assets/import-data.png)