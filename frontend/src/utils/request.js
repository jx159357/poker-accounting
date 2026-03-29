import axios from 'axios'
import { showToast } from 'vant'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    const hasToken = Boolean(localStorage.getItem('token'))

    if (error.response?.status === 401 && hasToken) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.setItem('isGuest', 'false')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || '请求失败'
    showToast(message)
    return Promise.reject(error)
  }
)

export default request
