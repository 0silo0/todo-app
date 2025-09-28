<template>
  <!-- Анимация появления/исчезновения -->
  <transition name="modal" appear>
    <div v-if="show" class="modal-overlay" @click.self="handleOverlayClick">
      <!-- Основной контейнер модалки с адаптивными классами -->
      <div class="modal-container" :class="modalSize" :style="customStyles">
        
        <!-- Хедер с иконкой и заголовком -->
        <div class="modal-header" :class="headerClass">
          <div class="flex items-center space-x-2 min-w-0">
            <span v-if="icon" class="text-xl flex-shrink-0">{{ icon }}</span>
            <h3 class="modal-title truncate">{{ title }}</h3>
          </div>
          <!-- Кнопка закрытия с доступностью -->
          <button
            v-if="closable"
            @click="handleClose"
            class="modal-close-btn"
            aria-label="Закрыть"
            :disabled="loading"
          >
            ×
          </button>
        </div>

        <!-- Основной контент с приоритетом слотов -->
        <div class="modal-content">
          <div class="modal-body">
            <!-- 1. ПРИОРИТЕТ: слот по умолчанию (максимальная гибкость) -->
            <slot v-if="$slots.default"></slot>
            
            <!-- 2. Динамический компонент (для глобальной модалки) -->
            <component
              v-else-if="content?.type === 'component' && content.component"
              :is="content.component"
              v-bind="content.props || {}"
              @confirm="handleConfirm"
              @cancel="handleCancel"
            />
            
            <!-- 3. VNode (альтернатива для программируемого контента) -->
            <div v-else-if="content?.type === 'vnode' && content.vnode">
              <component :is="content.vnode" />
            </div>
            
            <!-- 4. Простое текстовое сообщение -->
            <p v-else-if="message" class="text-gray-700 whitespace-pre-wrap">{{ message }}</p>
            
            <!-- 5. Fallback: пустая модалка (защита от ошибок) -->
            <div v-else class="min-h-[60px]"></div>
          </div>
        </div>

        <!-- Футер с кастомным слотом или стандартными кнопками -->
        <div v-if="$slots.footer || showFooter" class="modal-footer">
          <slot name="footer">
            <!-- Стандартные кнопки действий -->
            <div class="flex gap-3 justify-end w-full">
              <!-- Кнопка отмены -->
              <button
                v-if="showCancel"
                @click="handleCancel"
                :disabled="loading"
                class="modal-btn modal-btn-cancel"
                :class="{ 'opacity-50 cursor-not-allowed': loading }"
              >
                {{ cancelText }}
              </button>
              <!-- Кнопка подтверждения с индикатором загрузки -->
              <button
                v-if="showConfirm"
                @click="handleConfirm"
                :disabled="loading"
                class="modal-btn modal-btn-confirm"
                :class="[confirmButtonClass, { 'opacity-50 cursor-not-allowed': loading }]"
              >
                <span v-if="loading" class="flex items-center">
                  <!-- SVG спиннер для индикации загрузки -->
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ loadingText }}
                </span>
                <span v-else>{{ confirmText }}</span>
              </button>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted, type Component, type VNode } from 'vue';

/**
 * УНИВЕРСАЛЬНЫЙ КОМПОНЕНТ МОДАЛЬНОГО ОКНА
 * 
 * Особенности:
 * - Поддержка 5 типов контента (слоты, компоненты, VNode, текст, fallback)
 * - 5 размеров и кастомная максимальная ширина
 * - 5 типов модалок с соответствующими стилями
 * - Полная доступность (клавиатура, ARIA)
 * - Загрузочные состояния
 * - Анимации и адаптивный дизайн
 */

// === ТИПЫ И ИНТЕРФЕЙСЫ ===

/** Типы контента для универсальности */
export type ModalContentType = 'text' | 'component' | 'vnode';

/** Интерфейс для универсального контента */
export interface ModalContent {
  type: ModalContentType;
  content?: string;
  component?: Component;
  vnode?: VNode;
  props?: Record<string, any>;
}

/** Пропсы компонента с подробными комментариями */
interface Props {
  show: boolean;                    // Видимость модалки
  title?: string;                   // Заголовок
  message?: string;                 // Текстовое сообщение (устаревшее, лучше использовать content)
  content?: ModalContent;           // Универсальный контент
  icon?: string;                    // Иконка в заголовке
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm'; // Тип модалки
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'; // Размер
  confirmText?: string;             // Текст кнопки подтверждения
  cancelText?: string;              // Текст кнопки отмены
  loading?: boolean;                // Состояние загрузки
  loadingText?: string;             // Текст при загрузке
  closable?: boolean;               // Возможность закрытия
  showConfirm?: boolean;            // Показывать кнопку подтверждения
  showCancel?: boolean;             // Показывать кнопку отмены
  showFooter?: boolean;             // Показывать футер
  closeOnOverlay?: boolean;         // Закрытие по клику на оверлей
  persistent?: boolean;             // Постоянная модалка (не закрывается)
  maxWidth?: string;                // Кастомная максимальная ширина
}

