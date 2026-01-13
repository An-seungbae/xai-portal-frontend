<template>
  <div class="gemini-layout">
    <header class="top-header">
      <h1 class="gemini-title">AI Smart Search</h1>
    </header>

    <div class="chat-container scroll-bar" ref="chatHistoryRef">
      <div v-if="messages.length === 0" class="welcome-screen">
        <div class="welcome-logo">✨</div>
        <p class="welcome-text">무엇을 도와드릴까요?</p>
        <p class="sub-text">
          "어제 실패한 봇 분석해줘" 또는 "라이선스 현황 보여줘"
        </p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-row"
        :class="msg.role"
      >
        <div class="profile-area">
          <div v-if="msg.role === 'ai'" class="ai-icon">
            <span class="sparkle-icon">🤖</span>
          </div>
        </div>

        <div class="message-content">
          <div class="msg-info" v-if="msg.role === 'ai'">Charles</div>

          <div class="bubble">
            <div
              class="text-body markdown-body"
              v-html="formatMessage(msg.content)"
            ></div>

            <div
              v-if="msg.data && Object.keys(msg.data).length > 0"
              class="data-viz-wrapper"
            >
              <div class="viz-tabs">
                <button
                  v-for="(_, key) in msg.data"
                  :key="key"
                  class="tab-btn"
                  :class="{ active: msg.activeTab === String(key) }"
                  @click="changeTab(index, String(key))"
                >
                  {{ formatHeader(String(key)) }}
                </button>
              </div>

              <div class="view-options">
                <button
                  @click="setVizMode(index, 'table')"
                  :class="{ active: msg.vizMode === 'table' }"
                >
                  📋 표
                </button>
                <button
                  @click="setVizMode(index, 'chart')"
                  :class="{ active: msg.vizMode === 'chart' }"
                >
                  📊 차트
                </button>
              </div>

              <div
                v-if="msg.vizMode === 'table'"
                class="viz-content table-view"
              >
                <table>
                  <thead>
                    <tr>
                      <th
                        v-for="h in getKeys(msg.data[msg.activeTab || ''])"
                        :key="h"
                      >
                        {{ h }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, rIdx) in getList(
                        msg.data[msg.activeTab || '']
                      )"
                      :key="rIdx"
                    >
                      <td
                        v-for="h in getKeys(msg.data[msg.activeTab || ''])"
                        :key="h"
                      >
                        {{ formatValue(row[h]) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-show="msg.vizMode === 'chart'"
                class="viz-content chart-view"
              >
                <canvas :ref="(el) => setCanvasRef(el, index)"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="message-row ai">
        <div class="profile-area"><span class="sparkle-icon">✨</span></div>
        <div class="message-content">
          <div class="bubble loading-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area-wrapper">
      <div class="input-box-container">
        <button class="attach-btn" title="이미지/파일 첨부 (준비중)">
          <span class="plus-icon">＋</span>
        </button>

        <div class="input-inner-wrapper">
          <input
            type="text"
            class="gemini-input"
            v-model="userPrompt"
            @keyup.enter="sendMessage"
            placeholder="여기에 메시지 입력"
            :disabled="loading"
          />
        </div>

        <button
          class="send-btn"
          :disabled="!userPrompt.trim() || loading"
          @click="sendMessage"
        >
          <svg viewBox="0 0 24 24" class="send-icon">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </div>
      <p class="footer-note">
        Charles can make mistakes. Please verify important information.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import api from "../api/axios";
import Chart from "chart.js/auto";

// === 인터페이스 ===
interface Message {
  role: "user" | "ai";
  content: string;
  data?: any; // Map<String, Object> 형태
  activeTab?: string; // 현재 선택된 데이터 탭 Key
  vizMode?: "table" | "chart"; // 현재 뷰 모드
  chartInstance?: any; // Chart.js 인스턴스
}

// === 상태 변수 ===
const messages = ref<Message[]>([]);
const userPrompt = ref("");
const loading = ref(false);
const chatHistoryRef = ref<HTMLElement | null>(null);
const chartRefs = ref<Record<number, HTMLCanvasElement>>({});

onMounted(() => scrollToBottom());

// === 메시지 전송 ===
async function sendMessage() {
  if (!userPrompt.value.trim() || loading.value) return;

  const currentPrompt = userPrompt.value;

  // 1. 사용자 메시지 추가
  messages.value.push({ role: "user", content: currentPrompt });
  userPrompt.value = "";
  scrollToBottom();
  loading.value = true;

  try {
    // 2. API 호출 (JSON Body)
    const res = await api.post("/api/ai/search", { query: currentPrompt });

    // 3. AI 응답 처리
    const { summary, data } = res.data;

    // 초기 탭 설정 (데이터가 있으면 첫 번째 키)
    let initialTab = "";
    if (data && Object.keys(data).length > 0) {
      // [수정] undefined일 경우 빈 문자열 할당하여 TS2322 에러 해결
      initialTab = Object.keys(data)[0] || "";
    }

    const newMessage: Message = {
      role: "ai",
      content: summary || "검색 결과가 없습니다.",
      data: data,
      activeTab: initialTab,
      vizMode: "table", // 기본은 표
    };

    messages.value.push(newMessage);

    // 차트로 보여달라고 했으면 차트로 전환
    if (currentPrompt.includes("차트") && initialTab) {
      setTimeout(() => setVizMode(messages.value.length - 1, "chart"), 100);
    }
  } catch (e) {
    messages.value.push({
      role: "ai",
      content: "죄송합니다. 처리 중 오류가 발생했습니다.",
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}

// === 시각화 로직 (Chart/Table) ===

function changeTab(index: number, key: string) {
  const msg = messages.value[index];
  if (!msg) return;
  msg.activeTab = key;
  // 탭 변경 시 차트 갱신
  if (msg.vizMode === "chart") {
    nextTick(() => renderChart(index));
  }
}

function setVizMode(index: number, mode: "table" | "chart") {
  const msg = messages.value[index];
  if (!msg) return;
  msg.vizMode = mode;
  if (mode === "chart") {
    nextTick(() => renderChart(index));
  }
}

function setCanvasRef(el: any, index: number) {
  if (el) chartRefs.value[index] = el;
}

function renderChart(index: number) {
  const msg = messages.value[index];
  if (!msg || !msg.data || !msg.activeTab) return;

  const canvas = chartRefs.value[index];
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 기존 차트 파괴
  if (msg.chartInstance) {
    msg.chartInstance.destroy();
  }

  // 데이터 가져오기
  const rawData = msg.data[msg.activeTab];
  const list = getList(rawData);

  // 차트 데이터 가공
  let type: any = "bar";
  let labels: string[] = [];
  let data: number[] = [];
  let label = msg.activeTab;
  const colors = ["#4285f4", "#34a853", "#fbbc05", "#ea4335"];

  if (msg.activeTab === "BOT_STATUS") {
    type = "doughnut";
    const connected = list.filter((i: any) => i.status === "CONNECTED").length;
    const disconnected = list.filter(
      (i: any) => i.status === "DISCONNECTED"
    ).length;
    labels = ["Connected", "Disconnected"];
    data = [connected, disconnected];
  } else {
    // 일반 리스트: 이름이나 ID를 라벨로 사용
    const labelKey =
      Object.keys(list[0] || {}).find(
        (k) => k.toLowerCase().includes("name") || k.includes("Id")
      ) || "id";
    labels = list.map((i: any) => String(i[labelKey] || "Item"));
    data = list.map(() => 1);
  }

  msg.chartInstance = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: type === "doughnut" ? colors : "#4285f4",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: type === "doughnut" },
      },
    },
  });
}

