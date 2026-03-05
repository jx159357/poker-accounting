import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 初始化状态
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const isGuest = ref(localStorage.getItem('isGuest') === 'true')
  const loading = ref(false)

  // 初始化函数 - 确保从 localStorage 恢复状态
  const init = () => {
    const savedToken = localStorage.getItem('token')
    const savedUsername = localStorage.getItem('username')
    const savedIsGuest = localStorage.getItem('isGuest')

    if (savedToken) {
      token.value = savedToken
    }
    if (savedUsername) {
      username.value = savedUsername
    }
    if (savedIsGuest !== null) {
      isGuest.value = savedIsGuest === 'true'
    }

    console.log('User store initialized:', {
      token: !!token.value,
      username: username.value,
      isGuest: isGuest.value
    })
  }

  // 注册
  const register = async (usernameInput, password) => {
    loading.value = true
    try {
      const data = await authApi.register({
        username: usernameInput,
        password
      })

      token.value = data.access_token
      username.value = data.username
      isGuest.value = false

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('username', data.username)
      localStorage.setItem('isGuest', 'false')

      console.log('Registered successfully:', data.username)
    } catch (error) {
      throw new Error(error.response?.data?.message || '注册失败')
    } finally {
      loading.value = false
    }
  }

  // 登录
  const login = async (usernameInput, password) => {
    loading.value = true
    try {
      const data = await authApi.login({
        username: usernameInput,
        password
      })

      token.value = data.access_token
      username.value = data.username
      isGuest.value = false

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('username', data.username)
      localStorage.setItem('isGuest', 'false')

      console.log('Logged in successfully:', data.username)
    } catch (error) {
      throw new Error(error.response?.data?.message || '登录失败')
    } finally {
      loading.value = false
    }
  }

  // 游客模式
  const setGuestMode = () => {
    isGuest.value = true
    token.value = ''
    username.value = ''

    localStorage.setItem('isGuest', 'true')
    localStorage.removeItem('token')
    localStorage.removeItem('username')

    console.log('Guest mode activated')
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    username.value = ''
    isGuest.value = false

    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('isGuest')
    localStorage.removeItem('guestId')
    localStorage.removeItem('guestNickname')

    console.log('Logged out')
  }

  // 页面加载时初始化
  init()

  return {
    token,
    username,
    isGuest,
    loading,
    init,
    register,
    login,
    setGuestMode,
    logout
  }
})
