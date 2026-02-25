import { defineStore } from 'pinia'
import request from '../utils/request'
import { generateRandomName } from '../utils/nameGenerator'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    isGuest: !localStorage.getItem('token'),
    guestId: localStorage.getItem('guestId') || '',
    guestNickname: localStorage.getItem('guestNickname') || ''
  }),

  getters: {
    currentUserId: state => {
      if (state.isGuest) {
        if (!state.guestId) {
          const id = generateUUID()
          state.guestId = id
          localStorage.setItem('guestId', id)
        }
        return state.guestId
      }
      return state.userInfo?.id?.toString() || ''
    },

    currentNickname: state => {
      if (state.isGuest) {
        if (!state.guestNickname) {
          const nickname = generateRandomName()
          state.guestNickname = nickname
          localStorage.setItem('guestNickname', nickname)
        }
        return state.guestNickname
      }
      return state.userInfo?.nickname || '用户'
    }
  },

  actions: {
    setGuestNickname(nickname) {
      this.guestNickname = nickname
      localStorage.setItem('guestNickname', nickname)
    },

    async register(username, password, nickname) {
      try {
        const finalNickname = nickname || this.guestNickname || generateRandomName()

        const res = await request.post('/auth/register', {
          username,
          password,
          nickname: finalNickname,
          guestId: this.isGuest ? this.guestId : undefined
        })

        this.token = res.token
        this.userInfo = res.user
        this.isGuest = false
        localStorage.setItem('token', res.token)

        // 注册成功后立即获取完整用户信息
        await this.getUserInfo()

        return res
      } catch (error) {
        throw error
      }
    },

    async login(username, password) {
      try {
        const res = await request.post('/auth/login', {
          username,
          password
        })
        this.token = res.token
        this.userInfo = res.user
        this.isGuest = false
        localStorage.setItem('token', res.token)

        // 登录成功后立即获取完整用户信息
        await this.getUserInfo()

        return res
      } catch (error) {
        throw error
      }
    },

    logout() {
      this.token = ''
      this.userInfo = null
      this.isGuest = true
      localStorage.removeItem('token')
    },

    async getUserInfo() {
      if (this.isGuest) {
        return null
      }
      try {
        const res = await request.get('/auth/me')
        this.userInfo = res
        return res
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
        throw error
      }
    },

    async updateNickname(nickname) {
      if (this.isGuest) {
        this.setGuestNickname(nickname)
        return { nickname }
      } else {
        try {
          const res = await request.put('/auth/profile', { nickname })
          this.userInfo.nickname = nickname
          return res
        } catch (error) {
          throw error
        }
      }
    }
  }
})
