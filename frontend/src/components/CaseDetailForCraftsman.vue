<template>
  <div class="page">

    <!-- Navigation Bar -->
    <header class="navbar">
      <div class="navbar-inner">
        <button class="btn-back" @click="$router.replace('/craftsman')">
          <span class="back-chevron">‹</span> 首頁
        </button>
        <h1 class="nav-title">案件詳情</h1>
        <div class="spacer"></div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="state-area">
      <div class="spinner"></div>
      <p class="state-msg">載入中...</p>
    </div>

    <template v-else-if="caseData">

      <!-- 案件摘要 -->
      <div class="section-pad">
        <div class="case-card">
          <div class="case-hero">
            <span class="case-emoji">{{ skillEmoji(caseData.category) }}</span>
            <div class="case-hero-info">
              <div class="case-category">{{ caseData.category }}</div>
              <div class="case-location">📍 {{ caseData.location_area }}</div>
            </div>
            <span :class="['status-badge', caseData.status]">{{ statusLabel(caseData.status) }}</span>
          </div>

          <div class="meta-rows">
            <div v-if="caseData.budget_min && caseData.budget_max" class="meta-row">
              <span class="meta-key">預算</span>
              <span class="meta-val">{{ caseData.budget_min.toLocaleString() }} – {{ caseData.budget_max.toLocaleString() }} 元</span>
            </div>
            <div class="meta-row">
              <span class="meta-key">建立時間</span>
              <span class="meta-val">{{ formatDate(caseData.created_at) }}</span>
            </div>
          </div>

          <div class="case-desc-wrap">
            <p class="case-desc">{{ caseData.description }}</p>
          </div>
        </div>
      </div>

      <!-- 求助者資訊 -->
      <div class="section-pad">
        <p class="section-header">求助者資訊</p>

        <!-- 尚未聯絡 -->
        <div v-if="!contactInfo" class="empty-card">
          <div class="lock-icon">🔒</div>
          <p class="empty-title">聯絡資訊待解鎖</p>
          <p class="empty-sub">求助者主動聯繫你後，<br>聯絡方式將顯示於此</p>
        </div>

        <!-- 已有聯絡資訊 -->
        <template v-else>
          <div class="hint-banner">
            <span class="hint-icon">💡</span>
            <div class="hint-text">
              <p>請直接聯繫求助者協商報價與時間</p>
              <p>完成服務後請求對方給予評價</p>
            </div>
          </div>

          <!-- 電話 -->
          <div v-if="contactInfo.seeker_phone" class="contact-card">
            <p class="contact-label">電話號碼</p>
            <p class="contact-value">{{ contactInfo.seeker_phone }}</p>
            <div class="contact-actions">
              <button class="btn-action green" @click="callPhoneNumber(contactInfo.seeker_phone)">
                📞 直接撥號
              </button>
              <button class="btn-action ghost" @click="copyToClipboard(contactInfo.seeker_phone, '電話')">
                複製
              </button>
            </div>
          </div>

          <!-- LINE -->
          <div v-if="contactInfo.seeker_line_id && !contactInfo.seeker_line_id.startsWith('phone_')" class="contact-card">
            <p class="contact-label">LINE ID</p>
            <p class="contact-value">{{ contactInfo.seeker_line_id }}</p>
            <div class="contact-actions">
              <button class="btn-action line-green" @click="sendLineMessage(contactInfo.seeker_line_id)">
                💬 傳 LINE 訊息
              </button>
              <button class="btn-action ghost" @click="copyToClipboard(contactInfo.seeker_line_id, 'LINE ID')">
                複製
              </button>
            </div>
          </div>
        </template>
      </div>

    </template>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.show" :class="['toast', toast.type]">{{ toast.message }}</div>
    </transition>

  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api.js';

