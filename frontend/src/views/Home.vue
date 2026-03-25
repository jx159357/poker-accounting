<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
    <van-nav-bar title="打牌记账" fixed placeholder>
      <template #right>
        <van-icon name="setting-o" size="20" @click="settingsStore.openDrawer()" />
      </template>
    </van-nav-bar>

    <div class="flex-1 flex flex-col overflow-hidden min-h-0">
      <div class="home-page-shell">
        <section class="hero-card">
          <div class="hero-top">
            <div class="hero-copy">
              <h1 class="hero-title">打牌记账</h1>
              <p class="hero-desc">线下牌局，简单记账，随时继续。</p>
            </div>
            <div class="hero-status">{{ userStore.isGuest ? '游客' : '已登录' }}</div>
          </div>

          <div class="hero-metrics">
            <div class="hero-metric">
              <span class="hero-metric-value">{{ visibleGamesCount }}</span>
              <span class="hero-metric-label">当前列表</span>
            </div>
            <div class="hero-metric">
              <span class="hero-metric-value">{{ activeGamesCount }}</span>
              <span class="hero-metric-label">进行中</span>
            </div>
            <div class="hero-metric">
              <span class="hero-metric-value">{{ signedVisibleScore }}</span>
              <span class="hero-metric-label">可见净分</span>
            </div>
          </div>

          <button
            v-if="recentRoom"
            type="button"
            class="hero-return"
            @click="goToRecentRoom"
          >
            <div>
              <div class="hero-return-label">最近查看房间</div>
              <div class="hero-return-name">{{ recentRoom.name || recentRoom.roomCode }}</div>
            </div>
            <van-icon name="arrow" size="16" color="#0F172A" />
          </button>
        </section>

        <div class="action-grid">
          <button type="button" class="action-card" @click="showCreateDialog = true">
            <div class="action-icon-wrap action-icon-green">
              <van-icon name="plus" size="24" />
            </div>
            <div class="action-text">
              <span class="action-title">创建房间</span>
              <span class="action-desc">开一局新游戏</span>
            </div>
          </button>

          <button type="button" class="action-card" @click="showJoinDialog = true">
            <div class="action-icon-wrap action-icon-emerald">
              <van-icon name="friends-o" size="24" />
            </div>
            <div class="action-text">
              <span class="action-title">加入房间</span>
              <span class="action-desc">输入房间号</span>
            </div>
          </button>
        </div>

        <button
          v-if="showGuestGrowthCard"
          type="button"
          class="guest-growth-card"
          @click="router.push('/register')"
        >
          <span class="guest-growth-close" @click.stop="dismissGuestGrowthCard">
            <van-icon name="cross" size="16" />
          </span>
          <div class="guest-growth-copy">
            <div class="guest-growth-title">{{ guestGrowthTitle }}</div>
            <div class="guest-growth-desc">{{ guestGrowthDescription }}</div>
          </div>
          <span class="guest-growth-cta">立即注册</span>
        </button>

        <section class="list-card">
          <div class="list-head">
            <h2 class="section-title">我的游戏</h2>
            <div class="list-head-actions">
              <van-button
                size="small"
                type="primary"
                plain
                class="utility-btn action-btn-toolbar"
                @click="showToolsPopup = true"
              >
                工具
              </van-button>
              <van-button
                size="small"
                type="primary"
                plain
                class="utility-btn action-btn-toolbar"
                @click="loadGames"
                :loading="gameStore.loading"
              >
                刷新
              </van-button>
            </div>
          </div>

          <div class="list-scroll" :class="{ 'list-scroll-empty': filteredGames.length === 0 }">
            <van-loading v-if="gameStore.loading && !gameStore.myGames" class="py-8" />

            <van-empty
              v-else-if="filteredGames.length === 0"
              :description="emptyDescription"
              image="search"
            >
              <van-button
                type="primary"
                round
                size="small"
                class="action-btn-primary"
                @click="searchKeyword ? searchKeyword = '' : showCreateDialog = true"
              >
                {{ searchKeyword ? '清空搜索' : '创建第一局' }}
              </van-button>
            </van-empty>

            <div v-else class="game-list">
              <div
                v-for="game in filteredGames"
                :key="game.id"
                class="game-card"
                :class="game.status === 'active' ? 'status-bar-active' : 'status-bar-ended'"
                @click="goToRoom(game.roomCode)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="game-topline">
                      <span class="room-chip">{{ game.roomCode }}</span>
                      <span class="type-chip">{{ game.gameType }}</span>
                    </div>
                    <div class="flex items-center mt-2 min-w-0">
                      <h3 class="game-name">{{ game.name }}</h3>
                      <van-tag
                        :type="game.status === 'active' ? 'success' : 'default'"
                        size="small"
                        round
                        class="ml-2 flex-shrink-0"
                      >
                        {{ game.status === 'active' ? '进行中' : '已结束' }}
                      </van-tag>
                    </div>
                    <div class="game-info">
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
        </section>
      </div>
    </div>

    <van-dialog
      v-model:show="showCreateDialog"
      title="创建房间"
      show-cancel-button
      @confirm="handleCreateGame"
    >
      <div class="p-4">
        <van-field
          v-model="createForm.name"
          label="房间名称"
          placeholder="请输入房间名称"
          required
        />
        <van-field
          v-model="createForm.gameType"
          label="游戏类型"
          placeholder="点击选择类型"
          readonly
          is-link
          @click="showTypeSheet = true"
        />
        <van-field
          v-if="createForm.gameType === '自定义'"
          v-model="createForm.customType"
          label="自定义类型"
          placeholder="请输入游戏类型名称"
          required
        />
      </div>
    </van-dialog>

    <van-action-sheet
      v-model:show="showTypeSheet"
      :actions="typeActions"
      cancel-text="取消"
      @select="onTypeSelect"
    />

    <van-dialog
      v-model:show="showJoinDialog"
      title="加入房间"
      show-cancel-button
      @confirm="handleJoinGame"
    >
      <div class="p-4">
        <van-field
          v-model="joinForm.roomCode"
          label="房间号"
          placeholder="请输入6位房间号"
          maxlength="8"
          required
        />
      </div>
    </van-dialog>

    <RegisterPrompt v-model:visible="showRegisterPrompt" source="home-create" />

    <van-popup
      v-model:show="showToolsPopup"
      round
      position="bottom"
      :style="{ maxHeight: '76%' }"
    >
      <div class="tools-popup overlay-panel-surface">
        <div class="tools-head overlay-panel-head">
          <div>
            <div class="tools-title">扩展工具</div>
            <div class="tools-subtitle">搜索、排序和筛选都放在这里，主界面保持简洁。</div>
          </div>
          <div class="tools-head-side">
            <span class="overlay-panel-badge">{{ visibleGamesCount }} 条</span>
            <button type="button" class="tools-close overlay-panel-close" @click="showToolsPopup = false">
              <van-icon name="cross" size="18" />
            </button>
          </div>
        </div>

        <div class="tools-block tools-block-pinned overlay-panel-block">
          <div class="tools-label">搜索房间</div>
          <label class="search-shell overlay-panel-input">
            <van-icon name="search" size="16" color="#94A3B8" />
            <input
              v-model.trim="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索房间名、房间号或游戏类型"
            />
          </label>
        </div>

        <div class="tools-scroll">
          <div class="tools-block overlay-panel-block">
            <div class="tools-label">筛选范围</div>
            <div class="filter-row">
              <button
                v-for="option in listFilters"
                :key="option.key"
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip-active': activeListFilter === option.key }"
                @click="changeListFilter(option.key, false)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="tools-block overlay-panel-block">
            <div class="tools-label">排序方式</div>
            <div class="sort-row">
              <button
                v-for="option in sortOptions"
                :key="option.key"
                type="button"
                class="sort-chip"
                :class="{ 'sort-chip-active': activeSortKey === option.key }"
                @click="activeSortKey = option.key"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="tools-block overlay-panel-block">
            <div class="tools-label">当前摘要</div>
            <div class="insight-strip">
              <span class="insight-pill">{{ activeFilterDescription }}</span>
              <span class="insight-text">常玩类型 {{ favoriteGameType }}</span>
            </div>
          </div>
        </div>

        <van-button block round plain class="tools-reset action-btn-secondary" @click="resetTools">
          重置筛选与排序
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useUserStore } from '../stores/user';
import { useSettingsStore } from '../stores/settings';
import { showToast } from 'vant';
import RegisterPrompt from '../components/RegisterPrompt.vue';
import { getSelectableTypes } from '../config/gameTypes';
import { navigateToRoom } from '../utils/navigation';

