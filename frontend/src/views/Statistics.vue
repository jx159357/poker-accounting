<template>
  <div class="min-h-screen bg-gray-50">
    <van-nav-bar title="数据统计" left-arrow fixed placeholder @click-left="router.back()" />

    <div class="p-4">
      <van-loading v-if="loading" class="py-8" />

      <div v-else-if="stats" class="space-y-4">
        <!-- 总体统计 -->
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-lg font-bold mb-3">总体数据</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ stats.totalGames }}</div>
              <div class="text-sm text-gray-500 mt-1">总场次</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ stats.winRate }}%</div>
              <div class="text-sm text-gray-500 mt-1">胜率</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ stats.totalWins }}</div>
              <div class="text-sm text-gray-500 mt-1">胜场</div>
            </div>
            <div class="text-center">
              <div
                :class="stats.totalScore >= 0 ? 'text-green-600' : 'text-red-600'"
                class="text-2xl font-bold"
              >
                {{ stats.totalScore >= 0 ? '+' : '' }}{{ stats.totalScore }}
              </div>
              <div class="text-sm text-gray-500 mt-1">总积分</div>
            </div>
          </div>
        </div>

        <!-- 按游戏类型统计 -->
        <div v-if="stats.gameTypeStats && stats.gameTypeStats.length > 0" class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-lg font-bold mb-3">游戏类型统计</h3>
          <div class="space-y-3">
            <div
              v-for="stat in stats.gameTypeStats"
              :key="stat.gameType"
              class="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div>
                <div class="font-semibold">{{ stat.gameType }}</div>
                <div class="text-sm text-gray-500 mt-1">
                  {{ stat.count }} 场 · 胜率 {{ stat.winRate }}%
                </div>
              </div>
              <div
                :class="stat.totalScore >= 0 ? 'text-green-600' : 'text-red-600'"
                class="text-xl font-bold"
              >
                {{ stat.totalScore >= 0 ? '+' : '' }}{{ stat.totalScore }}
              </div>
            </div>
          </div>
        </div>

        <!-- 最近游戏 -->
        <div v-if="stats.recentGames && stats.recentGames.length > 0" class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-lg font-bold mb-3">最近游戏</h3>
          <div class="space-y-2">
            <div
              v-for="game in stats.recentGames"
              :key="game.id"
              class="flex items-center justify-between p-2 border-b last:border-b-0"
              @click="goToRoom(game.roomCode)"
            >
              <div class="flex-1">
                <div class="font-medium">{{ game.name }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ game.gameType }} · {{ formatDate(game.createdAt) }}
                </div>
              </div>
              <div
                :class="game.score >= 0 ? 'text-green-600' : 'text-red-600'"
                class="font-bold"
              >
                {{ game.score >= 0 ? '+' : '' }}{{ game.score }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <van-empty v-else description="暂无数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { showToast } from 'vant';

const router = useRouter();
const gameStore = useGameStore();

const loading = ref(false);
const stats = ref(null);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const goToRoom = (roomCode) => {
  router.push(`/room/${roomCode}`);
};

const loadStats = async () => {
  loading.value = true;
  try {
    stats.value = await gameStore.getStats();
  } catch (error) {
    showToast(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
});
</script>
