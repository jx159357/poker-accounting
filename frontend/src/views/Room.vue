<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <button @click="router.back()" class="text-gray-600 hover:text-gray-800 mr-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">{{ game?.name || '游戏房间' }}</h1>
              <p class="text-sm text-gray-500">房间号: {{ roomCode }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span
              :class="game?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="px-3 py-1 rounded-full text-sm font-medium"
            >
              {{ game?.status === 'active' ? '进行中' : '已结束' }}
            </span>
            <button
              v-if="game?.status === 'active'"
              @click="showEndGameModal = true"
              class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
            >
              结束游戏
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <Loading v-if="loading" />

    <!-- 主内容 -->
    <div v-else-if="game" class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：游戏信息 -->
        <div class="lg:col-span-1 space-y-6">
          <!-- 游戏设置卡片 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-4">游戏设置</h2>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-600">买入金额</span>
                <span class="font-semibold text-gray-800">¥{{ game.buyIn }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-gray-600">小盲</span>
                <span class="font-semibold text-gray-800">¥{{ game.smallBlind }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-600">大盲</span>
                <span class="font-semibold text-gray-800">¥{{ game.bigBlind }}</span>
              </div>
            </div>
          </div>

          <!-- 玩家列表 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-4">
              玩家列表 ({{ players.length }})
            </h2>
            <div v-if="players.length === 0" class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p class="text-sm">暂无玩家</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="player in players"
                :key="player.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {{ player.username.charAt(0).toUpperCase() }}
                  </div>
                  <span class="ml-3 font-medium text-gray-800">{{ player.username }}</span>
                </div>
                <div class="text-right">
                  <div class="font-semibold" :class="player.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ player.balance >= 0 ? '+' : '' }}¥{{ player.balance }}
                  </div>
                  <div class="text-xs text-gray-500">总买入: ¥{{ player.totalBuyIn }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：记录区域 -->
        <div class="lg:col-span-2">
          <!-- 添加记录卡片 -->
          <div v-if="game.status === 'active'" class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-lg font-bold text-gray-800 mb-4">添加记录</h2>
            <form @submit.prevent="handleAddRecord" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    金额
                  </label>
                  <div class="relative">
                    <span class="absolute left-4 top-3 text-gray-500">¥</span>
                    <input
                      v-model.number="recordAmount"
                      type="number"
                      min="0"
                      step="100"
                      class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="输入金额"
                      :disabled="addingRecord"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    类型
                  </label>
                  <select
                    v-model="recordType"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    :disabled="addingRecord"
                  >
                    <option value="buyin">买入</option>
                    <option value="cashout">结算</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                :disabled="addingRecord"
                class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Loading v-if="addingRecord" size="small" text="" />
                <span v-else>添加记录</span>
              </button>
            </form>
          </div>

          <!-- 记录列表 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-4">
              记录列表 ({{ records.length }})
            </h2>
            <div v-if="records.length === 0" class="text-center py-12 text-gray-500">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>暂无记录</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="record in records"
                :key="record.id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div class="flex items-center flex-1">
                  <div
                    :class="record.type === 'buyin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'"
                    class="px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {{ record.type === 'buyin' ? '买入' : '结算' }}
                  </div>
                  <div class="ml-4">
                    <div class="font-semibold text-gray-800">¥{{ record.amount }}</div>
                    <div class="text-sm text-gray-500">{{ formatDate(record.createdAt) }}</div>
                  </div>
                </div>
                <button
                  v-if="game.status === 'active'"
                  @click="handleUndoRecord(record.id)"
                  class="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  撤销
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 结束游戏确认弹窗 -->
    <div v-if="showEndGameModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click.self="showEndGameModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md animate-fade-in">
        <h3 class="text-xl font-bold text-gray-800 mb-4">确认结束游戏</h3>
        <p class="text-gray-600 mb-6">结束后将无法继续添加记录，确定要结束这局游戏吗？</p>
        <div class="flex space-x-3">
          <button
            @click="handleEndGame"
            :disabled="endingGame"
            class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Loading v-if="endingGame" size="small" text="" />
            <span v-else>确认结束</span>
          </button>
          <button
            @click="showEndGameModal = false"
            :disabled="endingGame"
            class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useToastStore } from '../stores/toast';
import Loading from '../components/Loading.vue';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();
const toastStore = useToastStore();

const roomCode = route.params.roomCode;
const loading = ref(false);
const recordAmount = ref(null);
const recordType = ref('buyin');
const addingRecord = ref(false);
const showEndGameModal = ref(false);
const endingGame = ref(false);

const game = computed(() => gameStore.currentGame);
const players = computed(() => game.value?.players || []);
const records = computed(() => game.value?.records || []);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleAddRecord = async () => {
  if (!recordAmount.value || recordAmount.value <= 0) {
    toastStore.error('请输入有效的金额');
    return;
  }

  addingRecord.value = true;
  try {
    // 这里需要调用 API 添加记录
    // await addRecord(roomCode, recordAmount.value, recordType.value);
    toastStore.success('记录添加成功');
    recordAmount.value = null;
    await loadGameDetail();
  } catch (error) {
    toastStore.error(error.message || '添加记录失败');
  } finally {
    addingRecord.value = false;
  }
};

const handleUndoRecord = async (recordId) => {
  try {
    // 这里需要调用 API 撤销记录
    // await undoRecord(roomCode, recordId);
    toastStore.success('记录已撤销');
    await loadGameDetail();
  } catch (error) {
    toastStore.error(error.message || '撤销失败');
  }
};

const handleEndGame = async () => {
  endingGame.value = true;
  try {
    await gameStore.endGame(roomCode);
    toastStore.success('游戏已结束');
    showEndGameModal.value = false;
    await loadGameDetail();
  } catch (error) {
    toastStore.error(error.message || '结束游戏失败');
  } finally {
    endingGame.value = false;
  }
};

const loadGameDetail = async () => {
  loading.value = true;
  try {
    await gameStore.loadGameDetail(roomCode);
  } catch (error) {
    toastStore.error('加载游戏详情失败');
    router.push('/home');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadGameDetail();
});
</script>
