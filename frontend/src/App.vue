<template>
  <div class="app-container">
    <div class="page-content">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </div>

    <van-tabbar
      v-if="showTabbar"
      :model-value="activeTab"
      :placeholder="true"
      class="app-tabbar"
      @change="handleTabChange"
    >
      <van-tabbar-item name="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item name="/history" icon="orders-o">历史</van-tabbar-item>
      <van-tabbar-item name="/statistics" icon="chart-trending-o">统计</van-tabbar-item>
      <van-tabbar-item name="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>

    <SettingsDrawer />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsDrawer from './components/SettingsDrawer.vue'
import { useSettingsStore } from './stores/settings'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

settingsStore.init()

const tabbarPages = ['/home', '/history', '/statistics', '/profile']

const showTabbar = computed(() => {
  return tabbarPages.includes(route.path)
})

const activeTab = computed(() => {
  return tabbarPages.includes(route.path) ? route.path : ''
})

const handleTabChange = (path) => {
  if (!path || path === route.path) return
  router.push(path)
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container > :deep(.van-tabbar--placeholder) {
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  position: relative;
  z-index: 0;
}

.app-tabbar {
  --van-tabbar-item-active-color: #16A34A;
  z-index: 10;
}

.app-tabbar :deep(.van-tabbar-item__icon) {
  font-size: calc(22px * var(--font-scale, 1));
  margin-bottom: 2px;
}
</style>
