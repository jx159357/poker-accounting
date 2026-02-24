<template>
  <div class="register-page">
    <div class="header">
      <h1>打牌记账</h1>
      <p>创建新账号</p>
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
          v-model="nickname"
          name="nickname"
          label="昵称"
          placeholder="请输入昵称"
          :rules="[{ required: true, message: '请输入昵称' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码（至少6位）"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' }
          ]"
        />
        <van-field
          v-model="confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validatePassword, message: '两次密码不一致' }
          ]"
        />
      </van-cell-group>

      <div class="button-group">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          注册
        </van-button>
        <van-button round block plain type="primary" @click="goLogin">
          已有账号，去登录
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
const nickname = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const validatePassword = () => {
  return password.value === confirmPassword.value;
};

const onSubmit = async () => {
  loading.value = true;
  try {
    await userStore.register(username.value, password.value, nickname.value);
    showToast('注册成功');
    router.push('/home');
  } catch (error) {
    showToast(error.response?.data?.message || '注册失败');
  } finally {
    loading.value = false;
  }
};

const goLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-page {
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
