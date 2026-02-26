import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'
import {
  createGame as apiCreateGame,
  joinGame as apiJoinGame,
  getMyGames as apiGetMyGames,
  getGameDetail as apiGetGameDetail,
  endGame as apiEndGame
} from '../api/game'

export const useGameStore = defineStore('game', () => {
  const userStore = useUserStore()

  const games = ref([])
  const currentGame = ref(null)
  const loading = ref(false)

  // 加载我的游戏列表
  const loadGames = async () => {
    if (userStore.isGuest) {
      // 游客模式从本地加载
      const localGames = JSON.parse(localStorage.getItem('guestGames') || '[]')
      games.value = localGames
      return
    }

    loading.value = true
    try {
      const data = await apiGetMyGames()
      games.value = data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建游戏
  const createGame = async (gameName, buyIn, smallBlind, bigBlind) => {
    if (userStore.isGuest) {
      // 游客模式本地创建
      const newGame = {
        id: Date.now(),
        name: gameName,
        roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        buyIn,
        smallBlind,
        bigBlind,
        status: 'active',
        createdAt: new Date().toISOString(),
        players: []
      }

      const localGames = JSON.parse(localStorage.getItem('guestGames') || '[]')
      localGames.push(newGame)
      localStorage.setItem('guestGames', JSON.stringify(localGames))

      games.value = localGames
      return newGame
    }

    loading.value = true
    try {
      const data = await apiCreateGame(gameName, buyIn, smallBlind, bigBlind)
      await loadGames()
      return data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 加入游戏
  const joinGame = async roomCode => {
    if (userStore.isGuest) {
      throw new Error('游客模式暂不支持加入游戏')
    }

    loading.value = true
    try {
      const data = await apiJoinGame(roomCode)
      await loadGames()
      return data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取游戏详情
  const loadGameDetail = async roomCode => {
    if (userStore.isGuest) {
      // 游客模式从本地加载
      const localGames = JSON.parse(localStorage.getItem('guestGames') || '[]')
      const game = localGames.find(g => g.roomCode === roomCode)
      if (!game) {
        throw new Error('游戏不存在')
      }
      currentGame.value = game
      return game
    }

    loading.value = true
    try {
      const data = await apiGetGameDetail(roomCode)
      currentGame.value = data
      return data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 结束游戏
  const endGame = async roomCode => {
    if (userStore.isGuest) {
      // 游客模式本地更新
      const localGames = JSON.parse(localStorage.getItem('guestGames') || '[]')
      const game = localGames.find(g => g.roomCode === roomCode)
      if (game) {
        game.status = 'ended'
        localStorage.setItem('guestGames', JSON.stringify(localGames))
        games.value = localGames
        if (currentGame.value?.roomCode === roomCode) {
          currentGame.value.status = 'ended'
        }
      }
      return
    }

    loading.value = true
    try {
      await apiEndGame(roomCode)
      await loadGames()
      if (currentGame.value?.roomCode === roomCode) {
        currentGame.value.status = 'ended'
      }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    games,
    currentGame,
    loading,
    loadGames,
    createGame,
    joinGame,
    loadGameDetail,
    endGame
  }
})
