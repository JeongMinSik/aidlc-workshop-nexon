# Functional Design Plan - Unit 2 (Frontend)

## 계획 개요
Frontend Unit (고객앱 + 관리자앱)의 상세 기능 설계를 위한 계획입니다.

---

## 질문 및 결정사항

### Question 1
CSS/스타일링 방식으로 어떤 것을 사용하시겠습니까?

A) Tailwind CSS — 유틸리티 퍼스트, 빠른 개발, 커스터마이징 용이
B) CSS Modules — 컴포넌트별 스코프 CSS, 충돌 방지
C) styled-components — CSS-in-JS, 동적 스타일링 편리
D) 일반 CSS/SCSS — 전통적 방식
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2
React 라우팅 라이브러리는?

A) React Router v6 — 가장 널리 사용, 풍부한 생태계
B) TanStack Router — 타입 안전, 최신 트렌드
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
HTTP 클라이언트(API 호출)는 어떤 것을 사용하시겠습니까?

A) fetch API (내장) — 의존성 없음, 직접 래퍼 작성
B) Axios — 인터셉터, 자동 JSON 변환, 에러 핸들링 편리
C) TanStack Query (React Query) + fetch — 서버 상태 관리 + 캐싱
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
빌드 도구는?

A) Vite — 빠른 HMR, 최신 표준
B) Create React App (CRA) — 전통적, 설정 간편
C) Next.js — SSR/SSG 지원 (이 프로젝트에서는 SPA로 사용)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 5
고객앱의 메뉴 화면 레이아웃 선호는?

A) 상단 카테고리 탭 + 하단 메뉴 카드 그리드 (2열)
B) 좌측 카테고리 사이드바 + 우측 메뉴 카드 그리드
C) 상단 카테고리 탭 + 하단 메뉴 리스트 (1열, 큰 카드)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
관리자 대시보드의 테이블 카드 그리드는 한 행에 몇 개가 적절할까요?

A) 3개 (큰 카드, 정보 많이 표시)
B) 4개 (중간 크기)
C) 5개 이상 (작은 카드, 한눈에 많은 테이블 확인)
D) 반응형 (화면 크기에 따라 자동 조절)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## 실행 계획 (답변 수집 후 진행)

### Step 1: 도메인 엔티티 정의 (Frontend 관점)
- [x] 고객앱 데이터 모델 (Menu, Category, CartItem, Order)
- [x] 관리자앱 데이터 모델 (Table, Order, Menu, Admin)
- [x] 공통 타입 정의 (API 응답 형식, 에러 형식)

### Step 2: 비즈니스 로직 모델
- [x] 장바구니 로직 (추가, 삭제, 수량 조절, 총액 계산, localStorage 동기화)
- [x] 인증 로직 (토큰 저장, 자동 로그인, 만료 처리)
- [x] SSE 연결 관리 로직 (연결, 재연결, 이벤트 처리)
- [x] 주문 상태 전이 로직 (UI 표시 규칙)

### Step 3: 비즈니스 규칙
- [x] 장바구니 검증 규칙 (빈 장바구니 주문 불가 등)
- [x] 폼 검증 규칙 (메뉴 등록, 관리자 생성 등)
- [x] 인증 규칙 (토큰 만료, 권한 확인)

### Step 4: Frontend 컴포넌트 설계
- [x] 고객앱 컴포넌트 계층 구조
- [x] 관리자앱 컴포넌트 계층 구조
- [x] 공통 컴포넌트 정의
- [x] Props/State 정의
- [x] 사용자 인터랙션 플로우
