<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center">
        <button @click="router.back()" class="text-gray-600 hover:text-gray-800 mr-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-800">创建游戏</h1>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
        <form @submit.prevent="handleCreateGame" class="space-y-6">
          <!-- 游戏名称 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              游戏名称 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="gameName"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="例如：周五夜局"
              :disabled="submitting"
            />
          </div>

          <!-- 游戏类型 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">游戏类型</label>
            <select
              v-model="gameType"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              :disabled="submitting"
            >
              <option value="德州扑克">德州扑克</option>
              <option value="跑得快">跑得快</option>
              <option value="麻将">麻将</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <!-- 提交按钮 -->
          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <van-loading v-if="submitting" size="20px" color="#fff" />
              <span v-else>创建游戏</span>
            </button>
            <button
              type="button"
              @click="router.back()"
              :disabled="submitting"
              class="px-6 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useGameStore } from '../stores/game'

const router = useRouter()
const gameStore = useGameStore()

const gameName = ref('')
const gameType = ref('德州扑克')
const submitting = ref(false)

const handleCreateGame = async () => {
  if (!gameName.value.trim()) {
    showToast('请输入游戏名称')
    return
  }

  submitting.value = true
  try {
    const game = await gameStore.createGame({
      name: gameName.value,
      gameType: gameType.value
    })

    showToast('游戏创建成功！')
    router.push(`/room/${game.roomCode}`)
  } catch (error) {
    showToast(error.response?.data?.message || '创建游戏失败')
  } finally {
    submitting.value = false
  }
}
</script>
