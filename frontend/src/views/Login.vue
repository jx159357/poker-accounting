<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <van-nav-bar title="登录" />

    <div class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h1 class="text-2xl font-bold text-center mb-6">打牌记账</h1>

          <van-form @submit="handleLogin">
            <van-field
              v-model="loginForm.username"
              name="username"
              label="用户名"
              placeholder="请输入用户名"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="loginForm.password"
              type="password"
              name="password"
              label="密码"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请输入密码' }]"
            />

            <div class="mt-6 space-y-3">
              <van-button
                round
                block
                type="primary"
                native-type="submit"
                :loading="userStore.loading"
              >
                登录
              </van-button>

              <van-button
                round
                block
                type="default"
                @click="goToRegister"
              >
                注册账号
              </van-button>

              <van-button
                round
                block
                plain
                type="primary"
                @click="handleGuestMode"
              >
                游客模式
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { showToast } from 'vant';

const router = useRouter();
const userStore = useUserStore();

const loginForm = ref({
  username: '',
  password: '',
});

const handleLogin = async () => {
  try {
    await userStore.login(loginForm.value.username, loginForm.value.password);
    showToast('登录成功');
    router.push('/home');
  } catch (error) {
    showToast(error.message || '登录失败');
  }
};

const goToRegister = () => {
  router.push('/register');
};

const handleGuestMode = () => {
  userStore.setGuestMode();
  showToast('已进入游客模式');
  router.push('/home');
};
</script>
