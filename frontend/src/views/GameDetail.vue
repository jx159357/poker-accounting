<template>
  <div class="game-detail-page">
    <van-nav-bar :title="game?.gameType || '牌局详情'" left-arrow @click-left="goBack" fixed />

    <div class="content" v-if="game">
      <!-- 统计信息 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value" :class="{ 'win': totalAmount > 0, 'lose': totalAmount < 0 }">
            {{ totalAmount > 0 ? '+' : '' }}{{ totalAmount.toFixed(2) }}
          </div>
          <div class="stat-label">本局输赢</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ game.records.length }}</div>
          <div class="stat-label">记录数</div>
        </div>
      </div>

      <!-- 记录列表 -->
      <div class="record-list">
        <div class="list-header">
          <h3>记录明细</h3>
        </div>

        <van-empty v-if="game.records.length === 0" description="还没有记录" />

        <van-cell-group v-else inset>
          <van-swipe-cell v-for="record in game.records" :key="record.id">
            <van-cell :title="record.playerName" :label="formatDate(record.createdAt)">
              <template #value>
                <span :class="{ 'win': record.amount > 0, 'lose': record.amount < 0 }">
                  {{ record.amount > 0 ? '+' : '' }}{{ record.amount.toFixed(2) }}
                </span>
              </template>
            </van-cell>
            <template #right>
              <van-button square type="danger" text="删除" @click="deleteRecord(record.id)" />
            </template>
          </van-swipe-cell>
        </van-cell-group>
      </div>
    </div>

    <!-- 添加记录按钮 -->
    <van-floating-bubble icon="plus" @click="showAddDialog = true" />

    <!-- 添加记录弹窗 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="添加记录"
      show-cancel-button
      @confirm="addRecord"
    >
      <van-form>
        <van-field v-model="playerName" label="玩家" placeholder="请输入玩家名称" />
        <van-field v-model="amount" label="金额" type="number" placeholder="赢为正数，输为负数" />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useUserStore } from '../stores/user';
import { useGuestStore } from '../stores/guest';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const guestStore = useGuestStore();

const gameId = ref(parseInt(route.params.id));
const game = ref(null);
const showAddDialog = ref(false);
const playerName = ref('');
const amount = ref('');

const totalAmount = computed(() => {
  if (!game.value) return 0;
  return game.value.records.reduce((sum, record) => sum + record.amount, 0);
});

// const loadGame = () => {
//   if (userStore.isGuest) {
//     game.value = guestStore.allGames.find(g => g.id === gameId.value);
//   } else {
//     // TODO: 从服务器获取
//   }
// };

const addRecord = () => {
  if (!playerName.value.trim()) {
    showToast('请输入玩家名称');
    return;
  }
  if (!amount.value) {
    showToast('请输入金额');
    return;
  }

  if (userStore.isGuest) {
    guestStore.addRecord(gameId.value, playerName.value, parseFloat(amount.value));
    // loadGame();
    showToast('记录添加成功');
  } else {
    // TODO: 调用后端接口
    showToast('功能开发中');
  }

  playerName.value = '';
  amount.value = '';
};

const deleteRecord = async (recordId) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条记录吗？',
    });

    if (userStore.isGuest) {
      guestStore.deleteRecord(gameId.value, recordId);
      // loadGame();
      showToast('删除成功');
    } else {
      // TODO: 调用后端接口
      showToast('功能开发中');
    }
  } catch {
    // 取消删除
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  // loadGame();
  if (!game.value) {
    showToast('牌局不存在');
    router.back();
  }
});
</script>

<style scoped>
.game-detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.content {
  padding-top: 46px;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 16px;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  justify-content: space-around;
  color: white;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-value.win {
  color: #07c160;
}

.stat-value.lose {
  color: #ee0a24;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.record-list {
  margin-top: 16px;
}

.list-header {
  padding: 16px;
}

.list-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.win {
  color: #07c160;
  font-weight: 600;
}

.lose {
  color: #ee0a24;
  font-weight: 600;
}
</style>
