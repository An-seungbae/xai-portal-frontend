<template>
  <div class="learning-page">
    <header class="page-header">
      <div class="header-content">
        <h1>🧠 AI 지식 학습 관리</h1>
        <p class="subtitle">
          RPA 자산 데이터와 매뉴얼을 AI 지식베이스(Vector DB)에 동기화하여,
          <strong>챗봇과 스마트 검색</strong>의 지능을 고도화합니다.
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
            A360 Control Room에 연결하여 봇 목록, 스케줄, Runner 상태를
            최신화합니다.
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
              @click="startA360Learning"
              :disabled="loading"
              class="primary-btn"
              :class="{ processing: loading }"
            >
              <span v-if="loading" class="loader"></span>
              {{ loading ? "동기화 진행 중..." : "지금 학습 실행" }}
            </button>
          </div>
        </div>
      </section>

      <section class="panel sub-panel" :class="{ active: !loading }">
        <div class="panel-header">
          <div class="icon-box manual">📂</div>
          <h3>매뉴얼 문서 학습</h3>
        </div>
        <div class="panel-body">
          <p class="desc">
            운영 매뉴얼(PDF, TXT)을 직접 업로드하여 AI에게 특화된 지식을
            학습시킵니다.
          </p>

          <div class="upload-form">
            <input
              type="file"
              id="manualFileUploader"
              class="hidden-input"
              accept=".pdf,.txt,.docx"
              @change="onManualFileChange"
            />
            <label
              for="manualFileUploader"
              class="placeholder-box"
              :class="{ 'has-file': uploadedFile }"
            >
              <span v-if="!uploadedFile"
                >클릭하여 학습할 파일을 선택하세요</span
              >
              <span v-else class="file-info">📄 {{ uploadedFile.name }}</span>
            </label>

            <div class="tag-input-group" v-if="uploadedFile">
              <input
                type="text"
                v-model="learningTag"
                placeholder="문서 분류 태그 (예: 인사/총무, 시스템가이드)"
                class="styled-input"
              />
            </div>
          </div>

          <button
            class="secondary-btn"
            :disabled="!uploadedFile || loading"
            @click="startManualLearning"
          >
            {{ loading ? "문서 분석 중..." : "지식 데이터 등록" }}
          </button>
        </div>
      </section>
    </div>

    <section class="log-terminal" v-if="loading || logs.length > 0">
      <div class="terminal-header">
        <div class="dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="terminal-title">AI Learning & Sync Console</span>
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

const uploadedFile = ref<File | null>(null);
const learningTag = ref("");

const getTime = () => new Date().toLocaleTimeString("ko-KR", { hour12: false });

const addLog = (msg: string, type: "info" | "success" | "error" = "info") => {
  logs.value.push({ time: getTime(), message: msg, type });
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
    }
  });
};

const startA360Learning = async () => {
  if (loading.value) return;

  loading.value = true;
  logs.value = [];
  addLog("A360 자산 데이터 동기화 프로세스를 시작합니다...", "info");
  addLog("Connecting to A360 Control Room...", "info");

  try {
    const res = await api.post("/api/ai/learn/a360");
    addLog("데이터 수집 완료. 지식 인덱싱 작업을 진행합니다.", "info");

    setTimeout(() => {
      addLog(res.data.message, "success");
      addLog("지식베이스 최신화가 완료되었습니다.", "success");
      lastSyncTime.value = new Date().toLocaleString();
      loading.value = false;
    }, 800);
  } catch (e: any) {
    addLog("동기화 중 오류가 발생했습니다.", "error");
    loading.value = false;
  }
};

const onManualFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  // item(0)은 File 또는 null을 반환하여 undefined 문제를 방지합니다.
  if (target.files) {
    uploadedFile.value = target.files.item(0);
  } else {
    uploadedFile.value = null;
  }
};

const startManualLearning = async () => {
  if (!uploadedFile.value || loading.value) return;

  loading.value = true;
  logs.value = [];
  addLog(`신규 지식 습득 프로세스 시작: ${uploadedFile.value.name}`, "info");

  const formData = new FormData();
  formData.append("file", uploadedFile.value);
  formData.append("tag", learningTag.value);

  try {
    const res = await api.post("/api/ai/learn/manual", formData);

    addLog("문서 텍스트 추출 및 의미 분석 완료.", "info");
    addLog("벡터 DB 임베딩 저장 성공.", "info");

    setTimeout(() => {
      addLog(res.data.message, "success");
      uploadedFile.value = null;
      learningTag.value = "";
      loading.value = false;

      const inputEl = document.getElementById(
        "manualFileUploader"
      ) as HTMLInputElement;
      if (inputEl) inputEl.value = "";
    }, 1000);
  } catch (e: any) {
    addLog("지식 등록 중 오류가 발생했습니다.", "error");
    loading.value = false;
  }
};
</script>

<style scoped>
.learning-page {
  padding: 40px;
  max-width: 1300px;
  margin: 0 auto;
  font-family: "Pretendard", sans-serif;
  color: #1f2937;
}
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 30px;
  margin-bottom: 30px;
}

.panel {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}
.sub-panel {
  opacity: 0.9;
}
.sub-panel.active {
  opacity: 1;
  border-color: #4f46e5;
}

.panel-header {
  padding: 24px 30px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #f9fafb;
}
.panel-header h3 {
  font-size: 19px;
  font-weight: 700;
  margin: 0;
  color: #333;
}

.icon-box {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.icon-box.a360 {
  background: #eef2ff;
  color: #4f46e5;
}
.icon-box.manual {
  background: #fef3c7;
  color: #d97706;
}

.panel-body {
  padding: 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.desc {
  color: #666;
  margin-bottom: 24px;
  font-size: 14.5px;
  line-height: 1.6;
}

.target-list {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}
.target-item {
  flex: 1;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.t-icon {
  font-size: 24px;
}
.t-label {
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
}

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

.upload-form {
  margin-bottom: 24px;
}
.placeholder-box {
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.placeholder-box:hover {
  border-color: #4f46e5;
  background: #f8faff;
  color: #4f46e5;
}
.placeholder-box.has-file {
  border-color: #10b981;
  background: #f0fdf4;
  color: #10b981;
  border-style: solid;
}
.file-info {
  font-weight: 700;
}

.tag-input-group {
  margin-top: 15px;
}
.styled-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.styled-input:focus {
  border-color: #4f46e5;
}

.primary-btn,
.secondary-btn {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.primary-btn {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}
.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(79, 70, 229, 0.3);
}
.secondary-btn {
  background: #4b5563;
  color: white;
  margin-top: auto;
}
.secondary-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.loader {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.log-terminal {
  background: #111827;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  margin-top: 20px;
  border: 1px solid #374151;
}
.terminal-header {
  background: #1f2937;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #374151;
}
.dots {
  display: flex;
  gap: 8px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot.red {
  background: #ff5f56;
}
.dot.yellow {
  background: #ffbd2e;
}
.dot.green {
  background: #27c93f;
}

.terminal-title {
  color: #9ca3af;
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
  font-weight: 600;
}

.terminal-body {
  padding: 25px;
  height: 220px;
  overflow-y: auto;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 13.5px;
  line-height: 1.8;
  color: #e5e7eb;
}
.log-line {
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
}
.timestamp {
  color: #6b7280;
  flex-shrink: 0;
}
.msg.success {
  color: #34d399;
  font-weight: 600;
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

.hidden-input {
  display: none;
}
</style>
