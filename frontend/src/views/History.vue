<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <!-- 顶部导航 -->
    <van-nav-bar title="历史记录" fixed />

    <div class="pt-12">
      <!-- 加载中 -->
      <div v-if="loading" class="p-4 space-y-4">
        <van-skeleton title :row="3" v-for="i in 3" :key="i" />
      </div>

      <!-- 空状态 -->
      <van-empty v-else-if="completedGames.length === 0" description="暂无已结束的游戏" />

      <!-- 历史列表 -->
      <div v-else class="p-4 space-y-3">
        <div
          v-for="game in completedGames"
          :key="game.id"
          class="bg-white rounded-xl shadow-sm p-4"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-gray-800 text-lg">{{ game.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ game.gameType || '德州扑克' }}</p>
            </div>
            <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
              已结束
            </span>
          </div>

          <div class="flex justify-between text-sm text-gray-500 mb-3">
            <span>房间号: {{ game.roomCode }}</span>
            <span>{{ formatDate(game.createdAt) }}</span>
          </div>

          <!-- 玩家盈亏概览 -->
          <div v-if="game.players && game.players.length > 0" class="border-t border-gray-100 pt-3">
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="player in game.players"
                :key="player.id"
                class="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2"
              >
                <span class="text-gray-700">{{ player.name }}</span>
                <span
                  class="font-semibold"
                  :class="Number(player.currentScore) >= 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ Number(player.currentScore) >= 0 ? '+' : '' }}{{ Number(player.currentScore) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 展开详情 -->
          <div class="mt-3 text-center">
            <button
              @click="toggleDetail(game.id)"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {{ expandedGameId === game.id ? '收起详情' : '查看详情' }}
            </button>
          </div>

          <!-- 详情展开区域 -->
          <div v-if="expandedGameId === game.id" class="mt-3 border-t border-gray-100 pt-3">
            <div class="text-sm text-gray-600 space-y-2">
              <div class="flex justify-between">
                <span>玩家数:</span>
                <span class="font-medium">{{ game.players?.length || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span>转账数:</span>
                <span class="font-medium">{{ game.transactions?.length || 0 }}</span>
              </div>
            </div>

            <!-- 转账明细 -->
            <div v-if="game.transactions && game.transactions.length > 0" class="mt-3">
              <h4 class="text-sm font-medium text-gray-700 mb-2">转账明细</h4>
              <div class="space-y-1">
                <div
                  v-for="tx in game.transactions"
                  :key="tx.id"
                  class="flex justify-between items-center text-xs bg-gray-50 rounded px-3 py-2"
                >
                  <span class="text-gray-600">
                    {{ tx.fromPlayer?.name || '未知' }} → {{ tx.toPlayer?.name || '未知' }}
                  </span>
                  <span class="font-medium">&yen;{{ tx.amount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()
const loading = ref(false)
const expandedGameId = ref(null)

const completedGames = computed(() => {
  return gameStore.games.filter(g => g.status === 'completed')
})

const toggleDetail = (gameId) => {
  expandedGameId.value = expandedGameId.value === gameId ? null : gameId
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  loading.value = true
  try {
    await gameStore.loadGames()
  } catch {
    // 静默
  } finally {
    loading.value = false
  }
})
</script>
