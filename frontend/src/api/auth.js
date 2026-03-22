import request from '../utils/request'

export const authApi = {
  register(data) {
    return request.post('/auth/register', data)
  },
  login(data) {
    return request.post('/auth/login', data)
  },
  getProfile() {
    return request.get('/auth/profile')
  },
  updateProfile(data) {
    return request.put('/auth/profile', data)
  },
  guestToUser(data) {
    return request.post('/auth/guest-to-user', data)
  },
  mergeGuest(data) {
    return request.post('/auth/merge-guest', data)
  },
  changePassword(data) {
    return request.put('/auth/password', data)
  },
  getAchievements() {
    return request.get('/auth/achievements')
  }
}
