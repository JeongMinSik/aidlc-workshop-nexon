# Infrastructure Design Plan - Unit 2 (Frontend)

## 계획 개요
Frontend 앱(고객앱 + 관리자앱)의 배포 인프라를 설계합니다.

---

## 질문 및 결정사항

### Question 1
Frontend 앱 배포 방식은?

A) AWS S3 + CloudFront (정적 호스팅, CDN 배포)
B) AWS Amplify (풀 매니지드, CI/CD 내장)
C) Vercel (Next.js 최적화, 간편 배포)
D) EC2/ECS에 Next.js 서버 배포 (SSR 필요 시)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
CI/CD 파이프라인은?

A) GitHub Actions (코드 푸시 → 빌드 → 배포 자동화)
B) AWS CodePipeline + CodeBuild
C) 수동 배포 (로컬 빌드 → 업로드)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
환경 분리는 어떻게 하시겠습니까?

A) 개발(dev) + 프로덕션(prod) 2개 환경
B) 개발(dev) + 스테이징(staging) + 프로덕션(prod) 3개 환경
C) 프로덕션(prod) 1개만 (MVP 단계)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4
도메인/SSL 설정은?

A) 커스텀 도메인 + SSL (Route53 + ACM)
B) 배포 서비스 기본 도메인 사용 (*.vercel.app, *.amplifyapp.com 등)
C) 나중에 결정 (MVP에서는 기본 도메인)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 실행 계획 (답변 수집 후 진행)

### Step 1: 배포 아키텍처 설계
- [x] 호스팅 서비스 선정 및 구성
- [x] CDN 설정 (캐싱 전략)
- [x] 환경별 설정 (환경 변수)

### Step 2: CI/CD 파이프라인 설계
- [x] 빌드 프로세스 정의
- [x] 배포 자동화 설정
- [x] 환경별 배포 전략

### Step 3: 산출물 생성
- [x] infrastructure-design.md 생성
- [x] deployment-architecture.md 생성