const SKILL_EMOJI = {
  '住宅水電': '💧', '管路工程': '🔧', '衛浴設備': '🚿', '熱水器': '♨️',
  '抓漏防水': '☔', '弱電工程': '📡', '空調冷氣': '❄️', '家電設備': '🏠',
  '工具材料': '🛠️', '能源系統': '☀️', '裝修工程': '🏗️',
};

export default {
  name: 'CaseDetailForCraftsman',
  setup() {
    const route  = useRoute();
    useRouter();

    const caseId     = route.params.id;
    const caseData   = ref(null);
    const contactInfo = ref(null);
    const isLoading  = ref(true);
    const toast = reactive({ show: false, type: 'success', message: '' });

    const loadCaseDetail = async () => {
      caseData.value = await api.get(`/cases/${caseId}`);
    };

    const loadContactInfo = async () => {
      try {
        const contacts = await api.get(`/case/${caseId}/contacts`);
        if (contacts && contacts.length > 0) {
          contactInfo.value = contacts[0];
        }
      } catch { /* 無聯絡資訊時不影響頁面 */ }
    };

    onMounted(async () => {
      try {
        await Promise.all([loadCaseDetail(), loadContactInfo()]);
      } catch (err) {
        showToast(err.message || '載入失敗', 'error');
      } finally {
        isLoading.value = false;
      }
    });

    const callPhoneNumber = (phone) => {
      window.location.href = `tel:${phone}`;
    };

    const sendLineMessage = (lineId) => {
      const isUserId = lineId.startsWith('U') && lineId.length === 33;
      window.location.href = isUserId
        ? `https://line.me/ti/p/${lineId}`
        : `line://open/direct?userIds=${lineId}`;
    };

    const copyToClipboard = (text, type) => {
      navigator.clipboard?.writeText(text)
        .then(() => showToast(`已複製${type}`, 'success'))
        .catch(() => showToast('複製失敗，請手動複製', 'error'));
    };

    function showToast(message, type = 'success') {
      Object.assign(toast, { show: true, type, message });
      setTimeout(() => { toast.show = false; }, 2500);
    }

    function statusLabel(s) {
      return { active: '進行中', matched: '已媒合', completed: '已完成', cancelled: '已取消' }[s] || s;
    }

    function skillEmoji(cat) { return SKILL_EMOJI[cat] || '🔨'; }

    function formatDate(str) {
      const d = new Date(str);
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    return {
      caseData, contactInfo, isLoading, toast,
      callPhoneNumber, sendLineMessage, copyToClipboard,
      statusLabel, skillEmoji, formatDate,
    };
  },
};
</script>

<style scoped>
.page {
  display: flex; flex-direction: column;
  min-height: 100vh; background: var(--gray6);
  padding-bottom: 2rem;
}

/* ── Navbar ── */
.navbar {
  position: sticky; top: 0; z-index: 20;
  background: rgba(242,242,247,.92);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid var(--sep);
}
.navbar-inner {
  display: flex; align-items: center;
  padding: 0 0.5rem; min-height: 44px;
}
.btn-back {
  display: flex; align-items: center; gap: 0.1rem;
  background: none; border: none;
  color: var(--blue); font-size: 1.0625rem;
  cursor: pointer; padding: 0.5rem;
}
.back-chevron { font-size: 1.5rem; line-height: 1; font-weight: 300; margin-top: -1px; }
.nav-title { flex: 1; text-align: center; font-size: 1.0625rem; font-weight: 600; }
.spacer { width: 64px; }

/* ── Section ── */
.section-pad { padding: 0.75rem 1rem; }
.section-header {
  font-size: 0.8125rem; color: var(--gray);
  text-transform: uppercase; letter-spacing: 0.03em;
  padding: 0 0.25rem 0.5rem;
}

/* ── Case card ── */
.case-card { background: var(--surface); border-radius: 14px; overflow: hidden; }

.case-hero {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 1rem; border-bottom: 0.5px solid var(--sep);
}
.case-emoji    { font-size: 2.25rem; line-height: 1; flex-shrink: 0; }
.case-hero-info { flex: 1; }
.case-category { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.2rem; }
.case-location { font-size: 0.875rem; color: var(--gray); }

.status-badge {
  font-size: 0.6875rem; font-weight: 600;
  padding: 0.2rem 0.55rem; border-radius: 20px; flex-shrink: 0;
}
.status-badge.active    { background: rgba(52,199,89,.12);  color: var(--green); }
.status-badge.matched   { background: rgba(0,122,255,.1);   color: var(--blue); }
.status-badge.completed { background: var(--fill);          color: var(--gray); }
.status-badge.cancelled { background: rgba(255,59,48,.1);   color: var(--red); }

.meta-rows { border-bottom: 0.5px solid var(--sep); }
.meta-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6875rem 1rem;
  border-bottom: 0.5px solid var(--sep);
}
.meta-row:last-child { border-bottom: none; }
.meta-key { font-size: 0.9375rem; color: var(--label); }
.meta-val { font-size: 0.9375rem; color: var(--gray); }

