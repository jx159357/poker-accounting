<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <!-- 顶部导航 -->
    <van-nav-bar
      :title="game?.name || '游戏房间'"
      left-arrow
      fixed
      placeholder
      @click-left="router.back()"
    >
      <template #right>
        <van-button
          v-if="game?.status === 'active'"
          type="danger"
          size="small"
          @click="handleEndGame"
        >
          结束
        </van-button>
      </template>
    </van-nav-bar>

    <van-loading v-if="gameStore.loading && !game" class="flex-1 flex items-center justify-center" />

    <div v-else-if="game" class="flex-1 flex flex-col overflow-hidden">
      <!-- 房间信息 - 固定高度 -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs opacity-90">房间号</div>
            <div class="text-xl font-bold mt-0.5">{{ game.roomCode }}</div>
          </div>
          <van-button
            plain
            type="primary"
            size="small"
            icon="share-o"
            @click="handleShare"
          >
            分享
          </van-button>
        </div>
      </div>

      <!-- 主内容区 - 可滚动 -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-3">
          <!-- 玩家列表 -->
          <div class="mb-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-bold">玩家 ({{ game.players?.length || 0 }})</span>
            </div>

            <van-empty v-if="!game.players || game.players.length === 0" description="暂无玩家" />

            <div v-else class="grid grid-cols-3 gap-2">
              <div
                v-for="player in sortedPlayers"
                :key="player.id"
                class="bg-white rounded-lg p-2 shadow-sm active:bg-gray-50 transition"
                @click="game.status === 'active' && handlePlayerClick(player)"
              >
                <div class="flex flex-col items-center">
                  <!-- 头像 -->
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    :style="{ backgroundColor: getAvatarColor(player.name) }"
                  >
                    {{ getPlayerInitial(player.name) }}
                  </div>

                  <div class="mt-1 text-center w-full">
                    <div class="text-xs font-semibold text-gray-800 truncate">
                      {{ player.name || '未知' }}
                    </div>
                    <div
                      :class="Number(player.balance) >= 0 ? 'text-green-600' : 'text-red-600'"
                      class="text-sm font-bold"
                    >
                      {{ Number(player.balance) >= 0 ? '+' : '' }}{{ player.balance }}
                    </div>
                  </div>

                  <!-- 修改昵称按钮 -->
                  <van-button
                    v-if="isMyPlayer(player)"
                    size="mini"
                    type="primary"
                    plain
                    class="mt-1 text-xs"
                    @click.stop="handleEditNickname(player)"
                  >
                    改名
                  </van-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 记录列表 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-bold">记录 ({{ game.gameRecords?.length || 0 }})</span>
              <van-button
                v-if="game.gameRecords && game.gameRecords.length > 5"
                size="mini"
                type="primary"
                plain
                @click="showAllRecords = !showAllRecords"
              >
                {{ showAllRecords ? '收起' : '展开全部' }}
              </van-button>
            </div>

            <van-empty v-if="!game.gameRecords || game.gameRecords.length === 0" description="暂无记录" />

            <div v-else class="space-y-2">
              <div
                v-for="record in displayRecords"
                :key="record.id"
                class="bg-white rounded-lg p-2 shadow-sm text-xs"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <span class="font-medium">{{ getPlayerName(record.fromPlayer?.id) }}</span>
                    <span class="text-gray-500"> → </span>
                    <span class="font-medium">{{ getPlayerName(record.toPlayer?.id) }}</span>
                    <span class="text-green-600 font-bold ml-1">+{{ record.amount }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-gray-400">{{ formatDateTime(record.createdAt) }}</span>
                    <van-button
                      v-if="game.status === 'active' && canUndoRecord(record)"
                      size="mini"
                      type="danger"
                      plain
                      @click="handleUndoScore(record.id)"
                    >
                      撤销
                    </van-button>
                  </div>
                </div>
                <div v-if="record.note" class="text-gray-500 mt-1">
                  备注: {{ record.note }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加分对话框 -->
    <van-dialog
      v-model:show="showScoreDialog"
      :title="`给 ${selectedPlayer?.name || '玩家'} 转分`"
      show-cancel-button
      @confirm="handleAddScore"
    >
      <div class="p-4">
        <van-field
          v-model="scoreForm.score"
          type="number"
          label="分数"
          placeholder="请输入分数"
          required
        />
        <van-field
          v-model="scoreForm.note"
          label="备注"
          placeholder="选填"
          clearable
        />
        <div class="mt-3 text-sm text-gray-500">
          <p>你将给 <span class="font-medium">{{ selectedPlayer?.name || '玩家' }}</span> 转 <span class="text-green-600 font-bold">+{{ scoreForm.score || 0 }}</span> 分</p>
          <p class="mt-1">你的积分将减少 <span class="text-red-600 font-bold">-{{ scoreForm.score || 0 }}</span> 分</p>
        </div>
      </div>
    </van-dialog>

    <!-- 修改昵称对话框 -->
    <van-dialog
      v-model:show="showEditNicknameDialog"
      title="修改昵称"
      show-cancel-button
      @confirm="handleSaveNickname"
    >
      <div class="p-4">
        <van-field
          v-model="editNicknameForm.nickname"
          label="新昵称"
          placeholder="请输入新昵称"
          required
        />
        <van-checkbox v-if="!userStore.isGuest" v-model="editNicknameForm.syncToProfile" class="mt-3">
          同步到个人资料
        </van-checkbox>
        <div v-if="!userStore.isGuest" class="text-xs text-gray-500 mt-2">
          {{ editNicknameForm.syncToProfile ? '将同步更新你的用户昵称' : '仅在当前对局生效' }}
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useUserStore } from '../stores/user';
import { showToast, showConfirmDialog } from 'vant';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();

const roomCode = route.params.roomCode;
const showScoreDialog = ref(false);
const showEditNicknameDialog = ref(false);
const showAllRecords = ref(false);
const selectedPlayer = ref(null);
const editingPlayer = ref(null);
const scoreForm = ref({
  score: '',
  note: ''
});
const editNicknameForm = ref({
  nickname: '',
  syncToProfile: false
});

let refreshInterval = null;

const game = computed(() => gameStore.currentGame);

const sortedPlayers = computed(() => {
  if (!game.value?.players) return [];
  return [...game.value.players].sort((a, b) => Number(b.balance) - Number(a.balance));
});

const displayRecords = computed(() => {
  if (!game.value?.gameRecords) return [];
  if (showAllRecords.value) return game.value.gameRecords;
  return game.value.gameRecords.slice(0, 5); // 默认只显示最近5条
});

const currentPlayerId = computed(() => {
  return gameStore.getPlayerId();
});

// 获取玩家昵称首字母
const getPlayerInitial = (name) => {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return '?';
  }
  return name.charAt(0).toUpperCase();
};

