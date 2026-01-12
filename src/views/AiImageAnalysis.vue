<template>
  <div class="gemini-layout">
    <header class="top-header">
      <h1 class="gemini-title">AI Smart Search</h1>
    </header>

    <div class="chat-container scroll-bar" ref="chatHistoryRef">
      <div v-if="messages.length === 0" class="welcome-screen">
        <div class="welcome-logo">✨</div>
        <p class="welcome-text">무엇을 도와드릴까요?</p>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-row"
        :class="msg.role"
      >
        <div class="profile-area">
          <div v-if="msg.role === 'ai'" class="ai-icon">
            <img :src="aiAvatar" alt="AI" class="ai-avatar" />
          </div>
        </div>

        <div class="message-content">
          <div class="msg-info" v-if="msg.role === 'ai'">AI ChatRPA</div>

          <div class="bubble">
            <div v-if="msg.attachedImage" class="bubble-image-box">
              <img :src="msg.attachedImage" alt="User Upload" />
            </div>

            <div class="text-body" v-html="formatMessage(msg.content)"></div>

            <div v-if="msg.data && msg.data.length > 0" class="data-card">
              <div v-for="(item, i) in msg.data" :key="i" class="data-item">
                <div class="data-row" v-for="(val, key) in item" :key="key">
                  <span class="d-key">{{ formatHeader(key) }}</span>
                  <span class="d-val">{{ formatValue(val) }}</span>
                </div>
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
        <button
          class="attach-btn"
          @click="triggerFileUpload"
          title="이미지 추가"
        >
          <span class="plus-icon">＋</span>
        </button>

        <div class="input-inner-wrapper">
          <div v-if="previewUrl" class="inline-preview">
            <img :src="previewUrl" alt="preview" />
            <button class="remove-preview" @click="clearFile">×</button>
          </div>

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
          :disabled="(!userPrompt && !selectedFile) || loading"
          @click="sendMessage"
        >
          <svg viewBox="0 0 24 24" class="send-icon">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </div>

      <p class="footer-note">
        Charles may display inaccurate info, including about people, so
        double-check its responses.
      </p>

      <input
        type="file"
        ref="fileInputRef"
        accept="image/*"
        @change="onFileChange"
        hidden
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from "vue";
import api from "../api/axios";
import aiAvatar from "../assets/vue.svg";

// === 인터페이스 ===
interface Message {
  role: "user" | "ai";
  content: string;
  timestamp?: string;
  attachedImage?: string;
  data?: any[];
}

// === 상태 변수 ===
const messages = ref<Message[]>([]);
const userPrompt = ref("");
const loading = ref(false);
const chatHistoryRef = ref<HTMLElement | null>(null);

// 파일 관련 변수
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);

onMounted(() => scrollToBottom());

// === 파일 핸들링 ===
function triggerFileUpload() {
  fileInputRef.value?.click();
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];

    // [수정] 파일 존재 여부 명시적 확인 (TypeScript 에러 방지)
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 가능합니다.");
      target.value = "";
      return;
    }

    selectedFile.value = file;
    // 이제 file은 확실히 존재하므로 에러가 발생하지 않습니다.
    previewUrl.value = URL.createObjectURL(file);
  }
  target.value = "";
}

function clearFile() {
  selectedFile.value = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
}

