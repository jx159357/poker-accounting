<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
    <van-nav-bar title="个人资料" left-arrow @click-left="handleBack" />

    <van-loading v-if="loading" class="flex-1 flex items-center justify-center" />

    <div v-else class="flex-1 flex flex-col overflow-hidden min-h-0">
      <!-- 固定区域: 头部 + 统计 -->
      <div class="flex-shrink-0">
        <!-- 用户信息卡片 - 带绿色渐变头部 -->
        <div class="profile-header">
          <div class="profile-header-bg"></div>
          <div class="profile-avatar-area">
            <div
              class="profile-avatar"
              :style="{ backgroundColor: getAvatarColor(profile.nickname || profile.username) }"
            >
              {{ getInitial(profile.nickname || profile.username) }}
            </div>
            <div class="profile-name">{{ profile.nickname || profile.username }}</div>
            <div class="profile-role">
              {{ userStore.isGuest ? '游客' : '注册用户' }}
              <span class="profile-id">· ID: {{ userStore.isGuest ? guestId : profile.username }}</span>
            </div>
          </div>
        </div>

        <!-- 统计数据 - 4列单行紧凑 -->
        <div v-if="stats" class="profile-stats-bar">
          <div class="profile-stat-item">
            <div class="profile-stat-value profile-stat-blue">{{ stats.totalGames }}</div>
            <div class="profile-stat-label">总场次</div>
          </div>
          <div class="profile-stat-item">
            <div class="profile-stat-value profile-stat-green">{{ stats.winRate }}%</div>
            <div class="profile-stat-label">胜率</div>
          </div>
          <div class="profile-stat-item">
            <div class="profile-stat-value profile-stat-purple">{{ stats.totalWins }}</div>
            <div class="profile-stat-label">胜场</div>
          </div>
          <div class="profile-stat-item">
            <div
              class="profile-stat-value"
              :class="stats.totalScore >= 0 ? 'profile-stat-green' : 'profile-stat-red'"
            >
              {{ stats.totalScore >= 0 ? '+' : '' }}{{ stats.totalScore }}
            </div>
            <div class="profile-stat-label">总积分</div>
          </div>
        </div>
      </div>

      <!-- 可滚动区域 -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <div class="profile-body">
        <!-- 编辑昵称 -->
        <div class="profile-card">
          <van-cell-group :border="false">
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
                  plain
                  round
                  class="action-btn-toolbar"
                  @click="startEdit"
                >
                  修改
                </van-button>
              </template>
            </van-field>
          </van-cell-group>
          <div v-if="isEditing" class="edit-actions">
            <van-button
              block
              type="primary"
              round
              class="action-btn-primary"
              @click="handleSaveNickname"
              :loading="saving"
            >
              保存
            </van-button>
            <van-button
              block
              plain
              type="primary"
              round
              class="action-btn-secondary"
              @click="cancelEdit"
            >
              取消
            </van-button>
          </div>
        </div>

        <div class="profile-card">
          <van-cell-group :border="false">
            <van-cell title="界面设置" is-link @click="settingsStore.openDrawer()" />
          </van-cell-group>
        </div>

        <!-- 游客转注册 -->
        <div v-if="userStore.isGuest" class="profile-card guest-card">
          <div class="guest-hint">
            注册账号可以保存你的游戏数据
          </div>
          <van-button
            type="primary"
            block
            round
            class="action-btn-primary"
            @click="router.push('/register')"
          >
            立即注册
          </van-button>
        </div>

        <!-- 修改密码 (注册用户专属) -->
        <div v-if="!userStore.isGuest" class="profile-card">
          <van-cell-group :border="false">
            <van-cell title="修改密码" is-link @click="showPasswordForm = !showPasswordForm" />
          </van-cell-group>
          <div v-if="showPasswordForm" class="password-form">
            <van-field
              v-model="passwordForm.oldPassword"
              type="password"
              label="旧密码"
              placeholder="请输入旧密码"
            />
            <van-field
              v-model="passwordForm.newPassword"
              type="password"
              label="新密码"
              placeholder="请输入新密码 (至少6位)"
            />
            <van-field
              v-model="passwordForm.confirmPassword"
              type="password"
              label="确认密码"
              placeholder="请再次输入新密码"
            />
            <div class="edit-actions">
              <van-button
                block
                type="primary"
                round
                class="action-btn-primary"
                @click="handleChangePassword"
                :loading="savingPassword"
              >
                确认修改
              </van-button>
            </div>
          </div>
        </div>

        <!-- 我的成就 (注册用户专属) -->
        <div v-if="!userStore.isGuest && achievements.length > 0" class="profile-card">
          <van-cell-group :border="false">
            <van-cell
              :title="`我的成就 (${achievements.filter(a => a.unlocked).length}/${achievements.length})`"
              is-link
              :arrow-direction="showAchievements ? 'up' : 'down'"
              @click="showAchievements = !showAchievements"
            />
          </van-cell-group>
          <div v-if="showAchievements" class="achievement-grid">
            <div
              v-for="ach in achievements"
              :key="ach.code"
              class="achievement-item"
              :class="{ 'achievement-locked': !ach.unlocked }"
            >
              <div class="achievement-icon">{{ ach.icon }}</div>
              <div class="achievement-name">{{ ach.name }}</div>
            </div>
          </div>
        </div>

        <!-- 退出登录 -->
        <div v-if="!userStore.isGuest" class="profile-card logout-card">
          <van-cell-group :border="false">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useGameStore } from '../stores/game';
