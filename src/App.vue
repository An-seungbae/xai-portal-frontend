<template>
  <AppLayout />
</template>

<script setup lang="ts">
// 🔥 전역 스타일은 여기서 한 번만 로드 (기존 유지)
import "./assets/css/dashboard.css";
</script>

<script lang="ts">
import { defineComponent } from "vue";
// SideNav를 직접 가져오는 대신, Layout을 가져옵니다.
import AppLayout from "./components/layout/AppLayout.vue";

export default defineComponent({
  name: "App",
  components: {
    AppLayout,
  },
});
</script>
