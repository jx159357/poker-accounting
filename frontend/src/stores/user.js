import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../api/request'
import { Toast } from 'vant'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  // 注册
  const register = async (username, password) => {
    try {
      const res = await request.post('/auth/register', { username, password })

      if (res.data.access_token) {
        token.value = res.data.access_token
        user.value = res.data.user
        localStorage.setItem('token', token.value)

        Toast.success('注册成功')

        // 自动迁移游客数据
        await migrateGuestData()

        return true
      }
    } catch (error) {
      Toast.fail(error.response?.data?.message || '注册失败')
      return false
    }
  }

  // 登录
  const login = async (username, password) => {
    try {
      const res = await request.post('/auth/login', { username, password })

      if (res.data.access_token) {
        token.value = res.data.access_token
        user.value = res.data.user
        localStorage.setItem('token', token.value)

        Toast.success('登录成功')
        return true
      }
    } catch (error) {
      Toast.fail(error.response?.data?.message || '登录失败')
      return false
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    Toast.success('已退出登录')
  }

  // 迁移游客数据
  const migrateGuestData = async () => {
    const guestGamesStr = localStorage.getItem('guestGames')

    if (!guestGamesStr) {
      return
    }

    try {
      const guestGames = JSON.parse(guestGamesStr)

      if (!guestGames || guestGames.length === 0) {
        return
      }

      Toast.loading({
        message: '正在迁移数据...',
        forbidClick: true,
        duration: 0
      })

      const res = await request.post('/auth/migrate', { games: guestGames })

      Toast.clear()

      if (res.data.migratedCount > 0) {
        // 迁移成功后清空本地数据
        localStorage.removeItem('guestGames')
        Toast.success(`成功迁移 ${res.data.migratedCount} 个游戏`)
      } else {
        Toast.fail('数据迁移失败')
      }
    } catch (error) {
      Toast.clear()
      console.error('数据迁移失败:', error)
      Toast.fail(error.response?.data?.message || '数据迁移失败')
    }
  }

  return {
    token,
    user,
    register,
    login,
    logout,
    migrateGuestData
  }
})
