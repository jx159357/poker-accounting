<template>
  <div class="room-page">
    <!-- 顶部导航 -->
    <van-nav-bar :title="game?.gameType || '房间'" left-arrow @click-left="confirmLeave" fixed>
      <template #right>
        <van-icon name="ellipsis" size="20" @click="showMenu = true" />
      </template>
    </van-nav-bar>

    <div class="room-container" v-if="game">
      <!-- 房间号显示 -->
      <div class="room-code-banner" @click="copyRoomCode">
        <div class="room-code-content">
          <span class="room-code-label">房间号</span>
          <span class="room-code-value">{{ game.roomCode }}</span>
        </div>
        <van-button icon="share-o" size="small" plain type="primary">分享</van-button>
      </div>

      <!-- 玩家区域 -->
      <div class="players-section">
        <div
          v-for="player in game.players"
          :key="player.id"
          class="player-card"
          :class="{ 'is-me': isMe(player), 'is-selected': selectedPlayer?.id === player.id }"
          @click="selectPlayer(player)"
        >
          <div class="player-avatar" :style="getAvatarStyle(player)">
            <span class="player-initial">{{ getInitial(player.nickname) }}</span>
          </div>
          <div class="player-info">
            <div class="player-name">
              {{ player.nickname }}
              <van-tag v-if="isMe(player)" type="primary" size="mini">我</van-tag>
            </div>
            <div class="player-score" :class="getScoreClass(player.currentScore)">
              {{ formatScore(player.currentScore) }}
            </div>
          </div>
        </div>

        <!-- 空位 -->
        <div
          v-for="i in 4 - game.players.length"
          :key="'empty-' + i"
          class="player-card empty"
          @click="invitePlayers"
        >
          <div class="player-avatar empty-avatar">
            <van-icon name="plus" size="24" />
          </div>
          <div class="player-info">
            <div class="player-name">邀请玩家</div>
          </div>
        </div>
      </div>

      <!-- 记账区域 -->
      <div class="score-section" v-if="selectedPlayer">
        <div class="score-header">
          <span
            >给 <strong>{{ selectedPlayer.nickname }}</strong> 记账</span
          >
          <van-button size="small" plain @click="selectedPlayer = null">取消</van-button>
        </div>
        <div class="score-input-wrapper">
          <van-field
            v-model="scoreAmount"
            type="digit"
            placeholder="输入分数"
            center
            size="large"
            class="score-input"
          >
            <template #button>
              <van-button type="primary" size="small" @click="submitScore">确定</van-button>
            </template>
          </van-field>
        </div>
        <div class="quick-scores">
          <van-button
            v-for="score in quickScores"
            :key="score"
            size="small"
            :type="scoreAmount === score.toString() ? 'primary' : 'default'"
            @click="scoreAmount = score.toString()"
          >
            {{ score }}
          </van-button>
        </div>
      </div>

      <!-- 记录列表 -->
      <div class="records-section">
        <div class="records-header" @click="showAllRecords = !showAllRecords">
          <span>本局记录 ({{ game.records?.length || 0 }})</span>
          <van-icon :name="showAllRecords ? 'arrow-up' : 'arrow-down'" />
        </div>
        <div class="records-list" v-show="showAllRecords">
          <div v-for="record in displayRecords" :key="record.id" class="record-item">
            <div class="record-info">
              <span class="record-players">
                {{ record.fromPlayer?.nickname || '未知' }} → {{ record.toPlayer?.nickname || '未知' }}
              </span>
              <span class="record-time">{{ formatTime(record.createdAt) }}</span>
            </div>
            <div class="record-actions">
              <span class="record-amount">+{{ record.amount }}</span>
              <van-button size="mini" type="danger" plain @click="undoRecord(record.id)">
                撤销
              </van-button>
            </div>
          </div>
          <van-empty
            v-if="!game.records || game.records.length === 0"
            description="还没有记录"
            image-size="60"
          />
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions" v-if="game">
      <van-button type="warning" size="large" block @click="confirmSettle">结算本局</van-button>
      <van-button type="danger" size="large" block @click="confirmFinish">结束房间</van-button>
    </div>

    <!-- 菜单 -->
    <van-action-sheet v-model:show="showMenu" :actions="menuActions" @select="onMenuSelect" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { useUserStore } from '../stores/user'
import { gameApi } from '../api/game'
import { getNameInitial, getAvatarColorByString } from '../utils/nameGenerator'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const roomCode = route.params.id
const game = ref(null)
const selectedPlayer = ref(null)
const scoreAmount = ref('')
const showMenu = ref(false)
const showAllRecords = ref(false)
const quickScores = [5, 10, 20, 50, 100]

let refreshInterval = null

const displayRecords = computed(() => {
  if (!game.value?.records) return []
  return game.value.records.slice().reverse().slice(0, 20)
})

const menuActions = [
  { name: '复制房间号', value: 'copy' },
  { name: '刷新数据', value: 'refresh' }
]

const isMe = player => {
  if (userStore.isGuest) {
    return player.guestId === userStore.currentGuestId
  } else {
    return player.userId === userStore.userInfo?.id
  }
}

const getInitial = nickname => {
  return getNameInitial(nickname)
}

const getAvatarStyle = player => {
  const color = getAvatarColorByString(player.nickname)
  return {
    background: color.bg,
    color: color.text
  }
}

const getScoreClass = score => {
  const num = parseFloat(score)
  if (num > 0) return 'score-win'
  if (num < 0) return 'score-lose'
  return ''
}

const formatScore = score => {
  const num = parseFloat(score)
  if (num > 0) return `+${num}`
  return num.toString()
}

