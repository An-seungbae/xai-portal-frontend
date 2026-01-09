<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-left">
        <p class="sub-text">AI 기반 RPA 통합 관제 시스템</p>
      </div>
      <div class="header-right">
        <span class="date-badge">{{ currentDate }}</span>
      </div>
    </header>

    <section class="metrics-row">
      <div class="metric-card total">
        <div class="metric-icon">🤖</div>
        <div class="metric-info">
          <span class="label">Total Bots</span>
          <span class="value">{{ briefing?.totalExecutions || "-" }}</span>
        </div>
      </div>

      <div class="metric-card success">
        <div class="metric-icon">✅</div>
        <div class="metric-info">
          <span class="label">Success Rate</span>
          <span class="value">{{ briefing?.successRate || 0 }}%</span>
        </div>
      </div>

      <div class="metric-card fail">
        <div class="metric-icon">🚨</div>
        <div class="metric-info">
          <span class="label">Failures</span>
          <span class="value">{{ briefing?.failedCount || 0 }}</span>
        </div>
      </div>

      <div class="metric-card ai">
        <div class="metric-icon">🧠</div>
        <div class="metric-info">
          <span class="label">AI Analyzed</span>
          <span class="value">{{ briefing?.aiAnalysisCount || 0 }}</span>
        </div>
      </div>
    </section>

    <section class="main-content-row">
      <div class="content-card briefing-card">
        <div class="card-header">
          <div class="header-title-row">
            <h3>📢 AI Daily Intelligence Report</h3>
            <div class="lang-toggle">
              <button
                :class="{ active: currentLang === 'ko' }"
                @click="changeLang('ko')"
                title="한국어 리포트"
              >
                KR
              </button>
              <button
                :class="{ active: currentLang === 'en' }"
                @click="changeLang('en')"
                title="English Report"
              >
                EN
              </button>
            </div>
          </div>

          <span v-if="loading" class="status-badge loading">Generating...</span>
          <span v-else class="status-badge done">Updated</span>
        </div>
        <div class="card-body">
          <div v-if="loading" class="loading-container">
            <div class="spinner"></div>
            <p>오늘의 운영 데이터를 분석하여 보고서를 작성 중입니다...</p>
          </div>
          <div
            v-else-if="briefing"
            class="report-content"
            v-html="briefing.briefingMessage"
          ></div>
          <div v-else class="error-text">보고서를 불러오지 못했습니다.</div>
        </div>
      </div>

      <div class="content-card tasks-card">
        <div class="card-header">
          <h3>📊 My Work Status</h3>
        </div>
        <div class="card-body">
          <div class="task-summary">
            <div class="task-item">
              <div class="task-label">
                <span>Pending Errors</span>
                <span class="task-count red">{{
                  briefing?.pendingErrors || 0
                }}</span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill red"
                  :style="{
                    width: getWidth(
                      briefing?.pendingErrors,
                      briefing?.failedCount
                    ),
                  }"
                ></div>
              </div>
            </div>

            <div class="task-item">
              <div class="task-label">
                <span>AI Analyzed</span>
                <span class="task-count purple">{{
                  briefing?.aiAnalysisCount || 0
                }}</span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill purple"
                  :style="{ width: '75%' }"
                ></div>
              </div>
            </div>

            <div class="task-item">
              <div class="task-label">
                <span>System Stability</span>
                <span class="task-count green">Good</span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill green"
                  :style="{ width: (briefing?.successRate || 0) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="quick-links">
            <button class="action-btn" @click="$router.push('/errors')">
              오류 관리 바로가기
            </button>
            <button
              class="action-btn secondary"
              @click="$router.push('/ai/history')"
            >
              분석 이력 보기
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import api from "../api/axios";

interface DailyBriefing {
  briefingMessage: string; // HTML content
  totalExecutions: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  aiAnalysisCount: number;
  pendingErrors: number;
}

