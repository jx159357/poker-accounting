<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <van-nav-bar title="个人资料" left-arrow fixed placeholder @click-left="router.back()" />

    <van-loading v-if="loading" class="flex-1 flex items-center justify-center" />

    <div v-else class="flex-1 overflow-y-auto">
      <div class="p-4 space-y-4">
        <!-- 用户信息卡片 -->
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="flex items-center space-x-4">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              :style="{ backgroundColor: getAvatarColor(profile.nickname || profile.username) }"
            >
              {{ getInitial(profile.nickname || profile.username) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-lg font-bold truncate">{{ profile.nickname || profile.username }}</div>
              <div class="text-sm text-gray-500 mt-1">
                {{ userStore.isGuest ? '游客' : '注册用户' }}
              </div>
              <div class="text-xs text-gray-400 mt-1 truncate">
                ID: {{ userStore.isGuest ? guestId : profile.username }}
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑昵称 -->
        <div class="bg-white rounded-lg shadow-sm">
          <van-cell-group>
            <van-field
              v-model="editForm.nickname"
              label="昵称"
              placeholder="请输入昵称"
              :readonly="!isEditing"
            >
              <template #button>
                <van-button
                  v-if="!isEditing"
                  size="small"
                  type="primary"
                  @click="startEdit"
                >
                  修改
                </van-button>
              </template>
            </van-field>
          </van-cell-group>
          <div v-if="isEditing" class="p-4 flex space-x-2">
            <van-button
              block
              type="primary"
              @click="handleSaveNickname"
              :loading="saving"
            >
              保存
            </van-button>
            <van-button
              block
              @click="cancelEdit"
            >
              取消
            </van-button>
          </div>
        </div>

        <!-- 游客转注册 -->
        <div v-if="userStore.isGuest" class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-center">
            <div class="text-sm text-gray-600 mb-3">
              注册账号可以保存你的游戏数据
            </div>
            <van-button
              type="primary"
              block
              @click="router.push('/register')"
            >
              注册账号
            </van-button>
          </div>
        </div>

        <!-- 统计数据 -->
        <div v-if="stats" class="bg-white rounded-lg p-4 shadow-sm">
          <h3 class="text-lg font-bold mb-3">我的数据</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ stats.totalGames }}</div>
              <div class="text-sm text-gray-500 mt-1">总场次</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ stats.winRate }}%</div>
              <div class="text-sm text-gray-500 mt-1">胜率</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ stats.totalWins }}</div>
              <div class="text-sm text-gray-500 mt-1">胜场</div>
            </div>
            <div class="text-center">
              <div
                :class="stats.totalScore >= 0 ? 'text-green-600' : 'text-red-600'"
                class="text-2xl font-bold"
              >
                {{ stats.totalScore >= 0 ? '+' : '' }}{{ stats.totalScore }}
              </div>
              <div class="text-sm text-gray-500 mt-1">总积分</div>
            </div>
          </div>
        </div>

        <!-- 退出登录 -->
        <div v-if="!userStore.isGuest" class="bg-white rounded-lg shadow-sm">
          <van-cell-group>
            <van-cell
              title="退出登录"
              is-link
              @click="handleLogout"
            />
          </van-cell-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useGameStore } from '../stores/game';
import { showToast, showConfirmDialog } from 'vant';
import { authApi } from '../api/auth';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();

const loading = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const profile = ref({
  username: '',
  nickname: '',
});
const editForm = ref({
  nickname: '',
});
const stats = ref(null);

const guestId = computed(() => {
  return localStorage.getItem('guestId') || '';
});

const getInitial = (name) => {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return '?';
  }
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];

  if (!name || typeof name !== 'string') {
    return colors[0];
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const loadProfile = async () => {
  loading.value = true;
  try {
    if (userStore.isGuest) {
      // 游客模式
      const nickname = localStorage.getItem('guestNickname') || '游客';
      profile.value = {
        username: guestId.value,
        nickname: nickname,
      };
      editForm.value.nickname = nickname;
    } else {
      // 注册用户
      const data = await authApi.getProfile();
      profile.value = data;
      editForm.value.nickname = data.nickname || data.username;
    }

    // 加载统计数据
    stats.value = await gameStore.getStats();
  } catch (error) {
    console.error('Load profile error:', error);
    showToast(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

const startEdit = () => {
  isEditing.value = true;
  editForm.value.nickname = profile.value.nickname || profile.value.username;
};

const handleSaveNickname = async () => {
  if (!editForm.value.nickname.trim()) {
    showToast('请输入昵称');
    return;
  }

  saving.value = true;
  try {
    if (userStore.isGuest) {
      // 游客模式 - 保存到 localStorage
      localStorage.setItem('guestNickname', editForm.value.nickname);
      profile.value.nickname = editForm.value.nickname;
      showToast('昵称已更新');
    } else {
      // 注册用户 - 保存到服务器
      await authApi.updateProfile({
        nickname: editForm.value.nickname,
      });
      profile.value.nickname = editForm.value.nickname;
      showToast('昵称已更新');
    }

    isEditing.value = false;
  } catch (error) {
    showToast(error.message || '更新失败');
  } finally {
    saving.value = false;
  }
};

const cancelEdit = () => {
  editForm.value.nickname = profile.value.nickname || profile.value.username;
  isEditing.value = false;
};

const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '确定要退出登录吗？',
    });

    userStore.logout();
    showToast('已退出登录');
    router.push('/login');
  } catch (error) {
    // 用户取消
  }
};

onMounted(() => {
  loadProfile();
});
</script>
