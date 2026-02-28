<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <!-- 顶部导航 -->
    <van-nav-bar title="统计数据" fixed />

    <div class="pt-12 p-4">
      <!-- 加载中 -->
      <div v-if="loading" class="space-y-4">
        <van-skeleton title :row="2" v-for="i in 3" :key="i" />
      </div>

      <template v-else>
        <!-- 总览卡片 -->
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-6 shadow-lg">
          <h2 class="text-lg font-medium opacity-90 mb-4">净盈亏</h2>
          <div class="text-4xl font-bold mb-1">
            {{ stats.profit >= 0 ? '+' : '' }}&yen;{{ stats.profit.toFixed(2) }}
          </div>
          <p class="text-sm opacity-75 mt-2">
            共 {{ stats.totalGames }} 局游戏 | {{ stats.totalTransactions }} 笔转账
          </p>
        </div>

        <!-- 统计详情卡片 -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">总转出</div>
            <div class="text-xl font-bold text-orange-600">&yen;{{ stats.totalSent.toFixed(2) }}</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">总转入</div>
            <div class="text-xl font-bold text-green-600">&yen;{{ stats.totalReceived.toFixed(2) }}</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">已完成</div>
            <div class="text-xl font-bold text-gray-800">{{ stats.completedGames }} 局</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <div class="text-sm text-gray-500 mb-1">进行中</div>
            <div class="text-xl font-bold text-blue-600">{{ stats.activeGames }} 局</div>
          </div>
        </div>

        <!-- 转入/转出比例条 -->
        <div v-if="stats.totalSent > 0 || stats.totalReceived > 0" class="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 class="text-base font-semibold text-gray-800 mb-4">转出/转入比例</h3>
          <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="stats.profit >= 0 ? 'bg-green-500' : 'bg-red-500'"
              :style="{ width: profitBarWidth + '%' }"
            ></div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-500">
            <span>转出: &yen;{{ stats.totalSent.toFixed(0) }}</span>
            <span>转入: &yen;{{ stats.totalReceived.toFixed(0) }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty
          v-if="stats.totalGames === 0"
          image="search"
          description="暂无统计数据，开始一局游戏吧"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '../stores/user'
import { gameApi } from '../api/game'

const userStore = useUserStore()
const loading = ref(false)

const stats = ref({
  totalGames: 0,
  completedGames: 0,
  activeGames: 0,
  totalTransactions: 0,
  totalSent: 0,
  totalReceived: 0,
  profit: 0
})

const profitBarWidth = computed(() => {
  const total = stats.value.totalSent + stats.value.totalReceived
  if (total === 0) return 50
  return Math.min(95, Math.max(5, (stats.value.totalReceived / total) * 100))
})

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    return
  }

  loading.value = true
  try {
    const data = await gameApi.getStatistics()
    stats.value = data
  } catch {
    showToast('加载统计数据失败')
  } finally {
    loading.value = false
  }
})
</script>
