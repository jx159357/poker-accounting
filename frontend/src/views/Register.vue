<template>
  <div class="register-page">
    <van-nav-bar title="注册账号" left-arrow @click="$router.back()" fixed />

    <div class="register-container">
      <div class="tip-box">
        <van-icon name="info-o" />
        <span>注册后将保留您的游客数据</span>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="username"
            name="username"
            label="账号"
            placeholder="请输入账号"
            :rules="[{ required: true, message: '请输入账号' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
          <van-field
            v-model="nickname"
            name="nickname"
            label="昵称"
            :placeholder="`默认：${userStore.currentNickname}`"
          />
        </van-cell-group>
        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit">
            注册
          </van-button>
        </div>
      </van-form>

      <div class="footer-link">
        已有账号？<router-link to="/login">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const username = ref('');
const password = ref('');
const nickname = ref('');

const onSubmit = async () => {
  showLoadingToast({ message: '注册中...', forbidClick: true });

  try {
    await userStore.register(
      username.value,
      password.value,
      nickname.value || userStore.currentNickname
    );

    closeToast();
    showToast('注册成功');
    router.push('/home');
  } catch (error) {
    closeToast();
    showToast(error.response?.data?.message || '注册失败');
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.register-container {
  padding-top: 46px;
  padding: 66px 16px 20px;
}

.tip-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #856404;
  font-size: 14px;
}

.footer-link {
  text-align: center;
  margin-top: 20px;
  color: #969799;
}

.footer-link a {
  color: #1989fa;
  text-decoration: none;
}
</style>
