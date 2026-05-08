<template>
  <div class="min-h-screen bg-[#F2F2F7] font-ios pb-20">
    <!-- Navbar -->
    <header
      class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100"
    >
      <div class="flex items-center justify-between px-4 h-11">
        <h1 class="text-[17px] font-semibold text-gray-900">我的案件</h1>
        <div class="flex items-center gap-3">
          <button
            v-if="isAdmin"
            class="text-[13px] font-semibold text-[#007AFF] bg-blue-50 px-2.5 py-1 rounded-lg"
            @click="$router.push('/admin/applications')"
          >
            後台
          </button>
          <button class="text-[15px] text-gray-400" @click="switchRole">
            切換身份
          </button>
        </div>
      </div>
    </header>

    <main class="px-4 pt-4 space-y-4">
      <!-- 歡迎 -->
      <div>
        <p class="text-[28px] font-bold tracking-tight text-gray-900">
          你好，{{ currentUser?.name || "用戶" }}
        </p>
        <p class="text-[15px] text-gray-400 mt-0.5">管理你的協尋案件</p>
      </div>

      <!-- 發起新協尋 -->
      <button
        class="w-full bg-[#007AFF] text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-semibold text-[17px] shadow-sm active:opacity-85 transition-opacity"
        @click="goToCreateCase"
      >
        <PlusCircleIcon class="w-6 h-6" />
        發起新協尋
      </button>

      <!-- 統計 -->
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="stat in stats"
          :key="stat.label"
          class="bg-white rounded-2xl py-3.5 flex flex-col items-center gap-1 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
          @click="filterByStatus(stat.value)"
        >
          <span class="text-[26px] font-bold text-[#007AFF]">{{
            stat.count
          }}</span>
          <span class="text-[12px] text-gray-400">{{ stat.label }}</span>
        </button>
      </div>

      <!-- Segmented Control -->
      <div class="bg-gray-100 rounded-xl p-1 flex gap-1">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          :class="[
            'flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap',
            selectedStatus === tab.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500',
          ]"
          @click="filterByStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center gap-3 py-16">
        <div class="spinner-ios"></div>
        <p class="text-[15px] text-gray-400">載入中...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="errorMessage"
        class="flex flex-col items-center gap-3 py-16"
      >
        <ExclamationCircleIcon class="w-12 h-12 text-gray-300" />
        <p class="text-[15px] text-gray-500">{{ errorMessage }}</p>
        <button
          class="bg-[#007AFF] text-white px-6 py-2 rounded-xl text-[15px] font-medium"
          @click="loadCases"
        >
          重試
        </button>
      </div>

      <!-- 空狀態 -->
      <div
        v-else-if="filteredCases.length === 0"
        class="flex flex-col items-center gap-3 py-16"
      >
        <MagnifyingGlassIcon class="w-14 h-14 text-gray-200" />
        <p class="text-[17px] font-semibold text-gray-700">
          {{ selectedStatus === "all" ? "還沒有案件" : "此分類暫無案件" }}
        </p>
        <p class="text-[14px] text-gray-400">點擊上方按鈕發起第一個協尋</p>
      </div>

      <!-- 案件列表 -->
      <div v-else class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {{ selectedStatus === "all" ? "全部案件" : TABS.find((t) => t.value === selectedStatus)?.label }}
          </p>
          <button
            class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            @click="hideCancel = !hideCancel"
          >{{ hideCancel ? "顯示已取消" : "隱藏已取消" }}</button>
        </div>

        <div
          v-for="c in filteredCases"
          :key="c.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <!-- 卡片主體 -->
          <div
            class="p-4 cursor-pointer active:bg-gray-50"
            @click="goToCaseDetail(c.id)"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <WrenchIcon class="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span class="text-[16px] font-semibold text-gray-900">{{
                  c.category
                }}</span>
              </div>
              <span
                :class="[
                  'text-[12px] font-semibold px-2.5 py-0.5 rounded-full',
                  statusBadge(c.status),
                ]"
              >
                {{ statusLabel(c.status) }}
              </span>
            </div>

            <div class="flex items-center gap-1 text-[13px] text-gray-400 mb-1">
              <MapPinIcon class="w-3.5 h-3.5 flex-shrink-0" />
              {{ c.location_area }}
            </div>

            <p class="text-[14px] text-gray-500 line-clamp-2 mb-3">
              {{ c.description }}
            </p>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1 text-[12px] text-gray-300">
                <ClockIcon class="w-3.5 h-3.5" />
                {{ formatDate(c.created_at) }}
              </div>
              <span class="text-[12px] text-[#007AFF] font-semibold">
                已聯絡 {{ c.craftsmen_count ?? 0 }} 位師傅
              </span>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div
            v-if="c.status === 'active' || c.status === 'matched'"
            class="border-t border-gray-100 flex"
          >
            <button
              v-if="c.status === 'active'"
              class="flex-1 py-2.5 text-[14px] font-medium text-red-500 flex items-center justify-center gap-1.5 transition-colors active:bg-red-50"
              :disabled="loadingAction === c.id + '_cancel'"
              @click.stop="handleCancel(c.id)"
            >
              <div
                v-if="loadingAction === c.id + '_cancel'"
                class="spinner-sm-ios"
              ></div>
              <XCircleIcon v-else class="w-4 h-4" />
              取消案件
            </button>

            <button
              v-if="c.status === 'matched'"
              class="flex-1 py-2.5 text-[14px] font-medium text-orange-500 flex items-center justify-center gap-1.5 transition-colors active:bg-orange-50"
              :disabled="loadingAction === c.id + '_rebroadcast'"
              @click.stop="handleRebroadcast(c.id)"
            >
              <div
                v-if="loadingAction === c.id + '_rebroadcast'"
                class="spinner-sm-ios"
              ></div>
              <ArrowPathIcon v-else class="w-4 h-4" />
              重新協尋
            </button>

            <div class="w-px bg-gray-100"></div>

            <button
              class="flex-1 py-2.5 text-[14px] font-medium text-[#007AFF] flex items-center justify-center gap-1.5 active:bg-blue-50 transition-colors"
              @click.stop="goToCaseDetail(c.id)"
            >
              <ChevronRightIcon class="w-4 h-4" />
              查看詳情
            </button>
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
          toast.type === 'error' ? 'bg-red-500' : 'bg-gray-900',
        ]"
      >
        {{ toast.message }}
      </div>
    </transition>

    <!-- Bottom Navigation -->
    <nav
      class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/90 backdrop-blur border-t border-gray-100 flex h-16 safe-bottom z-20"
    >
      <button
        class="flex-1 flex flex-col items-center justify-center gap-0.5"
        @click="goToHome"
      >
        <HomeIcon class="w-6 h-6 text-[#007AFF]" />
        <span class="text-[10px] font-medium text-[#007AFF]">首頁</span>
      </button>
      <button
        class="flex-1 flex flex-col items-center justify-center gap-0.5"
        @click="goToHome"
      >
        <ClipboardDocumentListIcon class="w-6 h-6 text-gray-400" />
        <span class="text-[10px] font-medium text-gray-400">我的案件</span>
      </button>
      <button
        class="flex-1 flex flex-col items-center justify-center gap-0.5"
        @click="goToCreateCase"
      >
        <PlusCircleIcon class="w-6 h-6 text-gray-400" />
        <span class="text-[10px] font-medium text-gray-400">發起協尋</span>
      </button>
      <button
        class="flex-1 flex flex-col items-center justify-center gap-0.5"
        @click="goToEditProfile"
      >
        <Cog6ToothIcon class="w-6 h-6 text-gray-400" />
        <span class="text-[10px] font-medium text-gray-400">設定</span>
      </button>
    </nav>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import api from "@/utils/api.js";
