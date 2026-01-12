<template>
  <div class="predictive-container">
    <div class="predictive-inner">
      <header class="page-header">
        <div class="header-content">
          <h2>🔮 AI 장애 예측 분석 (Predictive Maintenance)</h2>
          <p class="subtitle">
            실행 로그와 스케줄 패턴을 AI가 입체적으로 분석하여 잠재적 위험을
            사전에 차단합니다.
          </p>
        </div>
        <div class="control-panel" v-if="!loading">
          <span class="update-time"
            >Updated: {{ new Date().toLocaleTimeString() }}</span
          >
          <button class="refresh-btn" @click="fetchRisks" title="새로고침">
            🔄
          </button>
        </div>
      </header>

      <div v-if="loading" class="loading-state">
        <div class="loading-content">
          <div class="ai-pulse"></div>
          <p>AI가 봇의 스케줄과 로그 패턴을 분석하고 있습니다...</p>
          <span class="sub-text">약 5~10초 소요됩니다.</span>
        </div>
      </div>

      <div v-else-if="sortedRiskList.length === 0" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">✨</div>
          <h3>위험 징후가 발견되지 않았습니다.</h3>
          <p>
            최근 실행 이력이 없거나, 모든 봇이 매우 안정적으로 운영되고
            있습니다.
          </p>
        </div>
      </div>

      <div v-else class="dashboard-wrapper">
        <section class="summary-cards">
          <div class="stat-card critical">
            <div class="icon-box">🚨</div>
            <div class="text-box">
              <span class="label">CRITICAL</span>
              <div class="value-row">
                <span class="value">{{ criticalCount }}</span>
                <span class="unit">Bots</span>
              </div>
            </div>
            <div class="desc">즉시 조치 필요</div>
          </div>

          <div class="stat-card warning">
            <div class="icon-box">⚠️</div>
            <div class="text-box">
              <span class="label">WARNING</span>
              <div class="value-row">
                <span class="value">{{ warningCount }}</span>
                <span class="unit">Bots</span>
              </div>
            </div>
            <div class="desc">주의 관찰 요망</div>
          </div>

          <div class="stat-card normal">
            <div class="icon-box">✅</div>
            <div class="text-box">
              <span class="label">NORMAL</span>
              <div class="value-row">
                <span class="value">{{ normalCount }}</span>
                <span class="unit">Bots</span>
              </div>
            </div>
            <div class="desc">안정적 운영 중</div>
          </div>
        </section>

        <section class="risk-list">
          <div
            v-for="bot in sortedRiskList"
            :key="bot.botName"
            class="bot-card"
            :class="bot.status.toLowerCase()"
          >
            <div class="card-header">
              <div class="bot-identity">
                <span class="dept-tag">{{ bot.department || "운영팀" }}</span>
                <h3 class="bot-name">{{ bot.botName }}</h3>
              </div>
              <div class="status-tag" :class="bot.status.toLowerCase()">
                {{ bot.status }}
              </div>
            </div>

            <div
              v-if="
                bot.predictedFailure &&
                bot.predictedFailure !== '-' &&
                bot.status !== 'NORMAL'
              "
              class="prediction-alert"
            >
              <span class="flame">🔥</span>
              <span class="alert-msg">{{ bot.predictedFailure }}</span>
            </div>

            <div class="card-body">
              <div class="score-column">
                <div
                  class="score-chart"
                  :style="{ borderColor: getScoreColor(bot.riskScore) }"
                >
                  <div class="score-inner">
                    <span
                      class="score-val"
                      :style="{ color: getScoreColor(bot.riskScore) }"
                    >
                      {{ bot.riskScore }}
                    </span>
                    <span class="score-unit">%</span>
                  </div>
                  <span class="score-label">Risk Score</span>
                </div>
              </div>

              <div class="insight-column">
                <div class="insight-box">
                  <div class="box-title">
                    <span class="ai-icon">🤖</span> Charles' Insight
                  </div>
                  <p class="insight-text">{{ bot.analysisReport }}</p>
                </div>
              </div>

              <div class="chart-column">
                <div class="chart-header">실행 시간 추이 (최근 7회)</div>
                <div class="mini-bar-chart">
                  <div
                    v-for="(val, idx) in bot.durationHistory"
                    :key="idx"
                    class="bar-item"
                  >
                    <div class="bar-bg">
                      <div
                        class="bar-fill"
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
                    </div>
                  </div>
                </div>
                <div class="chart-stats">
                  <div class="stat-item">
                    <span class="l">평균</span>
                    <span class="v">{{ bot.avgDuration }}m</span>
                  </div>
                  <div class="stat-item highlight">
                    <span class="l">최근</span>
                    <span class="v">{{ bot.recentDuration }}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
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

// 위험도가 높은 순으로 정렬
const sortedRiskList = computed(() => {
  return [...riskList.value].sort((a, b) => {
    const statusOrder = { CRITICAL: 3, WARNING: 2, NORMAL: 1 };
    const scoreA = statusOrder[a.status] * 1000 + a.riskScore;
    const scoreB = statusOrder[b.status] * 1000 + b.riskScore;
    return scoreB - scoreA;
  });
});

