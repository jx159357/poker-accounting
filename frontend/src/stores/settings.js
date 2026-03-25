import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'app_settings_v1'
const DEFAULT_THEME = 'table-green'
const DEFAULT_FONT_SCALE = 'default'

const themeOptions = [
  {
    key: 'table-green',
    label: '牌桌绿',
    description: '清爽稳定，适合长时间记账',
    preview: ['#1F9D55', '#157347'],
    variables: {
      '--color-primary': '#1F9D55',
      '--color-primary-light': '#38B26D',
      '--color-primary-dark': '#157347',
      '--color-primary-bg': 'rgba(31, 157, 85, 0.08)',
      '--van-primary-color': '#1F9D55',
      '--van-primary-color-dark': '#157347',
      '--van-primary-color-light': '#38B26D',
      '--van-button-primary-background': '#1F9D55',
      '--van-button-primary-border-color': '#1F9D55',
      '--van-tabbar-item-active-color': '#1F9D55',
    },
  },
  {
    key: 'sea-blue',
    label: '海雾蓝',
    description: '更安静，适合理性的视觉风格',
    preview: ['#2C6E9F', '#1F5378'],
    variables: {
      '--color-primary': '#2C6E9F',
      '--color-primary-light': '#4E89B5',
      '--color-primary-dark': '#1F5378',
      '--color-primary-bg': 'rgba(44, 110, 159, 0.08)',
      '--van-primary-color': '#2C6E9F',
      '--van-primary-color-dark': '#1F5378',
      '--van-primary-color-light': '#4E89B5',
      '--van-button-primary-background': '#2C6E9F',
      '--van-button-primary-border-color': '#2C6E9F',
      '--van-tabbar-item-active-color': '#2C6E9F',
    },
  },
  {
    key: 'warm-sand',
    label: '暖砂橙',
    description: '更柔和，适合生活化的氛围',
    preview: ['#C9834A', '#A86436'],
    variables: {
      '--color-primary': '#C9834A',
      '--color-primary-light': '#D79B69',
      '--color-primary-dark': '#A86436',
      '--color-primary-bg': 'rgba(201, 131, 74, 0.08)',
      '--van-primary-color': '#C9834A',
      '--van-primary-color-dark': '#A86436',
      '--van-primary-color-light': '#D79B69',
      '--van-button-primary-background': '#C9834A',
      '--van-button-primary-border-color': '#C9834A',
      '--van-tabbar-item-active-color': '#C9834A',
    },
  },
  {
    key: 'ink-slate',
    label: '雾岩灰',
    description: '低调克制，适合信息密度较高的页面',
    preview: ['#5B6574', '#404854'],
    variables: {
      '--color-primary': '#5B6574',
      '--color-primary-light': '#7A8698',
      '--color-primary-dark': '#404854',
      '--color-primary-bg': 'rgba(91, 101, 116, 0.08)',
      '--van-primary-color': '#5B6574',
      '--van-primary-color-dark': '#404854',
      '--van-primary-color-light': '#7A8698',
      '--van-button-primary-background': '#5B6574',
      '--van-button-primary-border-color': '#5B6574',
      '--van-tabbar-item-active-color': '#5B6574',
    },
  },
]

const fontScaleOptions = [
  { key: 'small', label: '小', scale: 0.92, description: '更紧凑' },
  { key: 'default', label: '默认', scale: 1, description: '平衡显示' },
  { key: 'large', label: '大', scale: 1.1, description: '更清晰' },
  { key: 'xlarge', label: '超大', scale: 1.18, description: '优先可读性' },
]

const themeMap = Object.fromEntries(themeOptions.map(theme => [theme.key, theme]))
const fontScaleMap = Object.fromEntries(fontScaleOptions.map(option => [option.key, option]))

export const useSettingsStore = defineStore('settings', () => {
  const initialized = ref(false)
  const showDrawer = ref(false)
  const theme = ref(DEFAULT_THEME)
  const fontScale = ref(DEFAULT_FONT_SCALE)

  const persist = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: theme.value,
        fontScale: fontScale.value,
      }),
    )
  }

  const applyPreferences = () => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const activeTheme = themeMap[theme.value] || themeMap[DEFAULT_THEME]
    const activeFontScale = fontScaleMap[fontScale.value] || fontScaleMap[DEFAULT_FONT_SCALE]

    root.style.setProperty('--font-scale', String(activeFontScale.scale))

    Object.entries(activeTheme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  const init = () => {
    if (initialized.value) return

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (saved.theme && themeMap[saved.theme]) {
        theme.value = saved.theme
      }
      if (saved.fontScale && fontScaleMap[saved.fontScale]) {
        fontScale.value = saved.fontScale
      }
    } catch {
      // ignore malformed local storage
    }

    applyPreferences()
    initialized.value = true
  }

  const setTheme = (nextTheme) => {
    theme.value = themeMap[nextTheme] ? nextTheme : DEFAULT_THEME
    applyPreferences()
    persist()
  }

  const setFontScale = (nextFontScale) => {
    fontScale.value = fontScaleMap[nextFontScale] ? nextFontScale : DEFAULT_FONT_SCALE
    applyPreferences()
    persist()
  }

  const resetPreferences = () => {
    theme.value = DEFAULT_THEME
    fontScale.value = DEFAULT_FONT_SCALE
    applyPreferences()
    persist()
  }

  const openDrawer = () => {
    showDrawer.value = true
  }

  const closeDrawer = () => {
    showDrawer.value = false
  }

  return {
    initialized,
    showDrawer,
    theme,
    fontScale,
    themeOptions,
    fontScaleOptions,
    init,
    setTheme,
    setFontScale,
    resetPreferences,
    openDrawer,
    closeDrawer,
  }
})
