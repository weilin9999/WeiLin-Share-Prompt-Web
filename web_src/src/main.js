import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import MainView from './views/main.vue'

const router = createRouter({
  //history: createWebHistory(),
  routes: [
    { path: '/', component: MainView }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
