<template>
  <div class="min-h-screen bg-[#F2F2F7] font-ios pb-24">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div class="flex items-center px-2 h-11">
        <button class="flex items-center gap-0.5 text-[#007AFF] px-2 py-1.5" @click="$router.back()">
          <ChevronLeftIcon class="w-5 h-5 stroke-2" />
          返回
        </button>
        <h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">師傅認證申請</h1>
        <div class="w-20"></div>
      </div>
    </header>

    <form class="px-4 pt-4 space-y-5" @submit.prevent="handleSubmit">

      <!-- 1. 名稱 -->
      <div>
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">基本資料</p>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="flex items-center px-4 py-3 border-b border-gray-50">
            <label class="text-[15px] text-gray-900 w-24 flex-shrink-0">姓名 <span class="text-red-500">*</span></label>
            <input
              v-model="form.name"
              type="text"
              placeholder="請輸入真實姓名或暱稱"
              class="flex-1 text-[15px] text-gray-900 bg-transparent outline-none placeholder-gray-300"
              :class="{ 'text-red-500': errors.name }"
            />
          </div>

          <!-- 電話 / LINE 選擇 -->
          <div class="px-4 py-3 border-b border-gray-50">
            <p class="text-[13px] text-gray-500 mb-2">聯絡方式 <span class="text-red-500">*</span>（至少填一項）</p>
            <div class="flex gap-4 mb-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="contactType" value="phone" class="accent-[#007AFF]" />
                <span class="text-[14px] text-gray-700">電話</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="contactType" value="line" class="accent-[#007AFF]" />
                <span class="text-[14px] text-gray-700">LINE ID</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="contactType" value="both" class="accent-[#007AFF]" />
                <span class="text-[14px] text-gray-700">兩者都填</span>
              </label>
            </div>
            <div class="space-y-2">
              <input
                v-if="contactType === 'phone' || contactType === 'both'"
                v-model="form.phone"
                type="tel"
                placeholder="0912-345-678"
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#007AFF] transition-colors"
              />
              <input
                v-if="contactType === 'line' || contactType === 'both'"
                v-model="form.lineId"
                type="text"
                placeholder="LINE ID"
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#007AFF] transition-colors"
              />
            </div>
            <p v-if="errors.contact" class="text-[12px] text-red-500 mt-1">{{ errors.contact }}</p>
          </div>
        </div>
        <p v-if="errors.name" class="text-[12px] text-red-500 mt-1 px-1">{{ errors.name }}</p>
      </div>

      <!-- 2. 服務地區 -->
      <div>
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">
          服務地區 <span class="text-red-500">*</span>
        </p>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div class="grid grid-cols-3 gap-2">
            <label
              v-for="city in CITIES" :key="city"
              :class="[
                'flex items-center justify-center py-2 px-1 rounded-xl border text-[13px] font-medium cursor-pointer transition-all duration-150',
                form.serviceAreas.includes(city)
                  ? 'bg-[#007AFF] border-[#007AFF] text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              ]"
            >
              <input type="checkbox" :value="city" v-model="form.serviceAreas" class="hidden" />
              {{ city }}
            </label>
          </div>
        </div>
        <p v-if="errors.serviceAreas" class="text-[12px] text-red-500 mt-1 px-1">{{ errors.serviceAreas }}</p>
      </div>

      <!-- 3. 服務技能 -->
      <div>
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">
          服務項目 <span class="text-red-500">*</span>
        </p>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div v-if="allSkills.length === 0" class="text-center py-4">
            <div class="spinner-ios mx-auto"></div>
          </div>
          <div v-else class="grid grid-cols-2 gap-2">
            <label
              v-for="skill in allSkills" :key="skill.id"
              :class="[
                'flex items-center gap-2 py-2.5 px-3 rounded-xl border text-[13px] font-medium cursor-pointer transition-all duration-150',
                form.skills.includes(skill.id)
                  ? 'bg-blue-50 border-[#007AFF] text-[#007AFF]'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              ]"
            >
              <input type="checkbox" :value="skill.id" v-model="form.skills" class="hidden" />
              <CheckCircleIcon
                :class="['w-4 h-4 flex-shrink-0', form.skills.includes(skill.id) ? 'text-[#007AFF]' : 'text-gray-300']"
              />
              {{ skill.name }}
            </label>
          </div>
        </div>
        <p v-if="errors.skills" class="text-[12px] text-red-500 mt-1 px-1">{{ errors.skills }}</p>
      </div>

      <!-- 4. 名片照片 -->
      <div>
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">
          名片照片 <span class="text-red-500">*</span>
        </p>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <FileUploadRow
            label="名片"
            :required="true"
            :file="files.businessCard"
            :preview-url="previews.businessCard"
            :progress="uploadProgress.businessCard"
            :error="errors.businessCard"
            @change="onFileChange('businessCard', $event)"
          />
        </div>
      </div>

      <!-- 5. 證照照片（選填） -->
      <div>
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">
          證照照片 <span class="text-gray-400 font-normal text-[11px]">（選填）</span>
        </p>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <FileUploadRow
            label="證照"
            :required="false"
            :file="files.license"
            :preview-url="previews.license"
            :progress="uploadProgress.license"
            @change="onFileChange('license', $event)"
          />
        </div>
      </div>

      <!-- 聲明 -->
      <p class="text-[12px] text-gray-400 text-center px-2 leading-relaxed">
        提交申請即表示你同意平台服務條款，並確認所填資料真實有效。
        審核通常在 1–3 個工作日內完成。
      </p>

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
    <footer class="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/90 backdrop-blur border-t border-gray-100 px-4 py-3">
      <button
        type="button"
        class="w-full py-3.5 bg-[#007AFF] text-white rounded-2xl text-[17px] font-semibold flex items-center justify-center gap-2 active:opacity-85 transition-opacity disabled:opacity-50"
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        <div v-if="isSubmitting" class="spinner-sm-ios"></div>
        <span v-else>提交申請</span>
      </button>
    </footer>

  </div>
