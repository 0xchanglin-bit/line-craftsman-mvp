<template>
  <div class="min-h-screen bg-[#F2F2F7] font-ios pb-28">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div class="flex items-center px-2 h-11">
        <button class="flex items-center gap-0.5 text-[#007AFF] px-2 py-1.5" @click="$router.back()">
          <ChevronLeftIcon class="w-5 h-5 stroke-2" />
          返回
        </button>
        <h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">發起協尋</h1>
        <div class="w-20"></div>
      </div>
    </header>

    <form class="px-4 pt-5 space-y-6" @submit.prevent="handleSubmit">

      <!-- ── 1. 服務地區（單選下拉） ── -->
      <section>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">服務地區</p>

        <div class="relative">
          <!-- 觸發按鈕 -->
          <button
            type="button"
            class="w-full bg-white border rounded-2xl shadow-sm px-4 py-3.5 flex items-center justify-between text-[15px] active:opacity-80 transition-colors"
            :class="errors.locationArea ? 'border-red-300' : 'border-gray-200'"
            @click="isAreaOpen = !isAreaOpen"
          >
            <span :class="locationArea ? 'text-gray-900 font-medium' : 'text-gray-400'">
              {{ locationArea || '選擇縣市' }}
            </span>
            <ChevronDownIcon
              class="w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0"
              :class="{ 'rotate-180': isAreaOpen }"
            />
          </button>

          <!-- 下拉清單 -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            leave-active-class="transition-all duration-150 ease-in"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
          >
            <div
              v-if="isAreaOpen"
              class="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg z-30 overflow-hidden"
            >
              <div class="max-h-60 overflow-y-auto py-1">
                <button
                  v-for="city in CITIES" :key="city"
                  type="button"
                  class="w-full px-4 py-3 text-left text-[15px] flex items-center justify-between transition-colors active:bg-gray-50"
                  :class="locationArea === city ? 'text-[#007AFF] font-semibold' : 'text-gray-800'"
                  @click="selectArea(city)"
                >
                  {{ city }}
                  <CheckIcon v-if="locationArea === city" class="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <p v-if="errors.locationArea" class="text-[12px] text-red-500 mt-1.5 px-1">{{ errors.locationArea }}</p>
      </section>

      <!-- ── 2. 服務項目（單選） ── -->
      <section>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">服務項目</p>
        <div class="space-y-2">
          <button
            v-for="s in allServices" :key="s.id"
            type="button"
            class="w-full px-4 py-3 rounded-2xl border-2 text-[14px] font-medium flex items-center justify-between transition-all active:opacity-80"
            :class="selectedService === s.id
              ? 'bg-[#007AFF] border-[#007AFF] text-white'
              : 'bg-white border-gray-200 text-gray-700'"
            @click="toggleService(s.id)"
          >
            <span class="flex items-center gap-2">
              <span class="text-[18px] leading-none">{{ s.icon }}</span>
              {{ s.name }}
            </span>
            <CheckIcon v-if="selectedService === s.id" class="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
        <p v-if="errors.selectedService" class="text-[12px] text-red-500 mt-1.5 px-1">{{ errors.selectedService }}</p>
      </section>

      <!-- ── 3. 問題描述 ── -->
      <section>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">問題描述</p>
        <div
          class="bg-white rounded-2xl border shadow-sm overflow-hidden"
          :class="errors.description ? 'border-red-200' : 'border-gray-100'"
        >
          <div class="relative">
            <textarea
              v-model="description"
              rows="5"
              placeholder="描述你的問題（建議 20 字以內）"
              class="w-full px-4 pt-4 pb-2 text-[15px] text-gray-900 placeholder-gray-300 bg-transparent outline-none resize-none leading-relaxed"
            ></textarea>
          </div>
        </div>
        <p v-if="errors.description" class="text-[12px] text-red-500 mt-1.5 px-1">{{ errors.description }}</p>
      </section>

      <!-- ── 4. 預算範圍（選填） ── -->
      <section>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">
          預算範圍
          <span class="text-gray-300 font-normal text-[11px] normal-case tracking-normal">（選填）</span>
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="b in BUDGET_OPTIONS" :key="b.value"
            type="button"
            class="py-3 px-2 rounded-2xl border-2 text-[13px] font-medium text-center transition-all active:opacity-80"
            :class="selectedBudget === b.value
              ? 'bg-[#007AFF] border-[#007AFF] text-white font-semibold'
              : 'bg-white border-gray-200 text-gray-700'"
            @click="selectedBudget = selectedBudget === b.value ? '' : b.value"
          >{{ b.label }}</button>
        </div>
      </section>

    </form>

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

    <!-- 底部提交 -->
    <footer class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/90 backdrop-blur border-t border-gray-100 px-4 py-3 safe-bottom">
      <button
        type="button"
        class="w-full py-3.5 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-85 transition-opacity disabled:opacity-50"
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        <div v-if="isSubmitting" class="spinner-sm-ios"></div>
        <span v-else>發起協尋</span>
      </button>
    </footer>

  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api.js';
