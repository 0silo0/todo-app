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
          @keydown.backspace="handleBackspace"
          @blur="addCurrentTag"
          placeholder="Добавить тег..."
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        
        <div
          v-if="filteredAvailableTags.length && tagInput"
          class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto"
        >
          <button
            v-for="tag in filteredAvailableTags"
            :key="tag"
            @click="selectTag(tag)"
            class="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue';
  
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
  
  const filteredAvailableTags = computed(() => {
    return props.availableTags.filter(tag => 
      tag.toLowerCase().includes(tagInput.value.toLowerCase()) &&
      !selectedTags.value.includes(tag)
    );
  });
  
  const addCurrentTag = () => {
    if (tagInput.value.trim() && !selectedTags.value.includes(tagInput.value.trim())) {
      const newTag = tagInput.value.trim();
      selectedTags.value.push(newTag);
      emit('update:modelValue', selectedTags.value);
      emit('addTag', newTag);
      tagInput.value = '';
    }
  };
  
  const selectTag = (tag: string) => {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag);
      emit('update:modelValue', selectedTags.value);
      tagInput.value = '';
    }
  };
  
  const removeTag = (tag: string) => {
    selectedTags.value = selectedTags.value.filter(t => t !== tag);
    emit('update:modelValue', selectedTags.value);
  };
  
  const handleBackspace = (event: KeyboardEvent) => {
    if (tagInput.value === '' && selectedTags.value.length > 0) {
      selectedTags.value.pop();
      emit('update:modelValue', selectedTags.value);
    }
  };
  </script>