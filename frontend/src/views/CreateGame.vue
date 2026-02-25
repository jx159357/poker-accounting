<template>
  <div class="create-game-page">
    <van-nav-bar title="创建牌局" left-arrow @click-left="goBack" fixed />

    <div class="content">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="gameType"
            name="gameType"
            label="牌局类型"
            placeholder="如：斗地主、麻将"
            :rules="[{ required: true, message: '请输入牌局类型' }]"
          />
          <van-field
            v-model="note"
            name="note"
            label="备注"
            type="textarea"
            placeholder="可选，记录一些信息"
            rows="3"
          />
        </van-cell-group>

        <div class="button-group">
          <van-button round block type="primary" native-type="submit">
            创建牌局
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '../stores/user';
import { useGuestStore } from '../stores/guest';

const router = useRouter();
const userStore = useUserStore();
const guestStore = useGuestStore();

const gameType = ref('');
const note = ref('');

const goBack = () => {
  router.back();
};

const onSubmit = () => {
  if (userStore.isGuest) {
    const game = guestStore.createGame(gameType.value, note.value);
    showToast('牌局创建成功');
    router.push(`/game/${game.id}`);
  } else {
    // TODO: 调用后端接口创建牌局
    showToast('功能开发中');
  }
};
</script>

<style scoped>
.create-game-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.content {
  padding-top: 66px;
}

.button-group {
  padding: 20px 16px;
}
</style>
