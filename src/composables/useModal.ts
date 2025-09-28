import { ref, type VNode, type Component } from 'vue';

export type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Интерфейс для универсального контента модального окна
 * Поддерживает текст, Vue компоненты и VNode
*/
export interface ModalContent {
  type: 'text' | 'component' | 'vnode';
  content?: string; // для текста
  component?: Component; // для компонентов
  vnode?: VNode; // для VNode
  props?: Record<string, any>; // пропсы для компонента
}

/**
 * Опции для настройки модального окна
*/
export interface ModalOptions {
  title?: string;
  content?: ModalContent; // Для универсального контента
  message?: string;       // Для обратной совместимости
  icon?: string;
  type?: ModalType;
  size?: ModalSize;
  confirmText?: string;
  cancelText?: string;
  showConfirm?: boolean;
  showCancel?: boolean;
  closable?: boolean;
  persistent?: boolean;   // Запрещает закрытие по клику вне модалки
  maxWidth?: string;
}

/**
 * Внутреннее состояние модального окна
*/
interface ModalState extends ModalOptions {
  show: boolean;
  loading: boolean;
}

/**
 * Композиция для управления модальными окнами
 * Предоставляет гибкую систему модальных окон с поддержкой промисов
*/
export const useModal = () => {
  // Реактивное состояние модального окна
  const modalState = ref<ModalState>({
    show: false,
    loading: false,
    title: '',
    message: '',
    icon: '',
    type: 'info',
    size: 'md',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    showConfirm: true,
    showCancel: true,
    closable: true,
    persistent: false,
    maxWidth: 'none'
  });

  // Колбэк для разрешения промиса
  let resolvePromise: ((value: boolean) => void) | null = null;

  /**
   * Основная функция показа модального окна
   * @param options - Настройки модального окна
   * @returns Promise, который резолвится при закрытии модалки
  */
  const showModal = (options: ModalOptions = {}): Promise<boolean> => {
    console.log('🔄 showModal вызван с параметрами:', options);

    // Очищаем предыдущий промис если есть
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }

    console.log('dfsa fds ', options.message)

    // Подготавливаем контент
    const content = options.content || (options.message ? {
      type: 'text',
      content: options.message
    } : undefined);
    
    // Обновляем состояние модального окна
    modalState.value = {
      show: true,
      loading: false,
      title: options.title || 'Подтверждение',
      content,
      message: options.message || '',
      icon: options.icon || '',
      type: options.type || 'info',
      size: options.size || 'md',
      confirmText: options.confirmText || 'Подтвердить',
      cancelText: options.cancelText || 'Отмена',
      showConfirm: options.showConfirm !== false,
      showCancel: options.showCancel !== false,
      closable: options.closable !== false,
      persistent: options.persistent || false,
      maxWidth: options.maxWidth || 'none'
    };

    // Возвращаем промис для асинхронного ожидания результата
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const confirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
    modalState.value.show = false;
  };

  const cancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
    modalState.value.show = false;
  };

  const close = () => {
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
    modalState.value.show = false;
  };

  const setLoading = (loading: boolean) => {
    modalState.value.loading = loading;
  };

  const confirmAction = (message: string, title: string = 'Подтвердите действие') => {
    console.log(message, title)
    return showModal({
      title,
      message,
      type: 'confirm',
      icon: '⚠️'
    });
  };

  const showInfo = (message: string, title: string = 'Информация') => {
    return showModal({
      title,
      message,
      type: 'info',
      icon: 'ℹ️'
    });
  };

  const showSuccess = (message: string, title: string = 'Успех') => {
    return showModal({
      title,
      message,
      type: 'success',
      icon: '✅'
    });
  };

  const showError = (message: string, title: string = 'Ошибка') => {
    return showModal({
      title,
      message,
      type: 'error',
      icon: '❌'
    });
  };

  const showWarning = (message: string, title: string = 'Предупреждение') => {
    return showModal({
      title,
      message,
      type: 'warning',
      icon: '⚠️'
    });
  };

  return {
    modalState,
    showModal,
    confirm,
    cancel,
    close,
    setLoading,
    confirmAction,
    showInfo,
    showSuccess,
    showError,
    showWarning
  };
};