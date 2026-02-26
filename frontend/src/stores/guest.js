import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Toast } from 'vant'

export const useGuestStore = defineStore('guest', () => {
  const guestGames = ref([])

  // 从 localStorage 加载数据
  const loadGames = () => {
    const stored = localStorage.getItem('guestGames')
    if (stored) {
      try {
        guestGames.value = JSON.parse(stored)
      } catch (error) {
        console.error('加载游客数据失败:', error)
        guestGames.value = []
      }
    }
  }

  // 保存到 localStorage
  const saveGames = () => {
    localStorage.setItem('guestGames', JSON.stringify(guestGames.value))
  }

  // 创建游戏
  const createGame = (name, players, buyIn) => {
    const game = {
      id: Date.now().toString(),
      name,
      players,
      buyIn,
      records: [],
      status: 'active',
      createdAt: new Date().toISOString()
    }

    guestGames.value.unshift(game)
    saveGames()
    Toast.success('游戏创建成功')

    return game
  }

  // 添加记录
  const addRecord = (gameId, playerId, amount, type) => {
    const game = guestGames.value.find(g => g.id === gameId)

    if (!game) {
      Toast.fail('游戏不存在')
      return
    }

    const record = {
      playerId,
      amount,
      type,
      createdAt: new Date().toISOString()
    }

    game.records.push(record)
    saveGames()
    Toast.success('记录添加成功')
  }

  // 结束游戏
  const endGame = gameId => {
    const game = guestGames.value.find(g => g.id === gameId)

    if (!game) {
      Toast.fail('游戏不存在')
      return
    }

    game.status = 'completed'
    saveGames()
    Toast.success('游戏已结束')
  }

  // 删除游戏
  const deleteGame = gameId => {
    const index = guestGames.value.findIndex(g => g.id === gameId)

    if (index !== -1) {
      guestGames.value.splice(index, 1)
      saveGames()
      Toast.success('游戏已删除')
    }
  }

  // 获取统计数据
  const getStatistics = () => {
    const totalGames = guestGames.value.length
    const completedGames = guestGames.value.filter(g => g.status === 'completed').length
    const activeGames = guestGames.value.filter(g => g.status === 'active').length

    let totalBuyIn = 0
    let totalCashOut = 0
    let totalRecords = 0

    guestGames.value.forEach(game => {
      totalRecords += game.records.length
      game.records.forEach(record => {
        if (record.type === 'buy_in') {
          totalBuyIn += record.amount
        } else if (record.type === 'cash_out') {
          totalCashOut += record.amount
        }
      })
    })

    return {
      totalGames,
      completedGames,
      activeGames,
      totalRecords,
      totalBuyIn,
      totalCashOut,
      profit: totalCashOut - totalBuyIn
    }
  }

  // 初始化时加载数据
  loadGames()

  return {
    guestGames,
    createGame,
    addRecord,
    endGame,
    deleteGame,
    getStatistics,
    loadGames
  }
})
