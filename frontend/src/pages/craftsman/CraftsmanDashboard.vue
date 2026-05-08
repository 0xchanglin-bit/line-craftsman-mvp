<template>
  <div class="page">
    <header class="header">
      <div>
        <h2>師傅面板</h2>
        <p class="sub">{{ user?.name || '師傅' }}</p>
      </div>
      <button class="btn-skills" @click="$router.push('/craftsman/skills')">編輯技能</button>
    </header>

    <div class="stats-row">
      <div class="stat"><div class="num">{{ stats.average_rating }}</div><div class="nm">平均評分</div></div>
      <div class="stat"><div class="num">{{ stats.total_reviews }}</div><div class="nm">評價數</div></div>
    </div>

    <h3 class="section-title">近期案件推播</h3>
    <div class="empty">案件推播通知將透過 LINE 發送</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import auth from '@/stores/auth.js';
import api from '@/utils/api.js';

const user = auth.state.user;
const stats = ref({ average_rating: 0, total_reviews: 0 });

onMounted(async () => {
  try {
    const craftsmanId = user?.craftsman_id;
    if (craftsmanId) {
      const data = await api.get(`/craftsman/${craftsmanId}/ratings`);
      stats.value = { average_rating: data.average_rating, total_reviews: data.total_reviews };
    }
  } catch {}
});
</script>

<style scoped>
.page { padding: 1rem; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.sub { font-size: 0.875rem; color: #999; margin-top: 0.2rem; }
.btn-skills { background: #f0f0f0; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
.stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.stat { flex: 1; background: white; border-radius: 12px; padding: 1rem; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.num { font-size: 1.75rem; font-weight: bold; color: #06C755; }
.nm { font-size: 0.8rem; color: #999; margin-top: 0.25rem; }
.section-title { font-size: 1rem; margin-bottom: 0.5rem; }
.empty { text-align: center; color: #999; margin-top: 2rem; }
</style>
