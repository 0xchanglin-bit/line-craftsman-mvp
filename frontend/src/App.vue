<template>
  <div id="app-root">
    <router-view />
  </div>
</template>

<script setup>
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