// 根据昵称生成头像颜色
const getAvatarColor = (nickname) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];

  if (!nickname || typeof nickname !== 'string') {
    return colors[0];
  }

  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// 判断是否是当前玩家
const isMyPlayer = (player) => {
  if (!player) return false;
  const myPlayerId = currentPlayerId.value;
  if (!myPlayerId) return false;

  if (myPlayerId.startsWith('user_')) {
    const username = myPlayerId.replace('user_', '');
    return player.userId && player.user?.username === username;
  } else {
    return player.guestId === myPlayerId;
  }
};

// 判断是否可以撤销记录
const canUndoRecord = (record) => {
  if (!record || !record.fromPlayer) return false;
  return isMyPlayer(record.fromPlayer);
};

const getPlayerName = (playerId) => {
  const player = game.value?.players?.find(p => p.id === playerId);
  return player?.name || '未知';
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleShare = () => {
  const text = `房间号: ${game.value.roomCode}\n房间名: ${game.value.name}\n快来加入吧！`;

  if (navigator.share) {
    navigator.share({
      title: '打牌记账',
      text
    }).catch(err => {
      console.log('Share cancelled:', err);
    });
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast('房间信息已复制');
      })
      .catch(() => {
        fallbackCopyText(text);
      });
  } else {
    fallbackCopyText(text);
  }
};

const fallbackCopyText = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    showToast('房间信息已复制');
  } catch (err) {
    showToast('复制失败');
  }

  document.body.removeChild(textArea);
};

const handlePlayerClick = (player) => {
  if (isMyPlayer(player)) {
    showToast('不能给自己转分');
    return;
  }

  selectedPlayer.value = player;
  scoreForm.value = { score: '', note: '' };
  showScoreDialog.value = true;
};

const handleAddScore = async () => {
  if (!scoreForm.value.score || Number(scoreForm.value.score) <= 0) {
    showToast('请输入有效的分数');
    return;
  }

  try {
    const myPlayer = game.value.players.find(p => isMyPlayer(p));
    if (!myPlayer) {
      showToast('你还未加入房间');
      return;
    }

    await gameStore.addScore(
      roomCode,
      myPlayer.id,
      selectedPlayer.value.id,
      scoreForm.value.score,
      scoreForm.value.note
    );
    showToast('转分成功');
  } catch (error) {
    showToast(error.message);
  }
};

const handleUndoScore = async (recordId) => {
  try {
    await showConfirmDialog({
      title: '确认撤销',
      message: '确定要撤销这条记录吗？',
    });

    await gameStore.undoScore(roomCode, recordId);
    showToast('撤销成功');
  } catch (error) {
    if (error !== 'cancel') {
      showToast(error.message || '撤销失败');
    }
  }
};

const handleEditNickname = (player) => {
  editingPlayer.value = player;
  editNicknameForm.value = {
    nickname: player.name || '',
    syncToProfile: false
  };
  showEditNicknameDialog.value = true;
};

const handleSaveNickname = async () => {
  if (!editNicknameForm.value.nickname.trim()) {
    showToast('请输入昵称');
    return;
  }

  try {
    await gameStore.updatePlayerNickname(
      roomCode,
      editingPlayer.value.id,
      editNicknameForm.value.nickname,
      editNicknameForm.value.syncToProfile
    );
    showToast('昵称已更新');
  } catch (error) {
    showToast(error.message);
  }
};

const handleEndGame = async () => {
  try {
    await showConfirmDialog({
      title: '确认结束',
      message: '确定要结束游戏吗？结束后将无法继续转分。',
    });

    await gameStore.endGame(roomCode);
    showToast('游戏已结束');
  } catch (error) {
    if (error !== 'cancel') {
      showToast(error.message || '结束失败');
    }
  }
};

const loadGame = async () => {
  try {
    await gameStore.getGameDetail(roomCode);
  } catch (error) {
    showToast(error.message || '加载失败');
    router.push('/home');
  }
};

onMounted(() => {
  loadGame();

  // 每5秒自动刷新
  refreshInterval = setInterval(() => {
    loadGame();
  }, 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>
