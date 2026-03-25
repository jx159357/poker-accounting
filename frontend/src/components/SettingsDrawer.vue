<template>
  <van-popup
    v-model:show="settingsStore.showDrawer"
    position="right"
    class="settings-popup"
    :style="{ width: '86%', maxWidth: '420px', height: '100%' }"
  >
    <div class="drawer-shell">
      <van-nav-bar title="界面设置" left-arrow @click-left="settingsStore.closeDrawer()" />

      <div class="drawer-body">
        <section class="settings-card">
          <div class="settings-title">字体大小</div>
          <div class="option-grid">
            <button
              v-for="option in settingsStore.fontScaleOptions"
              :key="option.key"
              type="button"
              class="option-chip"
              :class="{ 'option-chip-active': settingsStore.fontScale === option.key }"
              @click="settingsStore.setFontScale(option.key)"
            >
              <span class="option-label">{{ option.label }}</span>
              <span class="option-desc">{{ option.description }}</span>
            </button>
          </div>
        </section>

        <section class="settings-card">
          <div class="settings-title">主题颜色</div>
          <div class="theme-grid">
            <button
              v-for="theme in settingsStore.themeOptions"
              :key="theme.key"
              type="button"
              class="theme-chip"
              :class="{ 'theme-chip-active': settingsStore.theme === theme.key }"
              @click="settingsStore.setTheme(theme.key)"
            >
              <span
                class="theme-swatch"
                :style="{ background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})` }"
              />
              <span class="theme-name">{{ theme.label }}</span>
            </button>
          </div>
        </section>

        <section class="settings-card">
          <div class="settings-title">实时预览</div>
          <div class="preview-card">
            <div class="preview-header">
              <div>
                <div class="preview-title">移动端显示预览</div>
                <div class="preview-subtitle">修改后会立即应用到首页、统计和牌局页面</div>
              </div>
              <span class="preview-badge">+128</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">当前主题</span>
              <span class="preview-value">{{ activeThemeLabel }}</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">当前字号</span>
              <span class="preview-value">{{ activeFontScaleLabel }}</span>
            </div>
          </div>
        </section>

        <section class="settings-card">
          <div class="settings-title">快捷入口</div>
          <van-cell-group inset>
            <van-cell title="个人资料" is-link @click="goToProfile" />
            <van-cell title="恢复默认设置" @click="handleReset" />
            <van-cell
              v-if="!userStore.isGuest"
              title="退出登录"
              @click="handleLogout"
            />
          </van-cell-group>
        </section>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useSettingsStore } from '../stores/settings'
import { useUserStore } from '../stores/user'

const router = useRouter()
const settingsStore = useSettingsStore()
const userStore = useUserStore()

const activeThemeLabel = computed(() => {
  return settingsStore.themeOptions.find(theme => theme.key === settingsStore.theme)?.label || '牌桌绿'
})

const activeFontScaleLabel = computed(() => {
  return settingsStore.fontScaleOptions.find(option => option.key === settingsStore.fontScale)?.label || '默认'
})

const goToProfile = () => {
  settingsStore.closeDrawer()
  router.push('/profile')
}

const handleReset = () => {
  settingsStore.resetPreferences()
  showToast('已恢复默认设置')
}

const handleLogout = () => {
  userStore.logout()
  settingsStore.closeDrawer()
  showToast('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.settings-popup {
  background: var(--color-bg, #F0F2F5);
}

.drawer-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--color-primary-bg, rgba(22, 163, 74, 0.08)) 0, transparent 120px), var(--color-bg, #F0F2F5);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-sm);
  padding: 16px;
}

.settings-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  margin-bottom: 12px;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.option-chip,
.theme-chip {
  border: 1px solid var(--color-border, #E5E7EB);
  background: var(--color-bg-secondary, #F9FAFB);
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  transition: border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}

.option-chip:active,
.theme-chip:active {
  transform: scale(0.98);
}

.option-chip-active,
.theme-chip-active {
  border-color: var(--color-primary, #16A34A);
  box-shadow: 0 0 0 3px var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  background: #fff;
}

.option-label,
.theme-name {
  display: block;
  font-size: var(--font-size-md, 14px);
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
}

.option-desc {
  display: block;
  margin-top: 4px;
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.theme-chip {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-swatch {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  flex-shrink: 0;
}

.preview-card {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.98));
  border: 1px solid var(--color-border, #E5E7EB);
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.preview-title {
  font-size: calc(16px * var(--font-scale, 1));
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
}

.preview-subtitle {
  margin-top: 4px;
  font-size: calc(12px * var(--font-scale, 1));
  color: var(--color-text-secondary, #6B7280);
}

.preview-badge {
  background: var(--color-primary-bg, rgba(22, 163, 74, 0.08));
  color: var(--color-primary, #16A34A);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: calc(14px * var(--font-scale, 1));
  font-weight: 700;
}

.preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-bg-hover, #F3F4F6);
}

.preview-label {
  font-size: calc(13px * var(--font-scale, 1));
  color: var(--color-text-secondary, #6B7280);
}

.preview-value {
  font-size: calc(14px * var(--font-scale, 1));
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
}
</style>
