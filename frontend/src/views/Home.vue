<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">打牌记账</h1>
        <div class="flex items-center space-x-4">
          <span class="text-gray-600">{{ displayName }}</span>
          <button
            v-if="!userStore.isGuest"
            @click="handleLogout"
            class="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            退出登录
          </button>
          <button
            v-else
            @click="showMigrateModal = true"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            迁移数据
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
              您正在使用游客模式，数据仅保存在本地。
              <button @click="router.push('/register')" class="underline font-medium hover:text-yellow-900">
                注册账户
              </button>
              以同步数据到云端。
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

        <Loading v-if="gameStore.loading" />

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
    <div v-if="showJoinModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click.self="showJoinModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md animate-fade-in">
        <h3 class="text-xl font-bold text-gray-800 mb-4">加入游戏</h3>
        <input
          v-model="joinRoomCode"
          type="text"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          placeholder="请输入房间号"
          :disabled="joining"
          @keyup.enter="handleJoinGame"
        />
        <div class="flex space-x-3">
          <button
            @click="handleJoinGame"
            :disabled="joining"
            class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Loading v-if="joining" size="small" text="" />
            <span v-else>加入</span>
          </button>
          <button
            @click="showJoinModal = false"
            :disabled="joining"
            class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 数据迁移弹窗 -->
    <div v-if="showMigrateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click.self="showMigrateModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md animate-fade-in">
        <h3 class="text-xl font-bold text-gray-800 mb-4">迁移游客数据</h3>
        <p class="text-gray-600 mb-6">将您的游客数据迁移到注册账户，数据将永久保存在云端。</p>
        <div class="flex space-x-3">
          <button
            @click="router.push('/register')"
            class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            去注册
          </button>
          <button
            @click="showMigrateModal = false"
            class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
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
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useGameStore } from '../stores/game';
import { useToastStore } from '../stores/toast';
import Loading from '../components/Loading.vue';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();
const toastStore = useToastStore();

const showJoinModal = ref(false);
const showMigrateModal = ref(false);
const joinRoomCode = ref('');
const joining = ref(false);

const displayName = computed(() => {
  if (userStore.isGuest) return '游客模式';
  return userStore.username || '用户';
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleJoinGame = async () => {
  if (!joinRoomCode.value.trim()) {
    toastStore.error('请输入房间号');
    return;
  }

  if (userStore.isGuest) {
    toastStore.warning('游客模式暂不支持加入游戏，请先注册');
    return;
  }

  joining.value = true;
  try {
    await gameStore.joinGame(joinRoomCode.value);
    toastStore.success('加入成功！');
    showJoinModal.value = false;
    joinRoomCode.value = '';
    router.push(`/room/${joinRoomCode.value}`);
  } catch (error) {
    toastStore.error(error.message || '加入失败');
  } finally {
    joining.value = false;
  }
};

const handleLogout = () => {
  userStore.logout();
  toastStore.info('已退出登录');
  router.push('/login');
};

onMounted(async () => {
  try {
    await gameStore.loadGames();
  } catch (error) {
    toastStore.error('加载游戏列表失败');
  }
});
</script>
