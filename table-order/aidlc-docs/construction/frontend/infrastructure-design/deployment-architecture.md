# Deployment Architecture - Unit 2 (Frontend)

## 배포 아키텍처 다이어그램

```
                    사용자 (브라우저)
                         |
                         | HTTPS
                         v
                  +-------------+
                  |  Route53    |
                  |  (DNS)      |
                  +------+------+
                         |
                         v
                  +-------------+
                  | CloudFront  |
                  |  (CDN)      |
                  |  + ACM SSL  |
                  +------+------+
                         |
              +----------+----------+
              |                     |
              v                     v
    +---------+--------+  +---------+--------+
    | S3: Customer App |  | S3: Admin App    |
    | (Static Files)   |  | (Static Files)   |
    +------------------+  +------------------+
```

---

## GitHub Actions CI/CD 파이프라인

### 워크플로우 구조

```
코드 푸시 (main/develop/release)
    |
    v
[GitHub Actions Trigger]
    |
    +-- packages/customer 변경? → Customer 빌드 + 배포
    |
    +-- packages/admin 변경? → Admin 빌드 + 배포
```

### 배포 전략 (브랜치별)
| 브랜치 | 환경 | 트리거 |
|--------|------|--------|
| `develop` | dev | push |
| `release/*` | staging | push |
| `main` | prod | push (수동 승인 후) |

### GitHub Actions 워크플로우 예시

```yaml
# .github/workflows/deploy-customer.yml
name: Deploy Customer App

on:
  push:
    branches: [develop, 'release/*', main]
    paths: ['packages/customer/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "env=prod" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == refs/heads/release/* ]]; then
            echo "env=staging" >> $GITHUB_OUTPUT
          else
            echo "env=dev" >> $GITHUB_OUTPUT
          fi

      - name: Build
        run: npm -w packages/customer run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets[format('API_URL_{0}', steps.env.outputs.env)] }}

      - name: Deploy to S3
        run: |
          aws s3 sync packages/customer/out/ \
            s3://table-order-customer-${{ steps.env.outputs.env }}/ \
            --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-northeast-2

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets[format('CF_DIST_CUSTOMER_{0}', steps.env.outputs.env)] }} \
            --paths "/*"
```

---

## 배포 프로세스

### 일반 배포 (dev/staging)
```
1. 코드 푸시 → GitHub Actions 자동 트리거
2. npm ci → 의존성 설치
3. npm run build → Next.js 정적 빌드 (output: 'export')
4. aws s3 sync → S3 업로드 (--delete로 이전 파일 정리)
5. aws cloudfront create-invalidation → CDN 캐시 무효화
6. 완료 알림 (Slack/GitHub)
```

### 프로덕션 배포
```
1. main 브랜치 푸시
2. GitHub Actions 트리거 → 빌드
3. 수동 승인 대기 (environment protection rules)
4. 승인 후 S3 배포 + CloudFront 무효화
5. 배포 후 헬스 체크 (index.html 접근 확인)
6. 문제 시 이전 S3 버전으로 롤백
```

### 롤백 전략
```
문제 감지
    → S3 버전 관리에서 이전 버전 복원
    → CloudFront 캐시 무효화
    → 복구 확인
```

---

## GitHub Secrets 설정

| Secret 이름 | 용도 |
|-------------|------|
| `AWS_ACCESS_KEY_ID` | AWS 인증 |
| `AWS_SECRET_ACCESS_KEY` | AWS 인증 |
| `API_URL_dev` | dev 환경 API URL |
| `API_URL_staging` | staging 환경 API URL |
| `API_URL_prod` | prod 환경 API URL |
| `CF_DIST_CUSTOMER_dev` | 고객앱 dev CloudFront ID |
| `CF_DIST_CUSTOMER_staging` | 고객앱 staging CloudFront ID |
| `CF_DIST_CUSTOMER_prod` | 고객앱 prod CloudFront ID |
| `CF_DIST_ADMIN_dev` | 관리자앱 dev CloudFront ID |
| `CF_DIST_ADMIN_staging` | 관리자앱 staging CloudFront ID |
| `CF_DIST_ADMIN_prod` | 관리자앱 prod CloudFront ID |

---

## 모니터링

| 항목 | 도구 | 설명 |
|------|------|------|
| CDN 성능 | CloudFront 메트릭 | 캐시 히트율, 에러율, 지연 시간 |
| 에러 추적 | 브라우저 console (MVP) | 프론트엔드 에러 로깅 |
| 가용성 | CloudFront 5xx 알람 | 서비스 장애 감지 |
| 배포 상태 | GitHub Actions | 빌드/배포 성공/실패 |

---

## Next.js 정적 빌드 설정

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  output: 'export',  // 정적 HTML 내보내기
  trailingSlash: true,  // S3 호환
  images: {
    unoptimized: true,  // 외부 이미지 URL 사용 (S3 정적 호스팅)
  },
});
```
