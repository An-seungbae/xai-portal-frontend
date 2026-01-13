<template>
  <div class="ai-assistant-wrapper">
    <transition name="pop">
      <button
        v-if="!isOpen"
        class="chat-launcher"
        @click="toggleChat"
        title="AI Assistant Charles"
      >
        <span class="launcher-icon">🤖</span>
      </button>
    </transition>

    <transition name="slide-up">
      <div v-if="isOpen" class="chat-window">
        <div class="chat-header">
          <div class="header-left">
            <span class="bot-avatar">🤖</span>
            <div class="header-info">
              <span class="bot-name">Charles</span>
              <span class="bot-status">Online</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="icon-btn" @click="toggleChat">✖</button>
          </div>
        </div>

        <div class="chat-body" ref="chatBody">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-row"
            :class="msg.role"
          >
            <div class="message-bubble">
              <div
                class="message-text"
                v-html="formatMessage(msg.content)"
              ></div>

              <div
                v-if="msg.rawData && msg.role === 'assistant'"
                class="viz-container"
              >
                <div class="viz-tabs">
                  <button
                    @click="setVizMode(index, 'table')"
                    :class="{ active: msg.vizMode === 'table' }"
                  >
                    📋 Table
                  </button>
                  <button
                    @click="setVizMode(index, 'chart')"
                    :class="{ active: msg.vizMode === 'chart' }"
                  >
                    📊 Chart
                  </button>
                </div>

                <div
                  v-if="msg.vizMode === 'table'"
                  class="viz-content table-view"
                >
                  <table>
                    <thead>
                      <tr>
                        <th v-for="key in getKeys(msg.rawData)" :key="key">
                          {{ key }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, i) in getList(msg.rawData)" :key="i">
                        <td v-for="key in getKeys(msg.rawData)" :key="key">
                          {{ formatCell(item[key]) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-if="getList(msg.rawData).length === 0" class="no-data">
                    데이터가 없습니다.
                  </div>
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

          <div v-if="isLoading" class="message-row assistant">
            <div class="message-bubble loading">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <button
            class="mic-btn"
            :class="{ listening: isListening }"
            @click="toggleSpeech"
            :title="isListening ? '듣고 있습니다...' : '음성 입력'"
          >
            {{ isListening ? "👂" : "🎙️" }}
          </button>

          <input
            v-model="inputMessage"
            @keyup.enter="sendMessage"
            :placeholder="
              isListening ? '말씀해주세요...' : '무엇을 도와드릴까요?'
            "
            :disabled="isLoading"
          />
          <button
            class="send-btn"
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isLoading"
          >
            ➤
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick, onUnmounted, onMounted } from "vue";
import api from "../../api/axios";
import Chart from "chart.js/auto";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  rawData?: any;
  vizMode?: "table" | "chart" | null;
  chartInstance?: any;
}