const formatTime = timestamp => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const loadGameData = async () => {
  try {
    const data = await gameApi.getRoomDetail(roomCode)
    game.value = data
  } catch (error) {
    console.error('加载房间数据失败', error)
  }
}

const selectPlayer = player => {
  if (isMe(player)) {
    showToast('不能给自己记账')
    return
  }
  if (game.value.status !== 'playing') {
    showToast('房间已结束')
    return
  }
  selectedPlayer.value = player
  scoreAmount.value = ''
}

const submitScore = async () => {
  if (!scoreAmount.value || parseFloat(scoreAmount.value) <= 0) {
    showToast('请输入正确的分数')
    return
  }

  const myPlayer = game.value.players.find(p => isMe(p))
  if (!myPlayer) {
    showToast('你不在房间内')
    return
  }

  showLoadingToast({ message: '记账中...', forbidClick: true })

  try {
    await gameApi.addScore(roomCode, {
      fromPlayerId: myPlayer.id,
      toPlayerId: selectedPlayer.value.id,
      amount: parseFloat(scoreAmount.value)
    })

    closeToast()
    showToast('记账成功')
    selectedPlayer.value = null
    scoreAmount.value = ''
    await loadGameData()
  } catch (error) {
    closeToast()
    showToast('记账失败')
  }
}

const undoRecord = async recordId => {
  try {
    await showConfirmDialog({
      title: '确认撤销',
      message: '确定要撤销这条记录吗？'
    })

    showLoadingToast({ message: '撤销中...', forbidClick: true })

    await gameApi.undoRecord(roomCode, recordId)

    closeToast()
    showToast('撤销成功')
    await loadGameData()
  } catch (error) {
    if (error !== 'cancel') {
      closeToast()
      showToast('撤销失败')
    }
  }
}

const confirmSettle = async () => {
  try {
    // 结算当前对局，但不清空记录
    await gameApi.settleRound(route.params.id)
    showToast('对局结算成功')
  } catch (error) {
    showToast(error.message || '结算失败')
  }
}

const confirmFinish = async () => {
  try {
    await showConfirmDialog({
      title: '确认结束',
      message: '结束后将无法继续记账。确定要结束房间吗？'
    })

    showLoadingToast({ message: '结算中...', forbidClick: true })

    await gameApi.finishRoom(roomCode)

    closeToast()
    showToast('房间已结束')
    router.push('/home')
  } catch (error) {
    if (error !== 'cancel') {
      closeToast()
      showToast('操作失败')
    }
  }
}

const confirmLeave = async () => {
  try {
    await showConfirmDialog({
      title: '确认离开',
      message: '离开后可以从首页重新进入房间'
    })
    router.push('/home')
  } catch {
    // 取消
  }
}

const copyRoomCode = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(roomCode)
    showToast('房间号已复制')
  } else {
    showToast(`房间号: ${roomCode}`)
  }
}

const invitePlayers = () => {
  copyRoomCode()
  showToast('房间号已复制，分享给好友加入吧')
}

const onMenuSelect = async action => {
  showMenu.value = false
  if (action.value === 'copy') {
    copyRoomCode()
  } else if (action.value === 'refresh') {
    showLoadingToast({ message: '刷新中...', forbidClick: true })
    await loadGameData()
    closeToast()
    showToast('刷新成功')
  }
}

onMounted(async () => {
  try {
    await gameApi.joinRoom({
      roomCode: roomCode,
      nickname: userStore.currentNickname
    })
  } catch (error) {
    console.error('加入房间失败', error)
  }

  await loadGameData()

  refreshInterval = setInterval(async () => {
    await loadGameData()
  }, 3000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
<style scoped>
.room-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
  overflow: hidden;
}

.room-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 46px;
  padding-bottom: 120px;
  overflow-y: auto;
  overflow-x: hidden;
}

.room-code-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  flex-shrink: 0;
}

.room-code-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.room-code-label {
  font-size: 12px;
  opacity: 0.9;
}

.room-code-value {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 3px;
  word-break: break-all;
}

.players-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  flex-shrink: 0;
}

.player-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-width: 0;
}

.player-card:active {
  transform: scale(0.98);
}

.player-card.is-me {
  border-color: #1989fa;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f9ff 100%);
}

.player-card.is-selected {
  border-color: #07c160;
  background: linear-gradient(135deg, #e8f8f0 0%, #f0fdf4 100%);
}

.player-card.empty {
  border: 2px dashed #dcdee0;
  background: #fafafa;
  justify-content: center;
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-avatar {
  background: #dcdee0;
  color: #969799;
}

.player-initial {
  user-select: none;
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.player-name {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-score {
  font-size: 20px;
  font-weight: bold;
  color: #323233;
  white-space: nowrap;
}

.score-win {
  color: #07c160;
}

.score-lose {
  color: #ee0a24;
}

.score-section {
  background: white;
  padding: 16px;
  margin: 0 16px 16px;
  border-radius: 16px;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 15px;
}

.score-input-wrapper {
  margin-bottom: 12px;
}

.quick-scores {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.records-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 0 16px 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 0;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebedf0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.records-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px;
  max-height: 300px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f7f8fa;
  min-width: 0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.record-players {
  font-size: 14px;
  color: #323233;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-time {
  font-size: 12px;
  color: #969799;
}

.record-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.record-amount {
  font-size: 16px;
  font-weight: bold;
  color: #1989fa;
  white-space: nowrap;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 8px 16px;
  display: flex;
  gap: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
  z-index: 100;
}
</style>
