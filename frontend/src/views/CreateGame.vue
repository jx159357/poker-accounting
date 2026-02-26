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
              :disabled="gameStore.loading"
            />
          </div>

          <!-- 买入金额 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              买入金额 <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-gray-500">¥</span>
              <input
                v-model.number="buyIn"
                type="number"
                min="0"
                step="100"
                class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="1000"
                :disabled="gameStore.loading"
              />
            </div>
            <p class="mt-1 text-sm text-gray-500">每位玩家的初始买入金额</p>
          </div>

          <!-- 盲注设置 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                小盲 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-3 text-gray-500">¥</span>
                <input
                  v-model.number="smallBlind"
                  type="number"
                  min="0"
                  step="5"
                  class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="5"
                  :disabled="gameStore.loading"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                大盲 <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-4 top-3 text-gray-500">¥</span>
                <input
                  v-model.number="bigBlind"
                  type="number"
                  min="0"
                  step="10"
                  class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="10"
                  :disabled="gameStore.loading"
                />
              </div>
            </div>
          </div>

          <!-- 快速设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              快速设置
            </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                type="button"
                @click="setQuickConfig(1000, 5, 10)"
                class="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-sm"
                :disabled="gameStore.loading"
              >
                <div class="font-medium">小局</div>
                <div class="text-xs text-gray-500 mt-1">1000/5/10</div>
              </button>
              <button
                type="button"
                @click="setQuickConfig(2000, 10, 20)"
                class="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-sm"
                :disabled="gameStore.loading"
              >
                <div class="font-medium">中局</div>
                <div class="text-xs text-gray-500 mt-1">2000/10/20</div>
              </button>
              <button
                type="button"
                @click="setQuickConfig(5000, 25, 50)"
                class="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-sm"
                :disabled="gameStore.loading"
              >
                <div class="font-medium">大局</div>
                <div class="text-xs text-gray-500 mt-1">5000/25/50</div>
              </button>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              :disabled="gameStore.loading"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Loading v-if="gameStore.loading" size="small" text="" />
              <span v-else>创建游戏</span>
            </button>
            <button
              type="button"
              @click="router.back()"
              :disabled="gameStore.loading"
              class="px-6 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>
      </div>

      <!-- 说明卡片 -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div class="ml-3 text-sm text-blue-800">
            <p class="font-medium mb-1">温馨提示</p>
            <ul class="list-disc list-inside space-y-1 text-blue-700">
              <li>创建后会生成唯一房间号，分享给其他玩家加入</li>
              <li>买入金额是每位玩家的初始筹码</li>
              <li>盲注设置影响游戏节奏，建议根据买入金额合理设置</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useToastStore } from '../stores/toast';
import Loading from '../components/Loading.vue';

const router = useRouter();
const gameStore = useGameStore();
const toastStore = useToastStore();

const gameName = ref('');
const buyIn = ref(1000);
const smallBlind = ref(5);
const bigBlind = ref(10);

const setQuickConfig = (buy, small, big) => {
  buyIn.value = buy;
  smallBlind.value = small;
  bigBlind.value = big;
};

const handleCreateGame = async () => {
  // 表单验证
  if (!gameName.value.trim()) {
    toastStore.error('请输入游戏名称');
    return;
  }

  if (!buyIn.value || buyIn.value <= 0) {
    toastStore.error('请输入有效的买入金额');
    return;
  }

  if (!smallBlind.value || smallBlind.value <= 0) {
    toastStore.error('请输入有效的小盲金额');
    return;
  }

  if (!bigBlind.value || bigBlind.value <= 0) {
    toastStore.error('请输入有效的大盲金额');
    return;
  }

  if (bigBlind.value <= smallBlind.value) {
    toastStore.error('大盲必须大于小盲');
    return;
  }

  try {
    const game = await gameStore.createGame(
      gameName.value,
      buyIn.value,
      smallBlind.value,
      bigBlind.value
    );

    toastStore.success('游戏创建成功！');
    router.push(`/room/${game.roomCode}`);
  } catch (error) {
    toastStore.error(error.message || '创建游戏失败');
  }
};
</script>
