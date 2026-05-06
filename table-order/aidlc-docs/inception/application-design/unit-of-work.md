# 테이블오더 서비스 - Unit of Work 정의

## 분해 전략
- **팀 규모**: 2명
- **분해 방식**: Backend / Frontend 분리
- **병렬 개발**: API 계약(OpenAPI 스펙) 합의 후 독립 개발
- **통합 시점**: 각 유닛 기본 기능 완성 후 통합 테스트

---

## Unit 1: Backend (API 서버 + 데이터베이스)

### 담당자
- 개발자 A (백엔드 담당)

### 범위
| 항목 | 내용 |
|------|------|
| **패키지** | `packages/server` |
| **언어/프레임워크** | Node.js + Express (TypeScript) |
| **데이터베이스** | MySQL/MariaDB 스키마 설계 및 구현 |
| **인증** | JWT 발급/검증, bcrypt 해싱 |
| **실시간** | SSE 엔드포인트 구현 |

### 책임
- REST API 전체 엔드포인트 구현
- 데이터베이스 스키마 설계 및 마이그레이션
- 비즈니스 로직 (주문 처리, 세션 관리, 상태 전이)
- 인증/인가 미들웨어
- SSE 실시간 이벤트 시스템
- API 입력 검증 및 에러 핸들링
- 데이터베이스 시딩 (초기 데이터)

### 모듈 구성
```
packages/server/src/
├── controllers/    # Auth, Store, Admin, Table, Menu, Order, SSE
├── services/       # 비즈니스 로직 레이어
├── repositories/   # 데이터 접근 레이어
├── models/         # 데이터 모델/엔티티
├── middlewares/    # 인증, 검증, 에러 핸들링
├── routes/         # 라우트 정의
├── config/         # DB, JWT, 환경 설정
├── utils/          # 유틸리티 함수
└── migrations/     # DB 마이그레이션
```

### 산출물
- 동작하는 REST API 서버
- MySQL 스키마 + 마이그레이션 스크립트
- API 문서 (엔드포인트 목록)
- SSE 이벤트 시스템
- 시드 데이터 (테스트용 매장/메뉴/테이블)

---

## Unit 2: Frontend (고객앱 + 관리자앱)

### 담당자
- 개발자 B (프론트엔드 담당)

### 범위
| 항목 | 내용 |
|------|------|
| **패키지** | `packages/customer`, `packages/admin` |
| **언어/프레임워크** | React (TypeScript) |
| **상태 관리** | React Context + useReducer |
| **스타일링** | CSS (결정 필요 - Functional Design에서 확정) |
| **API 연동** | fetch/axios + Mock API (개발 초기) |

### 책임
- 고객용 주문 인터페이스 (6개 페이지)
- 관리자용 매장 관리 인터페이스 (5개 페이지)
- 반응형/터치 친화적 UI 구현
- 클라이언트 상태 관리 (장바구니, 인증)
- SSE 클라이언트 연동 (실시간 주문 수신)
- localStorage 활용 (장바구니 유지, 토큰 저장)
- API 호출 서비스 레이어

### 모듈 구성
```
packages/customer/src/
├── components/     # 재사용 UI 컴포넌트
├── contexts/       # AuthContext, CartContext
├── pages/          # MenuPage, CartPage, OrderConfirmPage, etc.
├── services/       # API 호출 함수
├── hooks/          # 커스텀 훅
└── utils/          # 유틸리티

packages/admin/src/
├── components/     # 재사용 UI 컴포넌트
├── contexts/       # AuthContext, OrderContext
├── pages/          # DashboardPage, TableManagePage, etc.
├── services/       # API 호출 + SSE 연동
├── hooks/          # 커스텀 훅
└── utils/          # 유틸리티
```

### 산출물
- 고객용 React 웹 앱 (메뉴 조회, 장바구니, 주문)
- 관리자용 React 웹 앱 (대시보드, 테이블/메뉴 관리)
- Mock API 설정 (Backend 완성 전 독립 개발용)
- 컴포넌트 라이브러리 (공통 UI)

---

## 코드 조직 전략 (Greenfield)

```
table-order/
├── packages/
│   ├── customer/          # Unit 2 - 고객앱
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin/             # Unit 2 - 관리자앱
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── server/            # Unit 1 - API 서버
│       ├── src/
│       ├── migrations/
│       ├── package.json
│       └── tsconfig.json
│
├── package.json           # 루트 (npm workspaces)
├── tsconfig.base.json     # 공통 TypeScript 설정
└── .env.example           # 환경 변수 템플릿
```

---

## 개발 순서 권장

### Phase 1: 기반 구축 (병렬)
| Unit 1 (Backend) | Unit 2 (Frontend) |
|-------------------|-------------------|
| DB 스키마 설계 | 프로젝트 셋업 + 라우팅 |
| Express 서버 기본 구조 | 공통 컴포넌트 구현 |
| API 계약 문서 작성 | Mock API 설정 |

### Phase 2: 핵심 기능 (병렬)
| Unit 1 (Backend) | Unit 2 (Frontend) |
|-------------------|-------------------|
| Auth API 구현 | 로그인/인증 UI |
| Menu API 구현 | 메뉴 조회 UI |
| Order API 구현 | 장바구니 + 주문 UI |

### Phase 3: 고급 기능 (병렬)
| Unit 1 (Backend) | Unit 2 (Frontend) |
|-------------------|-------------------|
| SSE 구현 | SSE 클라이언트 연동 |
| 세션 관리 로직 | 관리자 대시보드 |
| 이력 관리 | 테이블/메뉴 관리 UI |

### Phase 4: 통합 (합류)
- Mock API → 실제 API 전환
- 통합 테스트
- 버그 수정 및 최적화
