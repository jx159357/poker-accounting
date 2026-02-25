import { defineStore } from 'pinia'

export const useGuestStore = defineStore('guest', {
  state: () => ({
    games: JSON.parse(localStorage.getItem('guestGames') || '[]'),
    currentRoomCode: localStorage.getItem('currentRoomCode') || null
  }),

  getters: {
    // 获取当前房间
    currentGame: state => {
      return state.games.find(g => g.roomCode === state.currentRoomCode)
    },

    // 获取所有已结算的对局
    settledGames: state => {
      return state.games.filter(g => g.status === 'settled')
    },

    // 获取进行中的对局
    playingGames: state => {
      return state.games.filter(g => g.status === 'playing')
    },

    // 总输赢
    totalAmount: state => {
      return state.games
        .filter(g => g.status === 'settled')
        .reduce((total, game) => {
          const myPlayer = game.players.find(p => p.isMe)
          return total + (myPlayer?.finalScore || 0)
        }, 0)
    }
  },

  actions: {
    // 生成房间号
    generateRoomCode() {
      return Math.floor(100000 + Math.random() * 900000).toString()
    },

    // 创建房间
    createRoom(gameType, myNickname) {
      const roomCode = this.generateRoomCode()
      const game = {
        id: Date.now(),
        roomCode,
        gameType,
        status: 'playing',
        createdAt: new Date().toISOString(),
        players: [
          {
            id: Date.now(),
            nickname: myNickname,
            avatar: this.getRandomColor(),
            currentScore: 0,
            finalScore: 0,
            isMe: true,
            isActive: true
          }
        ],
        records: []
      }
      this.games.push(game)
      this.currentRoomCode = roomCode
      this.saveToLocal()
      return game
    },

    // 加入房间
    joinRoom(roomCode, myNickname) {
      const game = this.games.find(g => g.roomCode === roomCode)
      if (!game) {
        throw new Error('房间不存在')
      }
      if (game.status === 'settled') {
        throw new Error('房间已结算')
      }

      // 检查是否已在房间
      const existPlayer = game.players.find(p => p.isMe)
      if (existPlayer) {
        this.currentRoomCode = roomCode
        return game
      }

      // 添加玩家
      game.players.push({
        id: Date.now(),
        nickname: myNickname,
        avatar: this.getRandomColor(),
        currentScore: 0,
        finalScore: 0,
        isMe: true,
        isActive: true
      })

      this.currentRoomCode = roomCode
      this.saveToLocal()
      return game
    },

    // 记账
    addScore(fromPlayerId, toPlayerId, amount, note = '') {
      const game = this.currentGame
      if (!game) return

      // 添加记录
      game.records.push({
        id: Date.now(),
        fromPlayerId,
        toPlayerId,
        amount: parseFloat(amount),
        note,
        createdAt: new Date().toISOString()
      })

      // 更新分数
      const fromPlayer = game.players.find(p => p.id === fromPlayerId)
      const toPlayer = game.players.find(p => p.id === toPlayerId)

      if (fromPlayer && toPlayer) {
        fromPlayer.currentScore -= parseFloat(amount)
        toPlayer.currentScore += parseFloat(amount)
      }

      this.saveToLocal()
    },

    // 撤销记账
    undoRecord(recordId) {
      const game = this.currentGame
      if (!game) return

      const record = game.records.find(r => r.id === recordId)
      if (!record) return

      // 恢复分数
      const fromPlayer = game.players.find(p => p.id === record.fromPlayerId)
      const toPlayer = game.players.find(p => p.id === record.toPlayerId)

      if (fromPlayer && toPlayer) {
        fromPlayer.currentScore += record.amount
        toPlayer.currentScore -= record.amount
      }

      // 删除记录
      game.records = game.records.filter(r => r.id !== recordId)
      this.saveToLocal()
    },

    // 结算房间
    settleRoom(keepRecords = false) {
      const game = this.currentGame
      if (!game) return

      game.status = 'settled'
      game.settledAt = new Date().toISOString()

      // 保存最终分数
      game.players.forEach(player => {
        player.finalScore = player.currentScore
      })

      // 清空详细记录（可选）
      if (!keepRecords) {
        game.records = []
      }

      this.currentRoomCode = null
      this.saveToLocal()
    },

    // 离开房间
    leaveRoom() {
      this.currentRoomCode = null
      localStorage.setItem('currentRoomCode', '')
    },

    // 删除房间
    deleteRoom(roomCode) {
      this.games = this.games.filter(g => g.roomCode !== roomCode)
      if (this.currentRoomCode === roomCode) {
        this.currentRoomCode = null
      }
      this.saveToLocal()
    },

    // 随机颜色
    getRandomColor() {
      const colors = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#FFA07A',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E2'
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    },

    // 保存到本地
    saveToLocal() {
      localStorage.setItem('guestGames', JSON.stringify(this.games))
      localStorage.setItem('currentRoomCode', this.currentRoomCode || '')
    }
  }
})
