<template>
  <div class="app-container">
    <div class="page-content">
      <router-view v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>

    <!-- 底部导航栏 - 仅在主要页面显示 -->
    <van-tabbar
      v-if="showTabbar"
      v-model="activeTab"
      route
      :placeholder="true"
      class="app-tabbar"
    >
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="orders-o" to="/history">历史</van-tabbar-item>
      <van-tabbar-item icon="chart-trending-o" to="/statistics">统计</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = ref(0)

// 只在这些页面显示底部导航
const tabbarPages = ['/home', '/history', '/statistics', '/profile']

const showTabbar = computed(() => {
  return tabbarPages.includes(route.path)
})
</script>

<style scoped>
.app-container {
  height: 100vh;
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
}

.app-tabbar {
  --van-tabbar-item-active-color: #16A34A;
}

.app-tabbar :deep(.van-tabbar-item__icon) {
  font-size: 22px;
  margin-bottom: 2px;
}
</style>
