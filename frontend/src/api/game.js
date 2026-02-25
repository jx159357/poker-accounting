import request from '../utils/request'

export const gameApi = {
  // 创建房间
  createRoom(data) {
    return request.post('/game/create', data)
  },

  // 加入房间
  joinRoom(data) {
    return request.post('/game/join', data)
  },

  // 获取房间详情
  getRoomDetail(roomCode) {
    return request.get(`/game/${roomCode}`)
  },

  // 获取我的房间列表
  getMyGames() {
    return request.get('/game/my-games')
  },

  // 添加记分记录
  addScore(roomCode, data) {
    return request.post(`/game/${roomCode}/score`, data)
  },

  // 撤销记录
  undoRecord(roomCode, recordId) {
    return request.delete(`/game/${roomCode}/record/${recordId}`)
  },

  // 结算本局（不清空记录）
  settleRound(roomCode) {
    return request.post(`/game/${roomCode}/settle`, { clearRecords: false })
  },

  // 结束房间（清空记录）
  finishRoom(roomCode) {
    return request.post(`/game/${roomCode}/finish`)
  }
}
