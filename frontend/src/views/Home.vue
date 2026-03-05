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
      <div class="p-4 flex-shrink-0">
        <div class="grid grid-cols-2 gap-3">
          <van-button
            type="primary"
            size="large"
            icon="plus"
            block
            @click="showCreateDialog = true"
          >
            创建房间
          </van-button>
          <van-button
            type="success"
            size="large"
            icon="friends-o"
            block
            @click="showJoinDialog = true"
          >
            加入房间
          </van-button>
        </div>
      </div>

      <!-- 我的游戏列表 - 可滚动 -->
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold">我的游戏</h2>
          <van-button
            size="small"
            type="primary"
            plain
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
        />

        <div v-else class="space-y-3">
          <div
            v-for="game in gameStore.myGames"
            :key="game.id"
            class="bg-white rounded-lg p-4 shadow-sm active:bg-gray-50 transition"
            @click="goToRoom(game.roomCode)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center">
                  <h3 class="text-base font-semibold truncate">{{ game.name }}</h3>
                  <van-tag
                    :type="game.status === 'active' ? 'success' : 'default'"
                    size="small"
                    class="ml-2 flex-shrink-0"
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
              <div class="text-right ml-4 flex-shrink-0">
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
          placeholder="如：斗地主、麻将等"
        />
      </div>
    </van-dialog>

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

const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();

const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const showSettings = ref(false);

const createForm = ref({
  name: '',
  gameType: '其他',
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

// 创建游戏
const handleCreateGame = async () => {
  if (!createForm.value.name.trim()) {
    showToast('请输入房间名称');
    return;
  }

  try {
    const game = await gameStore.createGame(
      createForm.value.name,
      createForm.value.gameType || '其他'
    );
    showToast('创建成功');
    router.push(`/room/${game.roomCode}`);
  } catch (error) {
    showToast(error.message || '创建失败');
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
