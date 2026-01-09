<template>
  <div class="history-page">
    <header class="page-header">
      <div class="title-area">
        <h1>📜 AI 분석 및 학습 이력</h1>
        <p class="subtitle">
          AI가 수행한 이미지 분석(OCR)과 지식 학습 로그를 통합 관리합니다.
        </p>
      </div>
    </header>

    <div class="tab-nav">
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'OCR' }"
        @click="changeTab('OCR')"
      >
        🖼️ 이미지 분석 이력
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'LEARNING' }"
        @click="changeTab('LEARNING')"
      >
        🧠 지식 학습 로그
      </button>
    </div>

    <div class="content-area">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중입니다...</p>
      </div>

      <div v-else-if="currentTab === 'OCR'" class="tab-content fade-in">
        <div v-if="ocrItems.length === 0" class="empty-state">
          분석된 이미지 이력이 없습니다.
        </div>
        <div class="table-container" v-else>
          <table class="styled-table">
            <thead>
              <tr>
                <th>No</th>
                <th>문서 유형</th>
                <th>파일명</th>
                <th>분석 일시</th>
                <th>상태</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in ocrItems" :key="item.id">
                <td>{{ item.id }}</td>
                <td>
                  <span class="badge type">{{
                    item.documentType || "General"
                  }}</span>
                </td>
                <td class="filename">{{ item.sourceFileName }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td><span class="status-dot success"></span> 완료</td>
                <td>
                  <button class="action-btn" @click="goDetail(item.id)">
                    상세보기
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="totalPages > 0">
          <button
            :disabled="currentPage === 0"
            @click="changePage(currentPage - 1)"
          >
            ‹
          </button>
          <span class="page-info"
            >{{ currentPage + 1 }} / {{ totalPages }}</span
          >
          <button
            :disabled="currentPage >= totalPages - 1"
            @click="changePage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div>

      <div v-else class="tab-content fade-in">
        <div v-if="learningItems.length === 0" class="empty-state">
          학습된 지식 이력이 없습니다.
        </div>
        <div class="log-list" v-else>
          <div v-for="log in learningItems" :key="log.id" class="log-item">
            <div class="log-icon" :class="log.status === 'FAIL' ? 'fail' : ''">
              {{ log.category === "BOT_SCHEDULE" ? "📅" : "🖥️" }}
            </div>
            <div class="log-content">
              <div class="log-header">
                <span class="log-category">{{ log.category }}</span>
                <span class="log-time">{{ formatDate(log.learnedAt) }}</span>
              </div>
              <div class="log-title">
                Target: <strong>{{ log.targetName }}</strong>
              </div>
              <p class="log-summary">{{ log.contentSummary }}</p>
            </div>
            <div class="log-status">
              <span class="badge" :class="log.status.toLowerCase()">{{
                log.status
              }}</span>
            </div>
          </div>
        </div>

        <div class="pagination" v-if="totalPages > 0">
          <button
            :disabled="currentPage === 0"
            @click="changePage(currentPage - 1)"
          >
            ‹
          </button>
          <span class="page-info"
            >{{ currentPage + 1 }} / {{ totalPages }}</span
          >
          <button
            :disabled="currentPage >= totalPages - 1"
            @click="changePage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../api/axios";

// --- Types ---
interface OcrItem {
  id: number;
  documentType: string;
  sourceFileName: string;
  createdAt: string;
}

interface LearningLog {
  id: number;
  category: string;
  targetName: string;
  contentSummary: string;
  status: string;
  learnedAt: string;
}

// --- State ---
const router = useRouter();
const currentTab = ref<"OCR" | "LEARNING">("OCR");
const loading = ref(false);

const ocrItems = ref<OcrItem[]>([]);
const learningItems = ref<LearningLog[]>([]);

// 페이징 상태
const currentPage = ref(0);
const pageSize = ref(10);
const totalPages = ref(0);
const totalElements = ref(0);

// --- Actions ---
const changeTab = (tab: "OCR" | "LEARNING") => {
  currentTab.value = tab;
  currentPage.value = 0; // 탭 변경 시 1페이지로 초기화
  loadData();
};

const changePage = (page: number) => {
  currentPage.value = page;
  loadData();
};

const loadData = () => {
  if (currentTab.value === "OCR") fetchOcrHistory();
  else fetchLearningHistory();
};

// OCR 조회
const fetchOcrHistory = async () => {
  loading.value = true;
  try {
    const res = await api.get("/api/ai/image/history", {
      params: {
        page: currentPage.value,
        size: pageSize.value,
      },
    });
    // Spring Page 객체 응답 처리
    ocrItems.value = res.data.content;
    totalPages.value = res.data.totalPages;
    totalElements.value = res.data.totalElements;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 학습 로그 조회
const fetchLearningHistory = async () => {
  loading.value = true;
  try {
    const res = await api.get("/api/ai/learn/history", {
      params: {
        page: currentPage.value,
        size: pageSize.value,
      },
    });
    learningItems.value = res.data.content;
    totalPages.value = res.data.totalPages;
    totalElements.value = res.data.totalElements;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const goDetail = (id: number) => {
  router.push(`/ai/history/${id}`);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.history-page {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Pretendard", sans-serif;
}

.page-header {
  margin-bottom: 30px;
}
.page-header h1 {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 8px;
}
.subtitle {
  color: #6b7280;
  font-size: 14px;
}

/* 탭 스타일 */
.tab-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}
.tab-btn {
  padding: 12px 24px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #6b7280;
  cursor: pointer;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}
.tab-btn:hover {
  color: #4f46e5;
}
.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

/* 테이블 스타일 (OCR) */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 20px;
}
.styled-table {
  width: 100%;
  border-collapse: collapse;
}
.styled-table th {
  background: #f9fafb;
  padding: 15px;
  font-weight: 600;
  text-align: left;
  color: #374151;
  font-size: 14px;
}
.styled-table td {
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
}
.styled-table tr:last-child td {
  border-bottom: none;
}
.styled-table tr:hover {
  background: #f8fafc;
}

.filename {
  font-weight: 500;
  color: #1f2937;
}
.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.badge.type {
  background: #e0e7ff;
  color: #4f46e5;
}
.badge.success {
  background: #dcfce7;
  color: #166534;
}
.badge.fail {
  background: #fee2e2;
  color: #991b1b;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.status-dot.success {
  background: #10b981;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.action-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* 로그 리스트 스타일 (Learning) */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}
.log-item {
  display: flex;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}
.log-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f0fdf4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 20px;
}
.log-icon.fail {
  background: #fef2f2;
}
.log-content {
  flex: 1;
}
.log-header {
  margin-bottom: 5px;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  gap: 10px;
}
.log-category {
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
}
.log-title {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 5px;
}
.log-summary {
  font-size: 14px;
  color: #6b7280;
}

/* 페이지네이션 스타일 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}
.pagination button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #374151;
  transition: all 0.2s;
}
.pagination button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}
.pagination button:disabled {
  background: #f9fafb;
  color: #cbd5e1;
  cursor: not-allowed;
  border-color: #e5e7eb;
}
.page-info {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
}

/* 로딩 & 빈 상태 */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px;
  color: #9ca3af;
}
.spinner {
  margin: 0 auto 20px;
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
