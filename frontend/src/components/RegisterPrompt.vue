<template>
  <van-popup
    :show="visible"
    round
    closeable
    position="bottom"
    :style="{ maxHeight: '70%' }"
    @update:show="$emit('update:visible', $event)"
  >
    <div class="register-prompt">
      <h3 class="prompt-title">注册解锁更多功能</h3>
      <p class="prompt-desc">注册账号后，你将享有以下权益：</p>

      <div class="benefits-list">
        <div class="benefit-item">
          <van-icon name="records-o" size="20" color="#16A34A" />
          <span>不限房间数量</span>
        </div>
        <div class="benefit-item">
          <van-icon name="clock-o" size="20" color="#16A34A" />
          <span>完整历史记录</span>
        </div>
        <div class="benefit-item">
          <van-icon name="chart-trending-o" size="20" color="#16A34A" />
          <span>数据图表分析</span>
        </div>
        <div class="benefit-item">
          <van-icon name="down" size="20" color="#16A34A" />
          <span>数据导出</span>
        </div>
        <div class="benefit-item">
          <van-icon name="exchange" size="20" color="#16A34A" />
          <span>多设备同步</span>
        </div>
      </div>

      <van-button
        type="primary"
        block
        round
        class="prompt-btn"
        @click="goRegister"
      >
        立即注册
      </van-button>
      <van-button
        block
        round
        plain
        class="prompt-btn-secondary"
        @click="$emit('update:visible', false)"
      >
        以后再说
      </van-button>
    </div>
  </van-popup>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible'])

const router = useRouter()

const goRegister = () => {
  emit('update:visible', false)
  router.push('/register')
}
</script>

<style scoped>
.register-prompt {
  padding: 24px 20px 32px;
}

.prompt-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A1A;
  text-align: center;
  margin: 0 0 8px;
}

.prompt-desc {
  font-size: 14px;
  color: #6B7280;
  text-align: center;
  margin: 0 0 20px;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
  padding: 16px;
  background: #F0FDF4;
  border-radius: 12px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #374151;
}

.prompt-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.prompt-btn-secondary {
  height: 44px;
  font-size: 15px;
  color: #6B7280 !important;
  border-color: #D1D5DB !important;
}
</style>
