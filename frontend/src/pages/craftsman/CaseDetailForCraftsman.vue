<template>
  <div class="page">
    <header class="header">
      <button class="back" @click="$router.back()">← 返回</button>
      <h2>案件資訊</h2>
    </header>

    <div v-if="loading" class="loading">載入中...</div>

    <template v-else-if="caseData">
      <div class="info-card">
        <div class="row"><span class="label">服務</span><span>{{ caseData.category }}</span></div>
        <div class="row"><span class="label">地區</span><span>{{ caseData.location_area }}</span></div>
        <div class="row"><span class="label">狀態</span>
          <span :class="['badge', caseData.status]">{{ statusLabel(caseData.status) }}</span>
        </div>
        <div class="row desc"><span class="label">描述</span><span>{{ caseData.description }}</span></div>
        <div v-if="caseData.budget_min" class="row">
          <span class="label">預算</span><span>{{ caseData.budget_min }} ~ {{ caseData.budget_max }} 元</span>
        </div>
      </div>

      <div v-if="contactInfo" class="contact-card">
        <h3>求助者聯絡資訊</h3>
        <div class="info">📞 {{ contactInfo.seeker_phone || '未提供' }}</div>
        <div v-if="contactInfo.seeker_line_id" class="info">LINE: {{ contactInfo.seeker_line_id }}</div>
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
const contactInfo = ref(null);
const loading = ref(true);

const STATUS = { active: '進行中', matched: '已媒合', completed: '已完成', cancelled: '已取消' };
const statusLabel = (s) => STATUS[s] || s;

onMounted(async () => {
  try {
    const id = route.params.id;
    caseData.value = await api.get(`/cases/${id}`);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page { padding: 1rem; }
.header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.back { background: none; border: none; font-size: 1rem; cursor: pointer; }
.info-card { background: white; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.row { display: flex; gap: 0.75rem; padding: 0.4rem 0; font-size: 0.9rem; }
.row.desc { align-items: flex-start; }
.label { color: #999; min-width: 3rem; }
.badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 20px; background: #eee; }
.badge.active { background: #d4f5e0; color: #06C755; }
.contact-card { background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.contact-card h3 { margin-bottom: 0.5rem; }
.info { font-size: 0.9rem; color: #555; margin-top: 0.25rem; }
.loading { text-align: center; margin-top: 4rem; color: #999; }
</style>
