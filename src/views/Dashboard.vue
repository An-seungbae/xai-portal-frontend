<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="main-title">Control Tower</h1>
        <p class="sub-text">AI 기반 RPA 통합 관제 시스템</p>
      </div>
      <div class="header-right">
        <span class="date-badge">📅 {{ currentDate }}</span>
      </div>
    </header>

    <section class="metrics-row">
      <div class="metric-card total">
        <div class="metric-icon-bg blue">🤖</div>
        <div class="metric-info">
          <span class="label">Total Bots</span>
          <span class="value">{{ briefing?.totalExecutions || 0 }}</span>
        </div>
      </div>

      <div class="metric-card success">
        <div class="metric-icon-bg green">✅</div>
        <div class="metric-info">
          <span class="label">Success Rate</span>
          <span class="value"
            >{{ briefing?.successRate || 0 }}<small>%</small></span
          >
        </div>
      </div>

      <div class="metric-card fail">
        <div class="metric-icon-bg red">🚨</div>
        <div class="metric-info">
          <span class="label">Failures</span>
          <span class="value">{{ briefing?.failedCount || 0 }}</span>
        </div>
      </div>

      <div class="metric-card ai">
        <div class="metric-icon-bg purple">🧠</div>
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
            <span class="ai-badge">AI Insight</span>
            <h3>Daily Intelligence Report</h3>

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

          <div v-if="loading" class="status-indicator loading">
            <span class="dot"></span> Analyzing...
          </div>
          <div v-else class="status-indicator done">
            <span class="dot"></span> Updated
          </div>
        </div>

        <div class="card-body">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>AI가 오늘의 A360 운영 데이터를 분석하고 있습니다...</p>
          </div>
          <div
            v-else-if="briefing"
            class="report-content"
            v-html="briefing.briefingMessage"
          ></div>
          <div v-else class="error-state">
            <p>리포트를 불러오지 못했습니다.</p>
            <button @click="fetchBriefing" class="retry-btn">다시 시도</button>
          </div>
        </div>
      </div>

      <div class="content-card tasks-card">
        <div class="card-header">
          <h3>📊 Operation Status</h3>
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
                  :style="{
                    width: getWidth(
                      briefing?.aiAnalysisCount,
                      briefing?.failedCount
                    ),
                  }"
                ></div>
              </div>
            </div>

            <div class="task-item">
              <div class="task-label">
                <span>System Stability</span>
                <span
                  class="task-count"
                  :class="(briefing?.successRate || 0) >= 90 ? 'green' : 'red'"
                >
                  {{ (briefing?.successRate || 0) >= 90 ? "Good" : "Check" }}
                </span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  :class="(briefing?.successRate || 0) >= 90 ? 'green' : 'red'"
                  :style="{ width: (briefing?.successRate || 0) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="quick-links">
            <button class="action-btn primary" @click="$router.push('/errors')">
              ⚡ 오류 관리 바로가기
            </button>
            <button
              class="action-btn secondary"
              @click="$router.push('/ai/history')"
            >
              📜 분석 이력 조회
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
  briefingMessage: string; // HTML content from OpenAI
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
    const currentDate = ref(
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    );
    const currentLang = ref("ko");

    const fetchBriefing = async () => {
      loading.value = true;
      try {
        // [수정됨] 올바른 API 경로: /api/ai/a360/daily-briefing
        const res = await api.get("/api/ai/a360/daily-briefing", {
          params: { lang: currentLang.value },
        });
        briefing.value = res.data;
      } catch (e) {
        console.error("Dashboard Data Load Failed:", e);
      } finally {
        loading.value = false;
      }
    };

    const changeLang = (lang: string) => {
      if (currentLang.value === lang) return;
      currentLang.value = lang;
      fetchBriefing();
    };

    const getWidth = (val?: number, total?: number) => {
      if (!val || !total || total === 0) return "5%"; // 최소 너비
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
      fetchBriefing,
      changeLang,
      getWidth,
    };
  },
});
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

.dashboard-container {
  padding: 30px;
  background-color: #f8f9fc;
  min-height: 100vh;
  font-family: "Pretendard", sans-serif;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
}
.main-title {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 5px 0;
}
.sub-text {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}
.date-badge {
  background: white;
  padding: 8px 16px;
  border-radius: 99px;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  font-size: 14px;
}

/* Metrics Row */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 30px;
}
.metric-card {
  background: white;
  padding: 24px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: transform 0.2s;
}
.metric-card:hover {
  transform: translateY(-4px);
}

.metric-icon-bg {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-right: 20px;
}
.metric-icon-bg.blue {
  background: #eff6ff;
}
.metric-icon-bg.green {
  background: #f0fdf4;
}
.metric-icon-bg.red {
  background: #fef2f2;
}
.metric-icon-bg.purple {
  background: #f5f3ff;
}

.metric-info {
  display: flex;
  flex-direction: column;
}
.metric-info .label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.metric-info .value {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.metric-info .value small {
  font-size: 16px;
  color: #94a3b8;
  font-weight: 600;
  margin-left: 2px;
}

/* Main Content */
.main-content-row {
  display: flex;
  gap: 24px;
}
.content-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-header {
  padding: 20px 30px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}
.ai-badge {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
}

.card-body {
  padding: 30px;
  flex-grow: 1;
}

/* Briefing Card */
.briefing-card {
  flex: 2;
}
.status-indicator {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-indicator.loading {
  color: #6366f1;
}
.status-indicator.done {
  color: #10b981;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: block;
}
.status-indicator.loading .dot {
  background: #6366f1;
  animation: pulse 1.5s infinite;
}
.status-indicator.done .dot {
  background: #10b981;
}
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.lang-toggle {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  display: flex;
}
.lang-toggle button {
  border: none;
  background: none;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.lang-toggle button.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.report-content {
  color: #334155;
  line-height: 1.8;
  font-size: 15px;
}
/* AI HTML Content Styles */
:deep(h4) {
  color: #1e293b;
  margin: 24px 0 12px 0;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
:deep(ul) {
  margin: 0 0 20px 0;
  padding-left: 0;
  list-style: none;
}
:deep(li) {
  position: relative;
  padding-left: 20px;
  margin-bottom: 8px;
  color: #475569;
}
:deep(li::before) {
  content: "•";
  color: #cbd5e1;
  position: absolute;
  left: 4px;
  font-weight: bold;
}
:deep(b) {
  color: #0f172a;
  font-weight: 600;
}

/* Tasks Card */
.tasks-card {
  flex: 1;
}
.task-item {
  margin-bottom: 28px;
}
.task-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}
.task-count {
  font-weight: 700;
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
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease;
}
.progress-bar-fill.red {
  background: #ef4444;
}
.progress-bar-fill.purple {
  background: #8b5cf6;
}
.progress-bar-fill.green {
  background: #10b981;
}

.quick-links {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.action-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.action-btn.primary {
  background: #1e293b;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(30, 41, 59, 0.2);
}
.action-btn.primary:hover {
  background: #0f172a;
  transform: translateY(-1px);
}
.action-btn.secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}
.action-btn.secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #64748b;
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.retry-btn {
  margin-top: 10px;
  padding: 6px 16px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
}
</style>
