<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-fade-in">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">打牌记账</h1>
        <p class="text-gray-600">登录您的账户</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input
            v-model="username"
            type="text"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="请输入用户名"
            :disabled="userStore.loading"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="请输入密码"
            :disabled="userStore.loading"
          />
        </div>

        <button
          type="submit"
          :disabled="userStore.loading"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <van-loading v-if="userStore.loading" size="20px" color="#fff" />
          <span v-else>登录</span>
        </button>
      </form>

      <div class="mt-6 text-center space-y-4">
        <button
          @click="handleGuestLogin"
          :disabled="userStore.loading"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400"
        >
          游客模式进入
        </button>

        <div class="text-sm text-gray-600">
          还没有账户？
          <router-link to="/register" class="text-blue-600 hover:text-blue-800 font-medium ml-1">
            立即注册
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')

const handleLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    showToast('请输入用户名和密码')
    return
  }

  try {
    await userStore.login(username.value, password.value)
    showToast('登录成功！')
    router.push('/home')
  } catch (error) {
    showToast(error.response?.data?.message || '登录失败')
  }
}

const handleGuestLogin = () => {
  userStore.setGuestMode()
  showToast('游客模式已启用')
  router.push('/home')
}
</script>