import { ChevronLeftIcon, ChevronDownIcon, CheckIcon } from '@heroicons/vue/24/outline';

const CITIES = ['台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '南投', '雲林', '嘉義', '台南', '高雄', '屏東', '宜蘭', '花蓮', '台東'];

const BUDGET_OPTIONS = [
  { label: '500–1,000 元',   value: '500-1000',  min: 500,  max: 1000 },
  { label: '1,000–3,000 元', value: '1000-3000', min: 1000, max: 3000 },
  { label: '3,000–5,000 元', value: '3000-5000', min: 3000, max: 5000 },
  { label: '5,000 元以上',   value: '5000+',     min: 5000, max: null  },
  { label: '不確定',         value: 'unknown',   min: null, max: null  },
];

const ALL_SERVICES = [
  { id: 1,  name: '住宅水電', icon: '💧' },
  { id: 2,  name: '管路工程', icon: '🔧' },
  { id: 3,  name: '衛浴設備', icon: '🚿' },
  { id: 4,  name: '熱水器',   icon: '♨️' },
  { id: 5,  name: '抓漏防水', icon: '☔' },
  { id: 6,  name: '弱電工程', icon: '📡' },
  { id: 7,  name: '空調冷氣', icon: '❄️' },
  { id: 8,  name: '家電設備', icon: '🏠' },
  { id: 9,  name: '工具材料', icon: '🛠️' },
  { id: 10, name: '能源系統', icon: '☀️' },
  { id: 11, name: '裝修工程', icon: '🏗️' },
];

export default {
  name: 'CreateCasePage',
  components: { ChevronLeftIcon, ChevronDownIcon, CheckIcon },
  setup() {
    const router = useRouter();

    const locationArea     = ref('');
    const selectedService  = ref(null);
    const description      = ref('');
    const selectedBudget   = ref('');
    const isSubmitting     = ref(false);
    const errors = reactive({ locationArea: '', selectedService: '', description: '' });
    const toast  = reactive({ show: false, type: 'success', message: '' });

    const isAreaOpen = ref(false);

    function selectArea(city) {
      locationArea.value  = city;
      isAreaOpen.value    = false;
      errors.locationArea = '';
    }

    function toggleService(id) {
      selectedService.value = selectedService.value === id ? null : id;
      errors.selectedService = '';
    }

    function validateForm() {
      errors.locationArea    = locationArea.value             ? '' : '請選擇服務地區';
      errors.selectedService = selectedService.value !== null ? '' : '請選擇服務項目';
      errors.description     = description.value.trim()       ? '' : '請描述你的問題';
      return !errors.locationArea && !errors.selectedService && !errors.description;
    }

    function getBudgetRange() {
      const option = BUDGET_OPTIONS.find(b => b.value === selectedBudget.value);
      return option ? { budget_min: option.min, budget_max: option.max } : { budget_min: null, budget_max: null };
    }

    function showToast(message, type = 'success') {
      Object.assign(toast, { show: true, type, message });
      setTimeout(() => { toast.show = false; }, 2500);
    }

    const handleSubmit = async () => {
      if (!validateForm()) return;
      if (isSubmitting.value) return;


      isSubmitting.value = true;
      try {
        const { budget_min, budget_max } = getBudgetRange();
        const category = ALL_SERVICES.find(s => s.id === selectedService.value)?.name ?? '';
        const res = await api.post('/cases', {
          location_area: locationArea.value,
          category,
          description:   description.value.trim(),
          budget_min,
          budget_max,
        });

        showToast('案件已發起，正在媒合師傅...', 'success');
        setTimeout(() => {
          router.replace(`/seeker/case/${res.case_id}`);
        }, 1000);
      } catch (err) {
        showToast(err.message || '提交失敗，請重試', 'error');
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      CITIES, BUDGET_OPTIONS, allServices: ALL_SERVICES,
      locationArea, selectedService, description, selectedBudget,
      isAreaOpen,
      isSubmitting, errors, toast,
      selectArea, toggleService, handleSubmit,
    };
  },
};
</script>