// === 유틸리티 ===
function scrollToBottom() {
  nextTick(() => {
    if (chatHistoryRef.value)
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  });
}

function formatMessage(text: string) {
  if (!text) return "";
  // 마크다운 스타일 줄바꿈 및 볼드 처리
  return text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function formatHeader(key: string) {
  const map: Record<string, string> = {
    BOT_STATUS: "🤖 봇 상태",
    BOT_HISTORY: "📜 실행 이력",
    ERROR_LOG: "🚨 에러 로그",
    LICENSE_INFO: "💳 라이선스",
    KNOWLEDGE_BASE: "📚 문서 검색",
  };
  return map[key] || key;
}

function getList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data.products) return data.products; // 라이선스 대응
  if (typeof data === "object" && data.list) return data.list;
  return [data];
}

function getKeys(data: any): string[] {
  const list = getList(data);
  if (list.length === 0) return [];
  return Object.keys(list[0]).filter((k) => k !== "licenseFeatures");
}

function formatValue(val: any) {
  if (typeof val === "object" && val !== null) return "[Object]";
  return val;
}

onUnmounted(() => {
  messages.value.forEach((m) => {
    if (m.chartInstance) m.chartInstance.destroy();
  });
});
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

.gemini-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background-color: #ffffff;
  font-family: "Pretendard", sans-serif;
  color: #1f1f1f;
}

