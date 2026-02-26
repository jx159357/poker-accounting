import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

// Vant 组件库
import 'vant/lib/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Vant)

// 初始化用户状态
const userStore = useUserStore()
if (!userStore.isLoggedIn) {
  userStore.initGuest()
}

app.mount('#app')
