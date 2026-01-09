<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">🚨 오류 관리</h1>
        <p class="page-desc">
          RPA 실행 중 발생한 오류 내역을 모니터링하고 분석합니다.
        </p>
      </div>

      <div class="filter-controls">
        <select
          v-model.number="size"
          @change="changePageSize"
          class="size-select"
        >
          <option :value="20">20개씩 보기</option>
          <option :value="50">50개씩 보기</option>
          <option :value="100">100개씩 보기</option>
        </select>

        <div class="search-input-group">
          <input
            v-model="keyword"
            @keyup.enter="search"
            type="text"
            placeholder="봇 이름 검색..."
            class="search-input"
          />
          <button @click="search" class="search-btn">🔍</button>
        </div>
      </div>
    </header>

    <div class="content-card">
      <div v-if="loading" class="state-message">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중입니다...</p>
      </div>

      <div v-if="errorMessage" class="error-banner">⚠️ {{ errorMessage }}</div>

      <div v-if="!loading && items.length > 0" class="table-responsive">
        <table class="modern-table">
          <thead>
            <tr>
              <th width="100">상태</th>
              <th width="120">Automation</th>
              <th>Activity Name</th>
              <th>Bot Name</th>
              <th>User</th>
              <th>Device</th>
              <th width="160">발생 시각</th>
              <th>Error Message</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in items"
              :key="idx"
              class="clickable-row"
              @click="goToAiAnalysis(item)"
            >
              <td>
                <span class="status-badge" :class="getStatusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td class="text-sub">{{ item.automationType }}</td>
              <td class="font-medium">{{ item.activityName }}</td>
              <td>{{ item.botName }}</td>
              <td class="text-sub">{{ item.userName }}</td>
              <td class="text-sub">{{ item.deviceName }}</td>
              <td class="text-date">
                {{ formatDateTime(item.startedOn) }}
              </td>
              <td>
                <div class="message-truncate" :title="item.message">
                  {{ item.message }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading && items.length === 0 && !errorMessage"
        class="empty-state"
      >
        <div class="empty-icon">📂</div>
        <p>조회된 오류 내역이 없습니다.</p>
      </div>
    </div>

    <div v-if="total > 0" class="pagination-wrapper">
      <div class="pagination-info">
        Total <strong>{{ total }}</strong> items
      </div>

      <div class="pagination-nav">
        <button
          class="page-btn prev"
          :disabled="page === 1"
          @click="changePage(page - 1)"
        >
          &lt;
        </button>

        <button
          v-for="p in visiblePages"
          :key="p"
          class="page-btn"
          :class="{ active: p === page }"
          @click="changePage(p)"
        >
          {{ p }}
        </button>

        <button
          class="page-btn next"
          :disabled="page === totalPages"
          @click="changePage(page + 1)"
        >
          &gt;
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "../api/axios";

interface PortalError {
  botName: string;
  errorCode: string;
  message: string;
  occurredAt: string;
  activityId: string;
  status: string;
  automationType: string;
  activityName: string;
  priority: string;
  deviceName: string;
  userName: string;
  startedOn: string;
  endedOn: string;
}

export default defineComponent({
  name: "ErrorManage",
  setup() {
    const router = useRouter();
    const route = useRoute();

    const items = ref<PortalError[]>([]);
    const total = ref(0);
    const page = ref(Number(route.query.page) || 1);
    const size = ref(Number(route.query.size) || 20);
    const keyword = ref((route.query.keyword as string) || "");
    const loading = ref(false);
    const errorMessage = ref("");

    const totalPages = computed(() =>
      total.value === 0 ? 1 : Math.ceil(total.value / size.value)
    );

    const visiblePages = computed(() => {
      const pages: number[] = [];
      const start = Math.max(1, page.value - 2);
      const end = Math.min(totalPages.value, page.value + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    });

    const syncUrl = () => {
      router.replace({
        query: {
          page: String(page.value),
          size: String(size.value),
          keyword: keyword.value || undefined,
        },
      });
    };

    const fetchErrors = async (targetPage: number) => {
      loading.value = true;
      errorMessage.value = "";

      try {
        const res = await api.get("/api/errors", {
          params: {
            keyword: keyword.value,
            page: targetPage,
            size: size.value,
          },
        });

        items.value = res.data.items || [];
        total.value = res.data.total || 0;
        page.value = targetPage;
        syncUrl();
      } catch (err: any) {
        errorMessage.value =
          err?.response?.data?.message || "오류 데이터를 불러오지 못했습니다.";
      } finally {
        loading.value = false;
      }
    };

    const changePage = (target: number) => {
      if (target < 1 || target > totalPages.value) return;
      fetchErrors(target);
    };

    const changePageSize = () => {
      fetchErrors(1);
    };

    const search = () => {
      fetchErrors(1);
    };

    watch(
      () => route.query,
      () => {
        const qPage = Number(route.query.page) || 1;
        const qSize = Number(route.query.size) || size.value;
        const qKeyword = (route.query.keyword as string) || "";

        if (
          qPage !== page.value ||
          qSize !== size.value ||
          qKeyword !== keyword.value
        ) {
          size.value = qSize;
          keyword.value = qKeyword;
          fetchErrors(qPage);
        }
      }
    );

    const goToAiAnalysis = (item: PortalError) => {
      router.push({
        path: "/errors/ai-analysis",
        query: { activityId: item.activityId },
      });
    };

    // UI Helper Functions
    const getStatusClass = (status: string) => {
      const s = status.toUpperCase();
      if (s === "COMPLETED") return "success";
      if (
        ["FAILED", "RUN_FAILED", "DEPLOY_FAILED", "RUN_TIMED_OUT"].includes(s)
      )
        return "danger";
      if (s === "UNKNOWN") return "warning";
      return "neutral";
    };

    const formatDateTime = (dateStr: string) => {
      if (!dateStr) return "-";
      // 날짜 포맷팅 로직 (필요시 수정)
      return dateStr.replace("T", " ").substring(0, 19);
    };

    onMounted(() => {
      fetchErrors(page.value);
    });

    return {
      items,
      total,
      page,
      size,
      keyword,
      loading,
      errorMessage,
      totalPages,
      visiblePages,
      changePage,
      changePageSize,
      search,
      goToAiAnalysis,
      getStatusClass,
      formatDateTime,
    };
  },
});
</script>

<style scoped>
/* 구글 폰트 적용 (Pretendard 등) */
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px;
  font-family: "Pretendard", sans-serif;
  background-color: #f8f9fc;
  min-height: 100vh;
}

/* === 헤더 스타일 === */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-desc {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

/* === 검색 & 필터 === */
.filter-controls {
  display: flex;
  gap: 12px;
}

.size-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  outline: none;
}

.search-input-group {
  display: flex;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  width: 240px;
  outline: none;
}
.search-input:focus {
  border-color: #6366f1;
}

.search-btn {
  padding: 0 16px;
  background-color: #6366f1;
  color: white;
  border: 1px solid #6366f1;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: background 0.2s;
}
.search-btn:hover {
  background-color: #4f46e5;
}

/* === 카드 컨테이너 === */
.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid #f1f5f9;
  min-height: 400px;
  position: relative;
}

