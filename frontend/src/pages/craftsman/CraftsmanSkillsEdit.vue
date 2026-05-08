<template>
  <div class="page">
    <header class="header">
      <button class="back" @click="$router.back()">← 返回</button>
      <h2>編輯專長</h2>
    </header>

    <div v-if="loading" class="loading">載入中...</div>

    <template v-else>
      <p class="hint">選擇你提供的服務項目（可多選）</p>

      <div class="skill-grid">
        <button
          v-for="s in skills" :key="s.id"
          :class="['skill-btn', selected.includes(s.id) ? 'active' : '']"
          @click="toggle(s.id)"
        >
          <span class="cat">{{ s.category }}</span>
          <span class="name">{{ s.name }}</span>
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="btn-save" :disabled="saving" @click="save">
        {{ saving ? '儲存中...' : '儲存技能' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/api.js';
import auth from '@/stores/auth.js';

const skills = ref([]);
const selected = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');

const craftsmanId = auth.state.user?.craftsman_id;

onMounted(async () => {
  try {
    const [allSkills, mySkills] = await Promise.all([
      api.get('/skills'),
      craftsmanId ? api.get(`/craftsman/${craftsmanId}/skills`) : Promise.resolve({ skills: [] }),
    ]);
    skills.value = allSkills;
    selected.value = mySkills.skills.map(s => s.id);
  } finally {
    loading.value = false;
  }
});

function toggle(id) {
  const idx = selected.value.indexOf(id);
  if (idx === -1) selected.value.push(id);
  else selected.value.splice(idx, 1);
}

async function save() {
  if (!craftsmanId) return;
  saving.value = true;
  error.value = '';
  try {
    await api.post(`/craftsman/${craftsmanId}/skills`, { skill_ids: selected.value });
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.page { padding: 1rem; }
.header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.back { background: none; border: none; font-size: 1rem; cursor: pointer; }
.hint { font-size: 0.875rem; color: #999; margin-bottom: 1rem; }
.skill-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1.5rem; }
.skill-btn { background: white; border: 2px solid #eee; border-radius: 10px; padding: 0.6rem 0.4rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
.skill-btn.active { border-color: #06C755; background: #f0fff5; }
.cat { font-size: 0.65rem; color: #999; }
.name { font-size: 0.8rem; font-weight: 600; }
.btn-save { width: 100%; padding: 1rem; background: #06C755; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; }
.btn-save:disabled { opacity: 0.6; }
.error { color: #e03; font-size: 0.875rem; margin-bottom: 0.75rem; }
.loading { text-align: center; margin-top: 4rem; color: #999; }
</style>
