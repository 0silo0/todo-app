<template>
    <transition name="modal" appear>
      <div v-if="show" class="modal-overlay" @click.self="handleOverlayClick">
        <div class="modal-container" :class="modalSize" :style="customStyles">
          <div class="modal-header" :class="headerClass">
            <div class="flex items-center space-x-2">
              <span v-if="icon" class="text-xl">{{ icon }}</span>
              <h3 class="modal-title">{{ title }}</h3>
            </div>
            <button
              v-if="closable"
              @click="handleClose"
              class="modal-close-btn"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
  
          <div class="modal-content">
            <div v-if="$slots.default" class="modal-body">
              <slot></slot>
            </div>
            <div v-else class="modal-body">
              <p class="text-gray-700">{{ message }}</p>
            </div>
          </div>
  
          <div v-if="showFooter" class="modal-footer">
            <button
              v-if="showCancel"
              @click="handleCancel"
              :disabled="loading"
              class="modal-btn modal-btn-cancel"
              :class="{ 'opacity-50 cursor-not-allowed': loading }"
            >
              {{ cancelText }}
            </button>
            <button
              v-if="showConfirm"
              @click="handleConfirm"
              :disabled="loading"
              class="modal-btn modal-btn-confirm"
              :class="[confirmButtonClass, { 'opacity-50 cursor-not-allowed': loading }]"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loadingText }}
              </span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  
  interface Props {
    show: boolean;
    title?: string;
    message?: string;
    icon?: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    loadingText?: string;
    closable?: boolean;
    showConfirm?: boolean;
    showCancel?: boolean;
    showFooter?: boolean;
    closeOnOverlay?: boolean;
    persistent?: boolean;
  }
  
  interface Emits {
    (e: 'update:show', value: boolean): void;
    (e: 'confirm'): void;
    (e: 'cancel'): void;
    (e: 'close'): void;
  }
  
  const props = withDefaults(defineProps<Props>(), {
    title: 'Подтверждение',
    message: '',
    type: 'info',
    size: 'md',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    loading: false,
    loadingText: 'Загрузка...',
    closable: true,
    showConfirm: true,
    showCancel: true,
    showFooter: true,
    closeOnOverlay: true,
    persistent: false
  });
  
  const emit = defineEmits<Emits>();
  
  const headerClass = computed(() => {
    const classes = {
      info: 'bg-blue-500 text-white',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-white',
      error: 'bg-red-500 text-white',
      confirm: 'bg-blue-500 text-white'
    };
    return classes[props.type];
  });
  
  const confirmButtonClass = computed(() => {
    const classes = {
      info: 'bg-blue-500 hover:bg-blue-600 text-white',
      success: 'bg-green-500 hover:bg-green-600 text-white',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      error: 'bg-red-500 hover:bg-red-600 text-white',
      confirm: 'bg-blue-500 hover:bg-blue-600 text-white'
    };
    return classes[props.type];
  });
  
  const modalSize = computed(() => {
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };
    return sizes[props.size];
  });
  
  const customStyles = computed(() => {
    return {
      width: props.size === 'xl' ? '90vw' : 'auto',
      maxWidth: props.size === 'xl' ? '1200px' : 'none'
    };
  });
  
  const handleConfirm = () => {
    if (!props.loading) {
      emit('confirm');
      if (!props.persistent) {
        emit('update:show', false);
      }
    }
  };
  
  const handleCancel = () => {
    if (!props.loading) {
      emit('cancel');
      emit('update:show', false);
    }
  };
  
  const handleClose = () => {
    if (!props.loading) {
      emit('close');
      emit('update:show', false);
    }
  };
  
  const handleOverlayClick = () => {
    if (props.closeOnOverlay && !props.loading && !props.persistent) {
      handleClose();
    }
  };
  
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.show && !props.persistent) {
      handleClose();
    }
  };
  
  if (typeof window !== 'undefined') {
    if (props.show) {
      window.addEventListener('keydown', handleKeydown);
    } else {
      window.removeEventListener('keydown', handleKeydown);
    }
  }
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-container {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .modal-header {
    padding: 1.25rem 1.5rem 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }
  
  .modal-close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }
  
  .modal-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .modal-content {
    flex: 1;
    overflow-y: auto;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem 1.5rem;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }
  
  .modal-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    min-width: 5rem;
  }
  
  .modal-btn-cancel {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .modal-btn-cancel:hover {
    background-color: #e5e7eb;
  }
  
  .modal-btn-confirm {
    color: white;
  }
  
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
  
  .modal-enter-active .modal-container,
  .modal-leave-active .modal-container {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.95);
    opacity: 0;
  }
  </style>