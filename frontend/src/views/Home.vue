<template>
  <div class="home-page">
    <van-nav-bar title="打牌记账" fixed>
      <template #right>
        <van-button size="small" type="primary" @click="logout">退出</van-button>
      </template>
    </van-nav-bar>

    <div class="content">
      <van-empty description="首页功能开发中..." />
      <div class="user-info">
        <p>欢迎，{{ userStore.userInfo?.nickname }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

onMounted(async () => {
  try {
    await userStore.getUserInfo();
  } catch (error) {
    showToast('获取用户信息失败');
    router.push('/login');
  }
});

const logout = () => {
  userStore.logout();
  showToast('已退出登录');
  router.push('/login');
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.content {
  padding-top: 46px;
  padding: 66px 20px 20px;
}

.user-info {
  text-align: center;
  margin-top: 20px;
  font-size: 16px;
  color: #666;
}
</style>
