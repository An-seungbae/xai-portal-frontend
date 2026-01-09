<template>
  <div class="login-page">
    <!-- 상단 헤더 -->
    <header class="login-header">
      <div class="header-left">
        <span class="platform-title">Automation Platform</span>
      </div>
      <div class="header-right">
        <span class="xai-logo">XAI</span>
      </div>
    </header>

    <!-- 회원가입 카드 -->
    <div class="login-card">
      <h2 class="login-title">회원가입</h2>
      <p class="login-subtitle">xAI 자동화 플랫폼 계정을 생성합니다.</p>

      <form class="login-form" @submit.prevent="doRegister">
        <!-- 이메일 -->
        <input
          v-model="email"
          type="email"
          placeholder="이메일 주소"
          autocomplete="username"
        />

        <!-- 사용자 ID -->
        <input
          v-model="username"
          type="text"
          placeholder="사용자 ID (표시용)"
        />

        <!-- 비밀번호 -->
        <input
          v-model="password"
          type="password"
          placeholder="비밀번호"
          autocomplete="new-password"
        />

        <!-- 비밀번호 확인 -->
        <input
          v-model="passwordConfirm"
          type="password"
          placeholder="비밀번호 확인"
          autocomplete="new-password"
        />

        <!-- 가입 버튼 -->
        <button type="submit" class="login-button">회원가입</button>
      </form>

      <!-- 로그인 이동 -->
      <div class="signup-link">
        이미 계정이 있으신가요?
        <a href="#" @click.prevent="goLogin">로그인</a>
      </div>

      <!-- 에러 -->
      <p v-if="error" class="login-error">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../api/axios";
import { login } from "../api/auth";
import { authStore } from "../store/auth";

// 로그인 화면과 동일 CSS
import "../assets/css/login.css";

const router = useRouter();

const email = ref("");
const username = ref("");
const password = ref("");
const passwordConfirm = ref("");
const error = ref("");

async function doRegister() {
  error.value = "";

  // 1️⃣ 프론트 검증
  if (!email.value || !username.value || !password.value) {
    error.value = "필수 항목을 모두 입력하세요.";
    return;
  }

  if (password.value !== passwordConfirm.value) {
    error.value = "비밀번호가 서로 일치하지 않습니다.";
    return;
  }

  try {
    // 2️⃣ 회원가입
    await api.post("/api/auth/register", {
      email: email.value,
      username: username.value,
      password: password.value,
    });

    // 3️⃣ 자동 로그인
    const res = await login(email.value, password.value);
    authStore.setToken(res.accessToken);

    // 4️⃣ 대시보드 이동
    router.push("/");
  } catch (e: any) {
    error.value = e?.response?.data ?? "회원가입 중 오류가 발생했습니다.";
  }
}

function goLogin() {
  router.push("/login");
}
</script>
