<template>
  <van-popup
    v-model:show="visible"
    round
    position="center"
    :style="{ width: '92%', maxWidth: '420px' }"
  >
    <div class="scan-popup">
      <div class="scan-header">
        <div>
          <div class="scan-title">扫码加入房间</div>
          <div class="scan-subtitle">{{ scanSubtitle }}</div>
        </div>
        <button type="button" class="scan-close" @click="visible = false">关闭</button>
      </div>

      <div class="scan-viewfinder">
        <video ref="videoRef" class="scan-video" muted playsinline />
        <div ref="overlayRef" class="scan-overlay" />
        <div class="scan-frame" />
        <div v-if="starting" class="scan-status">正在打开摄像头...</div>
        <div v-else-if="errorMessage" class="scan-status scan-status-error">{{ errorMessage }}</div>
      </div>

      <div class="scan-tips">
        <div class="scan-tip-item">将二维码放在取景框中央，识别成功后会自动进入房间。</div>
        <div class="scan-tip-item">如果浏览器限制摄像头，请直接使用“拍照识别二维码”。</div>
      </div>

      <div class="scan-actions">
        <van-button block round type="primary" @click="pickCameraCapture">
          拍照识别二维码
        </van-button>
        <van-button block round plain type="primary" @click="pickImage">
          从相册选择图片
        </van-button>
        <van-button block round @click="emit('manual-entry')">
          手动输入房间号
        </van-button>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="scan-file-input"
        @change="handleFileChange"
      />
      <input
        ref="cameraInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        class="scan-file-input"
        @change="handleFileChange"
      />
    </div>
  </van-popup>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { showToast } from 'vant'
import { extractRoomCodeFromText } from '../utils/roomInvite'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'detected', 'manual-entry'])

const visible = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const videoRef = ref(null)
const overlayRef = ref(null)
const fileInputRef = ref(null)
const cameraInputRef = ref(null)
const starting = ref(false)
const errorMessage = ref('')

let scannerInstance = null
let hasDetected = false
let qrScannerModulePromise = null

const isSecureBrowserContext = computed(() => {
  if (typeof window === 'undefined') return false
  return window.isSecureContext || ['localhost', '127.0.0.1'].includes(window.location.hostname)
})

const scanSubtitle = computed(() => {
  if (!isSecureBrowserContext.value) {
    return '当前访问地址不是安全环境，浏览器可能禁用摄像头。可直接拍照识别二维码。'
  }
  return '优先调用后置摄像头，也支持拍照或从相册识别二维码'
})

const loadQrScanner = async () => {
  if (!qrScannerModulePromise) {
    qrScannerModulePromise = import('qr-scanner').then(module => module.default)
  }
  return qrScannerModulePromise
}

const mapScanError = error => {
  const rawMessage = String(error?.message || error || '')
  if (/permission|denied|notallowed/i.test(rawMessage)) {
    return '未获得摄像头权限，请允许访问摄像头或改用拍照识别。'
  }
  if (/https|secure|secure-context-required/i.test(rawMessage)) {
    return '当前地址不是 HTTPS 或安全上下文，浏览器禁用了摄像头。请改用拍照识别。'
  }
  if (/camera|notfound|device/i.test(rawMessage)) {
    return '当前浏览器无法直接打开摄像头，请改用拍照识别。'
  }
  return '摄像头启动失败，请改用拍照识别或手动输入。'
}

const handleDetected = rawValue => {
  if (hasDetected) return

  const roomCode = extractRoomCodeFromText(rawValue)
  if (!roomCode) {
    errorMessage.value = '识别到的内容不是房间二维码，请重试。'
    return
  }

  hasDetected = true
  stopScanner()
  visible.value = false
  emit('detected', roomCode)
}

const stopScanner = () => {
  starting.value = false
  if (scannerInstance) {
    scannerInstance.stop()
    scannerInstance.destroy()
    scannerInstance = null
  }
}

const startScanner = async () => {
  if (!visible.value || starting.value) return

  await nextTick()
  if (!videoRef.value || !overlayRef.value) return

  starting.value = true
  errorMessage.value = ''
  hasDetected = false

  try {
    if (!isSecureBrowserContext.value) {
      throw new Error('secure-context-required')
    }

    const QrScanner = await loadQrScanner()
    scannerInstance = new QrScanner(
      videoRef.value,
      result => handleDetected(result?.data || result),
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        overlay: overlayRef.value,
        returnDetailedScanResult: true,
        maxScansPerSecond: 10,
      },
    )
    await scannerInstance.start()
  } catch (error) {
    errorMessage.value = mapScanError(error)
    stopScanner()
  } finally {
    starting.value = false
  }
}

const pickImage = () => {
  fileInputRef.value?.click()
}

const pickCameraCapture = () => {
  cameraInputRef.value?.click()
}

const handleFileChange = async event => {
  const file = event.target.files?.[0]
  event.target.value = ''

  if (!file) return

  try {
    const QrScanner = await loadQrScanner()
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    })
    handleDetected(result?.data || result)
  } catch {
    showToast('未识别到可用的房间二维码')
  }
}

watch(
  () => visible.value,
  isVisible => {
    if (isVisible) {
      startScanner()
      return
    }

    stopScanner()
  },
)

onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
.scan-popup {
  padding: 18px 18px 22px;
  background:
    radial-gradient(circle at top left, var(--color-primary-bg, rgba(22, 163, 74, 0.08)), transparent 180px),
    var(--color-bg-white, #fff);
  border-radius: 24px;
}

.scan-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.scan-title {
  font-size: var(--font-size-xl, 20px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
}

.scan-subtitle {
  margin-top: 6px;
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #6B7280);
  line-height: 1.5;
}

.scan-close {
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #6B7280);
  font-size: var(--font-size-sm, 13px);
  padding: 4px 0;
}

.scan-viewfinder {
  position: relative;
  margin-top: 16px;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.08), rgba(17, 24, 39, 0.22)),
    #0f172a;
}

.scan-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.scan-frame {
  position: absolute;
  inset: 16%;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  box-shadow: 0 0 0 999px rgba(15, 23, 42, 0.26);
  pointer-events: none;
}

.scan-status {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text-primary, #1A1A1A);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: var(--font-size-sm, 13px);
  text-align: center;
}

.scan-status-error {
  color: var(--color-danger, #EF4444);
}

.scan-tips {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scan-tip-item {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-secondary, #6B7280);
  line-height: 1.5;
}

.scan-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.scan-file-input {
  display: none;
}
</style>