export default defineComponent({
  name: "Dashboard",
  setup() {
    const briefing = ref<DailyBriefing | null>(null);
    const loading = ref(true);
    const currentDate = ref(new Date().toLocaleDateString());

    // [추가] 현재 선택된 언어 상태 (기본값: ko)
    const currentLang = ref("ko");

    const fetchBriefing = async () => {
      try {
        loading.value = true;
        // [수정] lang 파라미터 전달
        const res = await api.get("/api/ai/analysis/daily-briefing", {
          params: { lang: currentLang.value },
        });
        briefing.value = res.data;
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        loading.value = false;
      }
    };

    // [추가] 언어 변경 핸들러
    const changeLang = (lang: string) => {
      if (currentLang.value === lang) return;
      currentLang.value = lang;
      fetchBriefing(); // 재조회
    };

    const getWidth = (val: number | undefined, total: number | undefined) => {
      if (!val || !total || total === 0) return "0%";
      return Math.min((val / total) * 100, 100) + "%";
    };

    onMounted(() => {
      fetchBriefing();
    });

    return {
      briefing,
      loading,
      currentDate,
      currentLang,
      changeLang,
      getWidth,
    };
  },
});
</script>

<style scoped>
/* 전체 컨테이너: 부드러운 회색 배경 */
.dashboard-container {
  padding: 30px;
  background-color: #f3f4f6;
  min-height: 100vh;
  font-family: "Pretendard", sans-serif;
}

/* 헤더 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.sub-text {
  color: #6b7280;
  margin: 5px 0 0;
}
.date-badge {
  background: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  color: #4b5563;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Metrics Row (카드 4개) */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}
.metric-card:hover {
  transform: translateY(-5px);
}

.metric-icon {
  font-size: 2rem;
  margin-right: 15px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 12px;
}
.metric-info {
  display: flex;
  flex-direction: column;
}
.metric-info .label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 600;
}
.metric-info .value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
}

/* Main Content Row */
.main-content-row {
  display: flex;
  gap: 20px;
}

/* 공통 카드 스타일 */
.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-header {
  padding: 20px 25px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #374151;
}
.card-body {
  padding: 25px;
  flex-grow: 1;
}

/* AI Briefing Card (왼쪽, 넓게) */
.briefing-card {
  flex: 2; /* 2:1 비율 */
}
.status-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}
.status-badge.loading {
  background: #e0f2fe;
  color: #0369a1;
}
.status-badge.done {
  background: #dcfce7;
  color: #15803d;
}

/* 언어 토글 스타일 */
.lang-toggle {
  background: #f3f4f6;
  border-radius: 20px;
  padding: 2px;
  display: flex;
  gap: 2px;
}
.lang-toggle button {
  background: transparent;
  border: none;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s;
}
.lang-toggle button.active {
  background: white;
  color: #4f46e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.lang-toggle button:hover:not(.active) {
  color: #6b7280;
}

/* 리포트 내용 스타일 (AI가 생성한 HTML 대응) */
.report-content {
  line-height: 1.7;
  color: #4b5563;
}
:deep(h4) {
  color: #1f2937;
  margin-top: 20px;
  margin-bottom: 10px;
  border-left: 4px solid #6366f1;
  padding-left: 10px;
}
:deep(ul) {
  padding-left: 20px;
  margin-bottom: 15px;
}
:deep(li) {
  margin-bottom: 5px;
}

/* Tasks Card (오른쪽) */
.tasks-card {
  flex: 1;
}
.task-item {
  margin-bottom: 25px;
}
.task-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
}
.task-count.red {
  color: #ef4444;
}
.task-count.purple {
  color: #8b5cf6;
}
.task-count.green {
  color: #10b981;
}

.progress-bar-bg {
  height: 10px;
  background: #f3f4f6;
  border-radius: 5px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 1s ease-in-out;
}
.progress-bar-fill.red {
  background: linear-gradient(90deg, #f87171, #ef4444);
}
.progress-bar-fill.purple {
  background: linear-gradient(90deg, #a78bfa, #8b5cf6);
}
.progress-bar-fill.green {
  background: linear-gradient(90deg, #34d399, #10b981);
}

.quick-links {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.action-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  background: #1f2937;
  color: white;
  transition: background 0.2s;
}
.action-btn:hover {
  background: #374151;
}
.action-btn.secondary {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}
.action-btn.secondary:hover {
  background: #f9fafb;
}

/* 로딩 스피너 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
