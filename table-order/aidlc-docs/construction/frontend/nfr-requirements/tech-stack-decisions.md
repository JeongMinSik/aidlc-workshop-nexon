# Tech Stack Decisions - Unit 2 (Frontend)

## 확정 기술 스택

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|----------|
| 프레임워크 | Next.js | 14+ | SPA 모드, 자동 코드 스플리팅, 이미지 최적화 |
| UI 라이브러리 | React | 18+ | 컴포넌트 기반, Context API |
| 언어 | TypeScript | 5+ | 타입 안전성, 개발 생산성 |
| 스타일링 | CSS Modules | - | 스코프 CSS, 충돌 방지, Next.js 내장 지원 |
| 라우팅 | React Router v6 | 6+ | 풍부한 생태계, 중첩 라우팅 |
| 상태 관리 | React Context + useReducer | - | 내장 기능, 의존성 최소화 |
| HTTP | fetch API | - | 내장, 의존성 없음 |
| PWA | next-pwa | - | Service Worker 자동 생성 |

---

## Next.js 설정 (SPA 모드)

### 프로젝트 구성
```
packages/customer/
├── next.config.js        # SPA 설정 (output: 'export' 또는 CSR 모드)
├── public/
│   ├── manifest.json     # PWA 매니페스트
│   ├── sw.js            # Service Worker (next-pwa 생성)
│   └── icons/           # PWA 아이콘
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── layout.tsx   # 루트 레이아웃
│   │   ├── page.tsx     # 메뉴 페이지 (/)
│   │   ├── cart/
│   │   ├── order/
│   │   ├── orders/
│   │   └── setup/
│   ├── components/      # UI 컴포넌트
│   ├── contexts/        # Context Providers
│   ├── services/        # API 호출 래퍼
│   ├── hooks/           # 커스텀 훅
│   ├── types/           # TypeScript 타입
│   └── styles/          # 글로벌 스타일 + CSS Modules
├── package.json
└── tsconfig.json
```

### Next.js 설정 핵심
```javascript
// next.config.js
const withPWA = require('next-pwa');

module.exports = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})({
  // CSR 모드 (API 서버 별도)
  // App Router 사용
  // CSS Modules 기본 지원
});
```

### 라우팅 전략
- Next.js App Router 사용 (파일 기반 라우팅)
- 고객앱과 관리자앱은 별도 Next.js 프로젝트 (모노레포 내)
- 클라이언트 사이드 렌더링 (CSR) 위주 — `'use client'` 디렉티브 활용

---

## CSS Modules 구성

### 파일 구조
```
src/
├── styles/
│   ├── globals.css          # 글로벌 스타일 (리셋, 변수, 폰트)
│   └── variables.css        # CSS 변수 (색상, 간격, 폰트 크기)
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.module.css
│   ├── Modal/
│   │   ├── Modal.tsx
│   │   └── Modal.module.css
```

### CSS 변수 (디자인 토큰)
```css
:root {
  /* Colors */
  --color-primary: #2196F3;
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-background: #F5F5F5;
  --color-surface: #FFFFFF;
  --color-text-primary: #212121;
  --color-text-secondary: #757575;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Font Size */
  --font-xs: 12px;
  --font-sm: 14px;
  --font-md: 16px;
  --font-lg: 18px;
  --font-xl: 24px;

  /* Touch Target */
  --touch-min: 44px;
}
```

---

## 번들 최적화 전략

| 전략 | 적용 방법 |
|------|----------|
| 코드 스플리팅 | Next.js 자동 (페이지별 분리) |
| 동적 임포트 | 모달, 차트 등 무거운 컴포넌트 `dynamic()` |
| 이미지 최적화 | `loading="lazy"`, 적절한 크기 지정 |
| 트리 쉐이킹 | ES Modules 사용, 사이드 이펙트 없는 코드 |
| 캐싱 | Service Worker 캐시 + 브라우저 캐시 헤더 |

---

## 테스트 도구

| 도구 | 용도 | 설명 |
|------|------|------|
| Jest | 단위 테스트 | 비즈니스 로직, 유틸리티 함수 |
| React Testing Library | 컴포넌트 테스트 | 사용자 관점 테스트 |
| Playwright (선택) | E2E 테스트 | 주요 플로우 자동화 |

---

## 개발 도구

| 도구 | 용도 |
|------|------|
| ESLint | 코드 품질 검사 |
| Prettier | 코드 포맷팅 |
| TypeScript | 타입 검사 |
| next-pwa | PWA Service Worker 생성 |

---

## 모노레포 설정

### 루트 package.json
```json
{
  "name": "table-order",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev:customer": "npm -w packages/customer run dev",
    "dev:admin": "npm -w packages/admin run dev",
    "build:customer": "npm -w packages/customer run build",
    "build:admin": "npm -w packages/admin run build"
  }
}
```

### 공유 설정
- `tsconfig.base.json` — 공통 TypeScript 설정
- `.eslintrc.js` — 공통 ESLint 규칙
- `.prettierrc` — 공통 포맷팅 규칙
