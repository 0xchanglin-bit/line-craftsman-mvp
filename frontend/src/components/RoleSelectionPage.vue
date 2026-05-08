<template>
  <div class="min-h-screen bg-ios-gray6 flex flex-col font-ios">

    <!-- Hero -->
    <div class="flex flex-col items-center pt-16 pb-10 px-6 text-center">
      <div class="w-20 h-20 bg-[#007AFF] rounded-[22px] flex items-center justify-center mb-5 shadow-lg">
        <WrenchScrewdriverIcon class="w-10 h-10 text-white" />
      </div>
      <h1 class="text-3xl font-bold text-gray-900 tracking-tight mb-1">師傅協尋</h1>
      <p class="text-[15px] text-gray-500">選擇你的身份繼續使用</p>
    </div>

    <!-- 角色卡片 -->
    <div class="flex-1 px-4 space-y-3">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 pb-1">我想要</p>

      <button
        class="w-full bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 p-4 text-left transition-all duration-200 active:scale-[.98] active:bg-gray-50"
        @click="selectRole('seeker')"
      >
        <div class="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <QuestionMarkCircleIcon class="w-7 h-7 text-red-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[16px] font-semibold text-gray-900">尋求協助</p>
          <p class="text-[13px] text-gray-500 mt-0.5">找水電師傅幫忙修繕</p>
        </div>
        <ArrowRightIcon class="w-5 h-5 text-gray-300 flex-shrink-0" />
      </button>

      <button
        class="w-full bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 p-4 text-left transition-all duration-200 active:scale-[.98] active:bg-gray-50"
        @click="selectRole('craftsman')"
      >
        <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <WrenchIcon class="w-7 h-7 text-[#007AFF]" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[16px] font-semibold text-gray-900">提供服務</p>
          <p class="text-[13px] text-gray-500 mt-0.5">接案並賺取報酬</p>
        </div>
        <ArrowRightIcon class="w-5 h-5 text-gray-300 flex-shrink-0" />
      </button>
    </div>

    <!-- Footer -->
    <div class="py-8 flex justify-center">
      <button
        class="text-[15px] text-gray-400 underline underline-offset-2"
        @click="logout"
      >
        切換帳號
      </button>
    </div>

  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth.js';
import {
  QuestionMarkCircleIcon,
  WrenchIcon,
  ArrowRightIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline';

export default {
  name: 'RoleSelectionPage',
  components: { QuestionMarkCircleIcon, WrenchIcon, ArrowRightIcon, WrenchScrewdriverIcon },
  setup() {
    const router = useRouter();
    const auth   = useAuth();

    const selectRole = (role) => {
      localStorage.setItem('userRole', role);
      router.push(role === 'craftsman' ? '/craftsman' : '/seeker');
    };

    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      auth.logout();
      router.push('/login');
    };

    return { selectRole, logout };
  },
};
</script>
