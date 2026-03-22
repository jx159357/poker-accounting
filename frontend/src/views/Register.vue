<template>
  <div class="register-page">
    <!-- 品牌区域 -->
    <div class="brand-section">
      <div class="brand-icon">
        <span class="card-symbol">&#9824;</span>
        <span class="card-symbol card-red">&#9829;</span>
        <span class="card-symbol">&#9827;</span>
        <span class="card-symbol card-red">&#9830;</span>
      </div>
      <h1 class="brand-title">创建账号</h1>
      <p class="brand-subtitle">加入打牌记账</p>
    </div>

    <!-- 表单卡片 -->
    <div class="form-wrapper">
      <div class="form-card">
        <!-- 游客迁移提示 -->
        <div v-if="userStore.isGuest" class="migrate-notice">
          <van-icon name="info-o" size="16" />
          <span>注册后将自动迁移你的游戏数据</span>
        </div>

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

          <div class="form-actions">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="userStore.loading"
              class="btn-register"
            >
              注册
            </van-button>

            <van-button
              round
              block
              plain
              class="btn-back"
              @click="handleBack"
            >
              返回登录
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

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
});

const redirectPath = route.query.redirect || '/home';

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
    router.replace(redirectPath);
  } catch (error) {
    showToast(error.message || '注册失败');
  }
};

const handleBack = () => {
  const query = route.query.redirect ? { redirect: route.query.redirect } : {};
  router.push({ path: '/login', query });
};
</script>

<style scoped>
.register-page {
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

.btn-register {
  height: 44px;
  font-size: 16px;
  font-weight: 600;
}

.btn-back {
  height: 44px;
  font-size: 15px;
  color: var(--color-text-secondary, #6B7280) !important;
  border-color: #D1D5DB !important;
}

.migrate-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(22, 163, 74, 0.08);
  color: var(--color-primary, #16A34A);
  font-size: var(--font-size-sm, 13px);
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 16px;
}
</style>
