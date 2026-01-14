<template>
  <aside class="side-nav">
    <div class="logo-area">
      <h1>XAI Portal</h1>
    </div>

    <nav class="nav-links">
      <router-link to="/dashboard" class="nav-item" active-class="active">
        <span class="icon">🏠</span>
        <span class="label">대시보드</span>
      </router-link>

      <div class="nav-group-title">운영 관리</div>
      <router-link to="/errors" class="nav-item" active-class="active">
        <span class="icon">🚨</span>
        <span class="label">오류 관리</span>
      </router-link>

      <div class="nav-group-title">AI 서비스</div>
      <router-link to="/ai/predict" class="nav-item" active-class="active">
        <span class="icon">🔮</span>
        <span class="label">AI 장애 예측 분석</span>
      </router-link>

      <router-link to="/ai/insight" class="nav-item" active-class="active">
        <span class="icon">💡</span>
        <span class="label">AI 스마트 인사이트</span>
      </router-link>

      <router-link to="/ai/code-review" class="nav-item" active-class="active">
        <span class="icon">👨‍⚕️</span>
        <span class="label">AI Code Doctor</span>
      </router-link>

      <router-link to="/ai/image" class="nav-item" active-class="active">
        <span class="icon">🖼️</span>
        <span class="label">Vision AI 분석</span>
      </router-link>

      <router-link to="/ai/search" class="nav-item" active-class="active">
        <span class="icon">🔍</span>
        <span class="label">스마트 검색</span>
      </router-link>

      <div class="nav-group-title">지식 관리</div>
      <router-link to="/ai/learn" class="nav-item" active-class="active">
        <span class="icon">🧠</span>
        <span class="label">AI 지식 학습</span>
      </router-link>

      <router-link to="/ai/history" class="nav-item" active-class="active">
        <span class="icon">📜</span>
        <span class="label">분석/학습 이력</span>
      </router-link>
    </nav>

    <div class="user-profile">
      <div class="avatar">🤖</div>
      <div class="info">
        <span class="name">Charles</span>
        <span class="role">AI Assistant</span>
      </div>
    </div>
    <div class="nav-footer">
      <button class="logout-btn" @click="logout">로그아웃</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { authStore } from "../../store/auth";

const router = useRouter();
// const route = useRoute(); // isActive 제거로 인해 불필요해진 useRoute 제거

// [삭제됨] 사용하지 않는 go 함수 제거
// function go(path: string) { router.push(path); }

// [삭제됨] 사용하지 않는 isActive 함수 제거
// function isActive(path: string) { ... }

function logout() {
  authStore.clearToken();
  router.push("/login");
}
</script>

<style scoped>
/* 스타일은 기존과 동일하게 유지 */
.side-nav {
  width: 260px;
  height: 100vh;
  background: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  font-family: "Pretendard", sans-serif;
}

.logo-area {
  padding: 30px 20px;
  border-bottom: 1px solid #334155;
}
.logo-area h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(to right, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-links::-webkit-scrollbar {
  width: 6px;
}
.nav-links::-webkit-scrollbar-thumb {
  background-color: #475569;
  border-radius: 3px;
}

.nav-group-title {
  font-size: 12px;
  color: #94a3b8;
  padding: 20px 25px 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 25px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #334155;
  color: white;
}

.nav-item.active {
  background: #334155;
  color: #60a5fa;
  border-left-color: #60a5fa;
  font-weight: 600;
}

.icon {
  margin-right: 12px;
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.label {
  font-size: 15px;
}

.user-profile {
  padding: 20px;
  border-top: 1px solid #334155;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0f172a;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 700;
  font-size: 14px;
}

.role {
  font-size: 12px;
  color: #94a3b8;
}
</style>
