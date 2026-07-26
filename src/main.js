import { createApp } from 'vue'
import './style.css'
import './core/network/echo'
import './core/network/wsStatus'
import App from './App.vue'
import router from './router'

// Initialize theme from localStorage (defaulting to dark)
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
} else {
  document.body.classList.remove('dark-theme');
}


// Importación de componentes de UI globales
import AppButton from './components/ui/AppButton.vue'
import AppInput from './components/ui/AppInput.vue'
import AppSelect from './components/ui/AppSelect.vue'
import AppTooltip from './components/ui/AppTooltip.vue'
import AppModal from './components/ui/AppModal.vue'
import AppTable from './components/ui/AppTable.vue'

const app = createApp(App)

// Registro global de componentes de UI
app.component('AppButton', AppButton)
app.component('AppInput', AppInput)
app.component('AppSelect', AppSelect)
app.component('AppTooltip', AppTooltip)
app.component('AppModal', AppModal)
app.component('AppTable', AppTable)

app.use(router)
app.mount('#app')
