<template>
  <div class="page-container">
    <div class="content-wrapper">
      <header class="page-header">
        <div class="header-left">
          <h1>🚨 오류 정밀 분석 리포트</h1>
          <p class="subtitle">AI가 진단한 오류 원인과 해결책을 확인하세요.</p>
        </div>
        <div class="header-right">
          <div class="lang-selector">
            <span class="lang-label">분석 언어</span>
            <select
              v-model="language"
              @change="runAiAnalysis"
              class="modern-select"
            >
              <option value="KO">🇰🇷 한글</option>
              <option value="EN">🇺🇸 English</option>
              <option value="BOTH">🇰🇷 + 🇺🇸</option>
            </select>
          </div>
        </div>
      </header>

      <div class="content-grid">
        <section class="card detail-card">
          <div class="card-header">
            <h2>📊 A360 실행 로그</h2>
            <span
              v-if="detail"
              class="status-badge"
              :class="getStatusClass(detail.jobExecutionStatus)"
            >
              {{ detail.jobExecutionStatus }}
            </span>
          </div>

          <div v-if="detailLoading" class="loading-state">
            <div class="spinner"></div>
            <p>상세 데이터를 불러오는 중...</p>
          </div>
          <div v-else-if="detailError" class="error-state">
            ⚠️ {{ detailError }}
          </div>

          <div v-else-if="detail" class="detail-content">
            <div class="info-group">
              <label>Bot Name</label>
              <div class="value">{{ detail.currentBotName }}</div>
            </div>

            <div class="info-row">
              <div class="info-group">
                <label>Automation</label>
                <div class="value">{{ detail.automationName }}</div>
              </div>
              <div class="info-group">
                <label>Device</label>
                <div class="value">{{ detail.deviceName }}</div>
              </div>
            </div>

            <div class="info-row">
              <div class="info-group">
                <label>User</label>
                <div class="value">{{ detail.username }}</div>
              </div>
              <div class="info-group">
                <label>Time</label>
                <div class="value time">{{ detail.startDateTime }}</div>
              </div>
            </div>

            <div class="error-box">
              <div class="error-header">
                <span class="error-code"
                  >Code: {{ detail.error?.code || "N/A" }}</span
                >
              </div>
              <div class="error-msg">
                {{ detail.error?.message || "메시지 없음" }}
              </div>
              <div class="error-details" v-if="detail.error?.details">
                {{ detail.error?.details }}
              </div>
            </div>
          </div>
        </section>

        <section class="card ai-card">
          <div class="card-header ai-header">
            <h2>🤖 AI Charles Analysis</h2>
            <div class="ai-badge">Powered by GPT-4o</div>
          </div>

          <div v-if="aiLoading" class="loading-state ai-loading">
            <div class="ai-spinner"></div>
            <p>AI가 로그를 분석하고 있습니다...</p>
          </div>
          <div v-else-if="aiError" class="error-state">⚠️ {{ aiError }}</div>

          <div v-else-if="analysis" class="ai-result">
            <div class="ai-section summary-section">
              <h3>📝 핵심 요약</h3>
              <p>{{ analysis.summary }}</p>
            </div>

            <div class="ai-split">
              <div class="ai-sub-section">
                <h3>🧐 원인 후보</h3>
                <ul>
                  <li v-for="(c, i) in analysis.causeCandidates" :key="i">
                    {{ c }}
                  </li>
                </ul>
              </div>
              <div class="ai-sub-section action">
                <h3>🚀 권장 조치</h3>
                <ul>
                  <li v-for="(a, i) in analysis.recommendedActions" :key="i">
                    {{ a }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="ai-section business-section">
              <h3>💼 비즈니스 영향 / 보고용</h3>
              <div class="business-text">"{{ analysis.businessMessage }}"</div>
            </div>
          </div>

          <div v-else class="empty-state">
            <span class="icon">👈</span>
            <p>좌측 상세 정보가 로드되면<br />자동으로 분석을 시작합니다.</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import api from "../api/axios";

// 타입 정의 유지
interface A360ExecutionDetail {
  deviceName?: string;
  automationName?: string;
  currentBotName?: string;
  startDateTime?: string;
  endDateTime?: string;
  jobExecutionStatus?: string;
  username?: string;
  message?: string;
  error?: {
    message?: string;
    details?: string;
    correctiveAction?: string;
    code?: string;
  };
  id?: string;
}

interface AiAnalysisResult {
  summary: string;
  causeCandidates: string[];
  recommendedActions: string[];
  businessMessage: string;
}

export default defineComponent({
  name: "ErrorAiAnalysis",
  setup() {
    const route = useRoute();
    const activityId = ref(route.query.activityId as string);
    const language = ref<"KO" | "EN" | "BOTH">("KO");

    const detailLoading = ref(false);
    const detailError = ref("");
    const detail = ref<A360ExecutionDetail | null>(null);

    const aiLoading = ref(false);
    const aiError = ref("");
    const analysis = ref<AiAnalysisResult | null>(null);

    // 상태에 따른 CSS 클래스
    const getStatusClass = (status?: string) => {
      if (!status) return "gray";
      if (status === "COMPLETED") return "green";
      if (status === "FAILED") return "red";
      return "blue";
    };

    /** A360 상세 조회 */
    const loadExecutionDetail = async () => {
      if (!activityId.value) {
        detailError.value = "activityId가 없습니다.";
        return;
      }
      detailLoading.value = true;
      detailError.value = "";
      try {
        const res = await api.get(`/api/errors/execution/${activityId.value}`);
        detail.value = res.data;
      } catch (err: any) {
        detailError.value =
          err?.response?.data?.message ||
          "A360 상세 정보를 불러오지 못했습니다.";
      } finally {
        detailLoading.value = false;
      }
    };

    /** AI 분석용 텍스트 생성 */
    const buildAiInputText = (d: A360ExecutionDetail) => {
      return [
        `ExecutionId: ${d.id || ""}`,
        `Status: ${d.jobExecutionStatus || ""}`,
        `AutomationName: ${d.automationName || ""}`,
        `BotName: ${d.currentBotName || ""}`,
        `User: ${d.username || ""}`,
        `Device: ${d.deviceName || ""}`,
        `Start: ${d.startDateTime || ""}`,
        `End: ${d.endDateTime || ""}`,
        `ErrorCode: ${d.error?.code || ""}`,
        `ErrorMessage: ${d.error?.message || ""}`,
        `ErrorDetails: ${d.error?.details || ""}`,
        `CorrectiveAction: ${d.error?.correctiveAction || ""}`,
        `RawMessage: ${d.message || ""}`,
      ].join("\n");
    };

    /** AI 분석 실행 */
    const runAiAnalysis = async () => {
      if (!detail.value) return;
      const aiText = buildAiInputText(detail.value);
      if (!aiText.trim()) return;

      aiLoading.value = true;
      aiError.value = "";
      analysis.value = null;

      try {
        const res = await api.post("/api/ai/a360/error-analysis", {
          botName:
            detail.value.currentBotName || detail.value.automationName || "",
          errorCode: detail.value.error?.code || "",
          message: aiText,
          occurredAt:
            detail.value.endDateTime || detail.value.startDateTime || "",
          language: language.value,
        });
        analysis.value = res.data;
      } catch (err: any) {
        aiError.value =
          err?.response?.data?.message || "AI 분석에 실패했습니다.";
      } finally {
        aiLoading.value = false;
      }
    };

    watch(
      () => detail.value,
      (val) => {
        if (val) runAiAnalysis();
      },
      { immediate: false }
    );

    onMounted(() => {
      loadExecutionDetail();
    });

    return {
      language,
      detailLoading,
      detailError,
      detail,
      aiLoading,
      aiError,
      analysis,
      runAiAnalysis,
      getStatusClass,
    };
  },
});
</script>

<style scoped>
/* 구글 폰트 적용 (옵션) */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

.page-container {
  /* 배경은 전체를 채우되, 내용은 중앙 정렬 */
  padding: 40px 20px;
  background-color: #f3f4f6;
  min-height: 100vh;
  font-family: "Inter", "Pretendard", sans-serif;
  color: #1f2937;
  display: flex;
  justify-content: center; /* 가로 중앙 정렬 */
}

/* 중앙 정렬용 래퍼 */
.content-wrapper {
  width: 100%;
  max-width: 1400px; /* 최대 너비 제한으로 양쪽 여백 확보 */
  margin: 0 auto;
}

/* 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  padding: 0 10px; /* 미세한 내부 여백 */
}
.header-left h1 {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: #111827;
}
.header-left .subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
}

