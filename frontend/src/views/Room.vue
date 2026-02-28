<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <button @click="router.push('/home')" class="text-gray-600 hover:text-gray-800 mr-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">{{ game?.name || '游戏房间' }}</h1>
              <p class="text-sm text-gray-500">房间号: {{ roomCode }}
                <button @click="copyRoomCode" class="ml-2 text-blue-500 hover:text-blue-700 text-xs">复制</button>
              </p>
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
    <div v-if="loading" class="flex items-center justify-center py-20">
      <van-loading size="36px" />
    </div>

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
                <span class="text-gray-600">类型</span>
                <span class="font-semibold text-gray-800">{{ game.gameType || '德州扑克' }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-600">玩家数</span>
                <span class="font-semibold text-gray-800">{{ players.length }}</span>
              </div>
            </div>
          </div>

          <!-- 玩家列表 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-gray-800">
                玩家列表 ({{ players.length }})
              </h2>
              <button
                v-if="game.status === 'active'"
                @click="showJoinPlayerModal = true"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + 加入玩家
              </button>
            </div>
            <div v-if="players.length === 0" class="text-center py-8 text-gray-500">
              <p class="text-sm">暂无玩家</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="player in players"
                :key="player.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    :style="getPlayerAvatarStyle(player.name)"
                  >
                    {{ player.name.charAt(0).toUpperCase() }}
                  </div>
                  <span class="ml-3 font-medium text-gray-800">{{ player.name }}</span>
                </div>
                <div class="text-right">
                  <div class="font-semibold" :class="Number(player.currentScore) >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ Number(player.currentScore) >= 0 ? '+' : '' }}&yen;{{ Number(player.currentScore) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：转账区域 -->
        <div class="lg:col-span-2">
          <!-- 添加转账卡片 -->
          <div v-if="game.status === 'active'" class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 class="text-lg font-bold text-gray-800 mb-4">添加转账</h2>
            <form @submit.prevent="handleAddTransaction" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">付款方</label>
                  <select
                    v-model="fromPlayerId"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    :disabled="addingTransaction"
                  >
                    <option value="">请选择付款方</option>
                    <option v-for="player in players" :key="player.id" :value="player.id">
                      {{ player.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">收款方</label>
                  <select
                    v-model="toPlayerId"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    :disabled="addingTransaction"
                  >
                    <option value="">请选择收款方</option>
                    <option
                      v-for="player in players"
                      :key="player.id"
                      :value="player.id"
                      :disabled="player.id === fromPlayerId"
                    >
                      {{ player.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">金额</label>
                  <div class="relative">
                    <span class="absolute left-4 top-3 text-gray-500">&yen;</span>
                    <input
                      v-model.number="transactionAmount"
                      type="number"
                      min="0"
                      step="100"
                      class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="输入金额"
                      :disabled="addingTransaction"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">备注 (可选)</label>
                  <input
                    v-model="transactionRemark"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="输入备注"
                    :disabled="addingTransaction"
                  />
                </div>
              </div>
              <button
                type="submit"
                :disabled="addingTransaction"
                class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <van-loading v-if="addingTransaction" size="20px" color="#fff" />
                <span v-else>添加转账</span>
              </button>
            </form>
          </div>

          <!-- 转账记录列表 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-4">
              转账记录 ({{ transactions.length }})
            </h2>
            <div v-if="transactions.length === 0" class="text-center py-12 text-gray-500">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>暂无转账记录</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="tx in transactions"
                :key="tx.id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div class="flex items-center flex-1">
                  <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    转账
                  </div>
                  <div class="ml-4">
                    <div class="font-semibold text-gray-800">
                      {{ tx.fromPlayer?.name || '未知' }} → {{ tx.toPlayer?.name || '未知' }}
                      &yen;{{ tx.amount }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ formatDate(tx.createdAt) }}
                      <span v-if="tx.remark" class="ml-2 text-gray-400">({{ tx.remark }})</span>
                    </div>
                  </div>
                </div>
                <button
                  v-if="game.status === 'active'"
                  @click="handleUndoTransaction(tx.id)"
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

    <!-- 加入玩家弹窗 -->
    <van-dialog
      v-model:show="showJoinPlayerModal"
      title="加入新玩家"
      show-cancel-button
      :before-close="handleJoinPlayerBeforeClose"
    >
      <div class="px-4 py-2">
        <van-field
          v-model="newPlayerName"
          label="玩家昵称"
          placeholder="请输入玩家昵称"
        />
      </div>
    </van-dialog>

    <!-- 结束游戏确认弹窗 -->
    <van-dialog
      v-model:show="showEndGameModal"
      title="确认结束游戏"
      message="结束后将无法继续添加转账，确定要结束这局游戏吗？"
      show-cancel-button
      @confirm="handleEndGame"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useGameStore } from '../stores/game'
import { getAvatarColorByString } from '../utils/nameGenerator'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const roomCode = route.params.roomCode
const loading = ref(false)
const transactionAmount = ref(null)
const transactionRemark = ref('')
const fromPlayerId = ref('')
const toPlayerId = ref('')
const addingTransaction = ref(false)
const showEndGameModal = ref(false)
const showJoinPlayerModal = ref(false)
const newPlayerName = ref('')

let pollTimer = null

const game = computed(() => gameStore.currentGame)
const players = computed(() => game.value?.players || [])
const transactions = computed(() => game.value?.transactions || [])

const getPlayerAvatarStyle = (name) => {
  const color = getAvatarColorByString(name)
  return { background: color.bg }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const copyRoomCode = () => {
  navigator.clipboard.writeText(roomCode).then(() => {
    showToast('房间号已复制')
  }).catch(() => {
    showToast('复制失败')
  })
}

const handleAddTransaction = async () => {
  if (!fromPlayerId.value) {
    showToast('请选择付款方')
    return
  }
  if (!toPlayerId.value) {
    showToast('请选择收款方')
    return
  }
  if (fromPlayerId.value === toPlayerId.value) {
    showToast('付款方和收款方不能相同')
    return
  }
  if (!transactionAmount.value || transactionAmount.value <= 0) {
    showToast('请输入有效的金额')
    return
  }

  addingTransaction.value = true
  try {
    await gameStore.addTransaction(
      roomCode,
      fromPlayerId.value,
      toPlayerId.value,
      transactionAmount.value,
      transactionRemark.value
    )
    showToast('转账添加成功')
    transactionAmount.value = null
    transactionRemark.value = ''
    fromPlayerId.value = ''
    toPlayerId.value = ''
  } catch (error) {
    showToast(error.response?.data?.message || '添加转账失败')
  } finally {
    addingTransaction.value = false
  }
}

const handleUndoTransaction = async (transactionId) => {
  try {
    await gameStore.undoTransaction(roomCode, transactionId)
    showToast('转账已撤销')
  } catch (error) {
    showToast(error.response?.data?.message || '撤销失败')
  }
}

const handleEndGame = async () => {
  try {
    await gameStore.finishGame(roomCode)
    showToast('游戏已结束')
  } catch (error) {
    showToast(error.response?.data?.message || '结束游戏失败')
  }
}

const handleJoinPlayerBeforeClose = async (action) => {
  if (action === 'confirm') {
    const name = newPlayerName.value.trim()
    if (!name) {
      showToast('请输入玩家昵称')
      return false
    }
    try {
      await gameStore.joinGame(roomCode, name)
      await loadGameDetail()
      showToast('玩家已加入')
      newPlayerName.value = ''
      return true
    } catch (error) {
      showToast(error.response?.data?.message || '加入失败')
      return false
    }
  }
  return true
}

const loadGameDetail = async () => {
  loading.value = true
  try {
    await gameStore.loadGameDetail(roomCode)
  } catch {
    showToast('加载游戏详情失败')
    router.push('/home')
  } finally {
    loading.value = false
  }
}

// 轮询刷新（5秒）
const startPolling = () => {
  pollTimer = setInterval(async () => {
    if (game.value?.status === 'active') {
      try {
        await gameStore.loadGameDetail(roomCode)
      } catch {
        // 静默
      }
    }
  }, 5000)
}

onMounted(() => {
  loadGameDetail()
  startPolling()
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
