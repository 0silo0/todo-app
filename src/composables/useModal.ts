import { ref } from 'vue';

export type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalOptions {
  title?: string;
  message?: string;
  icon?: string;
  type?: ModalType;
  size?: ModalSize;
  confirmText?: string;
  cancelText?: string;
  showConfirm?: boolean;
  showCancel?: boolean;
  closable?: boolean;
  persistent?: boolean;
}

interface ModalState {
  show: boolean;
  title: string;
  message: string;
  icon: string;
  type: ModalType;
  size: ModalSize;
  confirmText: string;
  cancelText: string;
  showConfirm: boolean;
  showCancel: boolean;
  closable: boolean;
  persistent: boolean;
  loading: boolean;
}

export const useModal = () => {
  const modalState = ref<ModalState>({
    show: false,
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
    loading: false
  });

  let resolvePromise: ((value: boolean) => void) | null = null;

  const showModal = (options: ModalOptions = {}): Promise<boolean> => {
    modalState.value = {
      show: true,
      title: options.title || 'Подтверждение',
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
      loading: false
    };

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

  const setLoading = (loading: boolean) => {
    modalState.value.loading = loading;
  };

  const confirmAction = (message: string, title: string = 'Подтвердите действие') => {
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
    setLoading,
    confirmAction,
    showInfo,
    showSuccess,
    showError,
    showWarning
  };
};