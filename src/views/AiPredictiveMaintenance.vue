<template>
  <div class="predictive-container">
    <div class="page-header">
      <h2>🔮 AI 장애 예측 분석 (Predictive Maintenance)</h2>
      <p class="subtitle">
        최근 7일간의 실행 로그를 AI가 분석하여, 잠재적인 장애 위험을 예측합니다.
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>AI가 봇 실행 패턴을 정밀 분석 중입니다... (약 5~10초 소요)</p>
    </div>

    <div v-else-if="!riskList || riskList.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>최근 7일간 실행된 봇 이력이 없어 분석할 데이터가 없습니다.</p>
    </div>

    <div v-else class="content-grid">
      <div class="summary-cards">
        <div class="card critical">
          <div class="card-icon">🚨</div>
          <div class="card-info">
            <h3>CRITICAL</h3>
            <span class="count">{{ criticalCount }}건</span>
            <p>즉시 조치 필요</p>
          </div>
        </div>
        <div class="card warning">
          <div class="card-icon">⚠️</div>
          <div class="card-info">
            <h3>WARNING</h3>
            <span class="count">{{ warningCount }}건</span>
            <p>주의 관찰 요망</p>
          </div>
        </div>
        <div class="card normal">
          <div class="card-icon">✅</div>
          <div class="card-info">
            <h3>NORMAL</h3>
            <span class="count">{{ normalCount }}건</span>
            <p>안정적 운영 중</p>
          </div>
        </div>
      </div>

      <div class="risk-list-section">
        <h3>📊 봇별 상세 분석 리포트</h3>

        <div
          class="risk-item"
          v-for="bot in riskList"
          :key="bot.botName"
          :class="bot.status.toLowerCase()"
        >
          <div class="item-header">
            <div class="bot-info">
              <span class="badge" :class="bot.status.toLowerCase()">{{
                bot.status
              }}</span>
              <span class="bot-name">{{ bot.botName }}</span>
              <span class="dept">{{ bot.department || "운영팀" }}</span>
            </div>
            <div class="risk-score">
              장애 발생 확률
              <strong :style="{ color: getScoreColor(bot.riskScore) }">
                {{ bot.riskScore }}%
              </strong>
            </div>
          </div>

          <div class="item-body">
            <div class="analysis-text">
              <div
                class="prediction-alert"
                v-if="bot.predictedFailure && bot.predictedFailure !== '-'"
              >
                🔥 예측: {{ bot.predictedFailure }}
              </div>
              <div class="ai-comment-box">
                <span class="ai-label">🤖 Charles' Insight:</span>
                <p class="ai-comment">{{ bot.analysisReport }}</p>
              </div>
            </div>

            <div
              class="chart-area"
              v-if="bot.durationHistory && bot.durationHistory.length > 0"
            >
              <p class="chart-title">최근 실행 시간 추이 (분)</p>
              <div class="bar-chart">
                <div
                  v-for="(val, idx) in bot.durationHistory"
                  :key="idx"
                  class="bar-wrapper"
                >
                  <div
                    class="bar"
                    :style="{
                      height: getBarHeight(val, bot.durationHistory) + '%',
                      backgroundColor: getBarColor(
                        bot.status,
                        idx,
                        bot.durationHistory.length
                      ),
                    }"
                    :title="val + '분'"
                  ></div>
                  <span class="label">{{
                    idx === bot.durationHistory.length - 1 ? "최근" : ""
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="item-footer">
            <div class="stat-box">
              <span>평균 소요 시간</span>
              <strong>{{ bot.avgDuration }}분</strong>
            </div>
            <div class="arrow">➔</div>
            <div class="stat-box highlight">
              <span>최근 소요 시간</span>
              <strong>{{ bot.recentDuration }}분</strong>
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

interface BotRisk {
  botName: string;
  department: string;
  riskScore: number;
  status: "CRITICAL" | "WARNING" | "NORMAL";
  avgDuration: number;
  recentDuration: number;
  predictedFailure: string;
  analysisReport: string;
  durationHistory: number[];
}

const riskList = ref<BotRisk[]>([]);
const loading = ref(true);

// 요약 카운트 계산
const criticalCount = computed(
  () => riskList.value.filter((b) => b.status === "CRITICAL").length
);
const warningCount = computed(
  () => riskList.value.filter((b) => b.status === "WARNING").length
);
const normalCount = computed(
  () => riskList.value.filter((b) => b.status === "NORMAL").length
);

onMounted(async () => {
  try {
    loading.value = true;
    // 백엔드 호출 (실제 데이터 분석 요청)
    const res = await api.get("/api/ai/predict/risks");
    riskList.value = res.data || [];
  } catch (e) {
    console.error("Failed to fetch risks", e);
  } finally {
    loading.value = false;
  }
});

// 유틸리티 함수: 점수에 따른 색상 반환
const getScoreColor = (score: number) => {
  if (score >= 80) return "#ef4444"; // Red
  if (score >= 50) return "#f59e0b"; // Orange
  return "#10b981"; // Green
};

// 그래프 막대 색상 (최근 데이터 강조)
const getBarColor = (status: string, index: number, total: number) => {
  const isRecent = index === total - 1;
  if (status === "CRITICAL") return isRecent ? "#ef4444" : "#fca5a5";
  if (status === "WARNING") return isRecent ? "#f59e0b" : "#fcd34d";
  return isRecent ? "#10b981" : "#6ee7b7";
};

// 그래프 막대 높이 계산 (상대 비율)
const getBarHeight = (val: number, history: number[]) => {
  const max = Math.max(...history);
  if (max === 0) return 0;
  // 최소 10% 높이는 보장
  return Math.max((val / max) * 100, 10);
};
</script>

<style scoped>
.predictive-container {
  padding: 30px;
  font-family: "Pretendard", sans-serif;
  background-color: #f3f4f6;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
}
.page-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}
.subtitle {
  color: #6b7280;
  font-size: 14px;
}

/* 로딩 및 빈 상태 */
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
  color: #6b7280;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #4f46e5;
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

/* 요약 카드 */
.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}
.card {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-left: 5px solid transparent;
}
.card.critical {
  border-left-color: #ef4444;
}
.card.warning {
  border-left-color: #f59e0b;
}
.card.normal {
  border-left-color: #10b981;
}

