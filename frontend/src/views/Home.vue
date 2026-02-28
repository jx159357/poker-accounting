<template>
  <div class="min-h-screen bg-gray-50 pb-16">
    <!-- 顶部导航 -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">打牌记账</h1>
        <div class="flex items-center space-x-4">
          <span class="text-gray-600 text-sm">{{ displayName }}</span>
          <button
            @click="router.push('/profile')"
            class="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            个人中心
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- 游客提示 -->
      <div v-if="userStore.isGuest" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 animate-fade-in">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <p class="text-sm text-yellow-800">
              您正在使用游客模式。
              <button @click="router.push('/login')" class="underline font-medium hover:text-yellow-900">
                登录
              </button>
              或
              <button @click="router.push('/register')" class="underline font-medium hover:text-yellow-900">
                注册
              </button>
              以同步数据。
            </p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          @click="router.push('/create')"
          class="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-lg font-semibold">创建游戏</span>
        </button>

        <button
          @click="showJoinModal = true"
          class="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span class="text-lg font-semibold">加入游戏</span>
        </button>
      </div>

      <!-- 我的游戏列表 -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">我的游戏</h2>

        <div v-if="gameStore.loading" class="text-center py-12 text-gray-500">
          <van-loading size="36px" />
          <p class="mt-2">加载中...</p>
        </div>

        <div v-else-if="gameStore.games.length === 0" class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-lg font-medium">暂无游戏记录</p>
          <p class="text-sm mt-2">创建或加入一个游戏开始记账吧！</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="game in gameStore.games"
            :key="game.id"
            @click="router.push(`/room/${game.roomCode}`)"
            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition hover:shadow-md"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800 text-lg">{{ game.name }}</h3>
                <div class="mt-2 space-y-1">
                  <p class="text-sm text-gray-500">
                    <span class="font-medium">房间号:</span> {{ game.roomCode }}
                  </p>
                  <p class="text-sm text-gray-500">
                    <span class="font-medium">创建时间:</span> {{ formatDate(game.createdAt) }}
                  </p>
                </div>
              </div>
              <span
                :class="game.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                class="px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ game.status === 'active' ? '进行中' : '已结束' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加入游戏弹窗 -->
    <van-dialog
      v-model:show="showJoinModal"
      title="加入游戏"
      show-cancel-button
      :before-close="handleJoinBeforeClose"
    >
      <div class="px-4 py-2">
        <van-field
          v-model="joinRoomCode"
          label="房间号"
          placeholder="请输入6位房间号"
          maxlength="6"
        />
        <van-field
          v-model="joinNickname"
          label="昵称"
          :placeholder="userStore.currentNickname"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../stores/user'
import { useGameStore } from '../stores/game'

const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const showJoinModal = ref(false)
const joinRoomCode = ref('')
const joinNickname = ref('')

const displayName = computed(() => {
  if (userStore.isGuest) return '游客模式'
  return userStore.currentNickname || '用户'
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleJoinBeforeClose = async (action) => {
  if (action === 'confirm') {
    const code = joinRoomCode.value.trim().toUpperCase()
    if (!code) {
      showToast('请输入房间号')
      return false
    }
    try {
      const nickname = joinNickname.value.trim() || userStore.currentNickname
      await gameStore.joinGame(code, nickname)
      showToast('加入成功！')
      router.push(`/room/${code}`)
      joinRoomCode.value = ''
      joinNickname.value = ''
      return true
    } catch (error) {
      showToast(error.response?.data?.message || '加入失败')
      return false
    }
  }
  return true
}

onMounted(async () => {
  try {
    await gameStore.loadGames()
  } catch {
    // 静默处理
  }
})
</script>
