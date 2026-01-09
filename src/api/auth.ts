import api from './axios'

/**
 * 로그인 응답 타입
 */
export interface LoginResponse {
  accessToken: string
  tokenType: string
}

/**
 * 로그인
 * POST /api/auth/login
 * ✅ email 기반 로그인
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {

  const response = await api.post<LoginResponse>(
    '/api/auth/login',
    {
      email,
      password
    }
  )

  return response.data
}
