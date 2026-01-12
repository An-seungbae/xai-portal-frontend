<template>
  <div class="analysis-container">
    <header class="page-header">
      <h1 class="page-title">👁️ Vision AI 이미지 분석</h1>
      <p class="page-desc">
        문서의 텍스트를 추출하거나, RPA 실행 화면의 에러를 시각적으로
        진단합니다.
      </p>
    </header>

    <div class="mode-tabs">
      <button
        class="tab-btn"
        :class="{ active: analysisMode === 'OCR' }"
        @click="analysisMode = 'OCR'"
      >
        📄 문서 데이터 추출 (OCR)
      </button>
      <button
        class="tab-btn"
        :class="{ active: analysisMode === 'DIAGNOSIS' }"
        @click="analysisMode = 'DIAGNOSIS'"
      >
        🖥️ RPA 화면 에러 진단 (Vision)
      </button>
    </div>

    <section class="control-panel card">
      <div class="panel-body">
        <div class="upload-section">
          <h3 class="section-title">
            {{ analysisMode === "OCR" ? "📁 문서 이미지" : "💻 스크린샷" }}
            업로드
          </h3>

          <div class="file-upload-box" :class="{ 'has-file': previewUrl }">
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              @change="onFileChange"
              class="hidden-input"
            />
            <label for="fileInput" class="upload-label">
              <div v-if="!previewUrl" class="upload-placeholder">
                <div class="icon-circle">
                  <span class="upload-icon">{{
                    analysisMode === "OCR" ? "📄" : "🖥️"
                  }}</span>
                </div>
                <p class="main-text">
                  {{
                    analysisMode === "OCR"
                      ? "문서 이미지를"
                      : "에러 화면 스크린샷을"
                  }}
                  드래그하세요
                </p>
                <span class="sub-text">지원 형식: JPG, PNG (최대 10MB)</span>
              </div>
              <div v-else class="preview-container">
                <img :src="previewUrl" alt="Preview" class="preview-img" />
                <div class="change-overlay">
                  <span class="overlay-btn">이미지 변경</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div class="options-section">
          <div class="options-content">
            <h3 class="section-title">⚙️ 분석 설정</h3>

            <transition name="fade">
              <div v-if="analysisMode === 'DIAGNOSIS'" class="option-group">
                <label class="option-label">사용자 코멘트 (선택)</label>
                <textarea
                  v-model="userPrompt"
                  class="styled-textarea-sm"
                  placeholder="예: 로그인 버튼을 눌렀는데 반응이 없습니다."
                ></textarea>
              </div>
            </transition>

            <div class="option-group">
              <label class="option-label">응답 언어</label>
              <div class="select-wrapper">
                <select v-model="language" class="styled-select">
                  <option value="KO">🇰🇷 한국어 (Korean)</option>
                  <option value="EN">🇺🇸 영어 (English)</option>
                </select>
              </div>
            </div>

            <div class="action-group">
              <button
                class="btn-primary analyze-btn"
                :class="analysisMode === 'DIAGNOSIS' ? 'btn-vision' : ''"
                :disabled="!selectedFileRef || loading"
                @click="analyze"
              >
                <div class="btn-content">
                  <span class="btn-icon" v-if="!loading">{{
                    analysisMode === "OCR" ? "🔍" : "🧠"
                  }}</span>
                  <span class="btn-text">
                    {{
                      loading
                        ? "AI 분석 진행 중..."
                        : analysisMode === "OCR"
                        ? "텍스트 추출 시작"
                        : "화면 원인 진단 시작"
                    }}
                  </span>
                </div>
              </button>

              <button
                class="btn-secondary save-btn"
                :disabled="!result || saving || savedDocumentId !== null"
                @click="saveToDb"
              >
                <span class="btn-icon">💾</span>
                {{
                  saving
                    ? "저장 중..."
                    : savedDocumentId
                    ? "저장 완료"
                    : "분석 결과 저장"
                }}
              </button>
            </div>

            <transition name="fade">
              <div v-if="savedDocumentId" class="save-success-msg">
                <span class="check-icon">✅</span>
                <span
                  >저장되었습니다. (ID: <strong>{{ savedDocumentId }}</strong
                  >)</span
                >
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <transition name="fade">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-container">
          <div
            class="spinner"
            :class="{ 'vision-spinner': analysisMode === 'DIAGNOSIS' }"
          ></div>
          <p class="loading-title">
            {{
              analysisMode === "OCR"
                ? "OCR 텍스트 추출 중..."
                : "GPT-4o Vision 분석 중..."
            }}
          </p>
          <p class="loading-desc">
            {{
              analysisMode === "OCR"
                ? "문서의 구조를 파악하고 있습니다."
                : "화면의 UI 요소와 에러 메시지를 시각적으로 해석합니다."
            }}
          </p>
        </div>
      </div>
    </transition>

    <transition name="slide-up">
      <div v-if="result && !loading" class="result-container">
        <div
          class="insight-banner"
          :class="{ 'vision-banner': analysisMode === 'DIAGNOSIS' }"
        >
          <div class="insight-icon-box">💡</div>
          <div class="insight-content">
            <strong class="insight-title">
              {{
                analysisMode === "OCR"
                  ? "문서 분석 인사이트"
                  : "AI 화면 진단 결과"
              }}
            </strong>
            <p class="insight-text">
              {{ result.businessMessage || "분석된 메시지가 없습니다." }}
            </p>
          </div>
        </div>

        <div class="result-grid">
          <section class="card summary-card">
            <div class="card-header">
              <h3>🤖 상세 분석 리포트</h3>
            </div>
            <div class="card-body scrollable-body">
              <div class="report-section">
                <h4>📄 요약 (Summary)</h4>
                <p class="report-text">{{ result.summary || "-" }}</p>
              </div>

              <div class="report-section">
                <h4>
                  ⚠️
                  {{
                    analysisMode === "OCR"
                      ? "주요 이슈"
                      : "추정 원인 (Root Cause)"
                  }}
                </h4>
                <ul
                  class="styled-list bullet"
                  v-if="result.causeCandidates?.length"
                >
                  <li v-for="(c, i) in result.causeCandidates" :key="i">
                    {{ c }}
                  </li>
                </ul>
                <p v-else class="empty-text">-</p>
              </div>

              <div class="report-section">
                <h4>🚀 권장 조치 (Action Plan)</h4>
                <ul
                  class="styled-list check"
                  v-if="result.recommendedActions?.length"
                >
                  <li v-for="(a, i) in result.recommendedActions" :key="i">
                    {{ a }}
                  </li>
                </ul>
                <p v-else class="empty-text">-</p>
              </div>
            </div>
          </section>

          <section class="card data-card" v-if="analysisMode === 'OCR'">
            <div class="card-header">
              <h3>📊 구조화된 데이터</h3>
              <span
                class="doc-type-badge"
                v-if="result.structuredData?.documentType"
              >
                {{ result.structuredData.documentType }}
              </span>
            </div>
            <div class="card-body table-wrapper">
              <table class="styled-table" v-if="hasFields">
                <colgroup>
                  <col style="width: 35%" />
                  <col style="width: 45%" />
                  <col style="width: 20%" />
                </colgroup>
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>값</th>
                    <th class="text-center">신뢰도</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(field, key) in result.structuredData.fields"
                    :key="key"
                  >
                    <td class="field-key">{{ key }}</td>
                    <td class="field-value">
                      <div class="value-cell" :title="getFieldValue(field)">
                        {{ getFieldValue(field) }}
                      </div>
                    </td>
                    <td class="text-center">
                      <span
                        class="confidence-badge"
                        :class="getConfidenceClass(getFieldConfidence(field))"
                      >
                        {{ formatConfidence(getFieldConfidence(field)) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="no-data-state">
                <span class="no-data-icon">📭</span>
                <p>추출된 데이터 필드가 없습니다.</p>
              </div>
            </div>
          </section>
        </div>

        <section class="card raw-text-card" v-if="result.ocrRawText">
          <details>
            <summary class="card-header clickable">
              <h3>
                📄
                {{
                  analysisMode === "OCR"
                    ? "OCR 원본 텍스트"
                    : "Vision 분석 로그"
                }}
              </h3>
              <span class="toggle-icon">▼</span>
            </summary>
            <div class="card-body">
              <textarea
                class="styled-textarea"
                readonly
                :value="result.ocrRawText"
              ></textarea>
            </div>
          </details>
        </section>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import api from "../api/axios";

// === 상태 변수 ===
const analysisMode = ref<"OCR" | "DIAGNOSIS">("OCR"); // 분석 모드
const selectedFileRef = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const userPrompt = ref(""); // 사용자 코멘트
const language = ref<"KO" | "EN">("KO");

const result = ref<any>(null);
const loading = ref(false);
const saving = ref(false);
const savedDocumentId = ref<number | null>(null);

/**
 * 파일 선택 핸들러
 */
function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target || !target.files || target.files.length === 0) return;

  const selected = target.files[0];
  if (!selected) return;

  selectedFileRef.value = selected;

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(selected);

  // 파일 변경 시 결과 초기화
  result.value = null;
  savedDocumentId.value = null;
}

