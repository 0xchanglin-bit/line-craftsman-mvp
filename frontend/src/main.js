import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';

async function waitForLiffSdk(timeoutMs = 5000) {
  if (window.liff) return;
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (window.liff) { clearInterval(timer); resolve(); }
    }, 100);
    setTimeout(() => {
      clearInterval(timer);
      reject(new Error('LIFF SDK 載入逾時'));
    }, timeoutMs);
  });
}

async function bootstrap() {
  const liffId = import.meta.env.VITE_LIFF_ID;

  if (liffId) {
    try {
      console.log('[LIFF] 等待 SDK 載入...');
      await waitForLiffSdk();
      console.log('[LIFF] 初始化中，LIFF ID:', liffId);

      await window.liff.init({
        liffId,
        withLoginOnIssuedAccessToken: true,
      });

      console.log('[LIFF] 初始化成功');

      if (!window.liff.isLoggedIn()) {
        console.log('[LIFF] 未登入，跳轉 LINE 登入');
        window.liff.login();
        return;
      }

      console.log('[LIFF] 已登入');
    } catch (err) {
      console.error('[LIFF] 初始化失敗:', err);
      window.__liffInitError = err.message;
    }
  } else {
    console.warn('[LIFF] VITE_LIFF_ID 未設定，以瀏覽器模式運行');
  }

  const app = createApp(App);
  app.use(router);
  app.mount('#app-root');
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] 啟動失敗:', err);
});
