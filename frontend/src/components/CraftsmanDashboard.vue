<template>
  <div class="min-h-screen bg-[#F2F2F7] font-ios pb-20">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div class="flex items-center justify-between px-4 h-11">
        <h1 class="text-[17px] font-semibold text-gray-900">師傅中心</h1>
        <div class="flex items-center gap-3">
          <button class="text-[15px] text-gray-400" @click="switchRole">切換身份</button>
        </div>
      </div>
    </header>

    <!-- ── 申請狀態載入中 ── -->
    <div v-if="loadingStatus" class="flex-1 flex flex-col items-center justify-center py-32 gap-4">
      <div class="spinner-ios"></div>
      <p class="text-[15px] text-gray-400">載入中...</p>
    </div>

    <!-- ── 尚未申請 ── -->
    <div
      v-else-if="applicationStatus === 'none'"
      class="flex flex-col items-center justify-center px-8 py-20 text-center gap-5"
    >
      <div class="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
        <WrenchScrewdriverIcon class="w-12 h-12 text-[#007AFF]" />
      </div>
      <div>
        <h2 class="text-[24px] font-bold text-gray-900 mb-2">成為師傅，開始賺取報酬</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed">填寫基本資訊並通過驗證，<br>即可開始接案</p>
      </div>
      <button
        class="w-full max-w-xs px-8 py-4 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold active:opacity-85"
        @click="applyNow"
      >申請成為師傅</button>
    </div>

    <!-- ── 審核中 ── -->
    <div
      v-else-if="applicationStatus === 'pending'"
      class="flex flex-col items-center justify-center px-8 py-20 text-center gap-5"
    >
      <div class="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center">
        <ClockIcon class="w-12 h-12 text-yellow-500" />
      </div>
      <div>
        <h2 class="text-[24px] font-bold text-gray-900 mb-2">申請審核中</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed">你的申請正在審核中，<br>預計 1–3 個工作日完成</p>
      </div>
      <button
        class="px-6 py-3 bg-white border border-gray-200 text-[#007AFF] rounded-2xl text-[15px] font-semibold shadow-sm active:opacity-85"
        @click="checkStatus"
      >查看申請狀態</button>
    </div>

    <!-- ── 已拒絕 ── -->
    <div
      v-else-if="applicationStatus === 'rejected'"
      class="flex flex-col items-center justify-center px-8 py-20 text-center gap-5"
    >
      <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
        <XCircleIcon class="w-12 h-12 text-red-500" />
      </div>
      <div>
        <h2 class="text-[24px] font-bold text-gray-900 mb-2">申請未通過</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed">你的申請未通過審核</p>
      </div>
      <div v-if="applicationData?.rejection_reason" class="w-full max-w-sm bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
        <p class="text-[13px] font-semibold text-red-600 mb-1">拒絕原因</p>
        <p class="text-[14px] text-red-800 leading-relaxed">{{ applicationData.rejection_reason }}</p>
      </div>
      <button
        class="w-full max-w-xs px-8 py-4 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold active:opacity-85"
        @click="applyNow"
      >重新申請</button>
    </div>

    <!-- ── 需補充資訊 ── -->
    <div
      v-else-if="applicationStatus === 'revision_needed'"
      class="flex flex-col items-center justify-center px-8 py-20 text-center gap-5"
    >
      <div class="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
        <ExclamationTriangleIcon class="w-12 h-12 text-orange-500" />
      </div>
      <div>
        <h2 class="text-[24px] font-bold text-gray-900 mb-2">需要補充資訊</h2>
        <p class="text-[15px] text-gray-500 leading-relaxed">請根據說明補充資料後重新提交</p>
      </div>
      <div v-if="applicationData?.rejection_reason" class="w-full max-w-sm bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left">
        <p class="text-[13px] font-semibold text-orange-600 mb-1">補充說明</p>
        <p class="text-[14px] text-orange-900 leading-relaxed">{{ applicationData.rejection_reason }}</p>
      </div>
      <p class="text-[13px] text-gray-400">請在 7 天內補充並重新提交</p>
      <button
        class="w-full max-w-xs px-8 py-4 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold active:opacity-85"
        @click="applyNow"
      >重新申請</button>
    </div>

    <!-- ── 已通過：師傅主頁 ── -->
    <main v-else-if="applicationStatus === 'approved'" class="px-4 pt-4 space-y-4">

      <!-- 歡迎 -->
      <div>
        <p class="text-[28px] font-bold tracking-tight text-gray-900">你好，{{ craftsmanName }}</p>
        <p class="text-[15px] text-gray-400 mt-0.5">查看你的接案資訊</p>
      </div>

      <!-- 評分卡片 -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-start gap-4">
          <!-- 左側大分數 -->
          <div class="flex flex-col items-center min-w-[72px]">
            <p class="text-[40px] font-bold text-orange-400 leading-none">{{ averageRating.toFixed(1) }}</p>
            <div class="flex gap-0.5 my-1">
              <StarIcon
                v-for="n in 5" :key="n"
                :class="['w-4 h-4', n <= Math.round(averageRating) ? 'text-orange-400' : 'text-gray-200']"
              />
            </div>
            <p class="text-[11px] text-gray-400 text-center">{{ totalReviews }} 個評價</p>
          </div>

          <!-- 右側 bar chart -->
          <div class="flex-1 space-y-1.5">
            <div v-for="n in [5,4,3,2,1]" :key="n" class="flex items-center gap-2">
              <span class="text-[11px] text-gray-400 w-3 text-right">{{ n }}</span>
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-orange-400 rounded-full transition-all duration-500"
                  :style="{ width: barWidth(n) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 推薦案件 -->
      <div>
        <div class="flex items-center justify-between mb-2 px-1">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">
            推薦案件
            <span v-if="recommendedCases.length > 0" class="text-[#007AFF]">{{ recommendedCases.length }}</span>
          </p>
          <button
            class="text-[13px] text-[#007AFF] flex items-center gap-1"
            :disabled="isLoading"
            @click="loadRecommendedCases"
          >
            <ArrowPathIcon class="w-3.5 h-3.5" />
            刷新
          </button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-10">
          <div class="spinner-ios"></div>
        </div>

        <!-- 有案件 -->
        <div v-else-if="recommendedCases.length > 0" class="space-y-3">
          <div
            v-for="c in recommendedCases" :key="c.id"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div class="p-4">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <WrenchIcon class="w-5 h-5 text-[#007AFF]" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[15px] font-semibold text-gray-900">{{ c.category }}</p>
                  <p class="text-[12px] text-gray-400 flex items-center gap-1">
                    <MapPinIcon class="w-3 h-3" />{{ c.location_area }}
                  </p>
                </div>
                <span v-if="c.budget_min" class="text-[12px] text-gray-400 flex-shrink-0">
                  {{ c.budget_min.toLocaleString() }}–{{ c.budget_max?.toLocaleString() }} 元
                </span>
              </div>
              <p class="text-[13px] text-gray-500 line-clamp-2">{{ c.description }}</p>
            </div>
            <div class="border-t border-gray-100">
              <button
                class="w-full py-2.5 text-[14px] font-semibold text-[#007AFF] active:bg-blue-50 transition-colors"
                @click="goToCaseDetail(c.id)"
              >查看詳情</button>
            </div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-3 text-center">
          <BellAlertIcon class="w-14 h-14 text-gray-200" />
          <p class="text-[16px] font-semibold text-gray-700">暫時沒有符合的案件</p>
          <p class="text-[13px] text-gray-400 leading-relaxed">案件將透過 LINE 即時推播給你<br>編輯技能可提升媒合機率</p>
          <button
            class="mt-1 px-5 py-2 bg-blue-50 text-[#007AFF] rounded-xl text-[14px] font-semibold"
            @click="goToEditSkills"
          >編輯我的技能</button>
        </div>
      </div>

      <!-- 最近評價 -->
      <div v-if="reviews.length > 0">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">最近評價</p>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div v-for="(r, i) in reviews.slice(0, 3)" :key="r.id">
            <div class="p-4">
              <div class="flex items-center gap-2 mb-1">
                <div class="flex gap-0.5">
                  <StarIcon
                    v-for="n in 5" :key="n"
                    :class="['w-3.5 h-3.5', n <= r.score ? 'text-orange-400' : 'text-gray-200']"
                  />
                </div>
                <span class="text-[13px] font-semibold text-gray-700">{{ r.score }} 分</span>
                <span class="text-[11px] text-gray-300 ml-auto">{{ shortDate(r.created_at) }}</span>
              </div>
              <p v-if="r.comment" class="text-[13px] text-gray-600 leading-relaxed">「{{ r.comment }}」</p>
              <p class="text-[11px] text-gray-300 mt-1">{{ r.case_category }} · {{ r.location_area }}</p>
            </div>
            <div v-if="i < Math.min(reviews.length, 3) - 1" class="h-px bg-gray-100 mx-4"></div>
          </div>
        </div>
      </div>

    </main>

    <!-- Toast -->
    <transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition-all duration-200"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="toast.show"
        :class="[
          'fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white text-[14px] font-semibold shadow-lg whitespace-nowrap',
          toast.type === 'error' ? 'bg-red-500' : 'bg-gray-900'
        ]"
      >{{ toast.message }}</div>
    </transition>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/90 backdrop-blur border-t border-gray-100 flex h-16 safe-bottom z-20">
      <button class="flex-1 flex flex-col items-center justify-center gap-0.5">
        <HomeIcon class="w-6 h-6 text-[#007AFF]" />
        <span class="text-[10px] font-medium text-[#007AFF]">首頁</span>
      </button>
      <button class="flex-1 flex flex-col items-center justify-center gap-0.5" @click="loadRecommendedCases">
        <BriefcaseIcon class="w-6 h-6 text-gray-400" />
        <span class="text-[10px] font-medium text-gray-400">案件</span>
      </button>
      <button class="flex-1 flex flex-col items-center justify-center gap-0.5" @click="goToEditSkills">
        <Cog6ToothIcon class="w-6 h-6 text-gray-400" />
        <span class="text-[10px] font-medium text-gray-400">設定</span>
      </button>
      <button class="flex-1 flex flex-col items-center justify-center gap-0.5">
        <StarIcon class="w-6 h-6 text-gray-400" />
        <span class="text-[10px] font-medium text-gray-400">評價</span>
      </button>
    </nav>

  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api.js';
