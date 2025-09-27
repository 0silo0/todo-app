<template>
  <div class="tag-filter">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      🏷️ Теги
      <span v-if="selectedTags.length > 0" class="text-xs text-gray-500">
        ({{ selectedTags.length }} выбрано)
      </span>
    </label>
    
    <input
      v-model="tagSearch"
      placeholder="Поиск тегов..."
      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-500"
    />
    
    <div class="tag-list border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto">
      <div v-if="filteredTags.length === 0 && !showNoTagOption" class="text-center text-gray-500 text-sm py-2">
        Теги не найдены
      </div>
      
      <button
        v-if="showNoTagOption"
        @click="toggleNoTag"
        class="w-full text-left px-3 py-2 rounded-lg mb-1 transition-all duration-200 flex items-center justify-between"
        :class="getNoTagClass()"
      >
        <div class="flex items-center space-x-2">
          <span>📭 Без тега</span>
          <span v-if="noTagCount > 0" class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {{ noTagCount }}
          </span>
        </div>
        <span v-if="isNoTagSelected" class="text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity">×</span>
      </button>
      
      <button
        v-for="tag in filteredTags"
        :key="tag"
        @click="toggleTag(tag)"
        class="w-full text-left px-3 py-2 rounded-lg mb-1 last:mb-0 transition-all duration-200 flex items-center justify-between group"
        :class="getTagClass(tag)"
      >
        <div class="flex items-center space-x-2">
          <span>{{ tag }}</span>
          <span v-if="tagCounts[tag]" class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {{ tagCounts[tag] }}
          </span>
        </div>
        <span v-if="isTagSelected(tag)" class="text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity">×</span>
      </button>
    </div>
    
    <div v-if="selectedTags.length > 0 || isNoTagSelected" class="flex justify-between mt-2">
      <button 
        @click="selectAllTags"
        class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
      >
        Выбрать все
      </button>
      <button 
        @click="clearTags"
        class="text-xs text-red-600 hover:text-red-800 transition-colors"
      >
        Очистить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  availableTags: string[];
  modelValue: string[];
  tagCounts?: Record<string, number>;
  noTagCount?: number;
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  tagCounts: () => ({}),
  noTagCount: 0
});

const emit = defineEmits<Emits>();

const tagSearch = ref('');
const selectedTags = ref<string[]>(props.modelValue);
const NOTAG_VALUE = '__no_tag__';

const isNoTagSelected = computed(() => {
  return selectedTags.value.includes(NOTAG_VALUE);
});

const showNoTagOption = computed(() => {
  return true;
});

const filteredTags = computed(() => {
  if (!tagSearch.value) {
    return props.availableTags;
  }
  return props.availableTags.filter(tag =>
    tag.toLowerCase().includes(tagSearch.value.toLowerCase())
  );
});

const isTagSelected = (tag: string) => {
  return selectedTags.value.includes(tag);
};

const toggleTag = (tag: string) => {
  const newSelectedTags = [...selectedTags.value];
  const index = newSelectedTags.indexOf(tag);
  
  if (index > -1) {
    newSelectedTags.splice(index, 1);
  } else {
    newSelectedTags.push(tag);
  }
  
  selectedTags.value = newSelectedTags;
  emit('update:modelValue', newSelectedTags);
};

const toggleNoTag = () => {
  const newSelectedTags = [...selectedTags.value];
  const index = newSelectedTags.indexOf(NOTAG_VALUE);
  
  if (index > -1) {
    newSelectedTags.splice(index, 1);
  } else {
    newSelectedTags.push(NOTAG_VALUE);
  }
  
  selectedTags.value = newSelectedTags;
  emit('update:modelValue', newSelectedTags);
};

const selectAllTags = () => {
  selectedTags.value = [...props.availableTags, NOTAG_VALUE];
  emit('update:modelValue', selectedTags.value);
};

const clearTags = () => {
  selectedTags.value = [];
  emit('update:modelValue', selectedTags.value);
  tagSearch.value = '';
};

const getTagClass = (tag: string) => {
  return {
    'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm': isTagSelected(tag),
    'hover:bg-gray-50 text-gray-700': !isTagSelected(tag),
    'transform transition-transform duration-150 active:scale-95': true
  };
};

const getNoTagClass = () => {
  return {
    'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm': isNoTagSelected.value,
    'hover:bg-gray-50 text-gray-700': !isNoTagSelected.value,
    'transform transition-transform duration-150 active:scale-95': true
  };
};

watch(() => props.modelValue, (newValue) => {
  selectedTags.value = newValue;
});
</script>

<style scoped>
.tag-list::-webkit-scrollbar {
  width: 4px;
}

.tag-list::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 2px;
}
</style>