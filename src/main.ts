import { createSSRApp } from 'vue'
import '@deepjs/uni-ccui/style/iconfont.css'
import '@/style/index.scss'

import App from './App.vue'
import mini from '@/utils/mini'
import fetch from '@/api/fetch'

export function createApp() {
  const app = createSSRApp(App)

  for (const key in mini) {
    app.config.globalProperties[`$${key}`] = mini[key]
  }

  // 先挂载到全局，再挂载到原型上
  for (const key in fetch) {
    app.config.globalProperties[`$${key}`] = fetch[key]
  }

  return {
    app,
  }
}
