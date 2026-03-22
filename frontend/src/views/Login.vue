<template>
  <div class="login-page">
    <!-- 品牌区域 -->
    <div class="brand-section">
      <div class="brand-icon">
        <span class="card-symbol">&#9824;</span>
        <span class="card-symbol card-red">&#9829;</span>
        <span class="card-symbol">&#9827;</span>
        <span class="card-symbol card-red">&#9830;</span>
      </div>
      <h1 class="brand-title">打牌记账</h1>
      <p class="brand-subtitle">轻松记录每一局</p>
    </div>

    <!-- 表单卡片 -->
    <div class="form-wrapper">
      <div class="form-card">
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

          <div class="form-actions">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="userStore.loading"
              class="btn-login"
            >
              登录
            </van-button>

            <van-button
              round
              block
              plain
              class="btn-register"
              @click="goToRegister"
            >
              注册账号
            </van-button>

            <div class="divider">
              <span>或</span>
            </div>

            <van-button
              round
              block
              class="btn-guest"
              @click="handleGuestMode"
            >
              游客模式
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
import { showToast } from 'vant';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loginForm = ref({
  username: '',
  password: '',
});

const redirectPath = route.query.redirect || '/home';

const handleLogin = async () => {
  try {
    await userStore.login(loginForm.value.username, loginForm.value.password);
    showToast('登录成功');
    router.replace(redirectPath);
  } catch (error) {
    showToast(error.message || '登录失败');
  }
};

const goToRegister = () => {
  router.push({ path: '/register', query: { redirect: route.query.redirect } });
};

const handleGuestMode = () => {
  userStore.setGuestMode();
  showToast('已进入游客模式');
  router.replace(redirectPath);
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary, #16A34A) 0%, var(--color-primary-dark, #15803D) 50%, #166534 100%);
  padding: 24px 20px;
}

.brand-section {
  padding: 0 24px 20px;
  text-align: center;
}

.brand-icon {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.card-symbol {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-symbol.card-red {
  color: #FCA5A5;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 8px 0 0;
}

.form-wrapper {
  display: flex;
  justify-content: center;
  padding: 0;
}

.form-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  padding: 28px 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.form-actions {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-login {
  height: 44px;
  font-size: 16px;
  font-weight: 600;
}

.btn-register {
  height: 44px;
  font-size: 15px;
  color: var(--color-primary, #16A34A) !important;
  border-color: var(--color-primary, #16A34A) !important;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-placeholder, #9CA3AF);
  font-size: var(--font-size-sm, 13px);
  margin: 4px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border, #E5E7EB);
}

.btn-guest {
  height: 44px;
  font-size: 15px;
  color: var(--color-text-secondary, #6B7280) !important;
  background: var(--color-bg-hover, #F3F4F6) !important;
  border: none !important;
}
</style>