// === 메시지 전송 ===
async function sendMessage() {
  if ((!userPrompt.value.trim() && !selectedFile.value) || loading.value)
    return;

  const currentPrompt = userPrompt.value;
  const currentFile = selectedFile.value;
  const displayImageUrl = previewUrl.value;

  // 1. 사용자 메시지 추가
  messages.value.push({
    role: "user",
    content: currentPrompt,
    attachedImage: currentFile ? displayImageUrl! : undefined,
  });

  // 초기화
  userPrompt.value = "";
  selectedFile.value = null;
  previewUrl.value = null;

  scrollToBottom();
  loading.value = true;

  try {
    const formData = new FormData();
    formData.append("query", currentPrompt || "이미지 분석 요청");
    if (currentFile) {
      formData.append("file", currentFile);
    }

    const res = await api.post("/api/ai/search", formData);

    // 2. AI 응답 추가
    messages.value.push({
      role: "ai",
      content: res.data.summary || "결과가 없습니다.",
      data: res.data.data,
    });
  } catch (e) {
    messages.value.push({
      role: "ai",
      content: "죄송합니다. 오류가 발생했습니다.",
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}

// === 유틸리티 ===
function scrollToBottom() {
  nextTick(() => {
    if (chatHistoryRef.value)
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  });
}

function formatMessage(text: string) {
  return text ? text.replace(/\n/g, "<br>") : "";
}

function formatHeader(key: string | number | symbol) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function formatValue(val: any) {
  if (typeof val === "object" && val !== null) return JSON.stringify(val);
  return val;
}
</script>

<style scoped>
/* 폰트: Pretendard 권장 */
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

.gemini-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background-color: #ffffff;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui,
    Roboto, sans-serif;
  color: #1f1f1f;
}

/* === 헤더 === */
.top-header {
  text-align: center;
  padding: 16px 0;
  flex-shrink: 0;
}
.gemini-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #444;
  margin: 0;
  cursor: pointer;
  display: inline-block;
  background: linear-gradient(90deg, #4285f4, #9b72cb, #d96570);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* === 채팅 영역 === */
.chat-container {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 웰컴 스크린 */
.welcome-screen {
  margin-top: 10vh;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.8;
}
.welcome-logo {
  font-size: 3rem;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}
.welcome-text {
  font-size: 1.5rem;
  font-weight: 500;
  color: #c4c7c5;
}

/* 메시지 로우 */
.message-row {
  display: flex;
  gap: 16px;
  width: 100%;
}
.message-row.user {
  justify-content: flex-end;
}

/* 프로필 아이콘 */
.profile-area {
  width: 32px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}
.ai-avatar {
  width: 28px;
  height: 28px;
}
.sparkle-icon {
  font-size: 1.5rem;
}

/* 내용 영역 */
.message-content {
  max-width: 85%;
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
  font-size: 0.95rem;
  line-height: 1.6;
  word-break: break-word;
}

/* User Bubble */
.user .bubble {
  background-color: #f0f4f9;
  color: #1f1f1f;
  padding: 10px 18px;
  border-radius: 20px;
  border-bottom-right-radius: 4px;
}
.bubble-image-box {
  margin-bottom: 8px;
}
.bubble-image-box img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  display: block;
}

/* AI Bubble */
.ai .bubble {
  background-color: transparent;
  padding: 0;
  color: #1f1f1f;
}

/* 데이터 카드 */
.data-card {
  margin-top: 12px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.data-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 12px;
}
.data-item:last-child {
  border-bottom: none;
}
.data-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 4px;
}
.d-key {
  color: #757575;
  font-weight: 500;
}
.d-val {
  color: #333;
  font-weight: 600;
  text-align: right;
}

/* === 입력 영역 === */
.input-area-wrapper {
  flex-shrink: 0;
  background-color: #ffffff;
  padding: 0 20px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-box-container {
  width: 100%;
  max-width: 800px;
  background-color: #f0f4f9;
  border-radius: 28px;
  padding: 8px 16px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  transition: background-color 0.2s;
}
.input-box-container:focus-within {
  background-color: #e9eef6;
}

/* 첨부 버튼 */
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
  flex-shrink: 0;
  margin-bottom: 6px;
  transition: all 0.2s;
}
.attach-btn:hover {
  background: #bbb;
  color: #fff;
}
.plus-icon {
  font-size: 1.2rem;
  line-height: 1;
  font-weight: 300;
}

/* 내부 래퍼 */
.input-inner-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 44px;
}

/* 인라인 프리뷰 */
.inline-preview {
  display: inline-block;
  position: relative;
  width: fit-content;
  margin-top: 8px;
  margin-bottom: 4px;
}
.inline-preview img {
  height: 60px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.remove-preview {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: #555;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 인풋 */
.gemini-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1f1f1f;
  line-height: 1.5;
  padding: 10px 0;
}
.gemini-input::placeholder {
  color: #757575;
}

/* 전송 버튼 */
.send-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-bottom: 4px;
  flex-shrink: 0;
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
  margin-top: 8px;
  text-align: center;
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
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.scroll-bar::-webkit-scrollbar {
  width: 6px;
}
.scroll-bar::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
}
.scroll-bar::-webkit-scrollbar-track {
  background: transparent;
}
</style>
