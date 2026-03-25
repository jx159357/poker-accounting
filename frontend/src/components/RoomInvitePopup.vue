<template>
  <van-popup
    v-model:show="visible"
    round
    position="center"
    :style="{ width: '90%', maxWidth: '420px' }"
  >
    <div class="invite-popup">
      <button type="button" class="invite-close" @click="visible = false">
        <van-icon name="cross" size="18" />
      </button>

      <div class="invite-hero">
        <div>
          <div class="invite-title">扫码加入房间</div>
          <div class="invite-subtitle">打开打牌记账后扫码，或识别下方二维码直接进入</div>
        </div>
        <div class="invite-code-chip">{{ roomCode }}</div>
      </div>

      <div class="invite-qr-shell">
        <van-loading v-if="loading" size="24" />
        <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="房间二维码" class="invite-qr-image" />
        <div class="invite-room-name">{{ roomName || '打牌记账房间' }}</div>
        <div class="invite-room-meta">房间号 {{ roomCode }}</div>
      </div>

      <div class="invite-actions">
        <van-button block round type="primary" @click="handleShareOrCopy">
          {{ canUseNativeShare ? '系统分享' : '复制邀请信息' }}
        </van-button>
        <van-button block round plain type="primary" @click="copyRoomCode">
          复制房间号
        </van-button>
        <van-button v-if="qrDataUrl" block round plain @click="downloadQrImage">
          保存二维码
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'
import { buildRoomShareText, buildRoomShareUrl } from '../utils/roomInvite'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  roomCode: {
    type: String,
    default: '',
  },
  roomName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:show'])

const visible = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const qrDataUrl = ref('')
const loading = ref(false)

const shareUrl = computed(() => buildRoomShareUrl(props.roomCode))
const shareText = computed(() => buildRoomShareText(props.roomName, props.roomCode))
const canUseNativeShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function')

const fallbackCopyText = text => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  document.body.appendChild(textArea)
  textArea.select()

  try {
    document.execCommand('copy')
    showToast('邀请信息已复制')
  } catch {
    showToast('复制失败')
  }

  document.body.removeChild(textArea)
}

const copyText = async text => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      showToast('邀请信息已复制')
      return
    } catch {
      // fallback below
    }
  }

  fallbackCopyText(text)
}

const handleShareOrCopy = async () => {
  const payload = `${shareText.value}\n${shareUrl.value}`

  if (canUseNativeShare.value) {
    try {
      await navigator.share({
        title: props.roomName || '打牌记账',
        text: shareText.value,
        url: shareUrl.value,
      })
      return
    } catch {
      // 用户取消或浏览器失败时退化为复制
    }
  }

  await copyText(payload)
}

const copyRoomCode = async () => {
  await copyText(props.roomCode)
}

const downloadQrImage = () => {
  if (!qrDataUrl.value) return

  const anchor = document.createElement('a')
  anchor.href = qrDataUrl.value
  anchor.download = `${props.roomCode || 'room'}-qr.png`
  anchor.click()
  showToast('二维码已开始下载')
}

const generateQrCode = async () => {
  if (!visible.value || !props.roomCode) return

  loading.value = true
  try {
    const { default: QRCode } = await import('qrcode')
    qrDataUrl.value = await QRCode.toDataURL(shareUrl.value, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#1A1A1AFF',
        light: '#FFFFFFFF',
      },
    })
  } catch {
    showToast('二维码生成失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => [visible.value, props.roomCode],
  ([isVisible, roomCode]) => {
    if (!isVisible || !roomCode) {
      qrDataUrl.value = ''
      return
    }

    generateQrCode()
  },
  { immediate: true },
)
</script>

<style scoped>
.invite-popup {
  position: relative;
  padding: 20px 18px 22px;
  background:
    radial-gradient(circle at top right, var(--color-primary-bg, rgba(22, 163, 74, 0.08)), transparent 140px),
    var(--color-bg-white, #fff);
  border-radius: 24px;
}

.invite-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: var(--color-text-secondary, #6B7280);
  background: rgba(15, 23, 42, 0.06);
}

.invite-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-right: 28px;
}

.invite-title {
  font-size: var(--font-size-xl, 20px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
}

.invite-subtitle {
  margin-top: 6px;
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #6B7280);
}

.invite-code-chip {
  flex-shrink: 0;
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  color: var(--color-primary, #16A34A);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: var(--font-size-md, 14px);
  font-weight: 700;
}

.invite-qr-shell {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(249, 250, 251, 0.96));
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 20px;
  padding: 20px;
}

.invite-qr-image {
  width: min(62vw, 248px);
  max-width: 248px;
  border-radius: 16px;
  box-shadow: var(--shadow-md);
}

.invite-room-name {
  margin-top: 6px;
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  text-align: center;
}

.invite-room-meta {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-placeholder, #9CA3AF);
}

.invite-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}
</style>