</template>

<script>
import { ref, reactive, onMounted, defineComponent, h } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api.js';

import { ChevronLeftIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/vue/24/outline';

const CITIES = ['台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '南投', '雲林', '嘉義', '台南', '高雄', '屏東', '宜蘭', '花蓮', '台東'];

// ── 子元件：檔案上傳列 ──────────────────────────────
const FileUploadRow = defineComponent({
  name: 'FileUploadRow',
  components: { PhotoIcon },
  props: {
    label: String,
    required: { type: Boolean, default: false },
    file: Object,
    previewUrl: String,
    progress: { type: Number, default: -1 },
    error: String,
  },
  emits: ['change'],
  setup(props, { emit }) {
    const inputRef = ref(null);
    const triggerInput = () => inputRef.value?.click();
    const onChange = (e) => emit('change', e.target.files?.[0] ?? null);

    return () => h('div', { class: 'p-4' }, [
      h('div', {
        class: 'flex items-center gap-3 cursor-pointer',
        onClick: triggerInput,
      }, [
        props.previewUrl
          ? h('img', { src: props.previewUrl, class: 'w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0' })
          : h('div', { class: 'w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0' }, [
              h(PhotoIcon, { class: 'w-7 h-7 text-gray-300' }),
            ]),
        h('div', { class: 'flex-1 min-w-0' }, [
          h('p', { class: 'text-[15px] font-medium text-gray-900' }, props.previewUrl ? `已選擇${props.label}` : `選擇${props.label}照片`),
          h('p', { class: 'text-[12px] text-gray-400 mt-0.5' }, 'JPG / PNG，最大 5MB'),
          props.progress >= 0 && props.progress < 100
            ? h('div', { class: 'mt-2' }, [
                h('div', { class: 'h-1.5 bg-gray-100 rounded-full overflow-hidden' }, [
                  h('div', { class: 'h-full bg-[#007AFF] transition-all duration-200', style: { width: `${props.progress}%` } }),
                ]),
                h('p', { class: 'text-[11px] text-gray-400 mt-0.5' }, `上傳中 ${props.progress}%`),
              ])
            : null,
          props.error ? h('p', { class: 'text-[12px] text-red-500 mt-1' }, props.error) : null,
        ]),
        h('span', { class: 'text-gray-300 text-xl' }, '›'),
      ]),
      h('input', {
        ref: inputRef,
        type: 'file',
        accept: 'image/jpeg,image/jpg,image/png',
        class: 'hidden',
        onChange,
      }),
    ]);
  },
});

export default {
  name: 'CraftsmanApplicationForm',
  components: { ChevronLeftIcon, CheckCircleIcon, FileUploadRow },
  setup() {
    const router = useRouter();

    const form = reactive({
      name: '',
      phone: '',
      lineId: '',
      serviceAreas: [],
      skills: [],
    });

    const contactType  = ref('phone');
    const allSkills    = ref([]);
    const isSubmitting = ref(false);
    const errors       = reactive({});
    const toast        = reactive({ show: false, type: 'success', message: '' });

    const files   = reactive({ businessCard: null, license: null });
    const previews = reactive({ businessCard: null, license: null });
    const uploadProgress = reactive({ businessCard: -1, license: -1 });
    const uploadedUrls   = reactive({ businessCard: null, license: null });

    onMounted(async () => {
      try {
        allSkills.value = await api.get('/skills');
      } catch { /* ignore */ }
    });

    function onFileChange(field, file) {
      if (!file) return;
      files[field] = file;
      previews[field] = URL.createObjectURL(file);
      uploadedUrls[field] = null;
      errors[field === 'businessCard' ? 'businessCard' : ''] = '';
    }

    async function uploadOneFile(field, file) {
      uploadProgress[field] = 50;
      const formData = new FormData();
      formData.append('file', file);

      const token   = localStorage.getItem('jwt');
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${baseURL}/craftsman/upload-file`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || '檔案上傳失敗');
      }

      const { url } = await res.json();
      uploadedUrls[field]   = url;
      uploadProgress[field] = -1;
    }

    async function uploadFiles() {
      const tasks = [];
      if (files.businessCard && !uploadedUrls.businessCard)
        tasks.push(uploadOneFile('businessCard', files.businessCard));
      if (files.license && !uploadedUrls.license)
        tasks.push(uploadOneFile('license', files.license));
      await Promise.all(tasks);
    }

    function validate() {
      Object.keys(errors).forEach(k => delete errors[k]);
      let ok = true;
      if (!form.name.trim()) { errors.name = '請填寫姓名'; ok = false; }
      const noPhone = !form.phone.trim();
      const noLine  = !form.lineId.trim();
      if ((contactType.value === 'phone' && noPhone) ||
          (contactType.value === 'line'  && noLine) ||
          (contactType.value === 'both'  && noPhone && noLine)) {
        errors.contact = '請至少填寫一種聯絡方式'; ok = false;
      }
      if (form.serviceAreas.length === 0) { errors.serviceAreas = '請至少選擇一個服務地區'; ok = false; }
      if (form.skills.length === 0) { errors.skills = '請至少選擇一項服務技能'; ok = false; }
      if (!files.businessCard) { errors.businessCard = '請上傳名片照片'; ok = false; }
      return ok;
    }

    async function handleSubmit() {
      if (!validate()) {
        showToast('請檢查填寫內容', 'error');
        return;
      }
      isSubmitting.value = true;
      try {
        await uploadFiles();

        if (!uploadedUrls.businessCard) throw new Error('名片上傳失敗，請重試');

        await api.post('/craftsman/apply', {
          name:           form.name.trim(),
          phone:          form.phone.trim() || null,
          lineId:         form.lineId.trim() || null,
          serviceAreas:   form.serviceAreas,
          skills:         form.skills,
          businessCardUrl:  uploadedUrls.businessCard,
          licenseImageUrl:  uploadedUrls.license || null,
        });

        showToast('申請已提交！');
        setTimeout(() => router.replace('/craftsman/application-status'), 1200);
      } catch (err) {
        showToast(err.message || '提交失敗，請重試', 'error');
      } finally {
        isSubmitting.value = false;
      }
    }

    function showToast(message, type = 'success') {
      Object.assign(toast, { show: true, type, message });
      setTimeout(() => { toast.show = false; }, 3000);
    }

    return {
      CITIES, form, contactType, allSkills, isSubmitting,
      errors, toast, files, previews, uploadProgress,
      onFileChange, handleSubmit,
    };
  },
};
</script>
