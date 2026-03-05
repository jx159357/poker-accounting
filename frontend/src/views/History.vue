<template>
  <div class="min-h-screen bg-gray-50">
    <van-nav-bar title="游戏历史" left-arrow fixed placeholder @click-left="router.back()" />

    <div class="p-4">
      <van-loading v-if="gameStore.loading" class="py-8" />

      <van-empty v-else-if="!gameStore.myGames || gameStore.myGames.length === 0" description="暂无历史记录" />

      <div v-else class="space-y-3">
        <div
          v-for="game in gameStore.myGames"
          :key="game.id"
          class="bg-white rounded-lg p-4 shadow-sm"
          @click="goToRoom(game.roomCode)"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center">
                <h3 class="text-base font-semibold">{{ game.name }}</h3>
                <van-tag
                  :type="game.status === 'active' ? 'success' : 'default'"
                  size="small"
                  class="ml-2"
                >
                  {{ game.status === 'active' ? '进行中' : '已结束' }}
                </van-tag>
              </div>
              <div class="text-sm text-gray-500 mt-1">
                房间号: {{ game.roomCode }} · {{ game.gameType }}
              </div>
              <div class="text-sm text-gray-500 mt-1">
                {{ game.playerCount }} 人 · {{ formatDate(game.createdAt) }}
              </div>
            </div>
            <div class="text-right ml-4">
              <div
                :class="game.myScore >= 0 ? 'text-green-600' : 'text-red-600'"
                class="text-xl font-bold"
              >
                {{ game.myScore >= 0 ? '+' : '' }}{{ game.myScore }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';

const router = useRouter();
const gameStore = useGameStore();

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const goToRoom = (roomCode) => {
  router.push(`/room/${roomCode}`);
};

onMounted(() => {
  gameStore.loadMyGames();
});
</script>