/**
 * 분석 요청 (모드에 따라 분기)
 */
async function analyze() {
  if (!selectedFileRef.value) return;

  loading.value = true;
  result.value = null;
  savedDocumentId.value = null;

  const formData = new FormData();
  formData.append("image", selectedFileRef.value);
  formData.append("language", language.value);

  // [중요] 사용자 코멘트가 있으면 함께 전송
  if (userPrompt.value.trim()) {
    formData.append("prompt", userPrompt.value);
  }

  try {
    let url = "/api/ai/image/analyze"; // 기본 OCR

    // 🔥 화면 진단 모드일 경우 신규 API 호출
    if (analysisMode.value === "DIAGNOSIS") {
      url = "/api/ai/image/diagnosis";
    }

    const res = await api.post(url, formData);
    result.value = res.data;
  } catch (e) {
    alert("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    console.error(e);
  } finally {
    loading.value = false;
  }
}

/**
 * DB 저장
 */
async function saveToDb() {
  if (!result.value) return;

  saving.value = true;
  try {
    const jsonPayload = {
      analysisResult: result.value,
      sourceFileName: selectedFileRef.value?.name ?? null,
      // 저장 시 어떤 모드로 분석했는지 메모에 남기거나 할 수 있음
    };

    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(jsonPayload)], { type: "application/json" })
    );

    if (selectedFileRef.value) {
      formData.append("file", selectedFileRef.value);
    }

    const res = await api.post("/api/ai/image/save", formData);
    savedDocumentId.value = res.data?.documentId ?? null;
  } catch (e) {
    alert("저장에 실패했습니다.");
    console.error(e);
  } finally {
    saving.value = false;
  }
}

