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

  // 获取游戏详情
  getGameDetail(roomCode) {
    return request.get(`/game/${roomCode}`)
  },

  // 获取我的游戏列表
  getMyGames(params) {
    return request.get('/game/my-games/list', { params })
  },

  // 添加积分记录
  addScore(roomCode, data) {
    return request.post(`/game/${roomCode}/score`, data)
  },

  // 撤销积分记录
  undoScore(roomCode, recordId, data) {
    return request.delete(`/game/${roomCode}/score/${recordId}`, { data })
  },

  // 更新玩家昵称
  updatePlayerNickname(roomCode, playerId, data) {
    return request.patch(`/game/${roomCode}/player/${playerId}/nickname`, data)
  },

  // 结束游戏
  endGame(roomCode) {
    return request.post(`/game/${roomCode}/end`)
  },

  // 删除游戏
  deleteGame(roomCode, data) {
    return request.delete(`/game/${roomCode}`, { data })
  },

  // 获取统计数据
  getStats(params) {
    return request.get('/game/stats/data', { params })
  }
}
