<template>
  <div class="page-container">
    <div class="content-wrapper">
      <header class="page-header">
        <div class="header-left">
          <button @click="goBack" class="back-btn">← 뒤로가기</button>
          <div class="title-group">
            <h1>🚨 오류 정밀 분석 리포트</h1>
            <p class="subtitle">AI가 진단한 오류 원인과 해결책을 확인하세요.</p>
          </div>
        </div>
        <div class="header-right">
          <div class="lang-selector">
            <span class="lang-label">분석 언어</span>
            <select
              v-model="language"
              @change="triggerReAnalysis"
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
                <span class="error-code">
                  Code: {{ detail.error?.code || "N/A" }}
                </span>
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
            <div class="ai-title">
              <h2>🤖 AI Charles Analysis</h2>
              <div class="ai-badge">GPT-4o</div>
            </div>
            <button
              v-if="!aiLoading && detail"
              @click="triggerReAnalysis"
              class="retry-btn"
            >
              🔄 재분석
            </button>
          </div>

          <div v-if="aiLoading" class="loading-state ai-loading">
            <div class="ai-spinner"></div>
            <p>AI가 로그를 정밀 분석하고 있습니다...</p>
          </div>
          <div v-else-if="aiError" class="error-state">
            ⚠️ {{ aiError }}
            <button @click="triggerReAnalysis" class="retry-link">
              다시 시도
            </button>
          </div>

          <div v-else-if="analysis" class="ai-result">
            <div class="ai-section summary-section">
              <h3>📝 핵심 요약</h3>
              <p class="result-text">{{ analysis.summary }}</p>
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
import { useRoute, useRouter } from "vue-router";
import api from "../api/axios";

interface A360ExecutionDetail {
  id?: string;
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
    const router = useRouter(); // router 사용을 위해 선언
    const activityId = ref(route.query.activityId as string);
    const language = ref<"KO" | "EN" | "BOTH">("KO");

    const detailLoading = ref(false);
    const detailError = ref("");
    const detail = ref<A360ExecutionDetail | null>(null);

    const aiLoading = ref(false);
    const aiError = ref("");
    const analysis = ref<AiAnalysisResult | null>(null);

    // 뒤로가기 함수 구현 (router 사용)
    const goBack = () => {
      router.back();
    };

    const getStatusClass = (status?: string) => {
      if (!status) return "gray";
      const s = status.toUpperCase();
      if (s === "COMPLETED") return "green";
      if (["FAILED", "RUN_FAILED", "ABORTED", "TIMED_OUT"].includes(s))
        return "red";
      return "blue";
    };

    const loadExecutionDetail = async () => {
      if (!activityId.value) {
        detailError.value = "Activity ID가 전달되지 않았습니다.";
        return;
      }
      detailLoading.value = true;
      detailError.value = "";

      try {
        const res = await api.get(`/api/errors/execution/${activityId.value}`);
        detail.value = res.data;
      } catch (err: any) {
        console.error("Detail Load Error:", err);
        detailError.value =
          err?.response?.data?.message || "상세 정보를 불러오지 못했습니다.";
      } finally {
        detailLoading.value = false;
      }
    };

    // AI 분석용 텍스트 조립
    const buildAiInputText = (d: A360ExecutionDetail) => {
      // 메시지가 너무 길 경우 잘라서 전송 (토큰 제한 방지)
      let rawMsg = d.message || "";
      if (rawMsg.length > 2000)
        rawMsg = rawMsg.substring(0, 2000) + "...(truncated)";

      return [
        `ExecutionId: ${d.id || "N/A"}`,
        `Status: ${d.jobExecutionStatus || "Unknown"}`,
        `AutomationName: ${d.automationName || "N/A"}`,
        `BotName: ${d.currentBotName || "N/A"}`,
        `User: ${d.username || "N/A"}`,
        `Device: ${d.deviceName || "N/A"}`,
        `Time: ${d.startDateTime || ""} ~ ${d.endDateTime || ""}`,
        `ErrorCode: ${d.error?.code || "N/A"}`,
        `ErrorMessage: ${d.error?.message || "N/A"}`,
        `ErrorDetails: ${d.error?.details || "N/A"}`,
        `SysMessage: ${rawMsg}`,
      ].join("\n");
    };

    const runAiAnalysis = async () => {
      if (!detail.value) return;

      const aiText = buildAiInputText(detail.value);
      if (!aiText.trim()) return;

      aiLoading.value = true;
      aiError.value = "";
      analysis.value = null;

      try {
        // Backend DTO: A360AiAnalysisRequest와 필드명 일치 필수
        const payload = {
          botName:
            detail.value.currentBotName ||
            detail.value.automationName ||
            "Unknown Bot",
          errorCode: detail.value.error?.code || "Unknown Code",
          message: aiText,
          occurredAt:
            detail.value.endDateTime ||
            detail.value.startDateTime ||
            new Date().toISOString(),
          language: language.value,
        };

        const res = await api.post("/api/ai/a360/error-analysis", payload);
        analysis.value = res.data;
      } catch (err: any) {
        console.error("AI Analysis Error:", err);
        aiError.value =
          err?.response?.data?.message || "AI 분석 서버 연결에 실패했습니다.";
      } finally {
        aiLoading.value = false;
      }
    };

    const triggerReAnalysis = () => {
      runAiAnalysis();
    };

    // detail이 로드되면 자동으로 AI 분석 시작
    watch(
      () => detail.value,
      (val) => {
        if (val) runAiAnalysis();
      }
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
      triggerReAnalysis,
      getStatusClass,
      goBack, // 함수 반환
    };
  },
});
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

.page-container {
  padding: 40px 20px;
  background-color: #f3f4f6;
  min-height: 100vh;
  font-family: "Pretendard", sans-serif;
  color: #1f2937;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  width: 100%;
  max-width: 1400px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  padding: 0 10px;
}
.header-left .back-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 8px;
  padding: 0;
}
.header-left .back-btn:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.header-left h1 {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: #111827;
}
.header-left .subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
}

/* Language Selector */
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

/* Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: start;
}
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* Cards */
.card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.05);
  padding: 30px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}
.card:hover {
  transform: translateY(-2px);
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

/* Detail Card Specifics */
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

/* Badges */
.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
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

/* Error Box */
.error-box {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
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
  margin: 12px 0;
  font-size: 15px;
  line-height: 1.5;
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

/* AI Card Specifics */
.ai-card {
  border: 1px solid #e0e7ff;
  background: linear-gradient(to bottom, #ffffff, #fcfdff);
  position: relative;
  overflow: hidden;
}
.ai-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #6366f1, #a855f7);
}
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ai-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ai-title h2 {
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
.retry-btn {
  background: white;
  border: 1px solid #c7d2fe;
  color: #4f46e5;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}
.retry-btn:hover {
  background: #eff6ff;
}

.ai-section {
  margin-bottom: 28px;
}
.ai-section h3,
.ai-sub-section h3 {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 600;
}
.result-text {
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
.ai-sub-section li::before {
  content: "•";
  color: #f59e0b;
  position: absolute;
  left: 4px;
  top: 0;
  font-weight: bold;
  font-size: 18px;
}
.ai-sub-section.action li::before {
  content: "✓";
  color: #10b981;
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

/* Loading & Error */
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
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  color: #991b1b;
  padding: 20px;
  background: #fef2f2;
  border-radius: 12px;
}
.retry-link {
  background: none;
  border: none;
  text-decoration: underline;
  color: #991b1b;
  font-weight: bold;
  cursor: pointer;
  margin-left: 8px;
}

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
