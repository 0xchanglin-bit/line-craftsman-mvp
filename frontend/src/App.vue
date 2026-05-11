<template>
  <div id="app-root">
    <div v-if="liffInitError" class="fixed inset-0 bg-red-50 flex items-center justify-center z-50 p-6">
      <div class="bg-white rounded-2xl p-6 text-center shadow-lg max-w-sm w-full">
        <p class="text-red-500 font-bold text-lg mb-2">LIFF 初始化失敗</p>
        <p class="text-sm text-gray-500 mb-4">{{ liffInitError }}</p>
        <button
          class="w-full py-3 bg-[#007AFF] text-white rounded-xl font-semibold"
          @click="() => location.reload()"
        >重新載入</button>
      </div>
    </div>

    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const liffInitError = ref('');

onMounted(() => {
  if (window.__liffInitError) {
    liffInitError.value = window.__liffInitError;
  }
  console.log('[App] 已掛載，LIFF 登入狀態:', window.liff?.isLoggedIn?.() ?? 'N/A');
});
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  background: #F2F2F7;
  color: #000;
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app-root { min-height: 100vh; }

/* iOS safe-area helpers */
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }

/* Global spinner */
@keyframes ios-spin { to { transform: rotate(360deg); } }
.spinner-ios {
  width: 28px; height: 28px;
  border: 2.5px solid #E5E5EA;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: ios-spin 0.8s linear infinite;
}
.spinner-sm-ios {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ios-spin 0.8s linear infinite;
}
</style>
