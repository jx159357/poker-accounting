<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <!-- 顶部导航 -->
    <van-nav-bar title="打牌记账" fixed placeholder>
      <template #right>
        <van-icon name="setting-o" size="20" @click="showSettings = true" />
      </template>
    </van-nav-bar>

    <!-- 主要内容 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 快速操作 - 固定 -->
      <div class="action-area">
        <div class="action-grid">
          <div class="action-card action-card-create" @click="showCreateDialog = true">
            <div class="action-icon-wrap action-icon-green">
              <van-icon name="plus" size="24" />
            </div>
            <div class="action-text">
              <span class="action-title">创建房间</span>
              <span class="action-desc">开一局新游戏</span>
            </div>
          </div>
          <div class="action-card action-card-join" @click="showJoinDialog = true">
            <div class="action-icon-wrap action-icon-emerald">
              <van-icon name="friends-o" size="24" />
            </div>
            <div class="action-text">
              <span class="action-title">加入房间</span>
              <span class="action-desc">输入房间号</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 游客模式提示 -->
      <div v-if="userStore.isGuest" class="guest-notice-bar">
        <van-icon name="info-o" size="14" />
        <span>游客模式 - 功能受限，注册后解锁全部功能</span>
      </div>

      <!-- 我的游戏列表 - 可滚动 -->
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title">我的游戏</h2>
          <van-button
            size="small"
            type="primary"
            plain
            round
            @click="loadGames"
            :loading="gameStore.loading"
          >
            刷新
          </van-button>
        </div>

        <van-loading v-if="gameStore.loading && !gameStore.myGames" class="py-8" />

        <van-empty
          v-else-if="!gameStore.myGames || gameStore.myGames.length === 0"
          description="暂无游戏记录"
          image="search"
        >
          <van-button type="primary" round size="small" @click="showCreateDialog = true">
            创建第一局
          </van-button>
        </van-empty>

        <div v-else class="game-list">
          <div
            v-for="game in gameStore.myGames"
            :key="game.id"
            class="game-card"
            :class="game.status === 'active' ? 'status-bar-active' : 'status-bar-ended'"
            @click="goToRoom(game.roomCode)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center">
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
                  房间号: {{ game.roomCode }} · {{ game.gameType }}
                </div>
                <div class="game-info">
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

    <!-- 创建房间对话框 -->
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

    <!-- 游戏类型选择 -->
    <van-action-sheet
      v-model:show="showTypeSheet"
      :actions="typeActions"
      cancel-text="取消"
      @select="onTypeSelect"
    />

    <!-- 加入房间对话框 -->
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
          maxlength="6"
          required
        />
      </div>
    </van-dialog>

    <!-- 游客限制提示 -->
    <RegisterPrompt v-model:visible="showRegisterPrompt" source="home-create" />

    <!-- 设置弹出层 -->
    <van-popup v-model:show="showSettings" position="right" :style="{ width: '80%', height: '100%' }">
      <div class="h-full flex flex-col">
        <van-nav-bar
          title="设置"
          left-arrow
          @click-left="showSettings = false"
        />
        <div class="flex-1 p-4">
          <van-cell-group>
            <van-cell title="用户信息" is-link @click="goToProfile" />
            <van-cell
              v-if="!userStore.isGuest"
              title="退出登录"
              @click="handleLogout"
            />
          </van-cell-group>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useUserStore } from '../stores/user';
import { showToast } from 'vant';
import RegisterPrompt from '../components/RegisterPrompt.vue';
import { getSelectableTypes } from '../config/gameTypes';

const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();

const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const showSettings = ref(false);
const showRegisterPrompt = ref(false);
const showTypeSheet = ref(false);

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

// 格式化日期
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

// 加载游戏列表
const loadGames = async () => {
  try {
    await gameStore.loadMyGames();
  } catch (error) {
    showToast(error.message || '加载失败');
  }
};

// 游戏类型选择
const onTypeSelect = (action) => {
  createForm.value.gameType = action.name;
  createForm.value.customType = '';
  showTypeSheet.value = false;
};

// 创建游戏
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
      gameType || '其他'
    );
    showToast('创建成功');
    router.push(`/room/${game.roomCode}`);
  } catch (error) {
    if (error.code === 'GUEST_LIMIT_REACHED') {
      showRegisterPrompt.value = true;
    } else {
      showToast(error.message || '创建失败');
    }
  }
};

// 加入游戏
const handleJoinGame = async () => {
  if (!joinForm.value.roomCode.trim()) {
    showToast('请输入房间号');
    return;
  }

  try {
    await gameStore.joinGame(joinForm.value.roomCode.toUpperCase());
    showToast('加入成功');
    router.push(`/room/${joinForm.value.roomCode.toUpperCase()}`);
  } catch (error) {
    showToast(error.message || '加入失败');
  }
};

// 进入房间
const goToRoom = (roomCode) => {
  router.push(`/room/${roomCode}`);
};

// 进入个人中心
const goToProfile = () => {
  showSettings.value = false;
  router.push('/profile');
};

// 退出登录
const handleLogout = () => {
  userStore.logout();
  showToast('已退出登录');
  router.push('/login');
};

onMounted(() => {
  loadGames();
});
</script>

<style scoped>
.action-area {
  padding: 16px;
  flex-shrink: 0;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  padding: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.action-card:active {
  transform: scale(0.97);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
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
  background: linear-gradient(135deg, #16A34A, #15803D);
}

.action-icon-emerald {
  background: linear-gradient(135deg, #10B981, #059669);
}

.action-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.action-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
}

.action-desc {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 2px;
  white-space: nowrap;
}

.section-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.game-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  padding: 14px 14px 14px 17px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.game-card:active {
  transform: scale(0.98);
}

.game-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.guest-notice-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(22, 163, 74, 0.08);
  color: var(--color-primary, #16A34A);
  font-size: var(--font-size-sm, 13px);
  flex-shrink: 0;
}

:deep(.van-action-sheet__content) {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
