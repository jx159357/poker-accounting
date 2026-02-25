<template>
  <div class="home-page">
    <van-nav-bar title="打牌记账" fixed>
      <template #right>
        <van-icon name="user-o" size="20" @click="$router.push('/profile')" />
      </template>
    </van-nav-bar>

    <div class="home-container">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-avatar" :style="avatarStyle">
          <span class="avatar-text">{{ avatarText }}</span>
        </div>
        <div class="user-info">
          <div class="user-name">{{ userStore.currentNickname }}</div>
          <div class="user-type">{{ userStore.isGuest ? '游客模式' : '已登录' }}</div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <van-button type="primary" size="large" block @click="showCreateDialog = true" icon="plus">
          创建房间
        </van-button>
        <van-button type="success" size="large" block @click="showJoinDialog = true" icon="friends-o">
          加入房间
        </van-button>
      </div>

      <!-- 我的房间列表 -->
      <div class="room-list-section">
        <div class="section-header">
          <span class="section-title">我的房间</span>
          <van-button size="small" plain @click="loadMyGames" icon="replay">刷新</van-button>
        </div>

        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <div v-if="loading" class="loading-wrapper">
            <van-loading size="24px">加载中...</van-loading>
          </div>

          <div v-else-if="myGames.length === 0" class="empty-wrapper">
            <van-empty description="还没有房间" image-size="100">
              <van-button type="primary" @click="showCreateDialog = true">创建第一个房间</van-button>
            </van-empty>
          </div>

          <div v-else class="room-list">
            <div
              v-for="game in myGames"
              :key="game.id"
              class="room-item"
              @click="enterRoom(game.roomCode)"
            >
              <div class="room-header">
                <div class="room-code">
                  <van-tag type="primary" size="large">{{ game.roomCode }}</van-tag>
                </div>
                <div class="room-status">
                  <van-tag :type="game.status === 'playing' ? 'success' : 'default'">
                    {{ game.status === 'playing' ? '进行中' : '已结束' }}
                  </van-tag>
                </div>
              </div>

              <div class="room-info">
                <div class="room-type">{{ game.gameType }}</div>
                <div class="room-players">
                  <van-icon name="friends-o" />
                  {{ game.playerCount }}/4 人
                </div>
              </div>

              <div class="room-time">
                创建于 {{ formatTime(game.createdAt) }}
              </div>
            </div>
          </div>
        </van-pull-refresh>
      </div>
    </div>

    <!-- 创建房间弹窗 -->
    <van-dialog
      v-model:show="showCreateDialog"
      title="创建房间"
      show-cancel-button
      @confirm="createRoom"
    >
      <van-field
        v-model="gameType"
        label="游戏类型"
        placeholder="例如：斗地主、麻将"
        maxlength="20"
      />
    </van-dialog>

    <!-- 加入房间弹窗 -->
    <van-dialog
      v-model:show="showJoinDialog"
      title="加入房间"
      show-cancel-button
      @confirm="joinRoom"
    >
      <van-field
        v-model="joinRoomCode"
        label="房间号"
        placeholder="请输入6位房间号"
        type="digit"
        maxlength="6"
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { useUserStore } from '../stores/user';
import { gameApi } from '../api/game';
import { getNameInitial, getAvatarColorByString } from '../utils/nameGenerator';

const router = useRouter();
const userStore = useUserStore();

const myGames = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const gameType = ref('');
const joinRoomCode = ref('');

const avatarText = computed(() => {
  return getNameInitial(userStore.currentNickname);
});

const avatarStyle = computed(() => {
  const color = getAvatarColorByString(userStore.currentUserId);
  return {
    background: color.bg,
    color: color.text,
  };
});

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }

  // 超过7天显示日期
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadMyGames = async () => {
  loading.value = true;
  try {
    const data = await gameApi.getMyGames();
    myGames.value = data;
  } catch (error) {
    console.error('加载房间列表失败', error);
    showToast('加载失败');
  } finally {
    loading.value = false;
  }
};

const onRefresh = async () => {
  await loadMyGames();
  refreshing.value = false;
  showToast('刷新成功');
};

const createRoom = async () => {
  if (!gameType.value.trim()) {
    showToast('请输入游戏类型');
    return;
  }

  showLoadingToast({ message: '创建中...', forbidClick: true });

  try {
    const data = await gameApi.createRoom({
      gameType: gameType.value,
      nickname: userStore.currentNickname,
    });

    closeToast();
    showToast('创建成功');
    gameType.value = '';

    // 跳转到房间
    router.push(`/room/${data.roomCode}`);
  } catch (error) {
    closeToast();
    showToast('创建失败');
  }
};

const joinRoom = async () => {
  if (!joinRoomCode.value || joinRoomCode.value.length !== 6) {
    showToast('请输入正确的房间号');
    return;
  }

  showLoadingToast({ message: '加入中...', forbidClick: true });

  try {
    await gameApi.joinRoom({
      roomCode: joinRoomCode.value,
      nickname: userStore.currentNickname,
    });

    closeToast();
    showToast('加入成功');
    joinRoomCode.value = '';

    // 跳转到房间
    router.push(`/room/${joinRoomCode.value}`);
  } catch (error) {
    closeToast();
    showToast(error.response?.data?.message || '加入失败');
  }
};

const enterRoom = (roomCode) => {
  router.push(`/room/${roomCode}`);
};

onMounted(() => {
  loadMyGames();
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.home-container {
  padding-top: 46px;
  padding-bottom: 20px;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.avatar-text {
  user-select: none;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.user-type {
  font-size: 14px;
  opacity: 0.9;
}

.quick-actions {
  padding: 16px;
  display: flex;
  gap: 12px;
}

.room-list-section {
  padding: 0 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
}

.loading-wrapper,
.empty-wrapper {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.room-item:active {
  transform: scale(0.98);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.room-code {
  font-size: 18px;
  font-weight: bold;
}

.room-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.room-type {
  font-size: 16px;
  color: #323233;
  font-weight: 500;
}

.room-players {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #969799;
  font-size: 14px;
}

.room-time {
  font-size: 12px;
  color: #969799;
}
</style>
