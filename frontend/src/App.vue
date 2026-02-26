<template>
  <router-view />

  <!-- Toast 容器 -->
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <Toast
      v-for="toast in toastStore.toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="toastStore.removeToast(toast.id)"
    />
  </div>
</template>

<script setup>
import { useToastStore } from './stores/toast';
import Toast from './components/Toast.vue';

const toastStore = useToastStore();
</script>