// === 헬퍼 함수 ===
const hasFields = computed(() => {
  return (
    result.value?.structuredData?.fields &&
    Object.keys(result.value.structuredData.fields).length > 0
  );
});

function getFieldValue(field: any) {
  if (field === null || field === undefined) return "-";
  if (typeof field === "object" && field.value !== undefined)
    return field.value;
  return field;
}

function getFieldConfidence(field: any): number | null {
  if (
    field &&
    typeof field === "object" &&
    typeof field.confidence === "number"
  ) {
    return field.confidence;
  }
  return null;
}

function formatConfidence(val: number | null) {
  if (val === null) return "-";
  return Math.round(val * 100) + "%";
}

function getConfidenceClass(val: number | null) {
  if (val === null) return "";
  if (val >= 0.8) return "high";
  if (val >= 0.5) return "mid";
  return "low";
}
</script>

<style scoped>
/* 기존 스타일 유지하면서 추가된 부분만 강조 */
.analysis-container {
  max-width: 1360px;
  margin: 0 auto;
  padding: 40px 30px;
  font-family: "Pretendard", sans-serif;
  color: #333;
}

/* === 모드 선택 탭 === */
.mode-tabs {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
}
.tab-btn {
  padding: 12px 24px;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  background: white;
  color: #666;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.tab-btn.active {
  background: #333;
  color: white;
  border-color: #333;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}
.tab-btn:hover:not(.active) {
  background: #f8f8f8;
}

/* 텍스트 영역 (작은 사이즈) */
.styled-textarea-sm {
  width: 100%;
  height: 80px;
  padding: 12px;
  border: 1px solid #dce0e5;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: none;
}
.styled-textarea-sm:focus {
  border-color: #646cff;
  outline: none;
}

/* 버튼 스타일 변형 (Vision 모드) */
.btn-vision {
  background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%) !important;
  box-shadow: 0 8px 20px rgba(138, 43, 226, 0.3) !important;
}

