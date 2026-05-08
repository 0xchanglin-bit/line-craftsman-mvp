import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { initLiff, isLoggedIn, loginWithLiff } from './utils/liff.js';

async function bootstrap() {
  const liffId = import.meta.env.VITE_LIFF_ID;

  if (liffId && liffId !== '你的_LIFF_ID') {
    try {
      await initLiff(liffId);
      if (!isLoggedIn()) {
        loginWithLiff();
        return;
      }
    } catch (err) {
      console.warn('[LIFF] init failed, running in browser mode:', err.message);
    }
  }

  const app = createApp(App);
  app.use(router);
  app.mount('#app');
}

bootstrap();
