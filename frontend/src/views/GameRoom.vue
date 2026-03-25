<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <!-- 顶部导航 -->
    <van-nav-bar
      :title="game?.name || '游戏房间'"
      left-arrow
      fixed
      placeholder
      @click-left="handleBack"
    >
      <template #right>
        <div class="nav-right-actions">
          <van-icon
            v-if="isCreator && !userStore.isGuest && game?.status === 'active'"
            name="edit"
            size="20"
            class="nav-action-icon"
            @click="showEditGameDialog = true"
          />
          <van-button
            v-if="game?.status === 'active'"
            type="danger"
            size="small"
            round
            @click="handleEndGame"
          >
            结束
          </van-button>
        </div>
      </template>
    </van-nav-bar>

    <van-loading v-if="gameStore.loading && !game" class="flex-1 flex items-center justify-center" />

    <div v-else-if="game" class="flex-1 flex flex-col overflow-hidden">
      <!-- 房间信息 - 绿色渐变 -->
      <div class="room-header">
        <div class="flex items-center justify-between">
          <div>
            <div class="room-label">房间号</div>
            <div class="room-code">{{ game.roomCode }}</div>
          </div>
          <button class="share-btn" @click="handleShare">
            <van-icon name="share-o" size="16" />
            <span>分享</span>
          </button>
        </div>
      </div>

      <!-- 玩家列表 - 固定区域 -->
      <div class="flex-shrink-0 p-3 pb-0">
        <div class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="section-label">玩家 ({{ game.players?.length || 0 }})</span>
          </div>

          <van-empty v-if="!game.players || game.players.length === 0" description="暂无玩家" />

          <div v-else class="player-grid">
            <div
              v-for="player in sortedPlayers"
              :key="player.id"
              class="player-card"
              @click="game.status === 'active' && handlePlayerClick(player)"
            >
              <div class="player-content">
                <!-- 头像 -->
                <div
                  class="player-avatar"
                  :style="{ backgroundColor: getAvatarColor(player.name) }"
                >
                  {{ getPlayerInitial(player.name) }}
                </div>

                <div class="player-info">
                  <div class="player-name">
                    {{ player.name || '未知' }}
                  </div>
                  <div
                    class="player-score"
                    :class="Number(player.balance) >= 0 ? 'score-positive' : 'score-negative'"
                  >
                    {{ Number(player.balance) >= 0 ? '+' : '' }}{{ player.balance }}
                  </div>
                </div>

                <!-- 修改昵称链接 -->
                <span
                  v-if="isMyPlayer(player)"
                  class="rename-link"
                  @click.stop="handleEditNickname(player)"
                >
                  改名
                </span>
              </div>
            </div>
            <button
              v-if="game.status === 'active'"
              type="button"
              class="player-card invite-player-card"
              @click="showInvitePopup = true"
            >
              <div class="player-content">
                <div class="invite-avatar">
                  <van-icon name="plus" size="24" />
                </div>
                <div class="player-info">
                  <div class="player-name invite-name">邀请加入</div>
                  <div class="invite-desc">生成二维码</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 记录区域 -->
      <div class="records-section">
        <div class="records-header">
          <span class="section-label">记录 ({{ game.gameRecords?.length || 0 }})</span>
        </div>

        <van-empty v-if="!game.gameRecords || game.gameRecords.length === 0" description="暂无记录" />

        <div v-else class="records-scroll">
          <div class="record-list">
            <template v-for="(group, gIndex) in groupedRecords" :key="gIndex">
              <div v-if="gIndex > 0" class="record-group-divider">
                <span class="divider-time">{{ formatGroupGap(group[0].createdAt, groupedRecords[gIndex - 1]) }}</span>
              </div>
              <div
                v-for="record in group"
                :key="record.id"
                class="record-item"
              >
                <div class="record-main">
                  <div class="record-flow">
                    <span class="record-player">{{ getPlayerName(record.fromPlayer?.id) }}</span>
                    <span class="record-arrow">
                      <van-icon name="arrow" size="12" color="#16A34A" />
                    </span>
                    <span class="record-player">{{ getPlayerName(record.toPlayer?.id) }}</span>
                    <span class="record-amount">+{{ record.amount }}</span>
                  </div>
                  <div class="record-actions">
                    <span class="record-time">{{ formatDateTime(record.createdAt) }}</span>
                  </div>
                </div>
                <div v-if="record.note" class="record-note">
                  {{ record.note }}
                </div>
              </div>
            </template>
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

    <!-- 编辑游戏对话框 -->
    <van-dialog
      v-model:show="showEditGameDialog"
      title="编辑房间"
      show-cancel-button
      @confirm="handleEditGame"
    >
      <div class="p-4">
        <van-field
          v-model="editGameForm.name"
          label="房间名称"
          placeholder="请输入房间名称"
        />
        <van-field
          v-model="editGameForm.gameType"
          label="游戏类型"
          placeholder="点击选择类型"
          readonly
          is-link
          @click="showEditTypeSheet = true"
        />
        <van-field
          v-if="editGameForm.gameType === '自定义'"
          v-model="editGameForm.customType"
          label="自定义类型"
          placeholder="请输入游戏类型名称"
          required
        />
        <van-button
          v-if="isCreator && !userStore.isGuest"
          block
          type="danger"
          plain
          round
          class="mt-4"
          @click="handleDeleteGame"
        >
          删除游戏
        </van-button>
      </div>
    </van-dialog>

    <!-- 编辑游戏类型选择 -->
    <van-action-sheet
      v-model:show="showEditTypeSheet"
      :actions="editTypeActions"
      cancel-text="取消"
      @select="onEditTypeSelect"
    />

    <!-- 结算弹窗 -->
    <van-popup
      v-model:show="showSettlement"
      round
      closeable
      position="bottom"
      :style="{ maxHeight: '70%' }"
      @closed="onSettlementClosed"
    >
      <div class="settlement-popup">
        <h3 class="settlement-title">游戏结算</h3>
        <div class="settlement-list">
          <div
            v-for="(player, index) in settlementPlayers"
            :key="player.id"
            class="settlement-item"
          >
            <div class="settlement-rank">{{ index + 1 }}</div>
            <div
              class="settlement-avatar"
              :style="{ backgroundColor: getAvatarColor(player.name) }"
            >
              {{ getPlayerInitial(player.name) }}
            </div>
            <div class="settlement-name">{{ player.name }}</div>
            <div
              class="settlement-score"
              :class="Number(player.balance) >= 0 ? 'score-positive' : 'score-negative'"
            >
              {{ Number(player.balance) >= 0 ? '+' : '' }}{{ player.balance }}
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 游客注册提示 -->
    <RegisterPrompt v-model:visible="showRegisterPrompt" source="game-end" />
    <RoomInvitePopup
      v-model:show="showInvitePopup"
      :room-code="game?.roomCode"
      :room-name="game?.name"
    />

    <!-- 非玩家加入提示弹窗 -->
    <van-dialog
      v-model:show="showJoinPrompt"
      :title="roomEnded ? '房间已结束' : '加入房间'"
      :show-cancel-button="true"
      :confirm-button-text="roomEnded ? '查看记录' : '加入房间'"
      cancel-button-text="返回上一页"
      @confirm="handleJoinRoom"
      @cancel="handleBack"
    >
      <div class="p-4 text-center">
        <template v-if="roomEnded">
          <p class="text-gray-600">该房间的游戏已结束</p>
          <p class="text-sm text-gray-400 mt-2">你可以查看游戏记录</p>
        </template>
        <template v-else>
          <p class="text-gray-600">{{ game?.name || '游戏房间' }}</p>
          <p class="text-sm text-gray-400 mt-2">
            类型: {{ game?.gameType || '其他' }} · 玩家: {{ game?.players?.length || 0 }}人
          </p>
          <p class="text-sm text-gray-500 mt-2">是否加入该房间?</p>
        </template>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useUserStore } from '../stores/user';