/* 비전 배너 스타일 */
.vision-banner {
  background: linear-gradient(120deg, #6a11cb 0%, #2575fc 100%) !important;
  box-shadow: 0 10px 30px rgba(37, 117, 252, 0.25) !important;
}

/* 스피너 색상 변경 */
.vision-spinner {
  border-top-color: #8e2de2 !important;
}

/* === (이하 기존 CSS 그대로 유지) === */
.page-header {
  margin-bottom: 40px;
  text-align: center;
}
.page-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}
.page-desc {
  color: #666;
  margin: 0;
  font-size: 1.1rem;
}
.card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  margin-bottom: 30px;
}
.card-header {
  background: #fdfdfd;
  padding: 20px 32px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
}
.card-body {
  padding: 32px;
}
.control-panel {
  margin-bottom: 40px;
}
.panel-body {
  display: flex;
  gap: 50px;
  align-items: stretch;
}
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #444;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.upload-section {
  flex: 1.2;
  min-width: 350px;
}
.hidden-input {
  display: none;
}
.file-upload-box {
  width: 100%;
  height: 400px;
  border-radius: 16px;
  border: 2px dashed #dce0e5;
  background: #f8f9fa;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}
.file-upload-box:hover {
  border-color: #646cff;
  background: #f4f6ff;
}
.file-upload-box.has-file {
  border-style: solid;
  border-color: #e0e0e0;
  background: #fff;
}
.upload-label {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.upload-placeholder {
  text-align: center;
  color: #888;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.icon-circle {
  width: 80px;
  height: 80px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}
.upload-icon {
  font-size: 2.5rem;
  color: #646cff;
}
.main-text {
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  color: #444;
}
.sub-text {
  font-size: 0.9rem;
  color: #999;
}
.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.change-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.preview-container:hover .change-overlay {
  opacity: 1;
}
.overlay-btn {
  background: white;
  color: #333;
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
.options-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.options-content {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.option-group {
  margin-bottom: 30px;
}
.option-label {
  display: block;
  font-weight: 600;
  margin-bottom: 10px;
  color: #555;
  font-size: 0.95rem;
}
.select-wrapper {
  position: relative;
}
.styled-select {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid #dce0e5;
  border-radius: 12px;
  font-size: 1.05rem;
  appearance: none;
  background: white
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")
    no-repeat right 16px center;
  transition: border-color 0.2s;
  cursor: pointer;
}
.styled-select:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 4px rgba(100, 108, 255, 0.1);
}
.action-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.btn-primary,
.btn-secondary {
  width: 100%;
  padding: 18px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.btn-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.btn-primary {
  background: linear-gradient(135deg, #646cff 0%, #4a54e8 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(100, 108, 255, 0.25);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(100, 108, 255, 0.35);
}
.btn-primary:active:not(:disabled) {
  transform: translateY(-1px);
}
.btn-primary:disabled {
  background: #a0a0a0;
  cursor: not-allowed;
  box-shadow: none;
}
.btn-secondary {
  background: #f5f7fa;
  color: #444;
  border: 1px solid #e1e4e8;
}
.btn-secondary:hover:not(:disabled) {
  background: #eaedf0;
  border-color: #ccc;
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.save-success-msg {
  margin-top: 20px;
  padding: 14px;
  background: #e6f4ea;
  color: #137333;
  border-radius: 12px;
  font-size: 0.95rem;
  text-align: center;
  border: 1px solid #cce6d3;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.spinner-container {
  text-align: center;
}
.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #eaeaea;
  border-top: 5px solid #646cff;
  border-radius: 50%;
  margin: 0 auto 24px;
  animation: spin 1s linear infinite;
}
.loading-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #333;
  margin: 0 0 10px 0;
}
.loading-desc {
  font-size: 1.05rem;
  color: #666;
  line-height: 1.6;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.result-container {
  margin-top: 50px;
}
.insight-banner {
  background: linear-gradient(120deg, #1565c0 0%, #0d47a1 100%);
  color: white;
  padding: 24px 32px;
  border-radius: 16px;
  margin-bottom: 40px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 10px 30px rgba(13, 71, 161, 0.25);
  position: relative;
  overflow: hidden;
}
.insight-icon-box {
  background: rgba(255, 255, 255, 0.2);
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}
.insight-content {
  flex: 1;
  z-index: 1;
}
.insight-title {
  display: block;
  font-size: 1.2rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}
.insight-text {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.6;
  font-weight: 500;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}
.summary-card,
.data-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.scrollable-body {
  flex: 1;
  overflow-y: auto;
  max-height: 600px;
  padding-right: 16px;
}
.report-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #eee;
}
.report-section:last-child {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}
.report-section h4 {
  font-size: 1rem;
  color: #777;
  margin: 0 0 14px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.report-text {
  line-height: 1.7;
  color: #333;
  font-size: 1.05rem;
}
.styled-list li {
  position: relative;
  padding-left: 28px;
  margin-bottom: 12px;
  line-height: 1.6;
  color: #444;
  font-size: 1.05rem;
}
.styled-list.bullet li::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: #646cff;
  font-weight: bold;
  font-size: 1.2rem;
}
.styled-list.check li::before {
  content: "✓";
  position: absolute;
  left: 6px;
  color: #1e8e3e;
  font-weight: bold;
  font-size: 1.1rem;
}
.empty-text {
  color: #aaa;
  font-style: italic;
}
.doc-type-badge {
  background: #e3f2fd;
  color: #1565c0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  border: 1px solid #bbdefb;
}
.table-wrapper {
  padding: 32px;
  padding-top: 10px;
}
.styled-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}
.styled-table th {
  background: #f8f9fa;
  color: #666;
  padding: 16px;
  text-align: left;
  border-bottom: 2px solid #e1e4e8;
  font-size: 0.95rem;
  font-weight: 700;
  position: sticky;
  top: 0;
}
.styled-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  font-size: 1rem;
  vertical-align: middle;
}
.field-key {
  font-weight: 600;
  color: #555;
}
.value-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: #222;
}
.no-data-state {
  padding: 40px;
  text-align: center;
  color: #999;
}
.no-data-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  display: block;
}
.confidence-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  min-width: 50px;
  text-align: center;
}
.confidence-badge.high {
  background: #def7e5;
  color: #0f6b2d;
}
.confidence-badge.mid {
  background: #fff4d6;
  color: #9c5800;
}
.confidence-badge.low {
  background: #fdeded;
  color: #c91c1c;
}
.text-center {
  text-align: center;
}
.raw-text-card details summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.raw-text-card details summary::-webkit-details-marker {
  display: none;
}
.clickable {
  cursor: pointer;
  user-select: none;
}
.toggle-icon {
  font-size: 0.9rem;
  color: #999;
  transition: transform 0.3s;
}
.raw-text-card details[open] .toggle-icon {
  transform: rotate(180deg);
}
.styled-textarea {
  width: 100%;
  height: 300px;
  padding: 20px;
  border: 1px solid #dce0e5;
  border-radius: 12px;
  background: #fcfcfc;
  font-family: "Consolas", monospace;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
  resize: vertical;
  box-sizing: border-box;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(40px);
}
@media (max-width: 1024px) {
  .panel-body {
    flex-direction: column;
    gap: 40px;
  }
  .file-upload-box {
    height: 300px;
  }
  .options-content {
    max-width: 100%;
  }
  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
