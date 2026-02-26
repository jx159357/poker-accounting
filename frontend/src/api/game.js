import axios from 'axios'

const API_URL = 'http://localhost:3000'

// 获取 token
const getToken = () => localStorage.getItem('token')

// 创建游戏
export const createGame = async (name, buyIn, smallBlind, bigBlind) => {
  const response = await axios.post(
    `${API_URL}/game/create`,
    { name, buyIn, smallBlind, bigBlind },
    { headers: { Authorization: `Bearer ${getToken()}` } }
  )
  return response.data
}

// 加入游戏
export const joinGame = async roomCode => {
  const response = await axios.post(
    `${API_URL}/game/join/${roomCode}`,
    {},
    { headers: { Authorization: `Bearer ${getToken()}` } }
  )
  return response.data
}

// 获取我的游戏列表
export const getMyGames = async () => {
  const response = await axios.get(`${API_URL}/game/my-games`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return response.data
}

// 获取游戏详情
export const getGameDetail = async roomCode => {
  const response = await axios.get(`${API_URL}/game/${roomCode}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return response.data
}

// 结束游戏
export const endGame = async roomCode => {
  const response = await axios.post(
    `${API_URL}/game/${roomCode}/end`,
    {},
    { headers: { Authorization: `Bearer ${getToken()}` } }
  )
  return response.data
}

// 添加记录
export const addRecord = async (roomCode, amount, type) => {
  const response = await axios.post(
    `${API_URL}/game/${roomCode}/record`,
    { amount, type },
    { headers: { Authorization: `Bearer ${getToken()}` } }
  )
  return response.data
}

// 撤销记录
export const undoRecord = async (roomCode, recordId) => {
  const response = await axios.delete(`${API_URL}/game/${roomCode}/record/${recordId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return response.data
}