export default defineComponent({
  name: "AiChatBot",
  setup() {
    const isOpen = ref(false);
    const inputMessage = ref("");
    const messages = ref<ChatMessage[]>([
      {
        role: "assistant",
        content: "안녕하십니까, 주인님. 찰스입니다. 무엇을 도와드릴까요?",
      },
    ]);
    const isLoading = ref(false);
    const chatBody = ref<HTMLElement | null>(null);
    const chartRefs = ref<Record<number, HTMLCanvasElement>>({});
    const isListening = ref(false);
    let recognition: any = null;

    // 1. 음성 인식 초기화
    onMounted(() => {
      const win = window as any;
      const SpeechRecognition =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = "ko-KR";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          inputMessage.value = transcript;
          isListening.value = false;
        };
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          isListening.value = false;
        };
        recognition.onend = () => {
          isListening.value = false;
        };
      }
    });

    const toggleSpeech = () => {
      if (!recognition) {
        alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
        return;
      }
      if (isListening.value) {
        recognition.stop();
        isListening.value = false;
      } else {
        recognition.start();
        isListening.value = true;
      }
    };

    const toggleChat = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) scrollToBottom();
    };

    // 2. 메시지 전송 로직 개선
    const sendMessage = async () => {
      if (!inputMessage.value.trim()) return;

      const userMsg = inputMessage.value;

      // [개선] 사용자가 '차트'나 '표'를 언급했는지 확인하여 초기 뷰 모드 설정
      const userMsgLower = userMsg.toLowerCase();
      let initialVizMode: "chart" | "table" | null = null;
      if (
        userMsgLower.includes("차트") ||
        userMsgLower.includes("chart") ||
        userMsgLower.includes("그래프")
      ) {
        initialVizMode = "chart";
      } else if (
        userMsgLower.includes("표") ||
        userMsgLower.includes("table") ||
        userMsgLower.includes("리스트")
      ) {
        initialVizMode = "table";
      }
      // 언급이 없으면 initialVizMode는 null (닫힌 상태)

      messages.value.push({ role: "user", content: userMsg });
      inputMessage.value = "";
      isLoading.value = true;
      scrollToBottom();

      try {
        const res = await api.post("/api/ai/chat", { message: userMsg });
        const { answer, intent, rawData } = res.data;

        messages.value.push({
          role: "assistant",
          content: answer,
          intent: intent,
          rawData: rawData,
          vizMode: rawData ? initialVizMode : null, // 데이터가 있고, 사용자가 요청했을 때만 열림
        });

        // 차트 모드라면 렌더링
        if (rawData && initialVizMode === "chart") {
          nextTick(() => renderChart(messages.value.length - 1));
        }
      } catch (e) {
        messages.value.push({
          role: "assistant",
          content: "죄송합니다. 서버와 연결할 수 없습니다.",
        });
      } finally {
        isLoading.value = false;
        scrollToBottom();
      }
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (chatBody.value)
          chatBody.value.scrollTop = chatBody.value.scrollHeight;
      });
    };

    // --- 시각화 로직 ---
    const setVizMode = (index: number, mode: "table" | "chart") => {
      const msg = messages.value[index];
      if (!msg) return;

      // 이미 열려있는 모드를 다시 누르면 닫기 (Toggle 기능)
      if (msg.vizMode === mode) {
        msg.vizMode = null;
      } else {
        msg.vizMode = mode;
        if (mode === "chart") {
          nextTick(() => renderChart(index));
        }
      }
    };

    const setCanvasRef = (el: any, index: number) => {
      if (el) chartRefs.value[index] = el;
    };

    const renderChart = (index: number) => {
      const msg = messages.value[index];
      if (!msg || !msg.rawData) return;
      const canvas = chartRefs.value[index];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (msg.chartInstance) msg.chartInstance.destroy();

      const list = Array.isArray(msg.rawData) ? msg.rawData : [msg.rawData];
      let type: any = "bar";
      let labels: string[] = [];
      let data: number[] = [];
      let label = "Count";
      let bgColors = ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

      if (msg.intent === "BOT_STATUS") {
        type = "doughnut";
        label = "Device Status";
        const connected = list.filter(
          (i: any) => i.status === "CONNECTED"
        ).length;
        const disconnected = list.filter(
          (i: any) => i.status === "DISCONNECTED"
        ).length;
        labels = ["Connected", "Disconnected"];
        data = [connected, disconnected];
        bgColors = ["#10b981", "#ef4444"];
      } else if (msg.intent === "BOT_HISTORY" || msg.intent === "ERROR_LOG") {
        type = "bar";
        label = "Execution Status";
        const statusMap: Record<string, number> = {};
        list.forEach((i: any) => {
          const s = i.status || "UNKNOWN";
          statusMap[s] = (statusMap[s] || 0) + 1;
        });
        labels = Object.keys(statusMap);
        data = Object.values(statusMap);
      } else {
        // Fallback: 첫 번째 키를 라벨로
        const firstKey = Object.keys(list[0] || {})[0] || "Item";
        labels = list.map((i: any) =>
          i[firstKey] ? String(i[firstKey]) : "Item"
        );
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
              backgroundColor: bgColors,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    };

    // [개선] 데이터 가공 유틸
    const getList = (data: any) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === "object" && data.list) return data.list; // A360 wrapper 대응
      return [data];
    };

    const getKeys = (data: any) => {
      const list = getList(data);
      if (list.length === 0) return [];
      // [수정] 필터링 제거하여 모든 컬럼 표시 (복잡한 객체도 formatCell에서 처리)
      return Object.keys(list[0]);
    };

    const formatCell = (val: any) => {
      if (val === null || val === undefined) return "-";
      // [수정] 객체나 배열도 JSON 문자열로 변환하여 표시
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    };

    const formatMessage = (content: string) => {
      if (!content) return "";
      return content
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    };

    onUnmounted(() => {
      messages.value.forEach((msg) => {
        if (msg.chartInstance) msg.chartInstance.destroy();
      });
      if (recognition) recognition.stop();
    });

    return {
      isOpen,
      inputMessage,
      messages,
      isLoading,
      isListening,
      toggleSpeech,
      toggleChat,
      sendMessage,
      setVizMode,
      setCanvasRef,
      getKeys,
      getList,
      formatCell,
      formatMessage,
      chatBody,
    };
  },
});
</script>

