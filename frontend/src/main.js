import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import App from './App.vue'
import router from './router'

// Vant 样式
import 'vant/lib/index.css'
// 主题变量
import './assets/theme.css'
// 全局样式（含 Tailwind）
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Vant)
app.mount('#app')
