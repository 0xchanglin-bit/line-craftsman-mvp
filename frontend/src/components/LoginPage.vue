<template>
  <div class="login-wrapper">

    <!-- 已登入或跳轉中 -->
    <div v-if="isAuthenticated" class="state-screen">
      <div class="spinner"></div>
      <p class="state-msg">正在載入...</p>
    </div>

    <!-- 非 LINE 環境 -->
    <div v-else-if="!isInLiff && liffReady" class="state-screen">
      <p class="state-icon">📱</p>
      <p class="state-title">請在 LINE 中開啟</p>
      <p class="state-msg">此連結需在 LINE App 中使用</p>
    </div>

    <!-- 登入頁 -->
    <div v-else class="login-page">

      <div class="hero">
        <div class="app-icon">🔨</div>
        <h1 class="app-name">師傅協尋</h1>
        <p class="app-desc">快速找到可信賴的專業師傅<br>解決您的水電問題</p>
      </div>

      <div class="feature-list">
        <div class="feature-row">
          <span class="feature-icon-wrap blue"><span>⚡</span></span>
          <div class="feature-text">
            <span class="feature-title">快速媒合</span>
            <span class="feature-sub">即時配對附近師傅</span>
          </div>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-row">
          <span class="feature-icon-wrap green"><span>✓</span></span>
          <div class="feature-text">
            <span class="feature-title">專業認證</span>
            <span class="feature-sub">師傅均經過資格審核</span>
          </div>
        </div>
        <div class="feature-divider"></div>
        <div class="feature-row">
          <span class="feature-icon-wrap orange"><span>★</span></span>
          <div class="feature-text">
            <span class="feature-title">評分保障</span>
            <span class="feature-sub">完工後評價，品質有保障</span>
          </div>
        </div>
      </div>

      <div class="action-area">
        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

        <button
          class="btn-login"
          :disabled="isLoading || !liffReady"
          @click="handleLogin"
        >
          <span v-if="isLoading" class="spinner-sm"></span>
          <span v-else>使用 LINE 登入</span>
        </button>

        <button v-if="errorMessage" class="btn-retry" @click="handleLogin">重試</button>

        <p class="legal-hint">登入即表示同意服務條款與隱私政策</p>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { initLiff, getUserProfile, isInLiff as checkInLiff, isLoggedIn } from '@/utils/liff.js';
import api from '@/utils/api.js';
import { useAuth } from '@/stores/auth.js';

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter();
    const auth = useAuth();

    const isInLiff = ref(false);
    const isLoading = ref(false);
    const isAuthenticated = ref(false);
    const errorMessage = ref('');
    const liffReady = ref(false);

    onMounted(async () => {
      if (auth.isAuthenticated) {
        isAuthenticated.value = true;
        redirectByRole();
        return;
      }

      const liffId = import.meta.env.VITE_LIFF_ID;
      if (!liffId || liffId === '你的_LIFF_ID') {
        liffReady.value = true;
        isInLiff.value = true;
        return;
      }

      try {
        await initLiff(liffId);
        liffReady.value = true;
        isInLiff.value = checkInLiff();

        if (isLoggedIn()) {
          await checkAuth();
        }
      } catch (err) {
        errorMessage.value = '無法初始化 LIFF：' + err.message;
        liffReady.value = true;
      }
    });

    async function checkAuth() {
      try {
        const profile = await getUserProfile();
        await doLogin(profile);
      } catch (err) {
        errorMessage.value = err.message;
      }
    }

    async function doLogin(profile) {
      const data = await api.post('/auth/login', {
        lineUserId: profile.userId,
        displayName: profile.displayName,
      });
      auth.setToken(data.token);
      auth.setUser(data.user);
      isAuthenticated.value = true;
      redirectByRole();
    }

    function redirectByRole() {
      router.replace('/role-selection');
    }

    const handleLogin = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      errorMessage.value = '';

      try {
        const liffId = import.meta.env.VITE_LIFF_ID;

        if (!liffId || liffId === '你的_LIFF_ID') {
          errorMessage.value = '請先在 .env 設定 VITE_LIFF_ID';
          return;
        }

        if (!isLoggedIn()) {
          import('@/utils/liff.js').then(({ loginWithLiff }) => loginWithLiff());
          return;
        }

        const profile = await getUserProfile();
        await doLogin(profile);
      } catch (err) {
        errorMessage.value = err.message || '登入失敗，請再試一次';
      } finally {
        isLoading.value = false;
      }
    };

    return {
      isInLiff,
      isLoading,
      isAuthenticated,
      errorMessage,
      liffReady,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
}

/* ── State screens ── */
.state-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
}
.state-icon  { font-size: 3.5rem; }
.state-title { font-size: 1.1rem; font-weight: 600; color: var(--label); }
.state-msg   { font-size: 0.9rem; color: var(--gray); text-align: center; }

/* ── Login page ── */
.login-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 0 2rem;
}

/* ── Hero ── */
.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem 2rem;
  text-align: center;
}
.app-icon {
  width: 88px; height: 88px;
  background: linear-gradient(145deg, #1a73e8, #007AFF);
  border-radius: 22px;
  font-size: 2.75rem;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 8px 24px rgba(0,122,255,.3);
}
.app-name {
  font-size: 2rem; font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--label);
  margin-bottom: 0.5rem;
}
.app-desc {
  font-size: 0.9375rem; color: var(--gray);
  line-height: 1.55;
}

/* ── Feature list (inset grouped) ── */
.feature-list {
  margin: 0 1rem 1.75rem;
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--sep);
  overflow: hidden;
}
.feature-row {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1rem;
}
.feature-divider {
  height: 0.5px; background: var(--sep);
  margin-left: calc(2.25rem + 0.875rem + 1rem);
}
.feature-icon-wrap {
  width: 2.25rem; height: 2.25rem; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.feature-icon-wrap.blue   { background: var(--blue); }
.feature-icon-wrap.green  { background: var(--green); }
.feature-icon-wrap.orange { background: var(--orange); }
.feature-text {
  display: flex; flex-direction: column; gap: 0.1rem;
}
.feature-title { font-size: 0.9375rem; font-weight: 600; color: var(--label); }
.feature-sub   { font-size: 0.8125rem; color: var(--gray); }

/* ── Action area ── */
.action-area {
  display: flex; flex-direction: column; gap: 0.75rem;
  padding: 0 1rem;
}

.error-banner {
  background: rgba(255,59,48,.08);
  color: var(--red);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  text-align: center;
  line-height: 1.45;
}

.btn-login {
  width: 100%;
  padding: 0.9375rem;
  background: var(--blue);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  transition: opacity 0.15s;
}
.btn-login:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-login:active   { opacity: 0.85; }

.btn-retry {
  width: 100%;
  padding: 0.875rem;
  background: transparent;
  color: var(--blue);
  border: 1.5px solid var(--blue);
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.legal-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--gray2);
}

/* ── Spinner ── */
.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--gray5);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: ios-spin 0.8s linear infinite;
}
.spinner-sm {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ios-spin 0.8s linear infinite;
}
</style>