<style scoped>
/* 스타일은 기존과 동일하게 유지 */
.ai-assistant-wrapper {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  font-family: "Pretendard", sans-serif;
}
.chat-launcher {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  border: none;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.chat-launcher:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6);
}
.launcher-icon {
  font-size: 30px;
}

.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.chat-header {
  background: #4f46e5;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bot-avatar {
  font-size: 24px;
  background: rgba(255, 255, 255, 0.2);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-info {
  display: flex;
  flex-direction: column;
}
.bot-name {
  font-weight: 700;
  font-size: 1rem;
}
.bot-status {
  font-size: 0.75rem;
  opacity: 0.9;
}
.icon-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.8;
}
.icon-btn:hover {
  opacity: 1;
}

.chat-body {
  flex: 1;
  background: #f9fafb;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.message-row {
  display: flex;
  width: 100%;
}
.message-row.user {
  justify-content: flex-end;
}
.message-row.assistant {
  justify-content: flex-start;
}
.message-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.5;
  position: relative;
  word-break: break-word;
}
.user .message-bubble {
  background: #4f46e5;
  color: white;
  border-bottom-right-radius: 4px;
}
.assistant .message-bubble {
  background: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.viz-container {
  margin-top: 12px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px;
  border: 1px solid #e2e8f0;
}
.viz-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.viz-tabs button {
  flex: 1;
  padding: 6px;
  font-size: 0.8rem;
  border: none;
  background: #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.viz-tabs button.active {
  background: #4f46e5;
  color: white;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.table-view {
  overflow-x: auto;
  max-height: 200px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  background: white;
}
th,
td {
  padding: 8px;
  border: 1px solid #f1f5f9;
  text-align: left;
  white-space: nowrap;
}
th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  position: sticky;
  top: 0;
}
.no-data {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 0.85rem;
}
.chart-view {
  height: 220px;
  background: white;
  border-radius: 8px;
  padding: 5px;
}

.typing-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #9ca3af;
  border-radius: 50%;
  margin-right: 4px;
  animation: typing 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(1) {
  animation-delay: 0s;
}
.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes typing {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.5);
    opacity: 1;
  }
}

.chat-footer {
  padding: 15px;
  background: white;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 10px;
  align-items: center;
}
.mic-btn {
  background: #f3f4f6;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mic-btn:hover {
  background: #e5e7eb;
}
.mic-btn.listening {
  background: #ef4444;
  color: white;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
.chat-footer input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}
.chat-footer input:focus {
  border-color: #4f46e5;
}
.send-btn {
  background: #4f46e5;
  color: white;
  border: none;
  width: 45px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.send-btn:hover:not(:disabled) {
  background: #4338ca;
}
.send-btn:disabled {
  background: #c7d2fe;
  cursor: not-allowed;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
