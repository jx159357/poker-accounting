<template>
  <div class="profile-page">
    <van-nav-bar title="个人资料" left-arrow @click-left="router.back()" fixed />

    <div class="profile-container">
      <!-- 头像区域 -->
      <div class="avatar-section">
        <div class="avatar-wrapper" :style="avatarStyle">
          <span class="avatar-text">{{ avatarText }}</span>
        </div>
        <div class="user-type-badge" :class="{ 'is-guest': userStore.isGuest }">
          {{ userStore.isGuest ? '游客' : '用户' }}
        </div>
      </div>

      <!-- 信息表单 -->
      <van-cell-group inset>
        <van-field
          v-model="nickname"
          label="昵称"
          placeholder="请输入昵称"
          :readonly="!isEditing"
        />
        <van-field
          v-if="userStore.isLoggedIn && userStore.userInfo"
          :model-value="userStore.userInfo.username"
          label="账号"
          readonly
        />
        <van-field :model-value="displayId" label="ID" readonly />
      </van-cell-group>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button v-if="!isEditing" type="primary" size="large" block @click="startEdit">
          修改昵称
        </van-button>
        <template v-else>
          <van-button type="primary" size="large" block @click="saveNickname">保存</van-button>
          <van-button size="large" block @click="cancelEdit">取消</van-button>
        </template>

        <van-button v-if="userStore.isGuest" type="success" size="large" block @click="goRegister">
          注册账号
        </van-button>

        <van-button
          v-if="userStore.isLoggedIn"
          type="warning"
          size="large"
          block
          @click="confirmLogout"
        >
          退出登录
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { useUserStore } from '../stores/user'
import { getNameInitial, getAvatarColorByString } from '../utils/nameGenerator'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref(userStore.currentNickname)
const isEditing = ref(false)
const originalNickname = ref('')

const displayId = computed(() => {
  const id = userStore.currentUserId
  if (!id) return '-'
  return id.length > 8 ? id.substring(0, 8) + '...' : id
})

const avatarText = computed(() => {
  return getNameInitial(nickname.value)
})

const avatarStyle = computed(() => {
  const color = getAvatarColorByString(userStore.currentUserId || 'guest')
  return {
    background: color.bg,
    color: color.text
  }
})

const startEdit = () => {
  originalNickname.value = nickname.value
  isEditing.value = true
}

const cancelEdit = () => {
  nickname.value = originalNickname.value
  isEditing.value = false
}

const saveNickname = async () => {
  if (!nickname.value.trim()) {
    showToast('昵称不能为空')
    return
  }

  showLoadingToast({ message: '保存中...', forbidClick: true })

  try {
    await userStore.updateNickname(nickname.value)
    closeToast()
    showToast('保存成功')
    isEditing.value = false
  } catch {
    closeToast()
    showToast('保存失败')
  }
}

const goRegister = () => {
  router.push('/register')
}

const confirmLogout = async () => {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '退出后将变为游客模式'
    })
    userStore.logout()
    showToast('已退出登录')
    router.push('/home')
  } catch {
    // 取消
  }
}

onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.userInfo) {
    try {
      await userStore.getUserInfo()
      nickname.value = userStore.currentNickname
    } catch {
      // 静默
    }
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.profile-container {
  padding-top: 46px;
  padding-bottom: 80px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  background: white;
  margin-bottom: 16px;
}

.avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
}

.avatar-text {
  user-select: none;
}

.user-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: #1989fa;
  color: white;
}

.user-type-badge.is-guest {
  background: #ff976a;
}

.action-buttons {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