const criticalCount = computed(
  () => riskList.value.filter((b) => b.status === "CRITICAL").length
);
const warningCount = computed(
  () => riskList.value.filter((b) => b.status === "WARNING").length
);
const normalCount = computed(
  () => riskList.value.filter((b) => b.status === "NORMAL").length
);

const fetchRisks = async () => {
  try {
    loading.value = true;
    const res = await api.get("/api/ai/predict/risks");
    riskList.value = res.data || [];
  } catch (e) {
    console.error("Failed to fetch risks", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRisks();
});

// UI Helpers
const getScoreColor = (score: number) => {
  if (score >= 80) return "#ef4444"; // Red
  if (score >= 50) return "#f59e0b"; // Orange
  return "#10b981"; // Green
};

const getBarHeight = (val: number, history: number[]) => {
  const max = Math.max(...history);
  if (max === 0) return 0;
  return Math.max((val / max) * 100, 15); // 최소 15% 높이 보장
};

const getBarColor = (status: string, index: number, total: number) => {
  const isRecent = index === total - 1;
  if (status === "CRITICAL") return isRecent ? "#ef4444" : "#fca5a5";
  if (status === "WARNING") return isRecent ? "#f59e0b" : "#fcd34d";
  return isRecent ? "#10b981" : "#6ee7b7";
};
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

/* [수정됨] 배경 전체 영역 */
.predictive-container {
  background-color: #f8f9fc;
  min-height: 100vh;
  font-family: "Pretendard", sans-serif;
  color: #1e293b;
  display: flex;
  justify-content: center; /* 내부 콘텐츠 중앙 정렬 */
}

/* [신규] 중앙 정렬된 콘텐츠 영역 */
.predictive-inner {
  width: 100%;
  max-width: 1400px; /* 최대 너비 제한으로 양쪽 여백 확보 */
  padding: 30px; /* 내부 여백 */
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
}
.page-header h2 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: #1e293b;
}
.subtitle {
  color: #64748b;
  font-size: 15px;
  margin: 0;
}
.control-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}
.update-time {
  font-size: 13px;
  color: #94a3b8;
}
.refresh-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.refresh-btn:hover {
  background: #f1f5f9;
  transform: rotate(180deg);
}

/* Loading */
.loading-state {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.loading-content {
  text-align: center;
}
.ai-pulse {
  width: 64px;
  height: 64px;
  background: #6366f1;
  border-radius: 50%;
  margin: 0 auto 24px;
  animation: pulse 2s infinite;
  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
}
@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 20px rgba(99, 102, 241, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}
.loading-content p {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}
.sub-text {
  font-size: 14px;
  color: #64748b;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 100px 0;
}
.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}
.empty-content h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}
.empty-content p {
  color: #64748b;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 30px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}
.stat-card.critical::before {
  background: #ef4444;
}
.stat-card.warning::before {
  background: #f59e0b;
}
.stat-card.normal::before {
  background: #10b981;
}

.icon-box {
  width: 56px;
  height: 56px;
  background: #f8fafc;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.text-box {
  flex: 1;
}
.text-box .label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}
.value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.value-row .value {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.value-row .unit {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 600;
}
.desc {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

/* Bot List */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.bot-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  transition: transform 0.2s;
}
.bot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
.bot-card.critical {
  border-left: 5px solid #ef4444;
}
.bot-card.warning {
  border-left: 5px solid #f59e0b;
}
.bot-card.normal {
  border-left: 5px solid #10b981;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bot-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dept-tag {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}
.bot-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}
.status-tag {
  font-size: 12px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 20px;
}
.status-tag.critical {
  background: #fee2e2;
  color: #991b1b;
}
.status-tag.warning {
  background: #fef3c7;
  color: #92400e;
}
.status-tag.normal {
  background: #dcfce7;
  color: #166534;
}

.prediction-alert {
  background: #fef2f2;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #fee2e2;
}
.flame {
  font-size: 18px;
  animation: flicker 1.5s infinite;
}
.alert-msg {
  color: #b91c1c;
  font-weight: 700;
  font-size: 14px;
}
@keyframes flicker {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.card-body {
  padding: 24px;
  display: grid;
  grid-template-columns: 140px 1fr 220px;
  gap: 30px;
  align-items: start;
}

/* Score */
.score-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.score-chart {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 8px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  position: relative;
}
.score-inner {
  display: flex;
  align-items: baseline;
}
.score-val {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}
.score-unit {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
}
.score-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-top: 4px;
  text-transform: uppercase;
}

/* Insight */
.insight-column {
}
.insight-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f1f5f9;
}
.box-title {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-icon {
  font-size: 18px;
}
.insight-text {
  font-size: 15px;
  color: #475569;
  line-height: 1.6;
  white-space: pre-line;
  margin: 0;
}

/* Chart */
.chart-column {
}
.chart-header {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 10px;
}
.mini-bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 80px;
  gap: 4px;
  margin-bottom: 12px;
}
.bar-item {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}
.bar-bg {
  width: 100%;
  height: 100%;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}
.bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 1s ease;
}

.chart-stats {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-item .l {
  font-size: 10px;
  color: #94a3b8;
}
.stat-item .v {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}
.stat-item.highlight .v {
  color: #0f172a;
}
</style>