import { showToast, showConfirmDialog } from 'vant';
import RegisterPrompt from '../components/RegisterPrompt.vue';
import RoomInvitePopup from '../components/RoomInvitePopup.vue';
import { getSelectableTypes } from '../config/gameTypes';
import { buildRoomShareText, buildRoomShareUrl } from '../utils/roomInvite';
import { goBackWithFallback } from '../utils/navigation';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();

const roomCode = route.params.roomCode;
const rawFrom = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from;
const showScoreDialog = ref(false);
const showEditNicknameDialog = ref(false);
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
const showEditGameDialog = ref(false);
const editGameForm = ref({ name: '', gameType: '', customType: '' });
const showEditTypeSheet = ref(false);
const selectableTypes = getSelectableTypes();
const editTypeActions = selectableTypes.map(t => ({ name: t }));
const showSettlement = ref(false);
const showRegisterPrompt = ref(false);
const showJoinPrompt = ref(false);
const roomEnded = ref(false);
const showInvitePopup = ref(false);
let previousStatus = null;

const AUTO_REFRESH_INTERVAL = 6000;
let refreshInterval = null;
let isRefreshingRoom = false;
let hasCheckedJoin = false;

// 页面可见性变化：暂停/恢复轮询
const handleVisibilityChange = () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    loadGame({ silent: true });
  }
};

