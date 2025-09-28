<template>
  <div class="project-tag-filter">
    <div class="flex flex-wrap gap-2 mb-3">
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
      
      <button
        v-if="selectedTags.length > 0"
        @click="clearAll"
        class="text-gray-500 hover:text-gray-700 text-sm px-2 py-1"
      >
        Очистить все
      </button>
    </div>
    
    <div class="relative">
      <input
        v-model="searchInput"
        @focus="showSuggestions = true"
        @blur="onBlur"
        placeholder="Поиск тегов..."
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      
      <div
        v-if="showSuggestions && filteredTags.length > 0"
        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto"
      >
        <button
          v-for="tag in filteredTags"
          :key="tag"
          @click="selectTag(tag)"
          @mousedown.prevent
          class="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
        >
          {{ tag }}
        </button>
      </div>
    </div>
    
    <div v-if="popularTags.length > 0" class="mt-3">
      <p class="text-xs text-gray-600 mb-2">Популярные теги:</p>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="tag in popularTags"
          :key="tag"
          @click="selectTag(tag)"
          class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-200 transition-colors"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  modelValue: string[];
  availableTags: string[];
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchInput = ref('');
const showSuggestions = ref(false);
const selectedTags = ref<string[]>(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  selectedTags.value = [...newValue];
}, { immediate: true });

const filteredTags = computed(() => {
  return props.availableTags.filter(tag => 
    tag.toLowerCase().includes(searchInput.value.toLowerCase()) &&
    !selectedTags.value.includes(tag)
  );
});

const popularTags = computed(() => {
  return props.availableTags.slice(0, 5).filter(tag => !selectedTags.value.includes(tag));
});

const selectTag = (tag: string) => {
  if (!selectedTags.value.includes(tag)) {
    const newTags = [...selectedTags.value, tag];
    selectedTags.value = newTags;
    emit('update:modelValue', newTags);
    searchInput.value = '';
    showSuggestions.value = false;
  }
};

const removeTag = (tag: string) => {
  const newTags = selectedTags.value.filter(t => t !== tag);
  selectedTags.value = newTags;
  emit('update:modelValue', newTags);
};

const clearAll = () => {
  selectedTags.value = [];
  emit('update:modelValue', []);
};

/**
 * Обработчик потери фокуса с задержкой
 * Задержка нужна для обработки кликов по подсказкам
*/
const onBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
};
</script>