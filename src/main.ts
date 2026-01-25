import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import '@/assets/styles/main.scss'
import { useRendererStore } from './stores/rendererStore'
import { useParticleStore } from './stores'

declare global {
	interface Window {
		__telemetry?: {
			getRendererMetrics: () => ReturnType<typeof useRendererStore>['metrics']['value']
			getPerformanceProfile: () => ReturnType<typeof useRendererStore>['performanceProfile']['value']
			getParticleStore: () => ReturnType<typeof useParticleStore>
		}
	}
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const rendererStore = useRendererStore(pinia)
const particleStore = useParticleStore(pinia)

if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
	window.__telemetry = {
		getRendererMetrics: () => ((rendererStore.metrics as any).value as any),
		getPerformanceProfile: () => ((rendererStore.performanceProfile as any).value as any),
		getParticleStore: () => particleStore,
	}
}

app.mount('#app')
