<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <van-nav-bar title="注册" left-arrow fixed placeholder @click-left="handleBack" />

    <div class="flex-1 flex items-center justify-center overflow-y-auto">
      <div class="w-full max-w-md p-4">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h1 class="text-2xl font-bold text-center mb-6">创建账号</h1>

          <van-form @submit="handleRegister">
            <van-field
              v-model="registerForm.username"
              name="username"
              label="用户名"
              placeholder="请输入用户名"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="registerForm.password"
              type="password"
              name="password"
              label="密码"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请输入密码' }]"
            />
            <van-field
              v-model="registerForm.confirmPassword"
              type="password"
              name="confirmPassword"
              label="确认密码"
              placeholder="请再次输入密码"
              :rules="[{ required: true, message: '请再次输入密码' }]"
            />

            <div class="mt-6 space-y-3">
              <van-button
                round
                block
                type="primary"
                native-type="submit"
                :loading="userStore.loading"
              >
                注册
              </van-button>

              <van-button
                round
                block
                @click="handleBack"
              >
                返回
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

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
});

const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    showToast('两次密码不一致');
    return;
  }

  if (registerForm.value.password.length < 6) {
    showToast('密码至少6位');
    return;
  }

  try {
    await userStore.register(registerForm.value.username, registerForm.value.password);
    showToast('注册成功');
    router.push('/home');
  } catch (error) {
    showToast(error.message || '注册失败');
  }
};

const handleBack = () => {
  router.back();
};
</script>
