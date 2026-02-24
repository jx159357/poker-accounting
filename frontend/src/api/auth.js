import request from '../utils/request'

export const authApi = {
  // 注册
  register(data) {
    return request.post('/auth/register', data)
  },

  // 登录
  login(data) {
    return request.post('/auth/login', data)
  },

  // 获取用户信息
  getUserInfo() {
    return request.get('/auth/me')
  }
}
