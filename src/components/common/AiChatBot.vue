<template>
  <div class="chatbot-wrapper">
    <button class="chat-fab" @click="toggleChat" :class="{ open: isOpen }">
      <span v-if="!isOpen">💬</span>
      <span v-else>✖</span>
    </button>

    <div class="chat-window" v-if="isOpen">
      <div class="chat-header">
        <div class="header-title">
          <span class="bot-icon">🤖</span>
          <span>AI 운영 비서 Charles</span>
        </div>
        <div class="status-dot"></div>
      </div>

      <div class="chat-body" ref="chatBody">
        <div class="message bot">
          <div class="bubble">
            무엇을 도와드릴까요? 오류 분석이나 운영 현황을 물어봐 주세요.
          </div>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message"
          :class="msg.role"
        >
          <div class="bubble" v-html="formatMessage(msg.content)"></div>
        </div>

        <div v-if="loading" class="message bot">
          <div class="bubble loading-bubble">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>

      <div class="chat-footer">
        <button
          class="voice-btn"
          :class="{ listening: isListening }"
          @click="toggleVoiceCommand"
          title="음성으로 입력하기"
        >
          <span v-if="isListening">🎙️</span>
          <span v-else>🎤</span>
        </button>

        <input
          type="text"
          v-model="inputMessage"
          @keyup.enter="sendMessage"
          placeholder="메시지를 입력하세요..."
          :disabled="loading || isListening"
        />
        <button
          class="send-btn"
          @click="sendMessage"
          :disabled="!inputMessage.trim() || loading"
        >
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import api from "../../api/axios";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
}

// --- 상태 변수 ---
const isOpen = ref(false);
const inputMessage = ref("");
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const chatBody = ref<HTMLElement | null>(null);

// --- 보이스 커맨드 상태 ---
const isListening = ref(false);
let recognition: any = null;

// --- 라이프사이클 (음성 인식 초기화) ---
onMounted(() => {
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "ko-KR"; // 한국어
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening.value = true;
    };

    recognition.onend = () => {
      isListening.value = false;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      inputMessage.value = transcript;
    };

    recognition.onerror = (event: any) => {
      console.error("Voice Error:", event.error);
      isListening.value = false;
    };
  }
});

// --- 기능 함수 ---
function toggleChat() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
}

// 음성 인식 토글
function toggleVoiceCommand() {
  if (!recognition) {
    alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
    return;
  }
  if (isListening.value) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value) return;

  const userText = inputMessage.value;
  messages.value.push({ role: "user", content: userText });
  inputMessage.value = "";
  loading.value = true;
  scrollToBottom();

  try {
    // 백엔드 호출
    const res = await api.post("/api/ai/chat", {
      message: userText,
    });

    // AI 응답 추가
    messages.value.push({ role: "bot", content: res.data.answer });
  } catch (e) {
    messages.value.push({
      role: "bot",
      content: "죄송합니다. 처리 중 오류가 발생했습니다.",
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight;
    }
  });
}

function formatMessage(text: string) {
  return text.replace(/\n/g, "<br>");
}
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  font-family: "Pretendard", sans-serif;
}

/* 플로팅 버튼 (FAB) */
.chat-fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
  transition: transform 0.3s, background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-fab:hover {
  transform: scale(1.1);
}
.chat-fab.open {
  background: #374151;
  transform: rotate(90deg);
}

/* 채팅창 윈도우 */
.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 550px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 헤더 */
.chat-header {
  background: linear-gradient(135deg, #1f2937, #111827);
  padding: 15px 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 5px #10b981;
}

/* 본문 (메시지 영역) */
.chat-body {
  flex: 1;
  padding: 20px;
  background-color: #f9fafb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  width: 100%;
}
.message.user {
  justify-content: flex-end;
}
.message.bot {
  justify-content: flex-start;
}

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.message.user .bubble {
  background-color: #3b82f6;
  color: white;
  border-bottom-right-radius: 2px;
}
.message.bot .bubble {
  background-color: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 로딩 애니메이션 */
.loading-bubble span {
  animation: dots 1.4s infinite;
  opacity: 0;
  margin: 0 1px;
}
.loading-bubble span:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-bubble span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dots {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* 푸터 (입력창) */
.chat-footer {
  padding: 15px;
  background: white;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center; /* 수직 정렬 추가 */
  gap: 10px;
}

/* 보이스 버튼 스타일 */
.voice-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.voice-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

/* 듣고 있을 때 (Listening) 애니메이션 */
.voice-btn.listening {
  border-color: #ef4444;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* 입력창 */
.chat-footer input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
  height: 40px; /* 높이 고정 */
  box-sizing: border-box; /* 패딩 포함 높이 계산 */
}
.chat-footer input:focus {
  border-color: #3b82f6;
}

/* 전송 버튼 */
.send-btn {
  background: #3b82f6;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.2s;
  flex-shrink: 0; /* 버튼 크기 줄어들지 않게 방지 */
}
.send-btn:hover {
  background: #2563eb;
}
.send-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>
