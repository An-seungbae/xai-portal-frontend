<template>
  <div class="insight-container">
    <div class="page-header">
      <h2>💡 AI 스마트 인사이트 (Smart Insight)</h2>
      <p class="subtitle">
        OpenAI가 운영 로그를 정밀 분석하여, 숨겨진 최적화 포인트를 찾아냅니다.
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>AI가 4대 운영 지표(활동, 스케줄, 자원, 라이선스)를 분석 중입니다...</p>
    </div>

    <div
      v-else-if="!insightList || insightList.length === 0"
      class="empty-state"
    >
      <div class="empty-icon">✨</div>
      <p>분석 결과가 없습니다. 다시 시도해주세요.</p>
    </div>

    <div v-else class="content-grid">
      <div class="summary-cards">
        <div class="card proposal">
          <div class="card-icon">💡</div>
          <div class="card-info">
            <h3>발견된 인사이트</h3>
            <span class="count">{{ insightList.length }}건</span>
            <p>즉시 개선 가능</p>
          </div>
        </div>
        <div class="card time-save">
          <div class="card-icon">⏱️</div>
          <div class="card-info">
            <h3>예상 절감 시간</h3>
            <span class="count">{{ totalTimeSave }}분/일</span>
            <p>생산성 향상 효과</p>
          </div>
        </div>
        <div class="card efficiency">
          <div class="card-icon">📈</div>
          <div class="card-info">
            <h3>평균 임팩트 점수</h3>
            <span class="count">{{ averageImpact }}점</span>
            <p>높을수록 시급함</p>
          </div>
        </div>
      </div>

      <div class="insight-list-section">
        <h3>📊 프로세스 최적화 제안 리포트</h3>

        <div
          class="insight-item"
          v-for="item in insightList"
          :key="item.id"
          :class="item.type"
        >
          <div class="item-header">
            <div class="bot-info">
              <span class="badge" :class="item.type">{{
                getTypeText(item.type)
              }}</span>
              <span class="bot-name">{{ item.title }}</span>
            </div>
            <div class="impact-score">
              개선 효과 점수
              <strong :style="{ color: '#6366f1' }">
                {{ item.impactScore }}점
              </strong>
            </div>
          </div>

          <div class="item-body">
            <div class="analysis-text">
              <div class="problem-statement">
                <span class="label">문제 상황:</span> {{ item.problem }}
              </div>
              <div class="ai-comment-box">
                <span class="ai-label">🤖 Charles' Proposal:</span>
                <p class="ai-comment">{{ item.solution }}</p>
              </div>
            </div>

            <div class="action-area">
              <div class="expected-effect">
                <span class="effect-label">기대 효과</span>
                <strong class="effect-value">{{ item.expectedEffect }}</strong>
              </div>
              <button class="action-btn" @click="applyInsight(item)">
                시나리오 적용 ➔
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import api from "../api/axios";

interface InsightItem {
  id: number;
  type: "schedule" | "resource" | "process";
  title: string;
  problem: string;
  solution: string;
  expectedEffect: string;
  impactScore: number;
  timeSaveMin: number;
}

const insightList = ref<InsightItem[]>([]);
const loading = ref(true);

const totalTimeSave = computed(() => {
  return insightList.value.reduce((acc, cur) => acc + cur.timeSaveMin, 0);
});

const averageImpact = computed(() => {
  if (insightList.value.length === 0) return 0;
  const total = insightList.value.reduce(
    (acc, cur) => acc + cur.impactScore,
    0
  );
  return Math.round(total / insightList.value.length);
});

const getTypeText = (type: string) => {
  switch (type) {
    case "schedule":
      return "스케줄 최적화";
    case "resource":
      return "라이선스/자원";
    case "process":
      return "병목 구간 개선";
    default:
      return "일반 제안";
  }
};

const applyInsight = (item: InsightItem) => {
  alert(
    `[${item.title}] 제안을 시스템에 적용합니다.\n예상 효과: ${item.expectedEffect}`
  );
};

onMounted(async () => {
  try {
    loading.value = true;
    const response = await api.get<InsightItem[]>("/api/ai/insight");
    insightList.value = response.data;
  } catch (e) {
    console.error("AI Insight 로드 실패:", e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.insight-container {
  /* [수정] 좌우 여백 확보 및 중앙 정렬 */
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;

  font-family: "Pretendard", sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 30px;
}
.page-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}
.subtitle {
  color: #64748b;
  font-size: 14px;
}

/* 로딩/빈 상태 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  color: #64748b;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

/* 카드 섹션 */
.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}
.card {
  flex: 1;
  background: white;
  padding: 25px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-left: 6px solid transparent;
  transition: transform 0.2s;
}
.card:hover {
  transform: translateY(-3px);
}
.card.proposal {
  border-left-color: #8b5cf6;
}
.card.time-save {
  border-left-color: #3b82f6;
}
.card.efficiency {
  border-left-color: #10b981;
}
.card-icon {
  width: 50px;
  height: 50px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.card h3 {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 4px;
}
.card .count {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  display: block;
}
.card p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}

/* 리스트 섹션 */
.insight-list-section h3 {
  font-size: 18px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 20px;
}
.insight-item {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}
.insight-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #c7d2fe;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 20px;
}
.bot-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bot-name {
  font-weight: 700;
  font-size: 18px;
  color: #1e293b;
}
.badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
}
.badge.schedule {
  background: #8b5cf6;
}
.badge.resource {
  background: #f59e0b;
}
.badge.process {
  background: #ec4899;
}

.item-body {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}
.analysis-text {
  flex: 2;
}
.problem-statement {
  color: #475569;
  margin-bottom: 16px;
  font-size: 15px;
  line-height: 1.5;
}
.problem-statement .label {
  font-weight: 700;
  color: #64748b;
  margin-right: 6px;
}
.ai-comment-box {
  background: #eff6ff;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}
.ai-label {
  font-size: 13px;
  font-weight: 700;
  color: #2563eb;
  display: block;
  margin-bottom: 8px;
}
.ai-comment {
  font-size: 15px;
  color: #1e3a8a;
  line-height: 1.6;
  margin: 0;
}

.action-area {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  padding: 25px;
  border-radius: 16px;
  gap: 20px;
  border: 1px solid #f1f5f9;
}
.expected-effect {
  text-align: center;
}
.effect-label {
  font-size: 13px;
  color: #64748b;
  display: block;
  margin-bottom: 6px;
}
.effect-value {
  font-size: 20px;
  color: #059669;
  font-weight: 800;
}
.action-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}
.action-btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}
</style>
