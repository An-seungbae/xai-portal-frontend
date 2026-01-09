<template>
  <div class="app-layout">
    <SideNav v-if="!hideNav" />

    <main class="main-content" :class="{ 'full-width': hideNav }">
      <router-view />
    </main>

    <AiChatBot v-if="!hideNav" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import SideNav from "./SideNav.vue";
// [수정 포인트 1] common 폴더에 있는 경우 상위 폴더(..)로 나갔다가 들어가야 합니다.
import AiChatBot from "../common/AiChatBot.vue";

export default defineComponent({
  name: "AppLayout",
  components: {
    SideNav,
    AiChatBot,
  },
  setup() {
    const route = useRoute();

    // 네비게이션과 챗봇을 숨길 경로 목록
    const hideNav = computed(() => {
      // [수정 포인트 2] '/'가 '메인 홈'이라면 목록에서 제외해야 합니다.
      // 오직 로그인이 필요한 '인증 전' 페이지들만 포함시킵니다.
      const hiddenPaths = ["/login", "/register"];

      // 만약 '/'가 로그인 페이지(Landing)라면 아래 주석을 해제하고 위 코드를 대체하세요.
      // const hiddenPaths = ["/", "/login", "/register"];

      return hiddenPaths.includes(route.path);
    });

    return { hideNav };
  },
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.main-content {
  flex: 1;
  margin-left: 220px; /* SideNav 너비(220px)에 맞춤 */
  transition: margin-left 0.3s ease;
  position: relative;
}

/* 네비게이션이 없을 때 (로그인 등) 전체 너비 사용 */
.main-content.full-width {
  margin-left: 0;
}
</style>
