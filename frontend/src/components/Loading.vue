<template>
  <div class="flex flex-col items-center justify-center p-8">
    <div :class="sizeClass" class="border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p v-if="text" class="mt-4 text-gray-600">{{ text }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '加载中...'
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
});

const sizeClass = computed(() => {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };
  return sizes[props.size];
});
</script>
