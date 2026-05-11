import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { initLiff, isLoggedIn, loginWithLiff, getIdToken } from './utils/liff.js';

async function bootstrap() {
  console.log('[Bootstrap] 啟動應用');

  const liffId = import.meta.env.VITE_LIFF_ID;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  console.log('[ENV] LIFF ID:', liffId || '未設定');
  console.log('[ENV] API URL:', apiBaseUrl || '未設定');
  console.log('[ENV] Mode:', import.meta.env.MODE);

  if (!liffId || liffId === '你的_LIFF_ID') {
    console.error('[LIFF] LIFF ID 未設定');
    window.__liffInitError = 'LIFF ID 未設定';
  } else {
    try {
      console.log('[LIFF] 等待 SDK 載入...');

      await new Promise((resolve, reject) => {
        if (window.liff) {
          console.log('[LIFF] SDK 已存在');
          resolve();
          return;
        }

        const checkInterval = setInterval(() => {
          if (window.liff) {
            clearInterval(checkInterval);
            console.log('[LIFF] SDK 載入完成');
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('LIFF SDK 載入超時'));
        }, 5000);
      });

      console.log('[LIFF] 初始化中...');
      await initLiff(liffId);
      console.log('[LIFF] 初始化成功');

      const loggedIn = isLoggedIn();
      console.log('[LIFF] 登入狀態:', loggedIn);

      if (!loggedIn) {
        console.log('[LIFF] 未登入，執行登入');
        loginWithLiff();
        return;
      }

      const token = getIdToken();
      console.log('[LIFF] ID Token:', token ? '已取得' : '取得失敗');

      if (token) {
        localStorage.setItem('liff_token', token);
        console.log('[LIFF] Token 已儲存');
      }

    } catch (err) {
      console.error('[LIFF] 初始化失敗:', err);
      console.error('[LIFF] 錯誤類型:', err.name);
      console.error('[LIFF] 錯誤訊息:', err.message);
      window.__liffInitError = err.message;
    }
  }

  console.log('[Bootstrap] 掛載 Vue 應用');
  const app = createApp(App);
  app.use(router);
  app.mount('#app-root');
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] 啟動失敗:', err);
});
