<template>
  <div class="app-container">
    <router-view />

    <!-- 底部导航栏 - 仅在主要页面显示 -->
    <van-tabbar
      v-if="showTabbar"
      v-model="activeTab"
      route
      :placeholder="true"
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
  min-height: 100vh;
}
</style>
