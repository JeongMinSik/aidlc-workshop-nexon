# Logical Components - Unit 2 (Frontend)

## 아키텍처 다이어그램

```
+----------------------------------------------------------+
|                    Frontend Application                    |
+----------------------------------------------------------+
|                                                          |
|  +------------------+  +------------------+              |
|  |   Customer App   |  |    Admin App     |              |
|  |   (Next.js)      |  |    (Next.js)     |              |
|  +--------+---------+  +--------+---------+              |
|           |                      |                        |
|  +--------+----------------------+--------+              |
|  |           Shared Layer                 |              |
|  |  +----------+ +----------+ +--------+ |              |
|  |  | API      | | Auth     | | UI     | |              |
|  |  | Client   | | Manager  | | Comps  | |              |
|  |  +----------+ +----------+ +--------+ |              |
|  +----------------------------------------+              |
|                                                          |
|  +--------------------------------------------------+    |
|  |              Service Worker (PWA)                 |    |
|  |  +----------+ +----------+ +-----------+         |    |
|  |  | Cache    | | BG Sync  | | Offline   |         |    |
|  |  | Manager  | | Queue    | | Detector  |         |    |
|  |  +----------+ +----------+ +-----------+         |    |
|  +--------------------------------------------------+    |
|                                                          |
+----------------------------------------------------------+
           |                    |
           | HTTP/REST          | SSE
           v                    v
+----------------------------------------------------------+
|                    Backend API Server                      |
+----------------------------------------------------------+
```

---

## 논리적 컴포넌트 상세

### 1. API Client (공통)

**목적**: 모든 HTTP 요청의 중앙 관리

```typescript
// 구성 요소
interface ApiClient {
  // 핵심 메서드
  get<T>(url: string): Promise<ApiResponse<T>>;
  post<T>(url: string, body: unknown): Promise<ApiResponse<T>>;
  put<T>(url: string, body: unknown): Promise<ApiResponse<T>>;
  delete<T>(url: string): Promise<ApiResponse<T>>;
}

// 내장 기능
// - Authorization 헤더 자동 첨부
// - JSON 직렬화/역직렬화
// - 에러 응답 표준화
// - 401 자동 로그아웃
// - 재시도 로직 (설정 가능)
// - 요청/응답 로깅 (개발 모드)
```

**파일 위치**: `src/services/apiClient.ts`

---

### 2. Auth Manager (공통)

**목적**: 인증 상태 및 토큰 라이프사이클 관리

```typescript
// 구성 요소
interface AuthManager {
  // 토큰 관리
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  isTokenExpired(): boolean;

  // 세션 관리
  startExpiryTimer(): void;
  stopExpiryTimer(): void;

  // 자동 로그인 (고객앱)
  getSavedCredentials(): TableAuth | null;
  saveCredentials(auth: TableAuth): void;
}
```

**파일 위치**: `src/services/authManager.ts`

---

### 3. SSE Manager (관리자앱)

**목적**: Server-Sent Events 연결 관리 및 이벤트 디스패치

```typescript
interface SSEManager {
  // 연결 관리
  connect(storeId: number): void;
  disconnect(): void;
  isConnected(): boolean;

  // 이벤트 리스너
  onNewOrder(callback: (order: Order) => void): void;
  onOrderUpdated(callback: (order: Order) => void): void;
  onOrderDeleted(callback: (data: { orderId: number }) => void): void;

  // 재연결
  reconnect(): void;
  getRetryCount(): number;
}

// 내장 기능
// - 자동 재연결 (지수 백오프)
// - 연결 상태 추적
// - 이벤트 파싱 및 타입 안전 디스패치
// - 언마운트 시 자동 정리
```

**파일 위치**: `src/services/sseManager.ts`

---

### 4. Cache Manager (Service Worker)

**목적**: 오프라인 캐싱 전략 관리

```typescript
// 캐시 이름 및 전략
const CACHES = {
  APP_SHELL: 'app-shell-v1',      // HTML, JS, CSS
  MENU_DATA: 'menu-data-v1',      // 메뉴 API 응답
  IMAGES: 'images-v1',            // 메뉴 이미지
};

// 전략별 핸들러
// - cacheFirst(cacheName, ttl): 캐시 우선, TTL 만료 시 네트워크
// - networkFirst(cacheName, ttl): 네트워크 우선, 실패 시 캐시
// - networkOnly(): 네트워크만 (주문 생성 등)
```

**파일 위치**: `public/sw.js` (next-pwa 생성) + `src/services/cacheManager.ts`

---

### 5. Offline Detector

**목적**: 네트워크 상태 감지 및 UI 알림

```typescript
interface OfflineDetector {
  isOnline(): boolean;
  onStatusChange(callback: (online: boolean) => void): void;
  
  // UI 연동
  // - 오프라인 → 상단 배너 표시 "오프라인 모드"
  // - 온라인 복구 → 배너 제거 + 데이터 동기화
}
```

**파일 위치**: `src/hooks/useOnlineStatus.ts`

---

### 6. Background Sync Queue

**목적**: 오프라인 시 요청 큐잉 및 복구 시 전송

```typescript
interface SyncQueue {
  // 큐 관리
  enqueue(request: QueuedRequest): void;
  dequeue(): QueuedRequest | null;
  getQueueSize(): number;

  // 동기화
  processQueue(): Promise<SyncResult[]>;
  onSyncComplete(callback: (results: SyncResult[]) => void): void;
}

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: unknown;
  timestamp: string;
}
```

**파일 위치**: `src/services/syncQueue.ts`

---

### 7. Toast Manager (공통 UI)

**목적**: 사용자 피드백 알림 중앙 관리

```typescript
interface ToastManager {
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
}

// 설정
// - 성공: 3초 자동 닫힘
// - 에러: 5초 자동 닫힘
// - 최대 3개 동시 표시
// - 하단 우측 위치 (모바일: 상단)
```

**파일 위치**: `src/components/Toast/` + `src/contexts/ToastContext.tsx`

---

## 컴포넌트 간 상호작용

```
사용자 액션 (주문 생성)
    │
    ▼
[CartContext] → [API Client] → 네트워크 가용?
    │                              │
    │                    Yes ──────┤────── No
    │                    │                  │
    │                    ▼                  ▼
    │              [Backend API]    [Sync Queue]
    │                    │          (IndexedDB)
    │                    ▼                  │
    │              성공/실패          네트워크 복구
    │                    │                  │
    │                    ▼                  ▼
    │              [Toast]          [processQueue]
    │                                      │
    ▼                                      ▼
[장바구니 비우기]                    [Backend API]
[주문 성공 화면]                    [Toast 알림]
```

---

## 파일 구조 (논리적 컴포넌트 매핑)

```
src/
├── services/
│   ├── apiClient.ts          # API Client
│   ├── authManager.ts        # Auth Manager
│   ├── sseManager.ts         # SSE Manager (관리자앱)
│   ├── cacheManager.ts       # Cache Manager 헬퍼
│   └── syncQueue.ts          # Background Sync Queue
├── hooks/
│   ├── useOnlineStatus.ts    # Offline Detector
│   ├── useAuth.ts            # Auth 훅
│   ├── useSSE.ts             # SSE 훅 (관리자앱)
│   └── useToast.ts           # Toast 훅
├── contexts/
│   ├── AuthContext.tsx        # 인증 Context
│   ├── CartContext.tsx        # 장바구니 Context (고객앱)
│   ├── OrderContext.tsx       # 주문 Context (관리자앱)
│   └── ToastContext.tsx       # Toast Context
└── components/
    └── Toast/                 # Toast UI 컴포넌트
```
