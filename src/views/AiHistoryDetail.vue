<template>
  <div class="history-detail-container">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <span class="icon">←</span> 목록으로
        </button>
        <h1 class="page-title">분석 결과 상세</h1>
      </div>
      <div class="header-right" v-if="result && result.filePath">
        <button @click="downloadOriginalImage" class="btn-download">
          <span class="icon">🖼️</span> 원본 이미지 다운로드
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>데이터를 불러오는 중입니다...</p>
    </div>

    <div v-else-if="result && parsedAnalysis" class="content-wrapper">
      <section class="card image-viewer-card" v-if="result.filePath">
        <div class="card-header">
          <h3>📷 분석 대상 이미지</h3>
        </div>
        <div class="card-body image-body">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            alt="Saved Document"
            class="saved-image"
          />
          <div v-else class="image-placeholder">이미지를 불러오는 중...</div>
        </div>
      </section>

      <section class="info-card">
        <h2>📂 문서 기본 정보</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">문서 ID</span>
            <span class="value">#{{ result.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">문서 유형</span>
            <span class="value highlight">{{ result.documentType }}</span>
          </div>
          <div class="info-item">
            <span class="label">원본 파일명</span>
            <span class="value">{{ result.sourceFileName || "-" }}</span>
          </div>
          <div class="info-item">
            <span class="label">저장 일시</span>
            <span class="value">{{ formatDate(result.createdAt) }}</span>
          </div>
        </div>
      </section>

      <div class="analysis-layout">
        <section class="card ai-summary-card">
          <div class="card-header">
            <h3>🤖 AI 분석 리포트</h3>
          </div>
          <div class="card-body">
            <div class="biz-message-box">
              <span class="biz-icon">💡</span>
              <p>
                {{
                  parsedAnalysis.businessMessage ||
                  "비즈니스 메시지가 없습니다."
                }}
              </p>
            </div>

            <div class="summary-group">
              <h4>요약</h4>
              <p class="text-content">{{ parsedAnalysis.summary || "-" }}</p>
            </div>

            <div class="summary-row">
              <div class="half">
                <h4>⚠️ 원인 후보</h4>
                <ul
                  class="bullet-list"
                  v-if="parsedAnalysis.causeCandidates?.length"
                >
                  <li
                    v-for="(cause, i) in parsedAnalysis.causeCandidates"
                    :key="i"
                  >
                    {{ cause }}
                  </li>
                </ul>
                <p v-else class="empty-text">-</p>
              </div>
              <div class="half">
                <h4>✅ 권장 조치</h4>
                <ul
                  class="bullet-list action-list"
                  v-if="parsedAnalysis.recommendedActions?.length"
                >
                  <li
                    v-for="(action, i) in parsedAnalysis.recommendedActions"
                    :key="i"
                  >
                    {{ action }}
                  </li>
                </ul>
                <p v-else class="empty-text">-</p>
              </div>
            </div>
          </div>
        </section>

        <section class="card structured-data-card">
          <div class="card-header">
            <h3>📊 추출 데이터 (Fields)</h3>
          </div>
          <div class="table-container">
            <table class="data-table" v-if="hasFields(parsedAnalysis)">
              <colgroup>
                <col style="width: 35%" />
                <col style="width: 45%" />
                <col style="width: 20%" />
              </colgroup>
              <thead>
                <tr>
                  <th>항목 (Field)</th>
                  <th>값 (Value)</th>
                  <th class="text-center">신뢰도</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(field, key) in parsedAnalysis.structuredData.fields"
                  :key="key"
                >
                  <td class="field-key">{{ key }}</td>
                  <td class="field-value">{{ getFieldValue(field) }}</td>
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
            <div v-else class="no-data">구조화된 데이터가 없습니다.</div>
          </div>
        </section>
      </div>

      <section class="card raw-text-card">
        <div class="card-header">
          <h3>📄 OCR 원본 텍스트</h3>
        </div>
        <div class="card-body">
          <textarea
            readonly
            class="raw-text-area"
            :value="parsedAnalysis.ocrRawText"
          ></textarea>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api/axios";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const result = ref<any>(null);
const loading = ref(false);
const imageUrl = ref<string>("");

// [수정] 인증 헤더를 포함하여 이미지 Blob 데이터를 가져오는 함수
async function fetchImageBlob() {
  try {
    const response = await api.get(`/api/ai/image/history/${id}/image`, {
      responseType: "blob",
    });
    // Blob 데이터를 로컬 URL로 변환
    imageUrl.value = URL.createObjectURL(response.data);
  } catch (e) {
    console.error("이미지를 로드하지 못했습니다.", e);
  }
}

// [수정] 원본 이미지 다운로드 처리
function downloadOriginalImage() {
  if (!imageUrl.value) return;
  const link = document.createElement("a");
  link.href = imageUrl.value;
  link.download = result.value.sourceFileName || `image_${id}.png`;
  link.click();
}

// JSON 파싱
const parsedAnalysis = computed(() => {
  if (!result.value || !result.value.analysisJson) return null;
  try {
    return typeof result.value.analysisJson === "string"
      ? JSON.parse(result.value.analysisJson)
      : result.value.analysisJson;
  } catch (e) {
    return null;
  }
});

async function fetchDetail() {
  loading.value = true;
  try {
    const res = await api.get(`/api/ai/image/history/${id}`);
    result.value = res.data;
    // 상세 정보를 성공적으로 가져온 후 이미지를 로드합니다.
    if (result.value.filePath) {
      await fetchImageBlob();
    }
  } catch (e) {
    alert("상세 정보를 불러오지 못했습니다.");
    router.push("/ai/history");
  } finally {
    loading.value = false;
  }
}

// 컴포넌트 해제 시 생성된 URL 폐기 (메모리 누수 방지)
onUnmounted(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
});

// 헬퍼 함수들
function hasFields(analysis: any) {
  return (
    analysis?.structuredData?.fields &&
    Object.keys(analysis.structuredData.fields).length > 0
  );
}
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
  )
    return field.confidence;
  return null;
}
function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
/* 기존 스타일 유지 및 보완 */
.history-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: "Pretendard", sans-serif;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
}
.back-btn {
  background: white;
  border: 1px solid #ddd;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-download {
  background: #333;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}
.btn-download:hover {
  background: #555;
}
.image-viewer-card {
  margin-bottom: 24px;
  border: 1px solid #eaeaea;
}
.image-body {
  text-align: center;
  background-color: #f7f9fc;
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
.saved-image {
  max-width: 100%;
  max-height: 600px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
}
.image-placeholder {
  color: #999;
  font-style: italic;
}
.info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #eaeaea;
}
.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}
.label {
  font-size: 0.85rem;
  color: #888;
}
.value {
  font-size: 1rem;
  font-weight: 600;
}
.value.highlight {
  color: #0056b3;
}
.analysis-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
}
.card {
  background: white;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  overflow: hidden;
  flex: 1;
  min-width: 350px;
}
.card-header {
  background: #f8f9fa;
  padding: 16px 20px;
  border-bottom: 1px solid #eaeaea;
}
.biz-message-box {
  background: #f0f9ff;
  border: 1px solid #bae7ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}
.biz-message-box p {
  color: #0050b3;
  font-weight: 600;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eee;
}
.confidence-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
}
.confidence-badge.high {
  background-color: #e6f4ea;
  color: #137333;
}
.raw-text-area {
  width: 100%;
  height: 200px;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
}
.loading-state {
  text-align: center;
  padding: 60px 0;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #333;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
