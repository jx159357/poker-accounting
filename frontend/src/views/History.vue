<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
    <van-nav-bar title="游戏历史" left-arrow @click-left="router.back()" />

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <van-tag
          v-for="type in gameTypes"
          :key="type"
          :type="activeFilter === type ? 'primary' : 'default'"
          round
          size="medium"
          class="filter-tag"
          @click="activeFilter = type"
        >
          {{ type === 'all' ? '全部类型' : type }}
        </van-tag>
      </div>
      <div class="filter-row">
        <van-tag
          v-for="st in statusTypes"
          :key="st.value"
          :type="activeStatus === st.value ? 'primary' : 'default'"
          round
          size="medium"
          class="filter-tag"
          @click="activeStatus = st.value"
        >
          {{ st.label }}
        </van-tag>
      </div>
    </div>

    <!-- 游客提示 -->
    <div v-if="userStore.isGuest" class="guest-notice" @click="router.push('/register')">
      <van-icon name="info-o" size="14" />
      <span>游客模式仅保留最近7天记录，注册后可查看完整历史</span>
      <van-icon name="arrow" size="12" />
    </div>

    <!-- 列表区域 - 可滚动 -->
    <div class="flex-1 overflow-y-auto p-4 min-h-0">
      <van-loading v-if="gameStore.loading" class="py-8" />

      <van-empty v-else-if="!gameStore.myGames || gameStore.myGames.length === 0" description="暂无历史记录" image="search" />

      <div v-else class="history-list">
        <div
          v-for="game in gameStore.myGames"
          :key="game.id"
          class="history-card"
          :class="game.status === 'active' ? 'status-bar-active' : 'status-bar-ended'"
          @click="goToRoom(game.roomCode)"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center">
                <h3 class="history-name">{{ game.name }}</h3>
                <van-tag
                  :type="game.status === 'active' ? 'success' : 'default'"
                  size="small"
                  round
                  class="ml-2 flex-shrink-0"
                >
                  {{ game.status === 'active' ? '进行中' : '已结束' }}
                </van-tag>
              </div>
              <div class="history-info">
                房间号: {{ game.roomCode }} · {{ game.gameType }}
              </div>
              <div class="history-info">
                {{ game.playerCount }} 人 · {{ formatDate(game.createdAt) }}
              </div>
            </div>
            <div class="score-area">
              <span
                :class="game.myScore >= 0 ? 'score-badge-positive' : 'score-badge-negative'"
              >
                {{ game.myScore >= 0 ? '+' : '' }}{{ game.myScore }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useUserStore } from '../stores/user';
import { getFilterTypes } from '../config/gameTypes';

const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();

const activeFilter = ref('all');
const activeStatus = ref('all');

const gameTypes = getFilterTypes();
const statusTypes = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'ended', label: '已结束' },
];

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

const loadGames = () => {
  const filters = {};
  if (activeFilter.value !== 'all') {
    filters.gameType = activeFilter.value;
  }
  if (activeStatus.value !== 'all') {
    filters.status = activeStatus.value;
  }
  gameStore.loadMyGames(filters);
};

watch([activeFilter, activeStatus], () => {
  loadGames();
});

onMounted(() => {
  loadGames();
});
</script>

<style scoped>
.filter-bar {
  padding: 8px 16px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--color-bg-white, #fff);
  border-bottom: 1px solid var(--color-bg-hover, #F3F4F6);
}

.filter-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-tag {
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}

.history-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  padding: 14px 14px 14px 17px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.history-card:active {
  transform: scale(0.98);
}

.history-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-info {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 4px;
}

.score-area {
  margin-left: 16px;
  flex-shrink: 0;
}
</style>
