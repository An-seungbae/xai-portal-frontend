<template>
  <div class="analysis-container">
    <header class="page-header">
      <h1 class="page-title">🔍 xAI 이미지 OCR 분석</h1>
      <p class="page-desc">
        이미지를 업로드하면 고성능 OCR 및 AI가 문서를 분석하여 핵심 정보를
        구조화합니다.
      </p>
    </header>

    <section class="control-panel card">
      <div class="panel-body">
        <div class="upload-section">
          <h3 class="section-title">📁 이미지 파일 선택</h3>

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
                  <span class="upload-icon">☁️</span>
                </div>
                <p class="main-text">클릭하거나 이미지를 여기로 드래그하세요</p>
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
            <h3 class="section-title">⚙️ 분석 옵션</h3>

            <div class="option-group">
              <label class="option-label">응답 언어 설정</label>
              <div class="select-wrapper">
                <select v-model="language" class="styled-select">
                  <option value="KO">🇰🇷 한글 우선 (Korean Mode)</option>
                  <option value="EN">🇺🇸 영문 우선 (English Mode)</option>
                  <option value="BOTH">🌐 한글 + 영문 혼합 (Mixed)</option>
                </select>
              </div>
              <p class="option-help">
                문서에 포함된 주 언어를 선택하면 인식률이 향상됩니다.
              </p>
            </div>

            <div class="action-group">
              <button
                class="btn-primary analyze-btn"
                :disabled="!selectedFileRef || loading"
                @click="analyze"
              >
                <div class="btn-content">
                  <span class="btn-icon" v-if="!loading">🚀</span>
                  <span class="btn-text">{{
                    loading ? "AI 정밀 분석 진행 중..." : "이미지 분석 시작"
                  }}</span>
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
                    : "분석 결과 DB 저장"
                }}
              </button>
            </div>

            <transition name="fade">
              <div v-if="savedDocumentId" class="save-success-msg">
                <span class="check-icon">✅</span>
                <span
                  >문서가 안전하게 저장되었습니다. (ID:
                  <strong>{{ savedDocumentId }}</strong
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
          <div class="spinner"></div>
          <p class="loading-title">AI 분석 중...</p>
          <p class="loading-desc">
            텍스트를 추출하고 의미를 해석하고 있습니다.<br />잠시만 기다려
            주세요.
          </p>
        </div>
      </div>
    </transition>

    <transition name="slide-up">
      <div v-if="result && !loading" class="result-container">
        <div class="insight-banner">
          <div class="insight-icon-box">💡</div>
          <div class="insight-content">
            <strong class="insight-title">AI 비즈니스 인사이트</strong>
            <p class="insight-text">
              {{
                result.businessMessage || "분석된 비즈니스 메시지가 없습니다."
              }}
            </p>
          </div>
        </div>

        <div class="result-grid">
          <section class="card summary-card">
            <div class="card-header">
              <h3>🤖 AI 분석 리포트</h3>
            </div>
            <div class="card-body scrollable-body">
              <div class="report-section">
                <h4>📄 요약</h4>
                <p class="report-text">{{ result.summary || "-" }}</p>
              </div>

              <div class="report-section">
                <h4>⚠️ 원인 후보</h4>
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
                <h4>✅ 권장 조치</h4>
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

          <section class="card data-card">
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
                    <th>항목 (Field)</th>
                    <th>추출 값 (Value)</th>
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
                <p>추출된 구조화 데이터가 없습니다.</p>
              </div>
            </div>
          </section>
        </div>

        <section class="card raw-text-card">
          <details>
            <summary class="card-header clickable">
              <h3>📄 OCR 원본 텍스트 보기</h3>
              <span class="toggle-icon">▼</span>
            </summary>
            <div class="card-body">
              <textarea
                class="styled-textarea"
                readonly
                :value="result.ocrRawText || ''"
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

// 상태 변수
const selectedFileRef = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const language = ref<"KO" | "EN" | "BOTH">("KO");

const result = ref<any>(null);
const loading = ref(false);
const saving = ref(false);
const savedDocumentId = ref<number | null>(null);

/**
 * 파일 선택 핸들러 (타입 에러 수정됨)
 */
function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target || !target.files || target.files.length === 0) return;

  const selected = target.files[0];
  if (!selected) return; // 확실한 체크

  selectedFileRef.value = selected;

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(selected);

  result.value = null;
  savedDocumentId.value = null;
}

/**
 * 분석 요청
 */
async function analyze() {
  if (!selectedFileRef.value) return;

  loading.value = true;
  result.value = null;
  savedDocumentId.value = null;

  const formData = new FormData();
  formData.append("image", selectedFileRef.value);
  formData.append("language", language.value);

  try {
    // 🔹 [중요] axios.ts에서 Content-Type 설정을 뺐으므로,
    // formData를 보내면 자동으로 multipart/form-data가 적용됩니다.
    const res = await api.post("/api/ai/image/analyze", formData);
    result.value = res.data;
  } catch (e) {
    alert("이미지 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    console.error(e);
  } finally {
    loading.value = false;
  }
}

/**
 * DB 저장 (이미지 파일 포함 전송)
 */
async function saveToDb() {
  if (!result.value) return;

  saving.value = true;
  try {
    const jsonPayload = {
      analysisResult: result.value,
      sourceFileName: selectedFileRef.value?.name ?? null,
    };

    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(jsonPayload)], {
        type: "application/json",
      })
    );

    if (selectedFileRef.value) {
      formData.append("file", selectedFileRef.value);
    }

    // 🔹 [수정] 수동으로 Content-Type을 지정하지 않습니다.
    // 브라우저가 알아서 boundary를 포함한 올바른 헤더를 만듭니다.
    const res = await api.post("/api/ai/image/save", formData);

    savedDocumentId.value = res.data?.documentId ?? null;
  } catch (e) {
    alert("결과 저장에 실패했습니다.");
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
/* === 전체 레이아웃 === */
.analysis-container {
  max-width: 1360px;
  margin: 0 auto;
  padding: 40px 30px;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui,
    Roboto, sans-serif;
  color: #333;
}

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

/* === 공통 카드 스타일 === */
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

/* === 1. 제어 패널 === */
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

/* 업로드 영역 */
.upload-section {
  flex: 1.2;
  min-width: 350px;
}
.hidden-input {
  display: none;
}
.file-upload-box {
  width: 100%;
  height: 400px; /* 높이 400px (요청 반영) */
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

/* 옵션 및 액션 영역 */
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
.option-help {
  font-size: 0.85rem;
  color: #999;
  margin-top: 8px;
  margin-bottom: 0;
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

/* === 로딩 오버레이 === */
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

/* === 2. 결과 영역 === */
.result-container {
  margin-top: 50px;
}

/* 인사이트 배너 */
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

/* 결과 그리드 */
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

/* AI 리포트 */
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

/* 테이블 */
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

/* 신뢰도 뱃지 */
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

/* OCR 원본 텍스트 */
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

/* === 애니메이션 및 반응형 === */
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
