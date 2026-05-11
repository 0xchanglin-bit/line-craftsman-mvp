import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { initLiff, isLoggedIn, loginWithLiff } from './utils/liff.js';

async function bootstrap() {
  const liffId = import.meta.env.VITE_LIFF_ID;

  if (liffId) {
    try {
      console.log('[LIFF] 初始化中，LIFF ID:', liffId);
      await initLiff(liffId);
      console.log('[LIFF] 初始化成功');

      if (!isLoggedIn()) {
        console.log('[LIFF] 未登入，跳轉到 LINE 登入');
        loginWithLiff();
        return;
      }

      console.log('[LIFF] 已登入');
    } catch (err) {
      console.error('[LIFF] 初始化失敗:', err.message);
    }
  } else {
    console.warn('[LIFF] VITE_LIFF_ID 未設定，以瀏覽器模式運行');
  }

  const app = createApp(App);
  app.use(router);
  app.mount('#app');
}

bootstrap();