/* 언어 선택기 */
.lang-selector {
  display: flex;
  align-items: center;
  background: white;
  padding: 6px 12px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.lang-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-right: 10px;
}
.modern-select {
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  background: transparent;
  outline: none;
  cursor: pointer;
  padding: 4px;
}

/* 그리드 레이아웃 - 좌우 대칭 */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 정확한 1:1 비율 */
  gap: 30px; /* 카드 사이 간격 */
  align-items: start; /* 상단 정렬 */
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr; /* 화면이 좁아지면 1단 */
  }
}

/* 공통 카드 스타일 */
.card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.05);
  padding: 30px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 16px;
}
.card-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #374151;
}

/* === 좌측: 상세 정보 카드 === */
.detail-card {
  border-left: 5px solid #6b7280;
}
.info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}
.info-group {
  flex: 1;
  margin-bottom: 15px;
}
.info-group label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.info-group .value {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
  word-break: break-all;
}
.info-group .value.time {
  font-family: monospace;
  color: #4b5563;
  background: #f9fafb;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 상태 배지 */
.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.status-badge.green {
  background: #dcfce7;
  color: #15803d;
}
.status-badge.red {
  background: #fee2e2;
  color: #991b1b;
}
.status-badge.blue {
  background: #dbeafe;
  color: #1e40af;
}
.status-badge.gray {
  background: #f3f4f6;
  color: #4b5563;
}

/* 에러 박스 */
.error-box {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
}
.error-header {
  margin-bottom: 10px;
}
.error-code {
  background: #991b1b;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
}
.error-msg {
  font-weight: 700;
  color: #7f1d1d;
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 15px;
}
.error-details {
  font-size: 13px;
  color: #b91c1c;
  background: rgba(255, 255, 255, 0.6);
  padding: 12px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(185, 28, 28, 0.1);
}

/* === 우측: AI 카드 === */
.ai-card {
  border: 1px solid #e0e7ff;
  background: linear-gradient(to bottom, #ffffff, #fcfdff);
  position: relative;
  overflow: hidden;
}
/* 상단 그라데이션 보더 효과 */
.ai-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #6366f1, #a855f7);
}

.ai-header h2 {
  background: linear-gradient(90deg, #4f46e5, #9333ea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ai-badge {
  background: #eff6ff;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #c7d2fe;
}

/* AI 결과 스타일 */
.ai-section {
  margin-bottom: 28px;
}
.ai-section h3,
.ai-sub-section h3 {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.summary-section p {
  font-size: 16px;
  line-height: 1.7;
  color: #1f2937;
  font-weight: 500;
  background: #f8fafc;
  padding: 15px;
  border-radius: 10px;
  border-left: 3px solid #6366f1;
}

.ai-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}
.ai-sub-section ul {
  padding-left: 0;
  list-style: none;
  margin: 0;
}
.ai-sub-section li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
}
/* 커스텀 불릿 */
.ai-sub-section li::before {
  content: "•";
  color: #f59e0b; /* 오렌지색 불릿 */
  position: absolute;
  left: 4px;
  top: 0;
  font-weight: bold;
  font-size: 18px;
  line-height: 1.2;
}
.ai-sub-section.action li::before {
  content: "✓";
  color: #10b981; /* 초록색 체크 */
}

.business-section {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e0f2fe;
}
.business-text {
  font-style: italic;
  color: #0369a1;
  font-weight: 500;
  line-height: 1.6;
  font-size: 15px;
}

/* 로딩 스피너 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #6b7280;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #6b7280;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
.ai-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e7ff;
  border-top-color: #6366f1; /* 보라색 */
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #9ca3af;
}
.empty-state .icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
  animation: bounceLeft 1s infinite;
}
@keyframes bounceLeft {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-10px);
  }
}
</style>
