/* eslint-disable */

// 1. Vue 파일에 대한 정의
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 2. SVG 이미지 파일에 대한 정의 (에러 해결 핵심)
declare module '*.svg' {
  const content: string;
  export default content;
}

// 3. 기타 이미지 파일 정의 (추후 사용 대비)
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}