/* 헤더 */
.top-header {
  text-align: center;
  padding: 16px 0;
  flex-shrink: 0;
}
.gemini-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #4285f4, #9b72cb, #d96570);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 채팅 영역 */
.chat-container {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-screen {
  margin-top: 10vh;
  text-align: center;
  opacity: 0.8;
}
.welcome-logo {
  font-size: 3rem;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}
.welcome-text {
  font-size: 1.8rem;
  font-weight: 500;
  color: #444;
  margin-bottom: 10px;
}
.sub-text {
  color: #888;
}

.message-row {
  display: flex;
  gap: 16px;
  width: 100%;
}
.message-row.user {
  justify-content: flex-end;
}

.profile-area {
  width: 32px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}
.sparkle-icon {
  font-size: 1.5rem;
}

.message-content {
  max-width: 90%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.msg-info {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  margin-left: 2px;
}

/* 말풍선 */
.bubble {
  font-size: 1rem;
  line-height: 1.6;
}
.user .bubble {
  background-color: #f0f4f9;
  color: #1f1f1f;
  padding: 12px 20px;
  border-radius: 20px;
  border-bottom-right-radius: 4px;
}
.ai .bubble {
  background-color: transparent;
  padding: 0;
  color: #1f1f1f;
}

/* 데이터 시각화 래퍼 */
.data-viz-wrapper {
  margin-top: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 탭 버튼 */
.viz-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
}
.tab-btn {
  padding: 6px 14px;
  border: none;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.tab-btn.active {
  background: #e8f0fe;
  color: #1967d2;
}

/* 뷰 옵션 (표/차트) */
.view-options {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
}
.view-options button {
  padding: 4px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}
.view-options button.active {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

/* 테이블/차트 */
.table-view {
  overflow-x: auto;
  max-height: 300px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
th {
  background: #f8f9fa;
  font-weight: 600;
  padding: 8px;
  text-align: left;
  position: sticky;
  top: 0;
  border-bottom: 2px solid #eee;
}
td {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
}
.chart-view {
  height: 300px;
}

/* 입력 영역 */
.input-area-wrapper {
  flex-shrink: 0;
  background-color: #ffffff;
  padding: 0 20px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.input-box-container {
  width: 100%;
  max-width: 800px;
  background-color: #f0f4f9;
  border-radius: 28px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.input-box-container:focus-within {
  background-color: #e9eef6;
}

.attach-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #d3d3d3;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plus-icon {
  font-size: 1.2rem;
  font-weight: 300;
}

.input-inner-wrapper {
  flex: 1;
}
.gemini-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1f1f1f;
  padding: 8px 0;
}

.send-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
}
.send-icon {
  width: 24px;
  height: 24px;
  fill: #1f1f1f;
  transition: fill 0.2s;
}
.send-btn:disabled .send-icon {
  fill: #b0b0b0;
  cursor: not-allowed;
}
.send-btn:not(:disabled):hover .send-icon {
  fill: #0b57d0;
}

.footer-note {
  font-size: 0.75rem;
  color: #757575;
  margin-top: 10px;
}

/* 로딩 애니메이션 */
.loading-bubble {
  display: flex;
  gap: 4px;
  padding: 10px 0;
}
.typing-dot {
  width: 6px;
  height: 6px;
  background: #0b57d0;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

/* 스크롤바 */
.scroll-bar::-webkit-scrollbar {
  width: 6px;
}
.scroll-bar::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
}
</style>
