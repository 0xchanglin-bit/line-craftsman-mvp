<template>
  <div class="min-h-screen bg-[#F2F2F7] font-ios pb-8">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div class="flex items-center px-2 h-11 gap-1">
        <button
          class="flex items-center gap-0.5 text-[#007AFF] text-[17px] px-2 py-1.5"
          @click="$router.back()"
        >
          <ChevronLeftIcon class="w-5 h-5 stroke-2" />
          <span class="text-[17px]">返回</span>
        </button>
        <h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">案件詳情</h1>
        <div class="w-24 flex justify-end pr-2">
          <span v-if="caseData" :class="['text-[12px] font-semibold px-2.5 py-0.5 rounded-full', statusBadge(caseData.status)]">
            {{ statusLabel(caseData.status) }}
          </span>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center gap-3 py-20">
      <div class="spinner-ios"></div>
      <p class="text-[15px] text-gray-400">載入中...</p>
    </div>

    <template v-else-if="caseData">

      <!-- 案件摘要卡片 -->
      <div class="px-4 pt-4">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <!-- 頭部 -->
          <div class="flex items-center gap-3 p-4 border-b border-gray-100">
            <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <WrenchIcon class="w-6 h-6 text-[#007AFF]" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[18px] font-bold text-gray-900">{{ caseData.category }}</p>
              <p class="text-[13px] text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPinIcon class="w-3.5 h-3.5 flex-shrink-0" />
                {{ caseData.location_area }}
              </p>
            </div>
          </div>

          <!-- Meta rows (iOS settings style) -->
          <div v-if="caseData.budget_min && caseData.budget_max" class="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span class="text-[15px] text-gray-900">預算</span>
            <span class="text-[15px] text-gray-500">{{ caseData.budget_min.toLocaleString() }} – {{ caseData.budget_max.toLocaleString() }} 元</span>
          </div>
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span class="text-[15px] text-gray-900">建立時間</span>
            <span class="text-[15px] text-gray-500">{{ formatDate(caseData.created_at) }}</span>
          </div>

          <!-- 描述 -->
          <div class="px-4 py-3">
            <p class="text-[15px] text-gray-700 leading-relaxed">{{ caseData.description }}</p>
          </div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div
        v-if="caseData.status === 'active' || caseData.status === 'matched'"
        class="px-4 pt-3 flex gap-3"
      >
        <button
          v-if="caseData.status === 'active'"
          class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-500 rounded-xl text-[14px] font-semibold border border-red-100 active:bg-red-100 transition-colors"
          :disabled="loadingAction === 'cancel'"
          @click="handleCancel"
        >
          <div v-if="loadingAction === 'cancel'" class="spinner-sm-ios"></div>
          <XCircleIcon v-else class="w-4 h-4" />
          取消案件
        </button>

        <button
          v-if="caseData.status === 'matched' || contactedCraftsmen.length > 0"
          class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 text-orange-500 rounded-xl text-[14px] font-semibold border border-orange-100 active:bg-orange-100 transition-colors"
          :disabled="loadingAction === 'rebroadcast'"
          @click="handleRebroadcast"
        >
          <div v-if="loadingAction === 'rebroadcast'" class="spinner-sm-ios"></div>
          <ArrowPathIcon v-else class="w-4 h-4" />
          重新協尋
        </button>
      </div>

      <!-- Segmented Control -->
      <div class="px-4 pt-3">
        <div class="bg-gray-100 rounded-xl p-1 flex gap-1">
          <button
            :class="[
              'flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 flex items-center justify-center gap-1',
              selectedTab === 'available' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            ]"
            @click="selectedTab = 'available'"
          >
            推薦師傅
            <span v-if="availableCraftsmen.length > 0" :class="['text-[11px] px-1.5 py-0.5 rounded-full font-semibold', selectedTab === 'available' ? 'bg-blue-100 text-[#007AFF]' : 'bg-gray-200 text-gray-400']">
              {{ availableCraftsmen.length }}
            </span>
          </button>
          <button
            :class="[
              'flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 flex items-center justify-center gap-1',
              selectedTab === 'contacted' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            ]"
            @click="selectedTab = 'contacted'"
          >
            已聯繫
            <span v-if="contactedCraftsmen.length > 0" :class="['text-[11px] px-1.5 py-0.5 rounded-full font-semibold', selectedTab === 'contacted' ? 'bg-blue-100 text-[#007AFF]' : 'bg-gray-200 text-gray-400']">
              {{ contactedCraftsmen.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- 推薦師傅 -->
      <div v-if="selectedTab === 'available'" class="px-4 pt-3">
        <div v-if="availableCraftsmen.length === 0" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-2 text-center">
          <UserGroupIcon class="w-14 h-14 text-gray-200" />
          <p class="text-[16px] font-semibold text-gray-700">目前無推薦師傅</p>
          <p class="text-[13px] text-gray-400">師傅需通過驗證後才會出現</p>
        </div>

        <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div v-for="(c, i) in availableCraftsmen" :key="c.id">
            <div class="p-4">
              <div class="flex items-center gap-3 mb-3">
                <!-- Avatar -->
                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-[16px] font-bold">{{ c.name?.[0] ?? '傅' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[16px] font-semibold text-gray-900">{{ c.name }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <div class="flex gap-0.5">
                      <StarIcon
                        v-for="n in 5" :key="n"
                        :class="['w-3.5 h-3.5', n <= Math.round(c.average_rating) ? 'text-orange-400' : 'text-gray-200']"
                      />
                    </div>
                    <span class="text-[13px] font-semibold text-gray-700">{{ c.average_rating.toFixed(1) }}</span>
                    <span class="text-[12px] text-gray-400">（{{ c.total_reviews }} 個評價）</span>
                  </div>
                </div>
              </div>
              <button
                class="w-full py-2.5 bg-[#007AFF] text-white rounded-xl text-[15px] font-semibold active:opacity-85 transition-opacity flex items-center justify-center gap-2"
                :disabled="contacting === c.id"
                @click="handleContactCraftsman(c.id)"
              >
                <div v-if="contacting === c.id" class="spinner-sm-ios"></div>
                <PhoneIcon v-else class="w-4 h-4" />
                聯繫此師傅
              </button>
            </div>
            <div v-if="i < availableCraftsmen.length - 1" class="h-px bg-gray-100 mx-4"></div>
          </div>
        </div>
      </div>

      <!-- 已聯繫 -->
      <div v-if="selectedTab === 'contacted'" class="px-4 pt-3">
        <div v-if="contactedCraftsmen.length === 0" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-2 text-center">
          <ChatBubbleLeftEllipsisIcon class="w-14 h-14 text-gray-200" />
          <p class="text-[16px] font-semibold text-gray-700">尚未聯繫任何師傅</p>
          <p class="text-[13px] text-gray-400">前往「推薦師傅」發起聯繫</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="c in contactedCraftsmen" :key="c.id"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div class="p-4 flex items-center gap-3">
              <div class="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                <span class="text-white text-[16px] font-bold">{{ c.craftsman_name?.[0] ?? '傅' }}</span>
              </div>
              <div class="flex-1">
                <p class="text-[16px] font-semibold text-gray-900">{{ c.craftsman_name }}</p>
                <span :class="['text-[11px] font-semibold px-2 py-0.5 rounded-full', contactStatusBadge(c.status)]">
                  {{ contactStatusLabel(c.status) }}
                </span>
              </div>
            </div>

            <div v-if="c.craftsman_phone" class="border-t border-gray-100 flex items-center px-4 py-3 gap-3">
              <PhoneIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a :href="`tel:${c.craftsman_phone}`" class="flex-1 text-[15px] font-semibold text-gray-900">
                {{ maskPhone(c.craftsman_phone) }}
              </a>
              <button
                class="text-[13px] text-[#007AFF] font-medium bg-blue-50 px-3 py-1 rounded-lg"
                @click="copyToClipboard(c.craftsman_phone, '電話')"
              >複製</button>
            </div>

            <div v-if="c.craftsman_line_id" class="border-t border-gray-100 flex items-center px-4 py-3 gap-3">
              <ChatBubbleLeftRightIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a
                :href="`https://line.me/ti/p/${c.craftsman_line_id}`"
                target="_blank"
                class="flex-1 text-[15px] font-semibold text-gray-900"
              >{{ maskLineId(c.craftsman_line_id) }}</a>
              <button
                class="text-[13px] text-[#007AFF] font-medium bg-blue-50 px-3 py-1 rounded-lg"
                @click="copyToClipboard(c.craftsman_line_id, 'LINE ID')"
              >複製</button>
            </div>
          </div>
        </div>
      </div>

    </template>

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

  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/utils/api.js';
import {
  ChevronLeftIcon,
  WrenchIcon,
  MapPinIcon,
  StarIcon,
  PhoneIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline';

const STATUS_LABELS = { active: '進行中', matched: '已媒合', completed: '已完成', cancelled: '已取消' };
const STATUS_BADGE  = { active: 'bg-yellow-100 text-yellow-700', matched: 'bg-blue-100 text-blue-700', completed: 'bg-gray-100 text-gray-500', cancelled: 'bg-red-100 text-red-600' };
const CONTACT_LABELS = { pending: '等待回覆', contacted: '已聯繫', matched: '已媒合' };
const CONTACT_BADGE  = { pending: 'bg-yellow-100 text-yellow-700', contacted: 'bg-green-100 text-green-700', matched: 'bg-blue-100 text-blue-700' };

export default {
  name: 'CaseDetailPage',
  components: {
    ChevronLeftIcon, WrenchIcon, MapPinIcon, StarIcon, PhoneIcon,
    XCircleIcon, ArrowPathIcon, UserGroupIcon,
    ChatBubbleLeftEllipsisIcon, ChatBubbleLeftRightIcon,
  },
  setup() {
    const route  = useRoute();
    const caseId = route.params.id;

    const caseData           = ref(null);
    const availableCraftsmen = ref([]);
    const contactedCraftsmen = ref([]);
    const selectedTab        = ref('available');
    const isLoading          = ref(true);
    const contacting         = ref(null);
    const loadingAction      = ref('');
    const toast = ref({ show: false, type: 'success', message: '' });

    const loadCaseDetail = async () => {
      caseData.value = await api.get(`/cases/${caseId}`);
    };
    const loadAvailableCraftsmen = async () => {
      availableCraftsmen.value = await api.get(`/case/${caseId}/available-craftsmen`);
    };
    const loadContactedCraftsmen = async () => {
      contactedCraftsmen.value = await api.get(`/case/${caseId}/contacts`);
    };

    onMounted(async () => {
      try {
        await Promise.all([loadCaseDetail(), loadAvailableCraftsmen(), loadContactedCraftsmen()]);
      } catch (err) {
        showToast(err.message || '載入失敗', 'error');
      } finally {
        isLoading.value = false;
      }
    });

    const handleContactCraftsman = async (craftsmanId) => {
      if (!confirm('確定要聯繫此師傅？雙方聯絡資訊將立即交換。')) return;
      contacting.value = craftsmanId;
      try {
        await api.post(`/case/${caseId}/contact`, { craftsman_id: craftsmanId });
        availableCraftsmen.value = availableCraftsmen.value.filter(c => c.id !== craftsmanId);
        await loadContactedCraftsmen();
        showToast('已發送聯絡資訊');
        selectedTab.value = 'contacted';
      } catch (err) {
        showToast(err.message || '聯繫失敗', 'error');
      } finally {
        contacting.value = null;
      }
    };

    const handleCancel = async () => {
      if (!confirm('確定要取消此案件？')) return;
      loadingAction.value = 'cancel';
      try {
        await api.patch(`/cases/${caseId}/cancel`, {});
        await loadCaseDetail();
        showToast('案件已取消');
      } catch (err) {
        showToast(err.message || '取消失敗', 'error');
      } finally {
        loadingAction.value = '';
      }
    };

    const handleRebroadcast = async () => {
      if (!confirm('重新協尋將再次通知符合條件的師傅，確定繼續？')) return;
      loadingAction.value = 'rebroadcast';
      try {
        await api.patch(`/cases/${caseId}/rebroadcast`, {});
        await loadCaseDetail();
        showToast('已重新發起協尋');
      } catch (err) {
        showToast(err.message || '操作失敗', 'error');
      } finally {
        loadingAction.value = '';
      }
    };

    function maskPhone(phone) {
      if (!phone) return '';
      return phone.replace(/(\d{4})(\d{3})(\d+)/, '$1***$3');
    }
    function maskLineId(lineId) {
      if (!lineId) return '';
      if (lineId.startsWith('phone_')) return lineId;
      return lineId.length <= 4 ? lineId : lineId.slice(0, 3) + '****';
    }
    function copyToClipboard(text, label) {
      navigator.clipboard?.writeText(text)
        .then(() => showToast(`已複製${label}`))
        .catch(() => showToast('複製失敗，請手動複製', 'error'));
    }
    function showToast(message, type = 'success') {
      toast.value = { show: true, type, message };
      setTimeout(() => { toast.value.show = false; }, 2500);
    }
    function statusLabel(s)        { return STATUS_LABELS[s] || s; }
    function statusBadge(s)        { return STATUS_BADGE[s] || 'bg-gray-100 text-gray-500'; }
    function contactStatusLabel(s) { return CONTACT_LABELS[s] || s; }
    function contactStatusBadge(s) { return CONTACT_BADGE[s] || 'bg-gray-100 text-gray-500'; }
    function formatDate(str) {
      const d = new Date(str);
      return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    return {
      caseData, availableCraftsmen, contactedCraftsmen,
      selectedTab, isLoading, contacting, loadingAction, toast,
      handleContactCraftsman, handleCancel, handleRebroadcast,
      maskPhone, maskLineId, copyToClipboard,
      statusLabel, statusBadge, contactStatusLabel, contactStatusBadge, formatDate,
    };
  },
};
</script>
