<template>
  <div class="min-h-screen bg-gray-50 pb-24">

    <!-- 頁頭 -->
    <div class="bg-white px-6 py-4 border-b flex items-center gap-3">
      <button class="text-[#007AFF] text-[15px]" @click="$router.back()">‹ 返回</button>
      <h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">編輯技能</h1>
      <div class="w-12"></div>
    </div>

    <!-- 載入中 -->
    <div v-if="isLoading" class="flex flex-col items-center gap-3 py-20">
      <div class="w-8 h-8 border-4 border-blue-100 border-t-[#007AFF] rounded-full animate-spin"></div>
      <p class="text-[15px] text-gray-400">載入中...</p>
    </div>

    <template v-else>

      <!-- 提示訊息 -->
      <div class="px-6 py-3 bg-blue-50 border-l-4 border-blue-500">
        <p class="text-sm text-blue-700">
          已選擇 <span class="font-bold">{{ selectedSkills.length }}</span> 項技能
          <span v-if="selectedSkills.length < 1" class="text-orange-600">• 至少選擇 1 項</span>
        </p>
      </div>

      <!-- 技能分類選擇區塊 -->
      <div class="p-6 space-y-8">
        <div v-for="group in skillGroups" :key="group.name">
          <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span class="text-lg">{{ group.icon }}</span>
            {{ group.name }}
          </h3>

          <div class="space-y-2">
            <button
              v-for="skill in group.services"
              :key="skill.id"
              type="button"
              class="w-full px-4 py-4 rounded-lg border-2 text-left transition-all active:opacity-80"
              :class="selectedSkills.includes(skill.id)
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-300 bg-white text-gray-700'"
              @click="toggleSkill(skill.id)"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold">{{ skill.icon }} {{ skill.name }}</span>
                <span v-if="selectedSkills.includes(skill.id)" class="text-blue-600 text-lg">✓</span>
              </div>
              <p class="text-xs text-gray-500">{{ skill.description }}</p>
            </button>
          </div>
        </div>
      </div>


    </template>

    <!-- 固定底部儲存按鈕 -->
    <div class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-gray-200 px-6 py-4 z-50">
      <button
        type="button"
        :disabled="isSaving || selectedSkills.length === 0"
        class="w-full py-4 rounded-lg font-semibold text-white transition-opacity disabled:opacity-40"
        :class="selectedSkills.length > 0 ? 'bg-[#007AFF] active:opacity-85' : 'bg-gray-300'"
        @click="saveSkills"
      >
        <span v-if="isSaving" class="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
        <span v-else>儲存技能</span>
      </button>
    </div>

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

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api.js';

const router = useRouter();

const selectedSkills = ref([]);
const isLoading = ref(true);
const isSaving = ref(false);
const toast = reactive({ show: false, type: 'success', message: '' });

let craftsmanId = null;

const skillGroups = [
  {
    name: '水相關',
    icon: '💧',
    services: [
      { id: 1, name: '住宅水電', icon: '💧', description: '居家給排水、供水設備、水電安裝維修' },
      { id: 2, name: '管路工程', icon: '🔧', description: '大型水管、給排水系統工程安裝' },
      { id: 3, name: '衛浴設備', icon: '🚿', description: '浴室、廚房設施、馬桶、洗臉盆等' },
      { id: 4, name: '熱水器',   icon: '♨️', description: '電熱水器、瓦斯熱水器安裝維修' },
      { id: 5, name: '抓漏防水', icon: '☔', description: '漏水修補、防水施工、壁癌處理' },
    ],
  },
  {
    name: '電相關',
    icon: '⚡',
    services: [
      { id: 6, name: '弱電工程', icon: '📡', description: '網路佈線、電話線、有線電視安裝' },
    ],
  },
  {
    name: '冷氣相關',
    icon: '❄️',
    services: [
      { id: 7, name: '空調冷氣', icon: '❄️', description: '冷氣安裝、保養、維修、清潔' },
    ],
  },
  {
    name: '其他服務',
    icon: '🔧',
    services: [
      { id: 8,  name: '家電設備', icon: '🏠', description: '家電維修和安裝' },
      { id: 9,  name: '工具材料', icon: '🛠️', description: '工具和材料供應' },
      { id: 10, name: '能源系統', icon: '☀️', description: '太陽能等能源系統' },
      { id: 11, name: '裝修工程', icon: '🏗️', description: '室內裝修工程' },
    ],
  },
];

function toggleSkill(id) {
  const idx = selectedSkills.value.indexOf(id);
  if (idx > -1) selectedSkills.value.splice(idx, 1);
  else selectedSkills.value.push(id);
}

function showToast(message, type = 'success') {
  Object.assign(toast, { show: true, type, message });
  setTimeout(() => { toast.show = false; }, 2500);
}

async function saveSkills() {
  if (selectedSkills.value.length === 0) {
    showToast('請至少選擇 1 項技能', 'error');
    return;
  }
  if (!craftsmanId) {
    showToast('找不到師傅資訊，請重新登入', 'error');
    return;
  }
  isSaving.value = true;
  try {
    await api.post(`/craftsman/${craftsmanId}/skills`, { skill_ids: selectedSkills.value });
    showToast('技能已更新');
    setTimeout(() => router.back(), 1200);
  } catch (err) {
    showToast(err.message || '儲存失敗，請重試', 'error');
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  try {
    const profile = await api.get('/craftsman/profile');
    craftsmanId = profile.id;
    selectedSkills.value = Array.isArray(profile.skills) ? profile.skills : [];
  } catch (err) {
    if (err?.status !== 404) {
      showToast('載入失敗：' + (err.message || '請重試'), 'error');
    }
  } finally {
    isLoading.value = false;
  }
});
</script>