.case-desc-wrap { padding: 0.875rem 1rem; }
.case-desc { font-size: 0.9375rem; color: var(--label); line-height: 1.6; }

/* ── Empty card ── */
.empty-card {
  background: var(--surface); border-radius: 14px;
  padding: 2.5rem 1rem; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
}
.lock-icon   { font-size: 3rem; }
.empty-title { font-size: 1.0625rem; font-weight: 600; color: var(--label); }
.empty-sub   { font-size: 0.875rem; color: var(--gray); line-height: 1.5; }

/* ── Hint banner ── */
.hint-banner {
  display: flex; gap: 0.75rem; align-items: flex-start;
  background: rgba(255,149,0,.08);
  border: 1px solid rgba(255,149,0,.25);
  border-radius: 12px; padding: 0.875rem 1rem;
  margin-bottom: 0.75rem;
}
.hint-icon { font-size: 1.25rem; flex-shrink: 0; }
.hint-text { font-size: 0.875rem; color: #7a5a00; line-height: 1.5; display: flex; flex-direction: column; gap: 0.15rem; }

/* ── Contact card ── */
.contact-card {
  background: var(--surface); border-radius: 14px;
  padding: 1rem; margin-bottom: 0.75rem;
}
.contact-label { font-size: 0.75rem; color: var(--gray); font-weight: 500; margin-bottom: 0.3rem; }
.contact-value { font-size: 1.25rem; font-weight: 700; color: var(--label); margin-bottom: 0.75rem; }
.contact-actions { display: flex; gap: 0.5rem; }
.btn-action {
  flex: 1; padding: 0.75rem 0.5rem;
  border: none; border-radius: 10px;
  font-size: 0.9375rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.12s;
}
.btn-action:active { opacity: 0.8; }
.btn-action.green      { background: var(--green); color: #fff; }
.btn-action.line-green { background: #00B900; color: #fff; }
.btn-action.ghost      { background: var(--fill); color: var(--label2); flex: 0 0 auto; padding: 0.75rem 1rem; }

/* ── State area ── */
.state-area {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 4rem 0;
}
.state-msg { font-size: 0.9375rem; color: var(--gray); }

/* ── Toast ── */
.toast {
  position: fixed; top: 4rem; left: 50%; transform: translateX(-50%);
  z-index: 100; padding: 0.625rem 1.25rem;
  border-radius: 30px; font-size: 0.875rem; font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,.15); white-space: nowrap;
}
.toast.success { background: #1C1C1E; color: #fff; }
.toast.error   { background: var(--red); color: #fff; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }

/* ── Spinner ── */
.spinner {
  width: 28px; height: 28px;
  border: 2.5px solid var(--gray5); border-top-color: var(--blue);
  border-radius: 50%; animation: ios-spin 0.8s linear infinite;
}
</style>
