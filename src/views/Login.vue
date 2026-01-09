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

    <!-- 로그인 카드 -->
    <div class="login-card">
      <h2 class="login-title">로그인</h2>
      <p class="login-subtitle">자동화 플랫폼 포털에 오신 것을 환영합니다.</p>

      <form class="login-form" @submit.prevent="doLogin">
        <!-- 이메일 -->
        <input
          v-model="email"
          type="email"
          placeholder="이메일 주소"
          autocomplete="username"
        />

        <!-- 비밀번호 -->
        <input
          v-model="password"
          type="password"
          placeholder="비밀번호"
          autocomplete="current-password"
        />

        <!-- 비밀번호 찾기 -->
        <div class="forgot-password">
          <a href="#" @click.prevent="goForgotPassword">
            비밀번호를 잊으셨나요?
          </a>
        </div>

        <!-- 로그인 버튼 -->
        <button type="submit" class="login-button">로그인</button>
      </form>

      <!-- 회원가입 -->
      <div class="signup-link">
        계정이 없으신가요?
        <a href="#" @click.prevent="goRegister">회원가입</a>
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

// email 기반 로그인 API
import { login } from "../api/auth";
import { authStore } from "../store/auth";

// 로그인 CSS
import "../assets/css/login.css";

const router = useRouter();

// ✅ 의미에 맞게 변수명 정리
const email = ref("");
const password = ref("");
const error = ref("");

async function doLogin() {
  error.value = "";

  try {
    const res = await login(email.value, password.value);
    authStore.setToken(res.accessToken);
    router.push("/");
  } catch (e) {
    error.value = "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
}

function goForgotPassword() {
  router.push("/forgot-password");
}

function goRegister() {
  router.push("/register");
}
</script>
