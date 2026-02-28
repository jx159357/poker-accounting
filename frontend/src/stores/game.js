import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'
import { gameApi } from '../api/game'

export const useGameStore = defineStore('game', () => {
  const userStore = useUserStore()

  const games = ref([])
  const currentGame = ref(null)
  const loading = ref(false)

  // 加载我的游戏列表
  const loadGames = async () => {
    loading.value = true
    try {
      const data = await gameApi.getMyGames()
      games.value = data
    } finally {
      loading.value = false
    }
  }

  // 创建游戏
  const createGame = async ({ name, gameType }) => {
    loading.value = true
    try {
      const data = await gameApi.createGame({
        name,
        gameType
      })
      await loadGames()
      return data
    } finally {
      loading.value = false
    }
  }

  // 加入游戏
  const joinGame = async (roomCode, nickname) => {
    loading.value = true
    try {
      const playerName = nickname || userStore.currentNickname
      const data = await gameApi.joinGame(roomCode, { nickname: playerName })
      await loadGames()
      return data
    } finally {
      loading.value = false
    }
  }

  // 获取游戏详情
  const loadGameDetail = async roomCode => {
    loading.value = true
    try {
      const data = await gameApi.getRoomDetail(roomCode)
      currentGame.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  // 添加转账
  const addTransaction = async (roomCode, fromPlayerId, toPlayerId, amount, remark) => {
    const data = await gameApi.addTransaction(roomCode, {
      fromPlayerId,
      toPlayerId,
      amount,
      remark
    })
    currentGame.value = data
    return data
  }

  // 撤销转账
  const undoTransaction = async (roomCode, transactionId) => {
    const data = await gameApi.undoTransaction(roomCode, transactionId)
    currentGame.value = data
    return data
  }

  // 结束游戏
  const finishGame = async roomCode => {
    const data = await gameApi.finishRoom(roomCode)
    currentGame.value = data
    await loadGames()
    return data
  }

  // 结算房间
  const settleRoom = async (roomCode) => {
    const data = await gameApi.settleRoom(roomCode, {})
    return data
  }

  return {
    games,
    currentGame,
    loading,
    loadGames,
    createGame,
    joinGame,
    loadGameDetail,
    addTransaction,
    undoTransaction,
    finishGame,
    settleRoom
  }
})