.card-icon {
  width: 45px;
  height: 45px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.card h3 {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}
.card .count {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  display: block;
}
.card p {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

/* 리스트 섹션 */
.risk-list-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
}

.risk-item {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s;
}
.risk-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

/* 아이템 헤더 */
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 15px;
}
.bot-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bot-name {
  font-weight: 700;
  font-size: 16px;
  color: #1f2937;
}
.dept {
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  color: white;
  font-weight: 700;
}
.badge.critical {
  background: #ef4444;
}
.badge.warning {
  background: #f59e0b;
}
.badge.normal {
  background: #10b981;
}

/* 아이템 바디 */
.item-body {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}
.analysis-text {
  flex: 2;
}
.prediction-alert {
  color: #ef4444;
  font-weight: 700;
  margin-bottom: 10px;
}
.ai-comment-box {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
}
.ai-label {
  font-size: 12px;
  font-weight: 700;
  color: #6366f1;
  display: block;
  margin-bottom: 5px;
}
.ai-comment {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

/* 그래프 영역 */
.chart-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.chart-title {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  margin-bottom: 10px;
}
.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 80px;
  gap: 5px;
}
.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  min-width: 8px;
}
.label {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 4px;
}

/* 푸터 */
.item-footer {
  display: flex;
  align-items: center;
  background: #f8fafc;
  padding: 12px 20px;
  border-radius: 8px;
  gap: 20px;
}
.stat-box {
  display: flex;
  flex-direction: column;
}
.stat-box span {
  font-size: 11px;
  color: #6b7280;
}
.stat-box strong {
  font-size: 15px;
  color: #1f2937;
}
.stat-box.highlight strong {
  color: #ef4444;
}
.arrow {
  color: #cbd5e1;
}
</style>