interface Emits {
  (e: 'update:show', value: boolean): void;  // Двусторонняя связь для show
  (e: 'confirm'): void;                      // Подтверждение
  (e: 'cancel'): void;                       // Отмена
  (e: 'close'): void;                        // Закрытие
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
  persistent: false,
  maxWidth: 'none'
});

const emit = defineEmits<Emits>();

// === COMPUTED СВОЙСТВА ДЛЯ СТИЛЕЙ ===

/** Классы для хедера в зависимости от типа модалки */
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

/** Классы для кнопки подтверждения */
const confirmButtonClass = computed(() => {
  const classes = {
    info: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white',
    success: 'bg-green-500 hover:bg-green-600 focus:ring-green-500 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 text-white',
    error: 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white',
    confirm: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white'
  };
  return classes[props.type];
});

/** Классы размера модалки */
const modalSize = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
    fullscreen: 'max-w-full max-h-full m-4'
  };
  return sizes[props.size];
});

/** Кастомные стили для расширенной кастомизации */
const customStyles = computed(() => {
  const styles: any = {};
  
  // Кастомная максимальная ширина
  if (props.maxWidth !== 'none') {
    styles.maxWidth = props.maxWidth;
  }
  
  // Специфичные стили для разных размеров
  if (props.size === 'fullscreen') {
    styles.width = 'calc(100vw - 2rem)';
    styles.height = 'calc(100vh - 2rem)';
  } else if (props.size === 'xl') {
    styles.width = '90vw';
  }
  
  return styles;
});

// === ОБРАБОТЧИКИ СОБЫТИЙ ===

const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm');
    // Закрываем модалку если она не персистентная
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

// === УПРАВЛЕНИЕ КЛАВИАТУРОЙ ===
const handleKeydown = (event: KeyboardEvent) => {
  // Игнорируем если модалка не показана или заблокирована
  if (!props.show || props.loading || props.persistent) return;
  
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      handleClose();
      break;
    case 'Enter':
      // Enter подтверждает только если показана кнопка подтверждения
      if (props.showConfirm && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        handleConfirm();
      }
      break;
  }
};

// === УПРАВЛЕНИЕ СОСТОЯНИЕМ МОДАЛКИ ===

/** Отслеживание состояния показа модалки */
watch(() => props.show, (newVal) => {
  if (newVal) {
    // Добавляем обработчик клавиатуры при открытии
    document.addEventListener('keydown', handleKeydown);
    // Блокируем скролл body
    document.body.style.overflow = 'hidden';
  } else {
    // Убираем обработчик при закрытии
    document.removeEventListener('keydown', handleKeydown);
    // Восстанавливаем скролл
    document.body.style.overflow = '';
  }
}, { immediate: true });

/** Очистка при размонтировании */
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<style lang="scss" scoped>
$modal-z-index: 1000;
$modal-overlay-bg: rgba(0, 0, 0, 0.5);
$modal-border-radius: 0.75rem;
$modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
$modal-transition: 0.3s ease;

// Основные стили модалки
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: $modal-overlay-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $modal-z-index;
  padding: 1rem;
  animation: overlay-fade $modal-transition;

  @media (max-width: 640px) {
    @apply p-2;
  }
}

.modal-container {
  @apply bg-white;
  
  border-radius: $modal-border-radius;
  box-shadow: $modal-shadow;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-slide $modal-transition;

  @media (max-width: 640px) {
    max-height: 95vh;
  }
}

.modal-header {
  @apply px-6 py-4 flex items-start justify-between flex-shrink-0;

  .modal-title {
    @apply text-xl font-semibold m-0 leading-relaxed truncate;
  }
}

.modal-close-btn {
  @apply bg-transparent border-none text-2xl cursor-pointer p-1 rounded transition-colors;
  
  color: inherit;
  line-height: 1;
  width: rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 0.5rem;

  &:hover:not(:disabled) {
    @apply bg-white bg-opacity-20;
  }

  &:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
}

.modal-content {
  @apply flex-1 overflow-y-auto;
  min-height: 0;
}

.modal-body {
  @apply px-6 py-4;
}

.modal-footer {
  @apply px-6 py-4 flex gap-3 justify-end flex-shrink-0 border-t border-gray-200;

  // Адаптивность
  @media (max-width: 640px) {
    @apply flex-col-reverse p-4;
  }
}

.modal-btn {
  @apply px-5 py-2.5 rounded-lg font-medium transition-all border-none cursor-pointer min-w-[6rem] text-sm outline-none relative;

  &:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  // Модификаторы кнопок
  &-cancel {
    @apply bg-gray-50 text-gray-700 border border-gray-300;

    &:hover:not(:disabled) {
      @apply bg-gray-100 border-gray-400;
    }
  }

  &-confirm {
    @apply text-white border border-transparent;
  }

  // Адаптивность
  @media (max-width: 640px) {
    @apply min-w-full w-full;
  }
}

// Анимации
.modal-enter-active,
.modal-leave-active {
  transition: opacity $modal-transition;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active {
  .modal-container {
    transition: transform $modal-transition, opacity $modal-transition;
  }
}

.modal-leave-active {
  .modal-container {
    transition: transform $modal-transition, opacity $modal-transition;
  }
}

.modal-enter-from,
.modal-leave-to {
  .modal-container {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
  }
}

@keyframes overlay-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-slide {
  from {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>