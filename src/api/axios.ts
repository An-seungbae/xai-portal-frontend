import axios from 'axios'
import { authStore } from '../store/auth'
import router from '../router'

/**
 * 공통 Axios 인스턴스
 */
const api = axios.create({
  // 백엔드 주소 (Vite Proxy 사용 시 '' 또는 환경변수 처리 권장, 현재는 하드코딩 유지)
  baseURL: 'http://localhost:8080',
  // 🔹 [유지] 타임아웃 3분 (AI 분석 등 긴 작업 대비)
  timeout: 180000, 
})

/**
 * ============================
 * Request Interceptor
 * - JWT 자동 Authorization 헤더 추가
 * ============================
 */
api.interceptors.request.use(
  (config) => {
    // authStore에서 토큰 가져오기
    const token = authStore.getToken()

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

/**
 * ============================
 * Response Interceptor
 * - 401 발생 시 자동 로그아웃 및 알림
 * - 타임아웃 및 네트워크 에러 처리
 * ============================
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. 타임아웃 에러 처리
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      alert('서버 응답 시간이 초과되었습니다. (AI 분석은 시간이 걸릴 수 있습니다.)\n잠시 후 다시 시도해 주십시오.');
      return Promise.reject(error);
    }

    // 2. 401 인증 실패 (세션 만료) 처리
    if (error.response && error.response.status === 401) {
      // 중복 알림 방지를 위해 토큰이 있을 때만 실행
      const currentToken = authStore.getToken();
      
      if (currentToken) {
        console.warn('⚠️ Session expired. Logging out automatically.');
        alert('세션이 만료되었습니다. 보안을 위해 다시 로그인해 주세요.');

        // 스토어 초기화 (토큰 삭제)
        authStore.clearToken()

        // 로그인 페이지로 강제 이동 (replace를 써야 뒤로가기 방지됨)
        router.replace('/login')
      }
    }
    
    return Promise.reject(error)
  }
)

export default api