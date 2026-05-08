<template>
  <div class="min-h-screen bg-gray-50 font-ios">

    <!-- 頂部導航欄 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-900">管理者後台</h2>
      <button
        class="text-blue-600 hover:text-blue-700 font-medium text-sm"
        @click="goToFrontend"
      >回到前台</button>
    </div>

    <!-- Header -->
    <div class="bg-white px-6 py-3 border-b text-center">
      <h1 class="text-xl font-bold text-gray-900">師傅申請審核</h1>
      <p class="text-gray-600 text-xs mt-0.5">待審核申請</p>
    </div>

    <!-- Tab 導航列 -->
    <div class="bg-white border-b border-gray-200">
      <div class="flex gap-6 px-6">
        <button
          @click="switchTab('pending')"
          :class="['px-0 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap',
            currentTab === 'pending' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900']"
        >⏳ 待審核</button>
        <button
          @click="switchTab('revision')"
          :class="['px-0 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap',
            currentTab === 'revision' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900']"
        >⚠️ 待補充</button>
        <button
          @click="switchTab('approved')"
          :class="['px-0 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap',
            currentTab === 'approved' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900']"
        >✅ 已通過</button>
        <button
          @click="switchTab('rejected')"
          :class="['px-0 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap',
            currentTab === 'rejected' ? 'text-red-600 border-red-600' : 'text-gray-600 border-transparent hover:text-gray-900']"
        >❌ 已拒絕</button>
      </div>
    </div>

    <div class="p-4">

      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
        <div class="w-8 h-8 border-4 border-blue-100 border-t-[#007AFF] rounded-full animate-spin"></div>
        <p class="text-gray-400 text-xs">載入中...</p>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <p class="text-red-600 font-semibold mb-1 text-sm">載入失敗</p>
        <p class="text-red-400 text-xs mb-3">{{ loadError }}</p>
        <button class="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs" @click="loadApplications">重試</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredApplications.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
        <p class="text-gray-500 text-sm">暫無此分類的申請</p>
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
        <div class="px-6 py-3 border-b bg-gray-50">
          <p class="text-xs text-gray-700">
            找到 <span class="font-bold text-blue-600">{{ filteredApplications.length }}</span> 件申請
          </p>
        </div>
        <table class="w-full min-w-max text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">ID</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap" style="min-width:100px">姓名</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap" style="min-width:100px">狀態</th>
              <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap" style="min-width:80px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="app in filteredApplications" :key="app.id"
              class="border-b border-gray-200 hover:bg-gray-50 transition"
            >
              <td class="px-6 py-3 text-xs text-gray-900 font-medium whitespace-nowrap">#{{ app.id }}</td>
              <td class="px-6 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap text-center">{{ app.name }}</td>
              <td class="px-6 py-3 text-center">
                <span
                  class="inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  :class="getStatusClass(app.status)"
                >{{ getStatusLabel(app.status) }}</span>
              </td>
              <td class="px-6 py-3 text-center">
                <button
                  class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium whitespace-nowrap text-xs"
                  @click="openModal(app)"
                >查看</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Modal ── -->
    <Transition name="fade">
      <div v-if="modal.open" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="closeModal">
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

        <div class="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col">

          <!-- Handle (mobile) -->
          <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden"></div>

          <!-- Modal header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 class="text-[16px] font-bold text-gray-900">申請詳情 <span class="text-gray-400">#{{ modal.app?.id }}</span></h2>
            <button class="text-gray-300 hover:text-gray-500 text-[22px] leading-none w-8 h-8 flex items-center justify-center" @click="closeModal">×</button>
          </div>

          <!-- Scrollable body -->
          <div class="overflow-y-auto flex-1 px-5 py-4 space-y-5">

            <!-- Basic info -->
            <div class="bg-gray-50 rounded-2xl divide-y divide-gray-100">
              <div class="flex justify-between px-4 py-3">
                <span class="text-[13px] text-gray-400">姓名</span>
                <span class="text-[14px] font-semibold text-gray-900">{{ modal.app?.name }}</span>
              </div>
              <div class="flex justify-between px-4 py-3">
                <span class="text-[13px] text-gray-400">電話</span>
                <span class="text-[14px] text-gray-700">{{ modal.app?.phone || '—' }}</span>
              </div>
              <div class="flex justify-between px-4 py-3">
                <span class="text-[13px] text-gray-400">LINE ID</span>
                <span class="text-[14px] text-gray-700">{{ modal.app?.line_id || '—' }}</span>
              </div>
              <div class="flex justify-between px-4 py-3">
                <span class="text-[13px] text-gray-400">服務地區</span>
                <span class="text-[14px] text-gray-700 text-right max-w-[55%]">{{ parseJSON(modal.app?.service_areas) }}</span>
              </div>
              <div class="flex justify-between px-4 py-3">
                <span class="text-[13px] text-gray-400 flex-shrink-0">服務項目</span>
                <span class="text-[13px] text-gray-700 text-right max-w-[60%]">
                  {{ parseJSONArray(modal.app?.skills).map(id => getSkillName(id)).join('、') }}
                </span>
              </div>
              <div class="flex justify-between px-4 py-3">
                <span class="text-[13px] text-gray-400">申請時間</span>
                <span class="text-[14px] text-gray-700">{{ formatDate(modal.app?.created_at) }}</span>
              </div>
            </div>

            <!-- Business card -->
            <div>
              <p class="text-[12px] font-semibold text-gray-400 uppercase mb-2">名片照片</p>
              <a v-if="modal.app?.business_card_url" :href="modal.app.business_card_url" target="_blank" class="block mx-auto w-4/5">
                <img
                  :src="modal.app.business_card_url"
                  alt="名片"
                  class="w-full rounded-xl border border-gray-200 object-contain max-h-56 bg-gray-50 hover:opacity-90 transition-opacity cursor-zoom-in"
                />
              </a>
              <p v-else class="text-gray-300 text-[13px] text-center py-4">未上傳</p>
            </div>

            <!-- License -->
            <div v-if="modal.app?.license_image_url">
              <p class="text-[12px] font-semibold text-gray-400 uppercase mb-2">證照 / 執照</p>
              <a :href="modal.app.license_image_url" target="_blank" class="block mx-auto w-4/5">
                <img
                  :src="modal.app.license_image_url"
                  alt="證照"
                  class="w-full rounded-xl border border-gray-200 object-contain max-h-56 bg-gray-50 hover:opacity-90 transition-opacity cursor-zoom-in"
                />
              </a>
            </div>

            <!-- Prior note -->
            <div v-if="modal.app?.rejection_reason" class="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <p class="text-[11px] font-semibold text-orange-500 uppercase mb-1">先前備註</p>
              <p class="text-[13px] text-orange-800 leading-relaxed">{{ modal.app.rejection_reason }}</p>
            </div>

            <!-- Reason input -->
            <div v-if="modal.action && modal.action !== 'approve'">
              <p class="text-[13px] font-semibold text-gray-700 mb-2">
                {{ modal.action === 'reject' ? '拒絕原因' : '補充說明' }}
                <span class="text-red-500">*</span>
              </p>
              <textarea
                v-model="modal.reason"
                rows="3"
                placeholder="請填寫說明..."
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:border-[#007AFF] transition-colors"
              ></textarea>
              <p v-if="modal.reasonError" class="text-[12px] text-red-500 mt-1">{{ modal.reasonError }}</p>
            </div>

          </div>

          <!-- Action buttons -->
          <div class="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">

            <!-- Can review -->
            <template v-if="canReview">
              <!-- Step 1: choose -->
              <template v-if="!modal.action">
                <div class="flex gap-2">
                  <button
                    class="flex-1 py-3 bg-red-50 text-red-700 rounded-xl text-[14px] font-semibold border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap"
                    @click="modal.action = 'reject'"
                  >❌ 拒絕</button>
                  <button
                    class="flex-1 py-3 bg-orange-50 text-orange-700 rounded-xl text-[14px] font-semibold border border-orange-200 hover:bg-orange-100 transition-colors whitespace-nowrap"
                    @click="modal.action = 'revision'"
                  >⚠️ 補充</button>
                  <button
                    class="flex-1 py-3 bg-green-50 text-green-700 rounded-xl text-[14px] font-semibold border border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap"
                    @click="modal.action = 'approve'"
                  >✅ 通過</button>
                </div>
              </template>

              <!-- Step 2: confirm -->
              <template v-else>
                <button
                  class="w-full py-3 rounded-xl text-[15px] font-semibold text-white transition-colors disabled:opacity-50"
                  :class="confirmBtnClass"
                  :disabled="isActing"
                  @click="submitAction"
                >{{ isActing ? '處理中...' : `確認${actionLabel}` }}</button>
                <button
                  class="w-full py-2 text-gray-400 text-[14px] hover:text-gray-600 transition-colors"
                  :disabled="isActing"
                  @click="modal.action = null; modal.reason = ''; modal.reasonError = ''"
                >取消</button>
              </template>
            </template>

            <!-- Already reviewed -->
            <div v-else class="text-center py-2">
              <span :class="['px-3 py-1.5 rounded-full text-[13px] font-semibold', statusClass(modal.app?.status)]">
                {{ statusEmoji(modal.app?.status) }} {{ statusLabel(modal.app?.status) }}
              </span>
            </div>

          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api.js';

const TABS = [
  { value: 'pending',         label: '⏳ 待審核' },
  { value: 'revision_needed', label: '⚠️ 待補充' },
  { value: 'approved',        label: '✅ 已通過' },
  { value: 'rejected',        label: '❌ 已拒絕' },
];

const SKILL_MAP = {
  1: '住宅水電', 2: '管路工程', 3: '衛浴設備', 4: '熱水器',
  5: '抓漏防水', 6: '弱電工程', 7: '空調冷氣', 8: '家電設備',
  9: '工具材料', 10: '能源系統', 11: '裝修工程',
};

function getSkillName(id) {
  return SKILL_MAP[Number(id)] || `服務項目 ${id}`;
}

export default {
  name: 'AdminApplicationsPage',
  setup() {
    const router = useRouter();

    const TAB_STATUS_MAP = {
      pending:  'pending',
      revision: 'revision_needed',
      approved: 'approved',
      rejected: 'rejected',
    };

    const applications  = ref([]);
    const isLoading     = ref(true);
    const isActing      = ref(false);
    const loadError     = ref('');
    const currentTab    = ref('pending');

    const modal = reactive({
      open: false, app: null,
      action: null, reason: '', reasonError: '',
    });

    const filteredApplications = computed(() => applications.value);
    const canReview       = computed(() => modal.app?.status === 'pending' || modal.app?.status === 'revision_needed');
    const actionLabel     = computed(() => ({ approve: '通過', reject: '拒絕', revision: '送出' })[modal.action] ?? '');
    const confirmBtnClass = computed(() => ({
      approve: 'bg-green-500 hover:bg-green-600',
      reject:  'bg-red-500 hover:bg-red-600',
      revision:'bg-orange-400 hover:bg-orange-500',
    })[modal.action] ?? 'bg-gray-400');

    async function loadApplications() {
      const apiStatus = TAB_STATUS_MAP[currentTab.value];
      console.log('[admin] 載入 status =', apiStatus);
      isLoading.value = true;
      loadError.value = '';
      try {
        const data = await api.get(`/admin/applications?status=${apiStatus}`);
        console.log('[admin] 回應:', data);
        applications.value = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('[admin] 失敗:', err.message);
        loadError.value = err.message || '載入失敗';
        applications.value = [];
      } finally {
        isLoading.value = false;
      }
    }

    async function submitAction() {
      if (modal.action !== 'approve' && !modal.reason.trim()) {
        modal.reasonError = '請填寫說明';
        return;
      }
      modal.reasonError = '';

      const suffix = { approve: 'approve', reject: 'reject', revision: 'revision' }[modal.action];
      const body   = modal.action === 'approve' ? {} : { reason: modal.reason.trim() };

      isActing.value = true;
      try {
        await api.patch(`/admin/applications/${modal.app.id}/${suffix}`, body);
        closeModal();
        loadApplications();
      } catch (err) {
        alert(err.message || '操作失敗，請重試');
      } finally {
        isActing.value = false;
      }
    }

    function openModal(app) {
      Object.assign(modal, { open: true, app, action: null, reason: '', reasonError: '' });
    }

    function closeModal() { modal.open = false; }

    function switchTab(status) {
      currentTab.value = status;
      loadApplications();
    }

    function parseJSON(val) {
      if (!val) return '—';
      if (Array.isArray(val)) return val.join('、');
      try { return JSON.parse(val).join('、'); } catch { return String(val); }
    }

    function parseJSONArray(val) {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try { return JSON.parse(val); } catch { return [String(val)]; }
    }

    function formatDate(str) {
      if (!str) return '—';
      return new Date(str).toLocaleDateString('zh-TW');
    }

    function statusLabel(s) {
      return { pending: '待審核', approved: '已通過', rejected: '已拒絕', revision_needed: '待補充' }[s] ?? s;
    }

    function statusEmoji(s) {
      return { pending: '⏳', approved: '✅', rejected: '❌', revision_needed: '⚠️' }[s] ?? '';
    }

    function statusClass(s) {
      return {
        pending:         'bg-yellow-100 text-yellow-700',
        approved:        'bg-green-100 text-green-700',
        rejected:        'bg-red-100 text-red-700',
        revision_needed: 'bg-orange-100 text-orange-700',
      }[s] ?? 'bg-gray-100 text-gray-500';
    }

    function getStatusLabel(s) {
      return { pending: '⏳ 待審核', approved: '✅ 已通過', rejected: '❌ 已拒絕', revision_needed: '⚠️ 需補充' }[s] ?? s;
    }

    function getStatusClass(s) {
      return {
        pending:         'bg-yellow-100 text-yellow-700',
        approved:        'bg-green-100 text-green-700',
        rejected:        'bg-red-100 text-red-700',
        revision_needed: 'bg-orange-100 text-orange-700',
      }[s] ?? 'bg-gray-100 text-gray-700';
    }

    onMounted(loadApplications);

    return {
      TABS, applications, filteredApplications, isLoading, isActing, loadError,
      currentTab, modal,
      canReview, actionLabel, confirmBtnClass,
      loadApplications, submitAction, openModal, closeModal, switchTab,
      parseJSON, parseJSONArray, formatDate, statusLabel, statusEmoji, statusClass, getSkillName,
      getStatusLabel, getStatusClass,
      goToFrontend: () => router.push('/'),
    };
  },
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
