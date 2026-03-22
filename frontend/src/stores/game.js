import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'
import { gameApi } from '../api/game'
import { authApi } from '../api/auth'
import { showToast } from 'vant'

export const useGameStore = defineStore('game',() => {
  const userStore = useUserStore()

  const currentGame = ref(null)
  const myGames = ref([])
  const loading = ref(false)

  // 统计缓存（5 分钟过期）
  const CACHE_TTL = 5 * 60 * 1000
  const statsCache = ref({ data: null, ts: 0 })
  const opponentsCache = ref({ data: null, ts: 0 })
  const leaderboardCache = ref({ data: null, ts: 0 })

  // 获取或生成玩家ID
  const getPlayerId = () => {
    if (userStore.isGuest) {
      let guestId = localStorage.getItem('guestId')
      if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        localStorage.setItem('guestId', guestId)
      }
      return guestId
    } else {
      // 确保返回正确的格式
      const username = userStore.username
      if (!username) {
        console.error('Username is undefined, user might not be logged in')
        // 尝试从 localStorage 恢复
        const savedUsername = localStorage.getItem('username')
        if (savedUsername) {
          userStore.username = savedUsername
          return `user_${savedUsername}`
        }
        return null
      }
      return `user_${username}`
    }
  }

  // 获取玩家昵称
  const getPlayerNickname = () => {
    if (userStore.isGuest) {
      let nickname = localStorage.getItem('guestNickname')
      if (!nickname) {
        const randomNum = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')
        nickname = `游客${randomNum}`
        localStorage.setItem('guestNickname', nickname)
      }
      return nickname
    } else {
      return userStore.username
    }
  }

  // 创建游戏
  const createGame = async (name, gameType = '其他') => {
    loading.value = true
    try {
      const playerId = getPlayerId()
      const nickname = getPlayerNickname()
      const playerType = userStore.isGuest ? 'guest' : 'user'

      const game = await gameApi.createGame({
        name,
        gameType,
        creatorId: playerId,
        creatorType: playerType,
        nickname
      })

      currentGame.value = game
      return game
    } catch (error) {
      const message = error.response?.data?.message || '创建游戏失败'
      const err = new Error(message)
      if (message.includes('GUEST_LIMIT_REACHED') || error.response?.data?.code === 'GUEST_LIMIT_REACHED') {
        err.code = 'GUEST_LIMIT_REACHED'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // 加入游戏
  const joinGame = async roomCode => {
    loading.value = true
    try {
      const playerId = getPlayerId()
      const nickname = getPlayerNickname()
      const playerType = userStore.isGuest ? 'guest' : 'user'

      const game = await gameApi.joinGame(roomCode, {
        nickname,
        playerId,
        playerType
      })

      currentGame.value = game
      return game
    } catch (error) {
      throw new Error(error.response?.data?.message || '加入游戏失败')
    } finally {
      loading.value = false
    }
  }

  // 获取游戏详情
  const getGameDetail = async roomCode => {
    loading.value = true
    try {
      const game = await gameApi.getGameDetail(roomCode)
      currentGame.value = game
      return game
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取游戏详情失败')
    } finally {
      loading.value = false
    }
  }

  // 添加积分记录
  const addScore = async (roomCode, fromPlayerId, toPlayerId, score, note = '') => {
    loading.value = true
    try {
      await gameApi.addScore(roomCode, {
        fromPlayerId: Number(fromPlayerId),
        toPlayerId: Number(toPlayerId),
        score: Number(score),
        note
      })

      // 刷新游戏详情
      await getGameDetail(roomCode)
    } catch (error) {
      throw new Error(error.response?.data?.message || '加分失败')
    } finally {
      loading.value = false
    }
  }

  // 撤销积分记录
  const undoScore = async (roomCode, recordId) => {
    try {
      const playerId = getPlayerId()
      await gameApi.undoScore(roomCode, recordId, { requesterId: playerId })
      await getGameDetail(roomCode)
    } catch (error) {
      throw error
    }
  }

  // 更新玩家昵称
  const updatePlayerNickname = async (roomCode, playerId, newNickname, syncToProfile = false) => {
    try {
      await gameApi.updatePlayerNickname(roomCode, playerId, { nickname: newNickname })

      // 如果需要同步到个人资料
      if (syncToProfile && !userStore.isGuest) {
        await authApi.updateProfile({ nickname: newNickname })
        showToast('昵称已同步到个人资料')
      }

      // 刷新游戏数据
      await getGameDetail(roomCode)
    } catch (error) {
      throw new Error(error.response?.data?.message || '更新昵称失败')
    }
  }

  // 结束游戏
  const endGame = async roomCode => {
    loading.value = true
    try {
      const result = await gameApi.endGame(roomCode)
      await getGameDetail(roomCode)
      return result
    } catch (error) {
      throw new Error(error.response?.data?.message || '结束游戏失败')
    } finally {
      loading.value = false
    }
  }

  // 获取我的游戏列表
  const loadMyGames = async (filter = {}) => {
    loading.value = true
    try {
      const playerId = getPlayerId()
      const playerType = userStore.isGuest ? 'guest' : 'user'

      if (!playerId) {
        myGames.value = []
        return
      }

      const games = await gameApi.getMyGames({
        playerId,
        playerType,
        ...filter
      })

      myGames.value = games
    } catch (error) {
      throw new Error(error.response?.data?.message || '加载游戏列表失败')
    } finally {
      loading.value = false
    }
  }

  // 编辑游戏信息
  const editGame = async (roomCode, data) => {
    loading.value = true
    try {
      await gameApi.editGame(roomCode, data)
      await getGameDetail(roomCode)
    } catch (error) {
      throw new Error(error.response?.data?.message || '编辑游戏失败')
    } finally {
      loading.value = false
    }
  }

  // 删除游戏
  const deleteGame = async roomCode => {
    loading.value = true
    try {
      const playerId = getPlayerId()
      await gameApi.deleteGame(roomCode, {
        requesterId: playerId
      })

      await loadMyGames()
    } catch (error) {
      throw new Error(error.response?.data?.message || '删除游戏失败')
    } finally {
      loading.value = false
    }
  }

  // 获取统计数据（带缓存）
  const getStats = async (force = false) => {
    const now = Date.now()
    if (!force && statsCache.value.data && (now - statsCache.value.ts) < CACHE_TTL) {
      return statsCache.value.data
    }

    loading.value = true
    try {
      const playerId = getPlayerId()
      const playerType = userStore.isGuest ? 'guest' : 'user'

      const stats = await gameApi.getStats({
        playerId,
        playerType
      })

      statsCache.value = { data: stats, ts: now }
      return stats
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取统计数据失败')
    } finally {
      loading.value = false
    }
  }

  // 获取对手统计（带缓存）
  const getOpponentStats = async (force = false) => {
    const now = Date.now()
    if (!force && opponentsCache.value.data && (now - opponentsCache.value.ts) < CACHE_TTL) {
      return opponentsCache.value.data
    }

    try {
      const playerId = getPlayerId()
      const playerType = userStore.isGuest ? 'guest' : 'user'
      const data = await gameApi.getOpponentStats({ playerId, playerType })
      opponentsCache.value = { data, ts: now }
      return data
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取对手统计失败')
    }
  }

  // 获取排行榜（带缓存）
  const getLeaderboard = async (force = false) => {
    const now = Date.now()
    if (!force && leaderboardCache.value.data && (now - leaderboardCache.value.ts) < CACHE_TTL) {
      return leaderboardCache.value.data
    }

    try {
      const playerId = getPlayerId()
      const playerType = userStore.isGuest ? 'guest' : 'user'
      const data = await gameApi.getLeaderboard({ playerId, playerType })
      leaderboardCache.value = { data, ts: now }
      return data
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取排行榜失败')
    }
  }

  return {
    currentGame,
    myGames,
    loading,
    createGame,
    joinGame,
    getGameDetail,
    addScore,
    undoScore,
    updatePlayerNickname,
    editGame,
    endGame,
    loadMyGames,
    deleteGame,
    getStats,
    getOpponentStats,
    getLeaderboard,
    getPlayerId,
    getPlayerNickname
  }
})