import { useAuth } from "@/stores/auth.js";
import {
  HomeIcon,
  PlusCircleIcon,
  Cog6ToothIcon,
  WrenchIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  ClockIcon,
  XCircleIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/vue/24/outline";

const TABS = [
  { label: "全部", value: "all" },
  { label: "進行中", value: "active" },
  { label: "已媒合", value: "matched" },
  { label: "已完成", value: "completed" },
  { label: "已取消", value: "cancelled" },
];

const STATUS_LABELS = {
  active: "進行中",
  matched: "已媒合",
  completed: "已完成",
  cancelled: "已取消",
};

const STATUS_BADGE = {
  active: "bg-yellow-100 text-yellow-700",
  matched: "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
};

export default {
  name: "SeekerDashboard",
  components: {
    HomeIcon,
    PlusCircleIcon,
    Cog6ToothIcon,
    WrenchIcon,
    MagnifyingGlassIcon,
    ExclamationCircleIcon,
    MapPinIcon,
    ClockIcon,
    XCircleIcon,
    ChevronRightIcon,
    ArrowPathIcon,
    ClipboardDocumentListIcon,
  },
  setup() {
    const router = useRouter();
    const auth = useAuth();

    const cases = ref([]);
    const selectedStatus = ref("all");
    const isLoading = ref(true);
    const errorMessage = ref("");
    const loadingAction = ref("");
    const toast = reactive({ show: false, type: "success", message: "" });
    const currentUser = computed(() => auth.state.user);
    const isAdmin = computed(() => !!auth.state.user?.is_admin);
    const hideCancel = ref(true);

    const filteredCases = computed(() => {
      let list = selectedStatus.value === "all"
        ? cases.value
        : cases.value.filter((c) => c.status === selectedStatus.value);
      if (hideCancel.value) list = list.filter((c) => c.status !== "cancelled");
      return list;
    });

    const stats = computed(() => [
      {
        label: "進行中",
        value: "active",
        count: cases.value.filter((c) => c.status === "active").length,
      },
      {
        label: "已媒合",
        value: "matched",
        count: cases.value.filter((c) => c.status === "matched").length,
      },
      {
        label: "已完成",
        value: "completed",
        count: cases.value.filter((c) => c.status === "completed").length,
      },
    ]);

    const loadCases = async () => {
      isLoading.value = true;
      errorMessage.value = "";
      try {
        cases.value = await api.get("/cases");
      } catch (err) {
        errorMessage.value = err.message || "載入失敗";
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(loadCases);

    const handleCancel = async (caseId) => {
      if (!confirm("確定要取消此案件？")) return;
      loadingAction.value = caseId + "_cancel";
      try {
        await api.patch(`/cases/${caseId}/cancel`, {});
        await loadCases();
        showToast("案件已取消");
      } catch (err) {
        showToast(err.message || "取消失敗", "error");
      } finally {
        loadingAction.value = "";
      }
    };

    const handleRebroadcast = async (caseId) => {
      if (!confirm("重新協尋將再次通知符合條件的師傅，確定繼續？")) return;
      loadingAction.value = caseId + "_rebroadcast";
      try {
        await api.patch(`/cases/${caseId}/rebroadcast`, {});
        await loadCases();
        showToast("已重新發起協尋");
      } catch (err) {
        showToast(err.message || "操作失敗", "error");
      } finally {
        loadingAction.value = "";
      }
    };

    function showToast(message, type = "success") {
      Object.assign(toast, { show: true, type, message });
      setTimeout(() => {
        toast.show = false;
      }, 2500);
    }

    function filterByStatus(status) {
      selectedStatus.value = status;
    }
    function goToCaseDetail(id) {
      router.push(`/seeker/case/${id}`);
    }
    function goToCreateCase() {
      router.push("/seeker/create");
    }
    function goToEditProfile() {
      router.push("/account");
    }
    function goToHome() {
      selectedStatus.value = "all";
    }
    function switchRole() {
      localStorage.removeItem("userRole");
      router.push("/role-selection");
    }
    function logout() {
      auth.logout();
      localStorage.removeItem("userRole");
      router.replace("/login");
    }
    function statusLabel(s) {
      return STATUS_LABELS[s] || s;
    }
    function statusBadge(s) {
      return STATUS_BADGE[s] || "bg-gray-100 text-gray-500";
    }
    function formatDate(str) {
      const d = new Date(str);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(
        d.getHours()
      ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    return {
      TABS,
      cases,
      filteredCases,
      stats,
      selectedStatus,
      hideCancel,
      isLoading,
      errorMessage,
      loadingAction,
      toast,
      currentUser,
      isAdmin,
      loadCases,
      filterByStatus,
      handleCancel,
      handleRebroadcast,
      goToCaseDetail,
      goToCreateCase,
      goToEditProfile,
      goToHome,
      switchRole,
      logout,
      statusLabel,
      statusBadge,
      formatDate,
    };
  },
};
</script>
