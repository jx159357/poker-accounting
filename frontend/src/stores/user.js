import { defineStore } from 'pinia'
import request from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null
  }),

  actions: {
    // 注册
    async register(username, password, nickname) {
      try {
        const res = await request.post('/auth/register', {
          username,
          password,
          nickname
        })
        this.token = res.token
        this.userInfo = res.user
        localStorage.setItem('token', res.token)
        return res
      } catch (error) {
        throw error
      }
    },

    // 登录
    async login(username, password) {
      try {
        const res = await request.post('/auth/login', {
          username,
          password
        })
        this.token = res.token
        this.userInfo = res.user
        localStorage.setItem('token', res.token)
        return res
      } catch (error) {
        throw error
      }
    },

    // 退出登录
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const res = await request.get('/auth/me')
        this.userInfo = res
        return res
      } catch (error) {
        this.logout()
        throw error
      }
    }
  }
})