const game = computed(() => gameStore.currentGame);
const shareUrl = computed(() => buildRoomShareUrl(game.value?.roomCode));
const shareText = computed(() => buildRoomShareText(game.value?.name, game.value?.roomCode));
const backTarget = computed(() => {
  const allowedTargets = new Set(['/home', '/history', '/statistics']);
  return allowedTargets.has(rawFrom) ? rawFrom : '/home';
});

const sortedPlayers = computed(() => {
  if (!game.value?.players) return [];
  return [...game.value.players].sort((a, b) => Number(b.balance) - Number(a.balance));
});

// 按时间间隔分组记录（2分钟内的记录归为一组）
const groupedRecords = computed(() => {
  const records = game.value?.gameRecords;
  if (!records?.length) return [];

  const GROUP_GAP = 2 * 60 * 1000; // 2分钟
  const groups = [[records[0]]];

  for (let i = 1; i < records.length; i++) {
    const prevTime = new Date(records[i - 1].createdAt).getTime();
    const currTime = new Date(records[i].createdAt).getTime();
    if (Math.abs(currTime - prevTime) > GROUP_GAP) {
      groups.push([records[i]]);
    } else {
      groups[groups.length - 1].push(records[i]);
    }
  }
  return groups;
});

const formatGroupGap = (currentTime, prevGroup) => {
  const prev = new Date(prevGroup[prevGroup.length - 1].createdAt).getTime();
  const curr = new Date(currentTime).getTime();
  const gap = Math.abs(curr - prev);
  const minutes = Math.round(gap / (1000 * 60));
  if (minutes < 60) return `${minutes} 分钟后`;
  const hours = Math.round(minutes / 60);
  return `${hours} 小时后`;
};

const currentPlayerId = computed(() => {
  return gameStore.getPlayerId();
});

const isCreator = computed(() => {
  if (!game.value) return false;
  return game.value.creatorId === currentPlayerId.value;
});

const isPlayerInGame = computed(() => {
  return game.value?.players?.some(p => isMyPlayer(p)) ?? false;
});

const settlementPlayers = computed(() => {
  if (!game.value?.players) return [];
  return [...game.value.players].sort((a, b) => Number(b.balance) - Number(a.balance));
});

