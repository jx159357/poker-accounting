import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'
import { generateUUID } from '@/utils/utils.js'

// 生成或获取游客 ID
function getOrCreateGuestId() {
  let guestId = localStorage.getItem('guestId')
  if (!guestId) {
    guestId = 'guest_' + generateUUID()
    localStorage.setItem('guestId', guestId)
  }
  return guestId
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const guestId = ref(getOrCreateGuestId())
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const isGuest = computed(() => !token.value)

  const currentNickname = computed(() => {
    if (userInfo.value) return userInfo.value.nickname || userInfo.value.username
    return localStorage.getItem('guestNickname') || '游客'
  })

  const currentUserId = computed(() => {
    if (userInfo.value) return String(userInfo.value.id)
    return guestId.value
  })

  const currentGuestId = computed(() => guestId.value)

  const username = computed(() => {
    return userInfo.value?.username || ''
  })

  // 登录
  const login = async (user, pass) => {
    loading.value = true
    try {
      const data = await authApi.login({ username: user, password: pass })
      token.value = data.access_token
      userInfo.value = data.user
      localStorage.setItem('token', data.access_token)
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (user, pass) => {
    loading.value = true
    try {
      const data = await authApi.register({ username: user, password: pass })
      token.value = data.access_token
      userInfo.value = data.user
      localStorage.setItem('token', data.access_token)
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    if (!token.value) return
    try {
      const data = await authApi.getUserInfo()
      userInfo.value = data
    } catch {
      // token 无效，清除
      logout()
    }
  }

  // 更新昵称
  const updateNickname = async (nickname) => {
    if (isLoggedIn.value) {
      const data = await authApi.updateProfile({ nickname })
      userInfo.value = data
    } else {
      localStorage.setItem('guestNickname', nickname)
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  // 设置游客模式（兼容旧逻辑）
  const setGuestMode = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  // 初始化：如果有 token 则获取用户信息
  if (token.value) {
    getUserInfo()
  }

  return {
    token,
    userInfo,
    guestId,
    loading,
    isLoggedIn,
    isGuest,
    currentNickname,
    currentUserId,
    currentGuestId,
    username,
    login,
    register,
    getUserInfo,
    updateNickname,
    logout,
    setGuestMode
  }
})
