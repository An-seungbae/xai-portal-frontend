<template>
  <div class="code-review-container">
    <div class="page-header">
      <h2>👨‍⚕️ AI Code Doctor</h2>
      <p>
        업로드된 봇 소스 코드를 분석하고,
        <strong>학습된 A360 내부 데이터</strong>와 대조하여 무결성을 검증합니다.
      </p>
    </div>

    <div class="upload-section" v-if="!report">
      <div
        class="drop-zone"
        @dragover.prevent
        @drop.prevent="handleDrop"
        :class="{ 'is-dragover': isDragOver }"
        @dragenter="isDragOver = true"
        @dragleave="isDragOver = false"
      >
        <div class="icon">📂</div>
        <h3>봇 파일(.bot, .json, .txt)을 여기에 드래그하세요</h3>
        <p>또는 클릭하여 파일을 선택하십시오</p>

        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept=".json,.txt,.bot,.xml"
          hidden
        />
        <button class="select-btn" @click="triggerFileInput">파일 선택</button>
      </div>

      <div v-if="loading" class="analyzing-overlay">
        <div class="spinner"></div>
        <h3>The Code Doctor is analyzing...</h3>
        <p>내부 지식베이스(A360 Asset)와 대조 중입니다.</p>
      </div>
    </div>

    <div class="report-section" v-else>
      <div class="report-header">
        <h3>📋 진단 리포트</h3>
        <div class="header-actions">
          <span class="badge knowledge">✨ Knowledge Base Applied</span>
          <button class="reset-btn" @click="reset">다른 파일 분석</button>
        </div>
      </div>

      <div class="report-body markdown-body" v-html="formattedReport"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { marked } from "marked";
import api from "../api/axios";

const isDragOver = ref(false);
const loading = ref(false);
const report = ref("");
// DOM 엘리먼트 참조 (템플릿의 ref="fileInput"과 이름 일치)
const fileInput = ref<HTMLInputElement | null>(null);

// [수정됨] 버튼 클릭 시 실행할 함수 (Null 체크 포함)
const triggerFileInput = () => {
  fileInput.value?.click();
};

const formattedReport = computed(() => {
  try {
    return marked(report.value);
  } catch (e) {
    return report.value ? report.value.replace(/\n/g, "<br>") : "";
  }
});

// [수정됨] 파일 선택 핸들러 (타입 안전성 강화)
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) {
      // file이 undefined가 아님을 보장
      uploadFile(file);
    }
  }
};

// [수정됨] 드래그 앤 드롭 핸들러 (타입 안전성 강화)
const handleDrop = (e: DragEvent) => {
  isDragOver.value = false;
  // dataTransfer가 null일 수 있음을 체크
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file) {
      uploadFile(file);
    }
  }
};

const uploadFile = async (file: File) => {
  loading.value = true;
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post("/api/ai/code/review", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    let content = res.data.report;
    // JSON 문자열 파싱 시도 (혹시 모를 이중 인코딩 대비)
    try {
      const jsonRes = JSON.parse(content);
      if (jsonRes.choices && jsonRes.choices[0]) {
        content = jsonRes.choices[0].message.content;
      }
    } catch (e) {
      // 일반 텍스트면 그대로 사용
    }

    report.value = content;
  } catch (e) {
    console.error(e);
    alert("분석 중 오류가 발생했습니다.");
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  report.value = "";
  if (fileInput.value) fileInput.value.value = "";
};
</script>

<style scoped>
/* 스타일은 이전과 동일 */
.code-review-container {
  padding: 30px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: "Pretendard", sans-serif;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}
.page-header h2 {
  font-size: 28px;
  color: #1f2937;
  margin-bottom: 10px;
}
.page-header p {
  color: #6b7280;
}

.upload-section {
  position: relative;
}

.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
  background: #f8fafc;
  transition: all 0.3s;
  cursor: pointer;
}
.drop-zone:hover,
.drop-zone.is-dragover {
  border-color: #4f46e5;
  background: #eef2ff;
}
.icon {
  font-size: 48px;
  margin-bottom: 20px;
}
.select-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.analyzing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #e2e8f0;
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

.report-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.report-header {
  background: #f8fafc;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.badge.knowledge {
  background: #dbeafe;
  color: #1e40af;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  margin-right: 10px;
}
.reset-btn {
  background: white;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.report-body {
  padding: 30px;
  line-height: 1.7;
  color: #334155;
}

/* 마크다운 스타일링 */
:deep(h1),
:deep(h2),
:deep(h3) {
  color: #1f2937;
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 700;
}
:deep(ul),
:deep(ol) {
  padding-left: 20px;
  margin-bottom: 15px;
}
:deep(li) {
  margin-bottom: 5px;
}
:deep(code) {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  color: #ef4444;
  font-size: 0.9em;
}
:deep(pre) {
  background: #1e293b;
  color: #f8fafc;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 15px;
}
:deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}
:deep(strong) {
  color: #111827;
  font-weight: 700;
}
:deep(blockquote) {
  border-left: 4px solid #cbd5e1;
  padding-left: 15px;
  color: #64748b;
  margin: 15px 0;
}
</style>
