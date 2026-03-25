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
      <div class="prompt-hero">
        <div class="prompt-hero-copy">
          <h3 class="prompt-title">注册解锁更多功能</h3>
          <p class="prompt-desc">{{ promptDescription }}</p>
        </div>
        <div class="prompt-hero-badge">PRO</div>
      </div>

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
import { computed } from 'vue'
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

const promptDescription = computed(() => {
  switch (props.source) {
    case 'home-create':
      return '注册后不再受游客房间数量限制，还能跨设备继续未完成的牌局。'
    case 'statistics':
      return '注册后可查看完整统计、对手分析、排行榜和更长期的历史数据。'
    case 'game-end':
      return '注册后可永久保存刚结束的牌局，并在其他设备继续查看与整理。'
    default:
      return '注册账号后，你将享有更完整的数据保存、统计分析和跨设备同步能力。'
  }
})

const goRegister = () => {
  emit('update:visible', false)
  router.push('/register')
}
</script>

<style scoped>
.register-prompt {
  padding: 24px 20px 32px;
  background:
    radial-gradient(circle at top right, rgba(22, 163, 74, 0.08), transparent 180px),
    var(--color-bg-white, #fff);
}

.prompt-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.prompt-hero-copy {
  flex: 1;
  min-width: 0;
}

.prompt-hero-badge {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  color: var(--color-primary, #16A34A);
  font-size: var(--font-size-xs, 12px);
  font-weight: 800;
}

.prompt-title {
  font-size: calc(20px * var(--font-scale, 1));
  font-weight: 700;
  color: #1A1A1A;
  text-align: left;
  margin: 0 0 8px;
}

.prompt-desc {
  font-size: calc(14px * var(--font-scale, 1));
  color: #6B7280;
  text-align: left;
  margin: 0 0 20px;
  line-height: 1.5;
}

.benefits-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(180deg, #F0FDF4, #F8FAFC);
  border-radius: 16px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  font-size: calc(15px * var(--font-scale, 1));
  color: #374151;
}

.prompt-btn {
  height: 44px;
  font-size: calc(16px * var(--font-scale, 1));
  font-weight: 600;
  margin-bottom: 10px;
}

.prompt-btn-secondary {
  height: 44px;
  font-size: calc(15px * var(--font-scale, 1));
  color: #6B7280 !important;
  border-color: #D1D5DB !important;
}

@media (max-width: 380px) {
  .benefits-list {
    grid-template-columns: 1fr;
  }
}
</style>
