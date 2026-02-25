<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant'
import { useUserStore } from '../stores/user'
import { gameApi } from '../api/game'

const router = useRouter()
const userStore = useUserStore()

const showJoinDialog = ref(false)
const roomCode = ref('')
const myGames = ref([])
const loading = ref(false)

// 加载我的房间列表
const loadMyGames = async () => {
  loading.value = true
  try {
    const data = await gameApi.getMyGames()
    myGames.value = data || []
  } catch (error) {
    console.error('加载房间列表失败', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

// 创建房间
const createRoom = async () => {
  showLoadingToast({ message: '创建中...', forbidClick: true })

  try {
    const data = await gameApi.createRoom({
      gameType: '跑得快',
      nickname: userStore.currentNickname
    })

    closeToast()
    showToast('创建成功')

    // 跳转到房间页面
    router.push(`/room/${data.roomCode}`)
  } catch (error) {
    closeToast()
    console.error('创建房间失败', error)
    showToast(error.response?.data?.message || '创建失败')
  }
}

// 加入房间
const joinRoom = async () => {
  if (!roomCode.value || roomCode.value.length !== 6) {
    showToast('请输入6位房间号')
    return
  }

  showLoadingToast({ message: '加入中...', forbidClick: true })

  try {
    const data = await gameApi.joinRoom({
      roomCode: roomCode.value,
      nickname: userStore.currentNickname
    })

    closeToast()
    showToast('加入成功')
    showJoinDialog.value = false

    // 跳转到房间页面
    router.push(`/room/${roomCode.value}`)
    roomCode.value = ''
  } catch (error) {
    closeToast()
    console.error('加入房间失败', error)
    showToast(error.response?.data?.message || '加入失败')
  }
}

// 进入房间
const enterRoom = game => {
  router.push(`/room/${game.roomCode}`)
}

// 格式化时间
const formatTime = timestamp => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN')
}

// 获取房间状态文本
const getStatusText = status => {
  const statusMap = {
    playing: '进行中',
    settled: '已结算',
    finished: '已结束'
  }
  return statusMap[status] || status
}

// 获取房间状态颜色
const getStatusType = status => {
  const typeMap = {
    playing: 'primary',
    settled: 'warning',
    finished: 'default'
  }
  return typeMap[status] || 'default'
}

// 去个人资料页
const goProfile = () => {
  router.push('/profile')
}

// 修改昵称
const changeNickname = () => {
  if (userStore.isGuest) {
    showDialog({
      title: '修改昵称',
      message: '请输入新昵称',
      showCancelButton: true,
      beforeClose: (action, done) => {
        if (action === 'confirm') {
          const input = document.querySelector('.van-dialog__message input')
          const nickname = input?.value?.trim()
          if (nickname) {
            userStore.setGuestNickname(nickname)
            showToast('修改成功')
            done()
          } else {
            showToast('请输入昵称')
            done(false)
          }
        } else {
          done(false)
        }
      }
    }).then(() => {
      // 刷新页面
      loadMyGames()
    })
  } else {
    router.push('/profile')
  }
}

onMounted(() => {
  loadMyGames()
})
</script>

<template>
  <div class="home-page">
    <van-nav-bar title="打牌记账" fixed>
      <template #right>
        <van-icon name="user-o" size="20" @click="goProfile" />
      </template>
    </van-nav-bar>

    <div class="home-container">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ userStore.currentNickname?.charAt(0) || 'U' }}</span>
          </div>
          <div class="user-details">
            <div class="user-name">{{ userStore.currentNickname || '未命名' }}</div>
            <div class="user-type">
              <van-tag :type="userStore.isGuest ? 'warning' : 'success'" size="medium">
                {{ userStore.isGuest ? '游客' : '用户' }}
              </van-tag>
            </div>
          </div>
          <van-button size="small" plain @click="changeNickname"> 修改昵称 </van-button>
        </div>

        <!-- 游客提示 -->
        <div v-if="userStore.isGuest" class="guest-tip">
          <van-notice-bar
            left-icon="info-o"
            text="游客模式下数据仅保存在本地，注册后可同步到云端"
            background="#fff7e6"
            color="#ed6a0c"
          />
          <van-button
            type="primary"
            size="small"
            block
            @click="router.push('/register')"
            style="margin-top: 12px"
          >
            立即注册
          </van-button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button type="primary" size="large" block @click="createRoom"> 创建房间 </van-button>
        <van-button type="success" size="large" block @click="showJoinDialog = true">
          加入房间
        </van-button>
      </div>

      <!-- 我的房间列表 -->
      <div class="room-list-section">
        <div class="section-header">
          <span>我的房间</span>
          <van-button size="small" plain @click="loadMyGames">刷新</van-button>
        </div>

        <van-pull-refresh v-model="loading" @refresh="loadMyGames">
          <div v-if="myGames.length > 0" class="room-list">
            <div v-for="game in myGames" :key="game.id" class="room-item" @click="enterRoom(game)">
              <div class="room-header">
                <div class="room-title">
                  <span class="room-type">{{ game.gameType }}</span>
                  <van-tag :type="getStatusType(game.status)" size="medium">
                    {{ getStatusText(game.status) }}
                  </van-tag>
                </div>
                <div class="room-code">{{ game.roomCode }}</div>
              </div>
              <div class="room-info">
                <span class="room-players">{{ game.players?.length || 0 }} 人</span>
                <span class="room-time">{{ formatTime(game.createdAt) }}</span>
              </div>
            </div>
          </div>
          <van-empty v-else description="还没有房间" image-size="80" />
        </van-pull-refresh>
      </div>
    </div>

    <!-- 加入房间弹窗 -->
    <van-dialog
      v-model:show="showJoinDialog"
      title="加入房间"
      show-cancel-button
      @confirm="joinRoom"
    >
      <van-field
        v-model="roomCode"
        type="digit"
        placeholder="请输入6位房间号"
        maxlength="6"
        center
      />
    </van-dialog>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.home-container {
  padding-top: 46px;
  padding-bottom: 20px;
}

.user-card {
  background: white;
  margin: 16px;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.user-type {
  font-size: 14px;
  color: #969799;
}

.guest-tip {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebedf0;
}

.action-buttons {
  padding: 0 16px;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.room-list-section {
  background: white;
  margin: 0 16px;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-item {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.room-item:active {
  transform: scale(0.98);
  background: #ebedf0;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.room-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-type {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.room-code {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
  letter-spacing: 2px;
}

.room-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #969799;
}
</style>
