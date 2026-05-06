# NFR Requirements Plan - Unit 2 (Frontend)

## 계획 개요
Frontend Unit의 비기능 요구사항(성능, 접근성, 호환성 등)을 정의합니다.

---

## 질문 및 결정사항

### Question 1
고객앱의 주요 사용 디바이스는?

A) 태블릿 전용 (10인치 이상, 매장 고정 설치)
B) 태블릿 + 스마트폰 (다양한 화면 크기 지원)
C) 태블릿 우선, 스마트폰은 기본 지원
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2
오프라인/네트워크 불안정 시 대응 수준은?

A) 기본 — 네트워크 에러 메시지만 표시
B) 중간 — 장바구니 로컬 유지 + 네트워크 복구 시 자동 재시도
C) 고급 — Service Worker 기반 오프라인 캐싱 (PWA)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 3
브라우저 호환성 범위는?

A) 최신 브라우저만 (Chrome, Safari, Edge 최신 2버전)
B) 넓은 호환성 (IE11 제외, 2년 이내 브라우저)
C) 크롬 전용 (태블릿에 크롬만 설치)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
접근성(Accessibility) 수준은?

A) 기본 — 시맨틱 HTML, 적절한 색상 대비, 터치 타겟 크기
B) WCAG 2.1 AA 준수 — 스크린 리더, 키보드 네비게이션 지원
C) 최소 — 기능 동작에만 집중 (접근성 고려 최소화)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
프론트엔드 성능 목표는?

A) 기본 — 페이지 로드 3초 이내, 인터랙션 응답 1초 이내
B) 빠름 — 페이지 로드 1.5초 이내, 인터랙션 응답 300ms 이내 (코드 스플리팅, 이미지 최적화)
C) 최소 — 기능 동작만 보장 (성능 최적화 나중에)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## 실행 계획 (답변 수집 후 진행)

### Step 1: NFR 요구사항 정의
- [x] 성능 요구사항 (로딩 시간, 응답 시간, 번들 크기)
- [x] 호환성 요구사항 (브라우저, 디바이스, 해상도)
- [x] 접근성 요구사항
- [x] 네트워크 복원력 요구사항
- [x] 사용성 요구사항 (터치, 반응형)

### Step 2: 기술 스택 세부 결정
- [x] Next.js 설정 (SPA 모드, 라우팅 전략)
- [x] CSS Modules 구성
- [x] 번들 최적화 전략
- [x] 테스트 도구 선택

### Step 3: 산출물 생성
- [x] nfr-requirements.md 생성
- [x] tech-stack-decisions.md 생성
