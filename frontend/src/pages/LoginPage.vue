<template>
  <div class="login-page">
    <div class="logo">
      <h1>🔧 師傅協尋</h1>
      <p>快速找到可信賴的水電師傅</p>
    </div>

    <div v-if="loading" class="loading">正在驗證身份...</div>

    <div v-else class="actions">
      <button class="btn-line" @click="handleLogin">
        <span>使用 LINE 登入</span>
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  initLiff,
  isLoggedIn,
  loginWithLiff,
  getUserProfile,
} from "@/utils/liff.js";
import auth from "@/stores/auth.js";

const router = useRouter();
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  const liffId = import.meta.env.VITE_LIFF_ID;

  try {
    if (liffId && liffId !== "你的_LIFF_ID") {
      await initLiff(liffId);

      if (isLoggedIn()) {
        const profile = await getUserProfile();
        await auth.login(profile.userId, profile.displayName);
        redirectByRole();
        return;
      }
    }
  } catch (err) {
    error.value = "初始化失敗：" + err.message;
  } finally {
    loading.value = false;
  }
  // 檢查 URL 參數，如果有 code 說明是登入回調
  const params = new URLSearchParams(window.location.search);
  if (params.get("code")) {
    // 自動觸發登入
    handleLogin();
  }
});

function redirectByRole() {
  const role = auth.state.user?.role;
  router.replace(role === "craftsman" ? "/craftsman" : "/seeker");
}

async function handleLogin() {
  const liffId = import.meta.env.VITE_LIFF_ID;
  if (liffId && liffId !== "你的_LIFF_ID") {
    loginWithLiff();
  } else {
    error.value = "請先設定 VITE_LIFF_ID";
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #06c755 0%, #04a244 100%);
  color: white;
}
.logo {
  text-align: center;
  margin-bottom: 3rem;
}
.logo h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.logo p {
  opacity: 0.85;
  font-size: 1rem;
}
.btn-line {
  background: white;
  color: #06c755;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
}
.loading {
  font-size: 1rem;
  opacity: 0.85;
}
.error {
  margin-top: 1rem;
  color: #ffcccc;
  font-size: 0.9rem;
}
</style>