/* === 테이블 스타일 === */
.table-responsive {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.modern-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
  text-align: left;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.modern-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}
.clickable-row:hover {
  background-color: #f8fafc;
}

/* 텍스트 유틸리티 */
.text-sub {
  color: #64748b;
  font-size: 13px;
}
.text-date {
  font-family: monospace;
  color: #64748b;
  font-size: 13px;
}
.font-medium {
  font-weight: 500;
  color: #0f172a;
}

/* 말줄임 처리 */
.message-truncate {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ef4444; /* 에러 메시지는 붉은 톤 */
}

/* === 상태 뱃지 === */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.status-badge.success {
  background-color: #dcfce7;
  color: #166534;
}
.status-badge.danger {
  background-color: #fee2e2;
  color: #991b1b;
}
.status-badge.warning {
  background-color: #fef3c7;
  color: #92400e;
}
.status-badge.neutral {
  background-color: #f1f5f9;
  color: #475569;
}

/* === 로딩 & 에러 & 빈 상태 === */
.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #64748b;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-banner {
  background-color: #fef2f2;
  color: #991b1b;
  padding: 12px;
  text-align: center;
  font-weight: 500;
  border-bottom: 1px solid #fee2e2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #94a3b8;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* === 페이지네이션 === */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}

.pagination-info {
  color: #64748b;
  font-size: 14px;
}

.pagination-nav {
  display: flex;
  gap: 6px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.page-btn.active {
  background-color: #6366f1;
  color: white;
  border-color: #6366f1;
}

.page-btn:disabled {
  background-color: #f1f5f9;
  color: #cbd5e1;
  cursor: not-allowed;
}
</style>
