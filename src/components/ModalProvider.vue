<template>
    <AppModal
      v-model:show="modalState.show"
      :title="modalState.title"
      :message="modalState.message"
      :icon="modalState.icon"
      :type="modalState.type"
      :size="modalState.size"
      :confirm-text="modalState.confirmText"
      :cancel-text="modalState.cancelText"
      :show-confirm="modalState.showConfirm"
      :show-cancel="modalState.showCancel"
      :closable="modalState.closable"
      :persistent="modalState.persistent"
      :loading="modalState.loading"
      @confirm="confirm"
      @cancel="cancel"
      @close="cancel"
    >
      <slot v-if="$slots.default"></slot>
      <template v-else-if="modalState.message" v-html="modalState.message"></template>
    </AppModal>
  </template>
  
  <script setup lang="ts">
  import { useModal } from '@/composables/useModal';
  import AppModal from './AppModal.vue';
  
  const { modalState, confirm, cancel } = useModal();
  </script>