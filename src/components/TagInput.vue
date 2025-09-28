<template>
    <div class="tag-input">
      <div class="flex flex-wrap gap-2 mb-2">
        <span
          v-for="tag in selectedTags"
          :key="tag"
          class="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
        >
          {{ tag }}
          <button
            @click="removeTag(tag)"
            class="ml-1 text-blue-600 hover:text-blue-800"
          >
            ×
          </button>
        </span>
      </div>
      
      <div class="relative">
        <input
          v-model="tagInput"
          @keydown.enter="addCurrentTag"
          @blur="addCurrentTag"
          placeholder="Добавить тег..."
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <div class="flex space-x-4 mt-2 text-xs text-gray-500 italic text-green-500">
          <span>Для добавления тега нажмите Enter или вне области ввода</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue';
  
  interface Props {
    modelValue: string[];
    availableTags: string[];
  }
  
  interface Emits {
    (e: 'update:modelValue', value: string[]): void;
    (e: 'addTag', value: string): void;
  }
  
  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();
  
  const selectedTags = ref<string[]>(props.modelValue);
  const tagInput = ref('');

  watch(() => props.modelValue, (newValue) => {
    if (JSON.stringify(newValue) !== JSON.stringify(selectedTags.value)) {
      selectedTags.value = [...newValue];
    }
  }, { immediate: true, deep: true });
  
  const addCurrentTag = () => {
    const tag = tagInput.value.trim();
    if (tag && !selectedTags.value.includes(tag)) {
      const newTags = [...selectedTags.value, tag];
      selectedTags.value = newTags;
      emit('update:modelValue', newTags);
      
      if (!props.availableTags.includes(tag)) {
        emit('addTag', tag);
      }
      tagInput.value = '';
    }
  };

  const removeTag = (tag: string) => {
    // Создаем новый массив вместо мутации
    const newTags = selectedTags.value.filter(t => t !== tag);
    selectedTags.value = newTags;
    emit('update:modelValue', newTags);
  };
  </script>