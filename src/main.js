import { createApp } from 'vue'
import App from './App.vue'
import { accent } from './directives/accent.js'
import './styles/main.scss'

createApp(App).directive('accent', accent).mount('#app')
