import axios from 'axios'
import { showToast } from 'vant'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 动态导入避免循环引用
    const token = localStorage.getItem('token')
    const guestId = localStorage.getItem('guestId')

    // 如果有 token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加 guestId 到请求头
    if (guestId) {
      config.headers['x-guest-id'] = guestId
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const message = error.response?.data?.message || error.message || '请求失败'

    // 401 未授权
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      showToast('登录已过期，请重新登录')
    } else {
      showToast(message)
    }

    return Promise.reject(error)
  }
)

export default request
