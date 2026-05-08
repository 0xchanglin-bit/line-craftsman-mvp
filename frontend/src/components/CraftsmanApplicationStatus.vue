<template>
  <div class="min-h-screen bg-[#F2F2F7] font-ios flex flex-col">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div class="flex items-center px-2 h-11">
        <button class="flex items-center gap-0.5 text-[#007AFF] px-2 py-1.5" @click="$router.back()">
          <ChevronLeftIcon class="w-5 h-5 stroke-2" />
          返回
        </button>
        <h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">申請狀態</h1>
        <div class="w-20"></div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="spinner-ios"></div>
      <p class="text-[15px] text-gray-400">查詢中...</p>
    </div>

    <!-- 無申請記錄 -->
    <div v-else-if="!application" class="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
        <DocumentTextIcon class="w-10 h-10 text-gray-300" />
      </div>
      <p class="text-[20px] font-bold text-gray-900">尚未提交申請</p>
      <p class="text-[15px] text-gray-500 leading-relaxed">填寫認證申請表單，<br>開始接受案件媒合。</p>
      <button
        class="mt-2 w-full max-w-xs py-3.5 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold active:opacity-85"
        @click="$router.push('/craftsman/apply')"
      >立即申請</button>
    </div>

    <!-- 有申請狀態 -->
    <div v-else class="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">

      <!-- PENDING -->
      <template v-if="application.status === 'pending'">
        <div class="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
          <ClockIcon class="w-12 h-12 text-yellow-500" />
        </div>
        <h2 class="text-[26px] font-bold text-gray-900 mb-2">審核中</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed mb-6">
          你的申請已收到，我們將在 1–3 個工作日內完成審核。
          <br>審核結果會透過 LINE 通知你。
        </p>
        <div class="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left">
          <div class="flex items-center justify-between py-1">
            <span class="text-[14px] text-gray-500">申請時間</span>
            <span class="text-[14px] text-gray-900 font-medium">{{ formatDate(application.created_at) }}</span>
          </div>
          <div class="flex items-center justify-between py-1">
            <span class="text-[14px] text-gray-500">目前狀態</span>
            <span class="text-[14px] font-semibold text-yellow-600 bg-yellow-50 px-3 py-0.5 rounded-full">審核中</span>
          </div>
        </div>
        <button
          class="mt-6 text-[15px] text-[#007AFF] flex items-center gap-1.5"
          :disabled="isLoading"
          @click="loadStatus"
        >
          <ArrowPathIcon class="w-4 h-4" />
          重新整理
        </button>
      </template>

      <!-- APPROVED -->
      <template v-else-if="application.status === 'approved'">
        <div class="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckBadgeIcon class="w-12 h-12 text-green-500" />
        </div>
        <h2 class="text-[26px] font-bold text-gray-900 mb-2">恭喜！認證通過</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed mb-6">
          你已正式成為認證師傅，<br>開始接受案件媒合吧！
        </p>
        <div class="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left mb-6">
          <div class="flex items-center justify-between py-1">
            <span class="text-[14px] text-gray-500">通過時間</span>
            <span class="text-[14px] text-gray-900 font-medium">{{ formatDate(application.approved_at) }}</span>
          </div>
          <div class="flex items-center justify-between py-1">
            <span class="text-[14px] text-gray-500">狀態</span>
            <span class="text-[14px] font-semibold text-green-600 bg-green-50 px-3 py-0.5 rounded-full">已通過</span>
          </div>
        </div>
        <button
          class="w-full max-w-sm py-3.5 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold active:opacity-85"
          @click="$router.replace('/craftsman')"
        >進入師傅首頁</button>
      </template>

      <!-- REJECTED -->
      <template v-else-if="application.status === 'rejected'">
        <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <XCircleIcon class="w-12 h-12 text-red-500" />
        </div>
        <h2 class="text-[26px] font-bold text-gray-900 mb-2">申請未通過</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed mb-4">
          請查看原因並修改後重新提交。
        </p>
        <div class="w-full max-w-sm bg-red-50 border border-red-200 rounded-2xl p-4 text-left mb-6">
          <p class="text-[13px] font-semibold text-red-600 mb-1">拒絕原因</p>
          <p class="text-[14px] text-red-800 leading-relaxed">{{ application.rejection_reason || '請聯繫管理員' }}</p>
        </div>
        <button
          class="w-full max-w-sm py-3.5 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold active:opacity-85"
          @click="$router.push('/craftsman/apply')"
        >重新申請</button>
      </template>

      <!-- REVISION NEEDED -->
      <template v-else-if="application.status === 'revision_needed'">
        <div class="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <ExclamationTriangleIcon class="w-12 h-12 text-orange-500" />
        </div>
        <h2 class="text-[26px] font-bold text-gray-900 mb-2">需要補充資訊</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed mb-4">
          請根據以下說明補充資料後重新提交。
        </p>
        <div class="w-full max-w-sm bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left mb-6">
          <p class="text-[13px] font-semibold text-orange-600 mb-1">補充說明</p>
          <p class="text-[14px] text-orange-900 leading-relaxed">{{ application.rejection_reason || '請聯繫管理員' }}</p>
        </div>
        <button
          class="w-full max-w-sm py-3.5 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold active:opacity-85"
          @click="$router.push('/craftsman/apply')"
        >重新提交</button>
      </template>

    </div>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api.js';
import {
  ChevronLeftIcon,
  ClockIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';

export default {
  name: 'CraftsmanApplicationStatus',
  components: {
    ChevronLeftIcon, ClockIcon, CheckBadgeIcon, XCircleIcon,
    ExclamationTriangleIcon, DocumentTextIcon, ArrowPathIcon,
  },
  setup() {
    const router = useRouter();
    const application = ref(null);
    const isLoading   = ref(true);

    const loadStatus = async () => {
      isLoading.value = true;
      try {
        application.value = await api.get('/craftsman/application-status');
      } catch (err) {
        if (err.response?.status === 404) {
          application.value = null;
        }
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(loadStatus);

    function formatDate(str) {
      if (!str) return '—';
      const d = new Date(str);
      return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
    }

    return { application, isLoading, loadStatus, formatDate };
  },
};
</script>
