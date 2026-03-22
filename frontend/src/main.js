import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import './style.css'

// Vant 组件
import {
  Button,
  NavBar,
  Tabbar,
  TabbarItem,
  Field,
  CellGroup,
  Cell,
  Form,
  Icon,
  Toast,
  Dialog,
  Loading,
  Empty,
  Tag,
  Popup,
  Image as VanImage,
  Picker,
  ActionSheet,
  Checkbox,
  Progress
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 注册 Vant 组件
app.use(Button)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Field)
app.use(CellGroup)
app.use(Cell)
app.use(Form)
app.use(Icon)
app.use(Toast)
app.use(Dialog)
app.use(Loading)
app.use(Empty)
app.use(Tag)
app.use(Popup)
app.use(VanImage)
app.use(Picker)
app.use(ActionSheet)
app.use(Checkbox)
app.use(Progress)

app.mount('#app')
