import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const isGuestMode = ref(localStorage.getItem('guestMode') === 'true')
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value && !isGuestMode.value)
  const isGuest = computed(() => isGuestMode.value)

  // 登录
  const login = async (user, pass) => {
    loading.value = true
    try {
      const data = await authApi.login(user, pass)
      token.value = data.access_token
      username.value = user
      isGuestMode.value = false

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('username', user)
      localStorage.removeItem('guestMode')
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (user, pass) => {
    loading.value = true
    try {
      const data = await authApi.register(user, pass)
      token.value = data.access_token
      username.value = user
      isGuestMode.value = false

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('username', user)
      localStorage.removeItem('guestMode')
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    username.value = ''
    isGuestMode.value = false

    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('guestMode')
  }

  // 设置游客模式
  const setGuestMode = () => {
    token.value = ''
    username.value = ''
    isGuestMode.value = true

    localStorage.setItem('guestMode', 'true')
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  return {
    token,
    username,
    isGuestMode,
    loading,
    isLoggedIn,
    isGuest,
    login,
    register,
    logout,
    setGuestMode
  }
})
