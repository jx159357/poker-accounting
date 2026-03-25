<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
    <van-nav-bar title="游戏历史" left-arrow @click-left="handleBack">
      <template #right>
        <van-icon name="search" size="20" @click="showSearchPopup = true" />
      </template>
    </van-nav-bar>

    <div class="filter-bar">
      <div class="filter-row">
        <button
          v-for="type in gameTypes"
          :key="type"
          type="button"
          class="filter-tag"
          :class="{ 'filter-tag-active': activeFilter === type }"
          @click="activeFilter = type"
        >
          {{ type === 'all' ? '全部类型' : type === 'custom' ? '自定义' : type }}
        </button>
      </div>
      <div class="filter-row">
        <button
          v-for="st in statusTypes"
          :key="st.value"
          type="button"
          class="filter-tag"
          :class="{ 'filter-tag-active': activeStatus === st.value }"
          @click="activeStatus = st.value"
        >
          {{ st.label }}
        </button>
      </div>
    </div>

    <div v-if="userStore.isGuest" class="guest-notice" @click="router.push('/register')">
      <van-icon name="info-o" size="14" />
      <span>游客模式仅保留最近 7 天记录，注册后可查看完整历史</span>
      <van-icon name="arrow" size="12" />
    </div>

    <div class="flex-1 overflow-y-auto p-4 min-h-0">
      <van-loading v-if="gameStore.loading" class="py-8" />

      <van-empty
        v-else-if="displayedGames.length === 0"
        description="暂无历史记录"
        image="search"
      />

      <div v-else class="history-list">
        <div
          v-for="game in displayedGames"
          :key="game.id"
          class="history-card"
          :class="game.status === 'active' ? 'status-bar-active' : 'status-bar-ended'"
          @click="goToRoom(game.roomCode)"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="history-topline">
                <span class="history-room-chip">{{ game.roomCode }}</span>
                <span class="history-type-chip">{{ game.gameType }}</span>
              </div>
              <div class="flex items-center mt-2">
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
                {{ game.playerCount }} 人 · {{ formatDate(game.createdAt) }}
              </div>
            </div>
            <div class="score-area">
              <span :class="game.myScore >= 0 ? 'score-badge-positive' : 'score-badge-negative'">
                {{ game.myScore >= 0 ? '+' : '' }}{{ game.myScore }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <van-popup
      v-model:show="showSearchPopup"
      round
      position="center"
      :style="{ width: '88%', maxWidth: '420px' }"
    >
      <div class="history-search-popup">
        <div class="history-search-head">
          <div class="history-search-title">搜索历史房间</div>
          <button
            v-if="searchKeyword"
            type="button"
            class="history-search-clear"
            @click="searchKeyword = ''"
          >
            清空
          </button>
        </div>
        <label class="history-search-shell">
          <van-icon name="search" size="16" color="#94A3B8" />
          <input
            v-model.trim="searchKeyword"
            type="text"
            class="history-search-input"
            placeholder="搜索房间名、房间号或游戏类型"
          />
        </label>
        <van-button block round plain class="history-search-btn" @click="showSearchPopup = false">
          完成
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useUserStore } from '../stores/user';
import { getFilterTypes, isBuiltInGameType } from '../config/gameTypes';
import { goBackWithFallback, navigateToRoom } from '../utils/navigation';

const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();

const activeFilter = ref('all');
const activeStatus = ref('all');
const discoveredGameTypes = ref([]);
const searchKeyword = ref('');
const showSearchPopup = ref(false);

const gameTypes = computed(() => {
  const builtIns = getFilterTypes().slice(1);
  const hasCustomTypes = discoveredGameTypes.value.some(type => !isBuiltInGameType(type));
  return ['all', ...builtIns, ...(hasCustomTypes ? ['custom'] : [])];
});

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

const displayedGames = computed(() => {
  return (gameStore.myGames || []).filter((game) => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    const statusMatch =
      activeStatus.value === 'all' || game.status === activeStatus.value;
    const searchMatch =
      !keyword ||
      [game.name, game.roomCode, game.gameType].some((value) =>
        String(value || '').toLowerCase().includes(keyword),
      );

    if (activeFilter.value === 'all') {
      return statusMatch && searchMatch;
    }

    if (activeFilter.value === 'custom') {
      return statusMatch && searchMatch && !isBuiltInGameType(game.gameType);
    }

    return statusMatch && searchMatch && game.gameType === activeFilter.value;
  });
});

const handleBack = () => {
  goBackWithFallback(router, '/home');
};

const goToRoom = (roomCode) => {
  navigateToRoom(router, roomCode, '/history');
};

const loadGames = async () => {
  const filters = {};
  filters.recentDays = 30;
  if (activeStatus.value !== 'all') {
    filters.status = activeStatus.value;
  }

  await gameStore.loadMyGames(filters);

  const currentTypes = (gameStore.myGames || [])
    .map(game => game.gameType)
    .filter(Boolean);
  discoveredGameTypes.value = Array.from(
    new Set([...discoveredGameTypes.value, ...currentTypes]),
  );
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
  padding: 10px 16px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--color-bg-white, #fff);
  border-bottom: 1px solid var(--color-bg-hover, #F3F4F6);
}

.filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.filter-tag {
  border: 1px solid var(--color-border, #E5E7EB);
  background: var(--color-bg-secondary, #F9FAFB);
  color: var(--color-text-secondary, #6B7280);
  border-radius: 999px;
  padding: 9px 14px;
  font-size: var(--font-size-md, 14px);
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-tag-active {
  border-color: var(--color-primary, #16A34A);
  background: linear-gradient(135deg, var(--color-primary, #16A34A), var(--color-primary-dark, #15803D));
  color: #fff;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}

.history-card {
  background: var(--color-bg-white, #fff);
  border-radius: 16px;
  padding: 14px 14px 14px 17px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.history-card:active {
  transform: scale(0.98);
}

.history-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.history-room-chip,
.history-type-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: var(--font-size-xs, 12px);
  font-weight: 700;
}

.history-room-chip {
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  color: var(--color-primary, #16A34A);
}

.history-type-chip {
  background: var(--color-bg-secondary, #F9FAFB);
  color: var(--color-text-secondary, #6B7280);
}

.history-name {
  font-size: calc(15px * var(--font-scale, 1));
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

.history-search-popup {
  padding: 18px;
}

.history-search-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
}

.history-search-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-search-clear {
  border: none;
  background: transparent;
  color: var(--color-primary, #16A34A);
  font-size: var(--font-size-sm, 13px);
  font-weight: 600;
}

.history-search-shell {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 11px 12px;
  border-radius: 14px;
  background: var(--color-bg-secondary, #F9FAFB);
}

.history-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-primary, #1A1A1A);
}

.history-search-btn {
  margin-top: 14px;
}
</style>