import { useSettingsStore } from '../stores/settings';
import { showToast, showConfirmDialog } from 'vant';
import { authApi } from '../api/auth';
import { goBackWithFallback } from '../utils/navigation';

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();
const settingsStore = useSettingsStore();

const loading = ref(false);
const saving = ref(false);
const savingPassword = ref(false);
const showPasswordForm = ref(false);
const isEditing = ref(false);
const profile = ref({
  username: '',
  nickname: '',
});
const editForm = ref({
  nickname: '',
});
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const stats = ref(null);
const achievements = ref([]);
const showAchievements = ref(false);

const guestId = computed(() => {
  return localStorage.getItem('guestId') || '';
});

const handleBack = () => {
  goBackWithFallback(router, '/home');
};

const getInitial = (name) => {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return '?';
  }
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    '#16A34A', '#10B981', '#0EA5E9', '#8B5CF6', '#EC4899',
    '#F59E0B', '#EF4444', '#06B6D4', '#6366F1', '#14B8A6'
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
      const nickname = localStorage.getItem('guestNickname') || '游客';
      profile.value = {
        username: guestId.value,
        nickname: nickname,
      };
      editForm.value.nickname = nickname;
    } else {
      const data = await authApi.getProfile();
      profile.value = data;
      editForm.value.nickname = data.nickname || data.username;
    }

    stats.value = await gameStore.getStats(true);

    if (!userStore.isGuest) {
      try {
        achievements.value = await authApi.getAchievements() || [];
      } catch {
        // achievements API may not be ready yet
      }
    }
  } catch (error) {
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
      localStorage.setItem('guestNickname', editForm.value.nickname);
      profile.value.nickname = editForm.value.nickname;
      showToast('昵称已更新');
    } else {
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

const handleChangePassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    showToast('请填写完整');
    return;
  }
  if (passwordForm.value.newPassword.length < 6) {
    showToast('新密码至少6位');
    return;
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showToast('两次密码不一致');
    return;
  }

  savingPassword.value = true;
  try {
    await authApi.changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    });
    showToast('密码修改成功');
    showPasswordForm.value = false;
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error) {
    showToast(error.response?.data?.message || error.message || '修改失败');
  } finally {
    savingPassword.value = false;
  }
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

<style scoped>
.profile-header {
  position: relative;
  padding-bottom: 10px;
}

.profile-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(135deg, var(--color-primary, #16A34A) 0%, var(--color-primary-dark, #15803D) 60%, #166534 100%);
}

.profile-avatar-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 18px;
  padding-bottom: 10px;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: calc(20px * var(--font-scale, 1));
  font-weight: 700;
  border: 2px solid #fff;
  box-shadow: var(--shadow-md);
}

.profile-name {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  margin-top: 12px;
}

.profile-role {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #6B7280);
  margin-top: 6px;
}

.profile-id {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-placeholder, #9CA3AF);
}

/* 统计条 - 4列单行 */
.profile-stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  background: var(--color-bg-white, #fff);
  margin: 0 16px;
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-sm);
  padding: 10px 0;
}

.profile-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-stat-value {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
}

.profile-stat-blue { color: #3B82F6; }
.profile-stat-green { color: var(--color-success, #16A34A); }
.profile-stat-purple { color: #8B5CF6; }
.profile-stat-red { color: var(--color-danger, #EF4444); }

.profile-stat-label {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 2px;
}

.profile-body {
  padding: 12px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  margin: 0;
  padding: 18px 18px 14px;
}

.edit-actions {
  padding: 12px 16px 16px;
  display: flex;
  gap: 10px;
}

.edit-actions :deep(.van-button) {
  flex: 1;
}

.guest-card {
  padding: 20px;
  text-align: center;
}

.guest-hint {
  font-size: var(--font-size-md, 14px);
  color: var(--color-text-secondary, #6B7280);
  margin-bottom: 14px;
}

.logout-card {
  margin-top: 4px;
}

.profile-card :deep(.van-cell-group) {
  background: transparent;
}

.profile-card :deep(.van-cell) {
  background: transparent;
}

.profile-card :deep(.van-cell::after) {
  border-bottom: none;
}

.password-form {
  padding-bottom: 4px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 18px;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 4px;
  background: var(--color-bg-secondary, #F9FAFB);
  border-radius: 10px;
  text-align: center;
}

.achievement-locked {
  opacity: 0.35;
  filter: grayscale(1);
}

.achievement-icon {
  font-size: calc(28px * var(--font-scale, 1));
  margin-bottom: 6px;
}

.achievement-name {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-tertiary, #374151);
  font-weight: 500;
}
</style>