const getPlayerInitial = (name) => {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return '?';
  }
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (nickname) => {
  const colors = [
    '#16A34A', '#10B981', '#0EA5E9', '#8B5CF6', '#EC4899',
    '#F59E0B', '#EF4444', '#06B6D4', '#6366F1', '#14B8A6'
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

const isMyPlayer = (player) => {
  if (!player) return false;
  const myPlayerId = currentPlayerId.value;
  if (!myPlayerId) return false;

  if (myPlayerId.startsWith('user_')) {
    const username = myPlayerId.replace('user_', '');
    return player.user?.username === username;
  } else {
    return player.guestId === myPlayerId;
  }
};

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
  // 优先使用 Web Share API
  if (navigator.share) {
    navigator.share({
      title: game.value.name || '打牌记账',
      text: shareText.value,
      url: shareUrl.value,
    }).catch(() => {
      // 用户取消分享，静默处理
    });
    return;
  }

  // 降级: 复制完整 URL
  const copyText = `${shareText.value}\n${shareUrl.value}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(copyText)
      .then(() => {
        showToast('分享信息已复制');
      })
      .catch(() => {
        fallbackCopyText(copyText);
      });
  } else {
    fallbackCopyText(copyText);
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
    showToast('分享信息已复制');
  } catch (err) {
    showToast('复制失败');
  }

  document.body.removeChild(textArea);
};

const handleBack = () => {
  goBackWithFallback(router, backTarget.value);
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
    showSettlement.value = true;
  } catch (error) {
    if (error !== 'cancel') {
      showToast(error.message || '结束失败');
    }
  }
};

const onEditTypeSelect = (action) => {
  editGameForm.value.gameType = action.name;
  editGameForm.value.customType = '';
  showEditTypeSheet.value = false;
};

const handleEditGame = async () => {
  let gameType = editGameForm.value.gameType;
  if (gameType === '自定义') {
    gameType = editGameForm.value.customType.trim();
    if (!gameType) {
      showToast('请输入自定义游戏类型');
      return;
    }
  }

  try {
    await gameStore.editGame(roomCode, {
      name: editGameForm.value.name,
      gameType: gameType
    });
    showToast('修改成功');
  } catch (error) {
    showToast(error.message || '修改失败');
  }
};

const handleDeleteGame = async () => {
  showEditGameDialog.value = false;
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '删除后数据无法恢复，确定要删除吗？',
    });
    await gameStore.deleteGame(roomCode);
    showToast('已删除');
    handleBack();
  } catch (error) {
    if (error !== 'cancel') {
      showToast(error.message || '删除失败');
    }
  }
};

const onSettlementClosed = () => {
  if (userStore.isGuest) {
    showRegisterPrompt.value = true;
  }
};

// 监听游戏状态变化，显示结算弹窗
watch(() => game.value?.status, (newStatus, oldStatus) => {
  if (oldStatus === 'active' && newStatus === 'ended') {
    showSettlement.value = true;
  }

  if (newStatus === 'active') {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

watch(showEditGameDialog, (val) => {
  if (val && game.value) {
    const currentType = game.value.gameType || '';
    const isKnownType = selectableTypes.includes(currentType) && currentType !== '自定义';
    editGameForm.value.name = game.value.name || '';
    editGameForm.value.gameType = isKnownType ? currentType : (currentType ? '自定义' : '其他');
    editGameForm.value.customType = isKnownType ? '' : currentType;
  }
});

const startAutoRefresh = () => {
  if (document.hidden || refreshInterval || game.value?.status !== 'active') return

  refreshInterval = setInterval(() => {
    loadGame({ silent: true })
  }, AUTO_REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

const loadGame = async ({ silent = false } = {}) => {
  if (isRefreshingRoom) return

  isRefreshingRoom = true
  try {
    await gameStore.getGameDetail(roomCode, { silent, from: backTarget.value });
    // 首次加载时检查是否为房间玩家
    if (!showJoinPrompt.value && !isPlayerInGame.value && !hasCheckedJoin) {
      hasCheckedJoin = true;
      roomEnded.value = game.value.status !== 'active';
      showJoinPrompt.value = true;
    }

    if (game.value?.status === 'active') {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  } catch (error) {
    showToast(error.message || '加载失败');
    handleBack();
  } finally {
    isRefreshingRoom = false
  }
};

const handleJoinRoom = async () => {
  if (roomEnded.value) {
    showJoinPrompt.value = false;
    return;
  }
  try {
    await gameStore.joinGame(roomCode);
    showToast('已加入房间');
    showJoinPrompt.value = false;
  } catch (error) {
    showToast(error.message || '加入失败');
  }
};

onMounted(() => {
  loadGame();

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  stopAutoRefresh();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.room-header {
  background: linear-gradient(135deg, var(--color-primary, #16A34A) 0%, var(--color-primary-dark, #15803D) 60%, #166534 100%);
  color: #fff;
  padding: 14px 16px;
  flex-shrink: 0;
}

.room-label {
  font-size: calc(12px * var(--font-scale, 1));
  opacity: 0.85;
}

.room-code {
  font-size: calc(22px * var(--font-scale, 1));
  font-weight: 700;
  margin-top: 2px;
  letter-spacing: 1px;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 6px 14px;
  color: #fff;
  font-size: calc(13px * var(--font-scale, 1));
  cursor: pointer;
  transition: background 0.15s ease;
}

.share-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.section-label {
  font-size: var(--font-size-md, 14px);
  font-weight: 700;
  color: var(--color-text-tertiary, #374151);
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.player-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  padding: 10px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.player-card:active {
  transform: scale(0.95);
}

.invite-player-card {
  border: 1px dashed rgba(22, 163, 74, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(240, 253, 244, 0.96));
}

.player-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: calc(18px * var(--font-scale, 1));
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.invite-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary, #16A34A);
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  box-shadow: inset 0 0 0 1px rgba(22, 163, 74, 0.12);
}

.player-info {
  margin-top: 6px;
  text-align: center;
  width: 100%;
}

.player-name {
  font-size: var(--font-size-xs, 12px);
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-score {
  font-size: calc(15px * var(--font-scale, 1));
  font-weight: 700;
  margin-top: 2px;
}

.invite-name {
  color: var(--color-primary, #16A34A);
}

.invite-desc {
  margin-top: 3px;
  font-size: calc(11px * var(--font-scale, 1));
  color: var(--color-text-placeholder, #9CA3AF);
}

.score-positive {
  color: var(--color-success, #16A34A);
}

.score-negative {
  color: var(--color-danger, #EF4444);
}

.records-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 12px 12px;
}

.records-header {
  flex-shrink: 0;
  padding: 4px 0 8px;
}

.records-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.record-group-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
}

.divider-time {
  font-size: calc(11px * var(--font-scale, 1));
  color: var(--color-text-placeholder, #9CA3AF);
  background: var(--color-bg, #F0F2F5);
  padding: 2px 10px;
  border-radius: 10px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  background: var(--color-bg-white, #fff);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: var(--shadow-sm);
  content-visibility: auto;
  contain-intrinsic-size: 86px;
}

.record-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-flow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(13px * var(--font-scale, 1));
}

.record-player {
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
}

.record-arrow {
  display: flex;
  align-items: center;
}

.record-amount {
  color: var(--color-success, #16A34A);
  font-weight: 700;
  margin-left: 2px;
}

.record-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-time {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
}

.record-note {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--color-bg-hover, #F3F4F6);
}

.nav-right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-action-icon {
  color: var(--color-text-tertiary, #374151);
  cursor: pointer;
}

.settlement-popup {
  padding: 24px 20px 32px;
}

.settlement-title {
  font-size: var(--font-size-xl, 20px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  text-align: center;
  margin: 0 0 20px;
}

.settlement-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settlement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg-secondary, #F9FAFB);
  border-radius: 10px;
}

.settlement-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md, 14px);
  font-weight: 700;
  color: var(--color-text-tertiary, #374151);
  flex-shrink: 0;
}

.settlement-item:first-child .settlement-rank {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
}

.settlement-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: calc(15px * var(--font-scale, 1));
  font-weight: 700;
  flex-shrink: 0;
}

.settlement-name {
  flex: 1;
  font-size: calc(15px * var(--font-scale, 1));
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settlement-score {
  font-size: calc(18px * var(--font-scale, 1));
  font-weight: 700;
  flex-shrink: 0;
}

.rename-link {
  font-size: calc(11px * var(--font-scale, 1));
  color: var(--color-primary, #16A34A);
  cursor: pointer;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.rename-link:active {
  background: rgba(22, 163, 74, 0.1);
}

:deep(.van-action-sheet__content) {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
