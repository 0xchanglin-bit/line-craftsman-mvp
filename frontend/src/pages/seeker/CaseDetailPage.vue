<template>
  <div class="page">
    <header class="header">
      <button class="back" @click="$router.back()">← 返回</button>
      <h2>案件詳情</h2>
    </header>

    <div v-if="loading" class="loading">載入中...</div>

    <template v-else-if="caseData">
      <div class="info-card">
        <div class="row"><span class="label">服務</span><span>{{ caseData.category }}</span></div>
        <div class="row"><span class="label">地區</span><span>{{ caseData.location_area }}</span></div>
        <div class="row"><span class="label">狀態</span><span :class="['badge', caseData.status]">{{ statusLabel(caseData.status) }}</span></div>
        <div class="row desc"><span class="label">描述</span><span>{{ caseData.description }}</span></div>
        <div v-if="caseData.budget_min" class="row">
          <span class="label">預算</span><span>{{ caseData.budget_min }} ~ {{ caseData.budget_max }} 元</span>
        </div>
      </div>

      <h3 class="section-title">已聯絡的師傅</h3>
      <div v-if="contacts.length === 0" class="empty">尚未聯絡任何師傅</div>
      <ul class="contact-list">
        <li v-for="c in contacts" :key="c.id" class="contact-card">
          <div class="name">👷 {{ c.craftsman_name }}</div>
          <div class="info">📞 {{ c.craftsman_phone }}</div>
          <div v-if="c.craftsman_line_id" class="info">LINE: {{ c.craftsman_line_id }}</div>
          <span :class="['badge', c.status]">{{ c.status }}</span>
        </li>
      </ul>

      <div v-if="caseData.status === 'active'" class="actions">
        <button class="btn-complete" @click="updateStatus('completed')">標記為已完成</button>
        <button class="btn-cancel" @click="updateStatus('cancelled')">取消案件</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/utils/api.js';

const route = useRoute();
const caseData = ref(null);
const contacts = ref([]);
const loading = ref(true);

const STATUS = { active: '進行中', matched: '已媒合', completed: '已完成', cancelled: '已取消' };
const statusLabel = (s) => STATUS[s] || s;

onMounted(async () => {
  try {
    const id = route.params.id;
    const [c, ct] = await Promise.all([
      api.get(`/cases/${id}`),
      api.get(`/case/${id}/contacts`),
    ]);
    caseData.value = c;
    contacts.value = ct;
  } finally {
    loading.value = false;
  }
});

async function updateStatus(status) {
  await api.patch(`/cases/${caseData.value.id}`, { status });
  caseData.value.status = status;
}
</script>

<style scoped>
.page { padding: 1rem; }
.header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.back { background: none; border: none; font-size: 1rem; cursor: pointer; }
.info-card { background: white; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.row { display: flex; gap: 0.75rem; padding: 0.4rem 0; font-size: 0.9rem; }
.row.desc { align-items: flex-start; }
.label { color: #999; min-width: 3rem; }
.badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 20px; background: #eee; }
.badge.active { background: #d4f5e0; color: #06C755; }
.badge.completed { background: #dce8ff; color: #1a6aff; }
.section-title { font-size: 1rem; margin: 1rem 0 0.5rem; }
.contact-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
.contact-card { background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.name { font-weight: bold; margin-bottom: 0.25rem; }
.info { font-size: 0.875rem; color: #555; }
.actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-complete { flex: 1; padding: 0.75rem; background: #06C755; color: white; border: none; border-radius: 8px; cursor: pointer; }
.btn-cancel { flex: 1; padding: 0.75rem; background: #eee; color: #555; border: none; border-radius: 8px; cursor: pointer; }
.loading, .empty { text-align: center; margin-top: 2rem; color: #999; }
</style>
