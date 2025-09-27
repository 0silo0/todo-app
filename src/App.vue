<template>
  <div id="app">
    <router-view />
    <ModalProvider />
  </div>
</template>

<script setup lang="ts">
import ModalProvider from '@/components/ModalProvider.vue';
</script>

<style>
</style>