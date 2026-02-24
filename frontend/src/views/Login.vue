<template>
  <div class="login-page">
    <div class="header">
      <h1>打牌记账</h1>
      <p>欢迎回来</p>
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>

      <div class="button-group">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
        <van-button round block plain type="primary" @click="goRegister">
          注册账号
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const username = ref('');
const password = ref('');
const loading = ref(false);

const onSubmit = async () => {
  loading.value = true;
  try {
    await userStore.login(username.value, password.value);
    showToast('登录成功');
    router.push('/home');
  } catch (error) {
    showToast(error.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
};

const goRegister = () => {
  router.push('/register');
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 20px 20px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 60px;
}

.header h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.header p {
  font-size: 16px;
  opacity: 0.9;
}

.button-group {
  padding: 20px 16px;
}

.button-group .van-button {
  margin-bottom: 12px;
}
</style>
