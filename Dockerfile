# ==========================================
# 1단계: 빌드 (Build Stage)
# ==========================================
# [수정] Vite 최신 버전 호환을 위해 Node.js 18 -> 22로 변경
FROM node:22-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 정보 복사 및 의존성 설치 (캐시 활용)
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드 실행
COPY . .
RUN npm run build

# ==========================================
# 2단계: 실행 (Production Stage)
# ==========================================
FROM nginx:alpine

# 1단계에서 빌드된 결과물(dist 폴더)을 Nginx의 기본 웹 폴더로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 우리가 작성한 Nginx 설정 파일을 컨테이너 내부로 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80번 포트 노출
EXPOSE 80

# Nginx 실행 (Foreground 모드)
CMD ["nginx", "-g", "daemon off;"]