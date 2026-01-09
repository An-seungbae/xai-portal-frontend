<template>
  <div class="learning-page">
    <header class="page-header">
      <div class="header-content">
        <h1>🧠 AI 지식 학습 관리</h1>
        <p class="subtitle">
          RPA 자산(A360) 데이터를 AI 지식베이스(Vector DB)에 동기화하여,
          <strong>챗봇과 스마트 검색</strong>의 정확도를 높입니다.
        </p>
      </div>
    </header>

    <div class="dashboard-grid">
      <section class="panel main-panel">
        <div class="panel-header">
          <div class="icon-box a360">🔄</div>
          <h3>A360 자산 자동 동기화</h3>
        </div>
        <div class="panel-body">
          <p class="desc">
            A360 Control Room에 연결하여 최신 운영 정보를 가져옵니다.
          </p>

          <div class="target-list">
            <div class="target-item">
              <span class="t-icon">🤖</span>
              <span class="t-label">Bot 목록</span>
            </div>
            <div class="target-item">
              <span class="t-icon">📅</span>
              <span class="t-label">스케줄 정보</span>
            </div>
            <div class="target-item">
              <span class="t-icon">🖥️</span>
              <span class="t-label">Runner 상태</span>
            </div>
          </div>

          <div class="action-area">
            <div class="last-sync" v-if="lastSyncTime">
              마지막 동기화: <span>{{ lastSyncTime }}</span>
            </div>
            <button
              @click="startLearning"
              :disabled="loading"
              class="primary-btn"
              :class="{ processing: loading }"
            >
              <span v-if="loading" class="loader"></span>
              {{ loading ? "데이터 동기화 중..." : "지금 학습 실행" }}
            </button>
          </div>
        </div>
      </section>

      <section class="panel sub-panel">
        <div class="panel-header">
          <div class="icon-box manual">📂</div>
          <h3>매뉴얼 문서 학습 (준비중)</h3>
        </div>
        <div class="panel-body">
          <p class="desc">
            운영 매뉴얼(PDF, TXT)을 직접 업로드하여 AI에게 특화된 지식을 가르칠
            수 있습니다.
          </p>
          <div class="placeholder-box">
            <span>Drag & Drop files here</span>
          </div>
          <button class="secondary-btn" disabled>업로드 기능 준비중</button>
        </div>
      </section>
    </div>

    <section class="log-terminal" v-if="loading || logs.length > 0">
      <div class="terminal-header">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="terminal-title">System Console</span>
      </div>
      <div class="terminal-body" ref="terminalBody">
        <div v-for="(log, index) in logs" :key="index" class="log-line">
          <span class="timestamp">[{{ log.time }}]</span>
          <span :class="['msg', log.type]">> {{ log.message }}</span>
        </div>
        <div v-if="loading" class="log-line blinking">_</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import api from "../api/axios";

interface LogItem {
  time: string;
  message: string;
  type: "info" | "success" | "error";
}

const loading = ref(false);
const logs = ref<LogItem[]>([]);
const lastSyncTime = ref<string | null>(null);
const terminalBody = ref<HTMLElement | null>(null);

// 현재 시간 포맷팅 (HH:mm:ss)
const getTime = () => new Date().toLocaleTimeString("ko-KR", { hour12: false });

const addLog = (msg: string, type: "info" | "success" | "error" = "info") => {
  logs.value.push({ time: getTime(), message: msg, type });
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
    }
  });
};

const startLearning = async () => {
  if (loading.value) return;

  loading.value = true;
  logs.value = []; // 로그 초기화

  addLog("A360 자산 데이터 동기화 프로세스를 시작합니다...", "info");
  addLog("Connecting to A360 Control Room...", "info");

  try {
    // 1. API 호출
    const res = await api.post("/api/ai/learn/a360");

    // 2. 성공 시 시각적 피드백
    addLog("데이터 수신 완료. 벡터 인덱싱 중...", "info");

    // 약간의 지연 효과 (사용자가 읽을 시간 확보)
    setTimeout(() => {
      addLog(res.data.message, "success");
      addLog("모든 프로세스가 성공적으로 완료되었습니다.", "success");
      lastSyncTime.value = new Date().toLocaleString();
      loading.value = false;
    }, 800);
  } catch (e: any) {
    console.error(e);
    addLog("서버 통신 중 오류가 발생했습니다.", "error");
    if (e.response) {
      addLog(`Error Code: ${e.response.status}`, "error");
    }
    loading.value = false;
  }
};
</script>

<style scoped>
.learning-page {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Pretendard", sans-serif;
  color: #1f2937;
}

/* 헤더 영역 */
.page-header {
  margin-bottom: 40px;
}
.page-header h1 {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 10px;
  color: #111827;
}
.subtitle {
  color: #6b7280;
  font-size: 16px;
  line-height: 1.5;
}

/* 대시보드 그리드 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr; /* 왼쪽이 더 넓게 */
  gap: 24px;
  margin-bottom: 30px;
}

/* 패널 공통 스타일 */
.panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 24px 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.panel-header h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.icon-box.a360 {
  background: #e0e7ff;
  color: #4f46e5;
}
.icon-box.manual {
  background: #f3f4f6;
  color: #4b5563;
}

.panel-body {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.desc {
  color: #6b7280;
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.6;
}

/* 타겟 리스트 (아이콘 나열) */
.target-list {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}
.target-item {
  flex: 1;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.t-icon {
  font-size: 24px;
}
.t-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

/* 액션 영역 */
.action-area {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.last-sync {
  font-size: 12px;
  color: #9ca3af;
}
.last-sync span {
  color: #4b5563;
  font-weight: 600;
}

.primary-btn {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.primary-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 로딩 스피너 */
.loader {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}
@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 보조 패널 (수동 업로드) */
.sub-panel {
  opacity: 0.8;
}
.placeholder-box {
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 20px;
}
.secondary-btn {
  width: 100%;
  padding: 12px;
  background: #f3f4f6;
  border: none;
  color: #9ca3af;
  border-radius: 8px;
  font-weight: 600;
  cursor: not-allowed;
}

/* 터미널 (로그) */
.log-terminal {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.terminal-header {
  background: #334155;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.red {
  background: #ef4444;
}
.dot.yellow {
  background: #f59e0b;
}
.dot.green {
  background: #10b981;
}
.terminal-title {
  margin-left: 10px;
  color: #94a3b8;
  font-size: 12px;
  font-family: monospace;
}

.terminal-body {
  padding: 20px;
  height: 200px;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
  color: #e2e8f0;
}
.log-line {
  margin-bottom: 6px;
  display: flex;
  gap: 10px;
}
.timestamp {
  color: #64748b;
}
.msg.info {
  color: #e2e8f0;
}
.msg.success {
  color: #4ade80;
}
.msg.error {
  color: #f87171;
}
.blinking {
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
