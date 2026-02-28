import request from '../utils/request'

export const gameApi = {
  // 创建游戏
  createGame(data) {
    return request.post('/game/create', data)
  },

  // 加入游戏
  joinGame(roomCode, data) {
    return request.post(`/game/join/${roomCode}`, data)
  },

  // 获取我的游戏列表
  getMyGames() {
    return request.get('/game/my-games')
  },

  // 获取房间详情
  getRoomDetail(roomCode) {
    return request.get(`/game/room/${roomCode}`)
  },

  // 添加转账
  addTransaction(roomCode, data) {
    return request.post(`/game/room/${roomCode}/transaction`, data)
  },

  // 撤销转账
  undoTransaction(roomCode, transactionId) {
    return request.delete(`/game/room/${roomCode}/transaction/${transactionId}`)
  },

  // 结算房间
  settleRoom(roomCode, data) {
    return request.post(`/game/room/${roomCode}/settle`, data)
  },

  // 结束房间
  finishRoom(roomCode) {
    return request.post(`/game/room/${roomCode}/finish`)
  },

  // 获取统计数据
  getStatistics() {
    return request.get('/game/statistics')
  }
}
