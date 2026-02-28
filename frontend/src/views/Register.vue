<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-fade-in">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">创建账户</h1>
        <p class="text-gray-600">注册新用户</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input
            v-model="username"
            type="text"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="至少3个字符"
            :disabled="userStore.loading"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="至少6个字符"
            :disabled="userStore.loading"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="再次输入密码"
            :disabled="userStore.loading"
          />
        </div>

        <button
          type="submit"
          :disabled="userStore.loading"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <van-loading v-if="userStore.loading" size="20px" color="#fff" />
          <span v-else>注册</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-600">
        已有账户？
        <router-link to="/login" class="text-blue-600 hover:text-blue-800 font-medium ml-1">
          立即登录
        </router-link>
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
const confirmPassword = ref('')

const handleRegister = async () => {
  if (!username.value.trim() || !password.value.trim() || !confirmPassword.value.trim()) {
    showToast('请填写所有字段')
    return
  }

  if (username.value.length < 3) {
    showToast('用户名至少3个字符')
    return
  }

  if (password.value.length < 6) {
    showToast('密码至少6个字符')
    return
  }

  if (password.value !== confirmPassword.value) {
    showToast('两次密码输入不一致')
    return
  }

  try {
    await userStore.register(username.value, password.value)
    showToast('注册成功！')
    router.push('/home')
  } catch (error) {
    showToast(error.response?.data?.message || '注册失败')
  }
}
</script>
