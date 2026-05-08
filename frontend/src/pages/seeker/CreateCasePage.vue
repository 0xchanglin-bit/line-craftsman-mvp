<template>
  <div class="page">
    <header class="header">
      <button class="back" @click="$router.back()">← 返回</button>
      <h2>建立新案件</h2>
    </header>

    <form class="form" @submit.prevent="submit">
      <label>服務項目 *
        <select v-model="form.category" required>
          <option value="" disabled>請選擇</option>
          <option v-for="s in skills" :key="s.id" :value="s.name">{{ s.emoji || '' }} {{ s.name }}</option>
        </select>
      </label>

      <label>服務地區 *
        <input v-model="form.location_area" placeholder="例：台中市" required />
      </label>

      <label>問題描述 *
        <textarea v-model="form.description" rows="4" placeholder="詳述問題..." required></textarea>
      </label>

      <label>預算範圍（選填）
        <div class="budget">
          <input v-model.number="form.budget_min" type="number" placeholder="最低" />
          <span>～</span>
          <input v-model.number="form.budget_max" type="number" placeholder="最高" />
          <span>元</span>
        </div>
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" class="btn-submit" :disabled="submitting">
        {{ submitting ? '送出中...' : '發起協尋' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api.js';

const router = useRouter();
const skills = ref([]);
const submitting = ref(false);
const error = ref('');
const form = ref({ category: '', location_area: '', description: '', budget_min: null, budget_max: null });

onMounted(async () => {
  skills.value = await api.get('/skills');
});

async function submit() {
  submitting.value = true;
  error.value = '';
  try {
    const res = await api.post('/cases', form.value);
    router.replace('/seeker/case/' + res.case_id);
  } catch (err) {
    error.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page { padding: 1rem; }
.header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
.back { background: none; border: none; font-size: 1rem; cursor: pointer; }
.form { display: flex; flex-direction: column; gap: 1.25rem; }
label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.9rem; font-weight: 500; }
input, select, textarea { padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; width: 100%; }
.budget { display: flex; align-items: center; gap: 0.5rem; }
.budget input { flex: 1; }
.btn-submit { background: #06C755; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; }
.btn-submit:disabled { opacity: 0.6; }
.error { color: #e03; font-size: 0.875rem; }
</style>
