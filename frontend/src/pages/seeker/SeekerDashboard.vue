<template>
  <div class="page">
    <header class="header">
      <h2>我的案件</h2>
      <button class="btn-new" @click="$router.push('/seeker/create')">＋ 新案件</button>
    </header>

    <div v-if="loading" class="loading">載入中...</div>
    <div v-else-if="cases.length === 0" class="empty">尚無案件，點擊右上角建立</div>

    <ul v-else class="case-list">
      <li v-for="c in cases" :key="c.id" class="case-card" @click="$router.push('/seeker/case/' + c.id)">
        <div class="case-title">{{ c.category }} · {{ c.location_area }}</div>
        <div class="case-desc">{{ c.description }}</div>
        <span :class="['badge', c.status]">{{ statusLabel(c.status) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/api.js';

const cases = ref([]);
const loading = ref(true);

const STATUS = { active: '進行中', matched: '已媒合', completed: '已完成', cancelled: '已取消' };
const statusLabel = (s) => STATUS[s] || s;

onMounted(async () => {
  try { cases.value = await api.get('/cases'); }
  finally { loading.value = false; }
});
</script>

<style scoped>
.page { padding: 1rem; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.btn-new { background: #06C755; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
.case-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
.case-card { background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.08); cursor: pointer; }
.case-title { font-weight: bold; margin-bottom: 0.25rem; }
.case-desc { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 20px; background: #eee; }
.badge.active { background: #d4f5e0; color: #06C755; }
.badge.completed { background: #dce8ff; color: #1a6aff; }
.badge.cancelled { background: #ffe5e5; color: #e03; }
.loading, .empty { text-align: center; margin-top: 4rem; color: #999; }
</style>
