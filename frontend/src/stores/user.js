import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const guestId = ref(localStorage.getItem('guestId') || '')
  const guestNickname = ref(localStorage.getItem('guestNickname') || '')

  // 是否是游客
  const isGuest = computed(() => !token.value && !!guestId.value)

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value)

  // 当前昵称
  const currentNickname = computed(() => {
    if (user.value?.nickname) return user.value.nickname
    if (guestNickname.value) return guestNickname.value
    return '游客'
  })

  // 当前用户ID（用于后端）
  const currentUserId = computed(() => user.value?.id || null)

  // 当前游客ID（用于后端）
  const currentGuestId = computed(() => guestId.value || null)

  // 初始化游客
  const initGuest = () => {
    if (!guestId.value) {
      // 生成 UUID
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
      guestId.value = uuid
      localStorage.setItem('guestId', uuid)
    }

    if (!guestNickname.value) {
      const nickname = `游客${Math.floor(Math.random() * 10000)}`
      guestNickname.value = nickname
      localStorage.setItem('guestNickname', nickname)
    }
  }

  // 设置游客昵称
  const setGuestNickname = nickname => {
    guestNickname.value = nickname
    localStorage.setItem('guestNickname', nickname)
  }

  // 登录
  const login = async (username, password) => {
    const data = await authApi.login({ username, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    // 登录后清除游客信息（数据已迁移）
    localStorage.removeItem('guestId')
    localStorage.removeItem('guestNickname')
    guestId.value = ''
    guestNickname.value = ''
  }

  // 注册
  const register = async (username, password, nickname) => {
    // 注册时携带 guestId，后端会自动迁移数据
    const data = await authApi.register({
      username,
      password,
      nickname,
      guestId: guestId.value
    })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    // 注册后清除游客信息
    localStorage.removeItem('guestId')
    localStorage.removeItem('guestNickname')
    guestId.value = ''
    guestNickname.value = ''
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // 重新初始化游客
    initGuest()
  }

  // 更新用户信息
  const updateUser = userData => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  const getUserInfo = async () => {
    const data =  await authApi.getUserInfo()
    return data
  }

  return {
    token,
    user,
    guestId,
    guestNickname,
    isGuest,
    isLoggedIn,
    currentNickname,
    currentUserId,
    currentGuestId,
    initGuest,
    setGuestNickname,
    login,
    register,
    logout,
    updateUser,
    getUserInfo
  }
})