const GUEST_GROWTH_DISMISS_KEY = 'guest_growth_dismissed_session_v1';
const HOME_FILTER_STORAGE_KEY = 'home_list_filter_v1';
const HOME_SORT_STORAGE_KEY = 'home_sort_key_v1';

const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const showRegisterPrompt = ref(false);
const showTypeSheet = ref(false);
const showToolsPopup = ref(false);
const activeListFilter = ref('active');
const searchKeyword = ref('');
const activeSortKey = ref('recent');
const showGuestGrowthCard = ref(false);

const selectableTypes = getSelectableTypes();
const typeActions = selectableTypes.map(t => ({ name: t }));

const createForm = ref({
  name: '',
  gameType: '其他',
  customType: '',
});

const joinForm = ref({
  roomCode: '',
});

const listFilters = [
  { key: 'active', label: '进行中' },
  { key: 'recent7', label: '近7天' },
  { key: 'recent30', label: '近30天' },
  { key: 'recent90', label: '近90天' },
];

const sortOptions = [
  { key: 'recent', label: '最新' },
  { key: 'score', label: '分数' },
  { key: 'players', label: '人数' },
];

const filteredGames = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const source = [...(gameStore.myGames || [])];

  const searched = keyword
    ? source.filter((game) =>
        [game.name, game.roomCode, game.gameType].some((value) =>
          String(value || '').toLowerCase().includes(keyword),
        ),
      )
    : source;

  searched.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'active' ? -1 : 1;
    }

    if (activeSortKey.value === 'score') {
      const scoreDiff = Number(b.myScore || 0) - Number(a.myScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
    }

    if (activeSortKey.value === 'players') {
      const playerDiff = Number(b.playerCount || 0) - Number(a.playerCount || 0);
      if (playerDiff !== 0) return playerDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return searched;
});