import { useAuth } from '@/stores/auth.js';
import {
  HomeIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  StarIcon,
  WrenchIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  ArrowPathIcon,
  BellAlertIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

export default {
  name: 'CraftsmanDashboard',
  components: {
    HomeIcon, BriefcaseIcon, Cog6ToothIcon, StarIcon,
    WrenchIcon, WrenchScrewdriverIcon, MapPinIcon, ArrowPathIcon, BellAlertIcon,
    ClockIcon, XCircleIcon, ExclamationTriangleIcon,
  },
  setup() {
    const router = useRouter();
    const auth   = useAuth();

    const craftsmanName      = computed(() => auth.state.user?.name || '師傅');
    const craftsmanId        = ref(auth.state.user?.craftsman_id || null);
    const averageRating      = ref(0);
    const totalReviews       = ref(0);
    const ratingDistribution = ref({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    const reviews            = ref([]);
    const recommendedCases   = ref([]);
    const isLoading          = ref(false);
    const toast = reactive({ show: false, type: 'success', message: '' });

    // Application status gating
    const loadingStatus     = ref(true);
    const applicationStatus = ref('none');   // 'none' | 'pending' | 'approved' | 'rejected' | 'revision_needed'
    const applicationData   = ref(null);

    const loadApplicationStatus = async () => {
      loadingStatus.value = true;
      try {
        const data = await api.get('/craftsman/application-status');
        applicationStatus.value = data.status;
        applicationData.value   = data;
      } catch (err) {
        if (err.response?.status === 404) {
          applicationStatus.value = 'none';
        } else {
          applicationStatus.value = 'none';
        }
      } finally {
        loadingStatus.value = false;
      }
    };

    const loadRatingInfo = async () => {
      if (!craftsmanId.value) return;
      try {
        const data = await api.get(`/craftsman/${craftsmanId.value}/ratings`);
        averageRating.value      = data.average_rating ?? 0;
        totalReviews.value       = data.total_reviews  ?? 0;
        ratingDistribution.value = data.rating_distribution ?? { 5:0, 4:0, 3:0, 2:0, 1:0 };
        reviews.value            = data.reviews ?? [];
      } catch { /* 評分資料不影響主流程 */ }
    };

    const loadRecommendedCases = async () => {
      isLoading.value = true;
      try {
        recommendedCases.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(async () => {
      await loadApplicationStatus();
      if (applicationStatus.value === 'approved') {
        await Promise.all([loadRatingInfo(), loadRecommendedCases()]);
      }
    });

    function barWidth(n) {
      if (!totalReviews.value) return 0;
      return Math.round((ratingDistribution.value[n] / totalReviews.value) * 100);
    }

    function shortDate(str) {
      const d = new Date(str);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    function applyNow()    { router.push('/craftsman/apply'); }
    function checkStatus() { router.push('/craftsman/application-status'); }

    function goToCaseDetail(id) { router.push(`/craftsman/case/${id}`); }
    function goToEditSkills()   { router.push('/craftsman/skills'); }
    function switchRole() {
      localStorage.removeItem('userRole');
      router.push('/role-selection');
    }
    function logout() {
      auth.logout();
      localStorage.removeItem('userRole');
      router.replace('/login');
    }

    return {
      craftsmanName, averageRating, totalReviews, ratingDistribution, reviews,
      recommendedCases, isLoading, toast,
      loadingStatus, applicationStatus, applicationData,
      barWidth, shortDate,
      loadRecommendedCases,
      applyNow, checkStatus,
      goToCaseDetail, goToEditSkills, switchRole, logout,
    };
  },
};
</script>
