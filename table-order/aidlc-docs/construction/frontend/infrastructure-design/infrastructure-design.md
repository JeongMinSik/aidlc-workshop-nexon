# Infrastructure Design - Unit 2 (Frontend)

## 인프라 결정사항 요약

| 항목 | 선택 |
|------|------|
| 호스팅 | AWS S3 + CloudFront |
| CI/CD | GitHub Actions |
| 환경 | dev + staging + prod (3개) |
| 도메인 | 커스텀 도메인 + SSL (Route53 + ACM) |
| 정적 빌드 | Next.js `output: 'export'` (Static HTML Export) |

---

## AWS 서비스 매핑

| 논리적 컴포넌트 | AWS 서비스 | 용도 |
|----------------|-----------|------|
| 정적 파일 호스팅 | S3 | HTML, JS, CSS, 이미지 저장 |
| CDN | CloudFront | 글로벌 캐싱, HTTPS 종단 |
| DNS | Route53 | 커스텀 도메인 관리 |
| SSL 인증서 | ACM (Certificate Manager) | HTTPS 인증서 |
| CI/CD | GitHub Actions | 빌드 + S3 배포 자동화 |
| 환경 변수 | GitHub Secrets + .env | 환경별 API URL 등 |

---

## S3 버킷 구성

### 버킷 구조 (앱별 분리)
```
s3://table-order-customer-{env}/     # 고객앱
├── index.html
├── _next/
│   ├── static/
│   │   ├── css/
│   │   ├── chunks/
│   │   └── media/
│   └── data/
├── manifest.json
├── sw.js
└── icons/

s3://table-order-admin-{env}/        # 관리자앱
├── index.html
├── _next/
│   ├── static/
│   └── data/
└── ...
```

### 버킷 설정
| 설정 | 값 |
|------|-----|
| 정적 웹 호스팅 | 비활성화 (CloudFront OAI 사용) |
| 퍼블릭 액세스 | 차단 (CloudFront만 접근) |
| 버전 관리 | 활성화 (롤백 지원) |
| 수명 주기 | 이전 버전 30일 후 삭제 |

---

## CloudFront 구성

### 배포 설정 (앱별 1개씩)
| 설정 | 고객앱 | 관리자앱 |
|------|--------|---------|
| Origin | S3 버킷 (OAI) | S3 버킷 (OAI) |
| 도메인 | order.{domain}.com | admin.{domain}.com |
| SSL | ACM 인증서 | ACM 인증서 |
| HTTP → HTTPS | 리다이렉트 | 리다이렉트 |
| 기본 루트 객체 | index.html | index.html |
| 에러 페이지 | 404 → /index.html (SPA) | 404 → /index.html (SPA) |

### 캐싱 정책
| 파일 유형 | Cache-Control | TTL |
|-----------|--------------|-----|
| `_next/static/*` | `public, max-age=31536000, immutable` | 1년 (해시 파일명) |
| `index.html` | `no-cache, no-store, must-revalidate` | 0 (항상 최신) |
| `sw.js` | `no-cache, no-store, must-revalidate` | 0 (항상 최신) |
| `manifest.json` | `public, max-age=86400` | 24시간 |
| 이미지/폰트 | `public, max-age=604800` | 7일 |

### SPA 라우팅 처리
- CloudFront 커스텀 에러 응답: 403/404 → `/index.html` (200)
- React Router가 클라이언트에서 라우팅 처리

---

## 환경별 구성

### 3개 환경
| 환경 | 용도 | API URL | 도메인 |
|------|------|---------|--------|
| dev | 개발/테스트 | `https://api-dev.{domain}.com` | `order-dev.{domain}.com` / `admin-dev.{domain}.com` |
| staging | QA/통합 테스트 | `https://api-staging.{domain}.com` | `order-staging.{domain}.com` / `admin-staging.{domain}.com` |
| prod | 프로덕션 | `https://api.{domain}.com` | `order.{domain}.com` / `admin.{domain}.com` |

### 환경 변수 (.env)
```bash
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SSE_URL=http://localhost:3000/api/sse

# .env.staging
NEXT_PUBLIC_API_URL=https://api-staging.{domain}.com/api
NEXT_PUBLIC_SSE_URL=https://api-staging.{domain}.com/api/sse

# .env.production
NEXT_PUBLIC_API_URL=https://api.{domain}.com/api
NEXT_PUBLIC_SSE_URL=https://api.{domain}.com/api/sse
```

---

## 비용 예상 (월간, 소규모 트래픽 기준)

| 서비스 | 예상 비용 | 비고 |
|--------|----------|------|
| S3 | ~$1 | 정적 파일 저장 (수 MB) |
| CloudFront | ~$5-10 | 데이터 전송 + 요청 수 |
| Route53 | ~$1 | 호스팅 존 + 쿼리 |
| ACM | 무료 | CloudFront 연동 시 |
| **합계** | **~$7-12/월** | 소규모 트래픽 기준 |