const visibleGamesCount = computed(() => filteredGames.value.length);
const activeGamesCount = computed(
  () => filteredGames.value.filter(game => game.status === 'active').length,
);
const signedVisibleScore = computed(() => {
  const total = filteredGames.value.reduce(
    (sum, game) => sum + Number(game.myScore || 0),
    0,
  );
  return `${total >= 0 ? '+' : ''}${Math.round(total * 10) / 10}`;
});

const recentRoom = computed(() => {
  return gameStore.lastViewedRoom?.roomCode ? gameStore.lastViewedRoom : null;
});

const favoriteGameType = computed(() => {
  if (!filteredGames.value.length) return '还没有数据';

  const typeScoreMap = new Map();
  filteredGames.value.forEach((game) => {
    const current = typeScoreMap.get(game.gameType) || { count: 0, score: 0 };
    current.count += 1;
    current.score += Number(game.myScore || 0);
    typeScoreMap.set(game.gameType, current);
  });

  return Array.from(typeScoreMap.entries())
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return b[1].score - a[1].score;
    })[0]?.[0] || '还没有数据';
});

const guestGrowthTitle = computed(() => {
  const totalGames = gameStore.myGames?.length || 0;
  if (totalGames > 0) {
    return `你已有 ${totalGames} 局记录，注册后可永久保留`;
  }
  return '注册后可保留扫码加入的房间和历史数据';
});

const guestGrowthDescription = computed(() => {
  if (recentRoom.value) {
    return `当前还有 ${activeGamesCount.value} 个进行中的房间。注册后可跨设备继续 ${recentRoom.value.name || recentRoom.value.roomCode}，不怕换手机丢记录。`;
  }
  return '注册后可永久保存历史、跨设备同步房间、查看完整统计与对手分析。';
});

const activeFilterDescription = computed(() => {
  switch (activeListFilter.value) {
    case 'active':
      return '只显示正在进行中的房间';
    case 'recent7':
      return '显示进行中和近 7 天结束的房间';
    case 'recent90':
      return '显示进行中和近 90 天结束的房间';
    case 'recent30':
    default:
      return '显示进行中和近 30 天结束的房间';
  }
});

const emptyDescription = computed(() => {
  if (searchKeyword.value) return '没有匹配的房间';
  return '暂无游戏记录';
});

const buildListQuery = () => {
  switch (activeListFilter.value) {
    case 'active':
      return { status: 'active' };
    case 'recent7':
      return { recentDays: 7 };
    case 'recent90':
      return { recentDays: 90 };
    case 'recent30':
    default:
      return { recentDays: 30 };
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const dismissGuestGrowthCard = () => {
  sessionStorage.setItem(GUEST_GROWTH_DISMISS_KEY, 'true');
  showGuestGrowthCard.value = false;
};

const loadGames = async () => {
  try {
    await gameStore.loadMyGames(buildListQuery());
  } catch (error) {
    showToast(error.message || '加载失败');
  }
};

const changeListFilter = async (filterKey, closePopup = true) => {
  if (activeListFilter.value === filterKey) return;
  activeListFilter.value = filterKey;
  localStorage.setItem(HOME_FILTER_STORAGE_KEY, filterKey);
  await loadGames();
  if (closePopup) {
    showToolsPopup.value = false;
  }
};

const onTypeSelect = (action) => {
  createForm.value.gameType = action.name;
  createForm.value.customType = '';
  showTypeSheet.value = false;
};

const handleCreateGame = async () => {
  if (!createForm.value.name.trim()) {
    showToast('请输入房间名称');
    return;
  }

  let gameType = createForm.value.gameType;
  if (gameType === '自定义') {
    gameType = createForm.value.customType.trim();
    if (!gameType) {
      showToast('请输入自定义游戏类型');
      return;
    }
  }

  try {
    const game = await gameStore.createGame(
      createForm.value.name,
      gameType || '其他',
    );
    showToast('创建成功');
    navigateToRoom(router, game.roomCode, '/home');
  } catch (error) {
    if (error.code === 'GUEST_LIMIT_REACHED') {
      showRegisterPrompt.value = true;
    } else {
      showToast(error.message || '创建失败');
    }
  }
};

const handleJoinGame = async () => {
  if (!joinForm.value.roomCode.trim()) {
    showToast('请输入房间号');
    return;
  }

  try {
    await gameStore.joinGame(joinForm.value.roomCode.toUpperCase());
    showToast('加入成功');
    navigateToRoom(router, joinForm.value.roomCode.toUpperCase(), '/home');
  } catch (error) {
    showToast(error.message || '加入失败');
  }
};

const goToRoom = (roomCode) => {
  navigateToRoom(router, roomCode, '/home');
};

const resetTools = async () => {
  searchKeyword.value = '';
  activeSortKey.value = 'recent';
  localStorage.setItem(HOME_SORT_STORAGE_KEY, 'recent');
  await changeListFilter('active', false);
};

const goToRecentRoom = () => {
  if (!recentRoom.value?.roomCode) return;
  navigateToRoom(router, recentRoom.value.roomCode, recentRoom.value.from || '/home');
};

watch(activeSortKey, (value) => {
  localStorage.setItem(HOME_SORT_STORAGE_KEY, value);
});

onMounted(() => {
  const savedFilter = localStorage.getItem(HOME_FILTER_STORAGE_KEY);
  if (savedFilter && listFilters.some(option => option.key === savedFilter)) {
    activeListFilter.value = savedFilter;
  }

  const savedSort = localStorage.getItem(HOME_SORT_STORAGE_KEY);
  if (savedSort && sortOptions.some(option => option.key === savedSort)) {
    activeSortKey.value = savedSort;
  }

  showGuestGrowthCard.value =
    userStore.isGuest && sessionStorage.getItem(GUEST_GROWTH_DISMISS_KEY) !== 'true';

  loadGames();
});
</script>

<style scoped>
.home-page-shell {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 16px;
  color: #fff;
  box-shadow: var(--shadow-lg);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 120px),
    radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.10), transparent 160px),
    linear-gradient(145deg, var(--color-primary-dark, #15803D), var(--color-primary, #16A34A) 58%, #0f766e);
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-title {
  margin: 0;
  font-size: calc(22px * var(--font-scale, 1));
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero-desc {
  margin: 6px 0 0;
  font-size: var(--font-size-sm, 13px);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.hero-status {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 6px 11px;
  font-size: var(--font-size-xs, 12px);
  font-weight: 700;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(12px);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.hero-metric {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
}

.hero-metric-value {
  display: block;
  font-size: calc(18px * var(--font-scale, 1));
  font-weight: 800;
}

.hero-metric-label {
  display: block;
  margin-top: 2px;
  font-size: var(--font-size-xs, 12px);
  color: rgba(255, 255, 255, 0.72);
}

.hero-return {
  width: 100%;
  margin-top: 12px;
  border: none;
  border-radius: 16px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.hero-return:active {
  transform: scale(0.99);
}

.hero-return-label {
  font-size: var(--font-size-xs, 12px);
  color: #64748B;
}

.hero-return-name {
  margin-top: 4px;
  font-size: var(--font-size-md, 14px);
  font-weight: 700;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-card {
  border: none;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-bg-white, #fff);
  border-radius: 16px;
  padding: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-align: left;
}

.action-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}

.action-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.action-icon-green {
  background: linear-gradient(135deg, var(--color-primary, #16A34A), var(--color-primary-dark, #15803D));
}

.action-icon-emerald {
  background: linear-gradient(135deg, var(--color-primary-light, #22C55E), var(--color-primary, #16A34A));
}

.action-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.action-title {
  font-size: calc(15px * var(--font-scale, 1));
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
}

.action-desc {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 2px;
  white-space: nowrap;
}

.guest-growth-card {
  width: 100%;
  border: none;
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.22), transparent 120px),
    linear-gradient(135deg, #0f766e, #115e59, #0f172a);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  color: #fff;
  box-shadow: var(--shadow-md);
  text-align: left;
}

.guest-growth-card:active {
  transform: scale(0.99);
}

.guest-growth-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.14);
}

.guest-growth-copy {
  flex: 1;
  min-width: 0;
}

.guest-growth-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
}

.guest-growth-desc {
  margin-top: 6px;
  font-size: var(--font-size-sm, 13px);
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.84);
}

.guest-growth-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: var(--font-size-sm, 13px);
  font-weight: 700;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.list-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  padding: 14px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.list-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.utility-btn {
  border-radius: 12px !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 60px;
}

.section-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  margin: 0;
}

.tools-popup {
  padding: 18px 18px 22px;
  display: flex;
  flex-direction: column;
  height: min(76vh, 560px);
  border-top: 1px solid var(--color-border, #E5E7EB);
}

.tools-head {
  flex-shrink: 0;
}

.tools-head-side {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.tools-title {
  font-size: var(--font-size-xl, 20px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
}

.tools-subtitle {
  margin-top: 6px;
  font-size: var(--font-size-sm, 13px);
  line-height: 1.5;
  color: var(--color-text-secondary, #6B7280);
}

.tools-close {
  color: var(--color-text-secondary, #6B7280);
}

.tools-block {
  padding: 14px;
}

.tools-block-pinned {
  margin-top: 14px;
  flex-shrink: 0;
}

.tools-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}

.tools-label {
  font-size: var(--font-size-md, 14px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  margin-bottom: 10px;
}

.search-shell {
  padding: 10px 12px;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-primary, #1A1A1A);
}

.filter-row,
.sort-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.filter-chip {
  border: 1px solid var(--color-border, #E5E7EB);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #6B7280);
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.filter-chip-active {
  color: #fff;
  border-color: var(--color-primary, #16A34A);
  background: linear-gradient(135deg, var(--color-primary, #16A34A), var(--color-primary-dark, #15803D));
}

.sort-chip {
  border: 1px solid var(--color-border, #E5E7EB);
  background: #fff;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-secondary, #6B7280);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.sort-chip-active {
  border-color: var(--color-primary, #16A34A);
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  color: var(--color-primary, #16A34A);
  box-shadow: 0 0 0 3px var(--color-primary-bg, rgba(22, 163, 74, 0.08));
}

.insight-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.insight-pill {
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  color: var(--color-primary, #16A34A);
  font-size: var(--font-size-xs, 12px);
  font-weight: 700;
}

.insight-text {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #6B7280);
}

.tools-reset {
  margin-top: 12px;
  flex-shrink: 0;
}

.list-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: 12px;
}

.list-scroll-empty {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}

.game-card {
  background: var(--color-bg-white, #fff);
  border-radius: 18px;
  padding: 15px 15px 15px 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  content-visibility: auto;
  contain-intrinsic-size: 88px;
}

.game-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}

.game-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.room-chip,
.type-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: var(--font-size-xs, 12px);
  font-weight: 700;
}

.room-chip {
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  color: var(--color-primary, #16A34A);
}

.type-chip {
  background: var(--color-bg-secondary, #F9FAFB);
  color: var(--color-text-secondary, #6B7280);
}

.game-name {
  font-size: calc(15px * var(--font-scale, 1));
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 100%;
}

.game-info {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 4px;
}

.score-area {
  margin-left: 16px;
  flex-shrink: 0;
}

@media (max-width: 420px) {
  .home-page-shell {
    padding: 14px;
  }

  .hero-card,
  .list-card {
    padding: 14px;
  }
}
</style>
