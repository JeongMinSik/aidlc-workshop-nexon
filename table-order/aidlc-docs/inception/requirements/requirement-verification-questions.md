# Requirements Verification Questions

> **프로젝트 맥락**: 하루 만에 완성하는 워크샵용 데모 프로젝트. 유지보수 계획 없음. "있어보이게" 만드는 것이 목표.
> **기술 제약**: 백엔드는 Go 또는 Python (본인이 읽을 수 있어야 함). 프론트엔드는 AI 생성 (몰라도 OK).
> **추가 요구**: 부하 테스트 시연으로 "1억명 커버 가능한 고성능 시스템" 인상을 줄 것.

각 질문의 [Answer]: 태그 뒤에 선택한 옵션 문자를 입력해 주세요.

---

## Question 1
백엔드 언어/프레임워크는 어떤 것을 사용하시겠습니까?

A) **Python + FastAPI**
   - 장점: 문법이 직관적, 타입 힌트로 코드 가독성 높음, 자동 API 문서(Swagger) 생성, async 지원으로 SSE 구현 용이
   - 단점: Go 대비 성능 낮음 (워크샵에선 무관)
   - 근거: Python 아시면 FastAPI 코드는 바로 읽힘. 데코레이터 기반이라 구조 파악 쉬움. Swagger UI가 자동 생성되어 데모 시 "있어보이는" 효과 추가

B) **Go + Gin**
   - 장점: 빠른 실행 속도, 단일 바이너리 배포, 명시적 에러 처리로 코드 흐름 명확
   - 단점: 웹 프레임워크 생태계가 Python보다 작음, ORM 선택지 제한적
   - 근거: Go 아시면 Gin 라우터 구조는 금방 파악 가능. 다만 Python 대비 보일러플레이트 코드가 많아 하루 개발에선 약간 불리

C) **Go + Echo**
   - 장점: Gin과 유사하나 미들웨어 구조가 더 깔끔, 자동 API 문서 지원
   - 단점: Gin 대비 커뮤니티 작음
   - 근거: Gin과 거의 동일한 경험. 취향 차이 수준

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2
프론트엔드 프레임워크는 어떤 것을 사용하시겠습니까?

A) **React + Vite + TypeScript**
   - 장점: 가장 큰 생태계, UI 라이브러리(shadcn/ui, MUI 등) 풍부, AI 코드 생성 품질 높음
   - 단점: 본인이 읽기 어려울 수 있음 (하지만 읽을 필요 없다고 하셨으므로 무관)
   - 근거: AI가 생성하기 가장 좋은 프레임워크. 컴포넌트 라이브러리 활용하면 적은 코드로 예쁜 UI 가능

B) **Next.js (React 기반)**
   - 장점: SSR/SSG 지원, 파일 기반 라우팅으로 구조 단순, 풀스택 가능
   - 단점: 별도 백엔드를 쓸 거면 Next.js의 장점(API Routes)을 못 살림, 오히려 복잡도만 추가
   - 근거: 별도 Go/Python 백엔드를 쓸 거라면 순수 React(Vite)가 더 단순함

C) **Vue.js + Vite**
   - 장점: 템플릿 문법이 HTML에 가까워 직관적, 학습 곡선 낮음
   - 단점: React 대비 AI 생성 코드 품질/양이 약간 떨어질 수 있음, UI 라이브러리 선택지 적음
   - 근거: 혹시 프론트도 살짝 읽어보고 싶다면 Vue가 더 읽기 쉬움

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
데이터베이스는 어떤 것을 사용하시겠습니까?

A) **SQLite**
   - 장점: 설치 제로(파일 하나), 설정 불필요, 즉시 시작, Python/Go 모두 기본 지원
   - 단점: 동시 쓰기 제한 (워크샵 데모에선 문제 없음)
   - 근거: 하루 개발에서 DB 설정에 시간 쓸 필요 없음. 파일 하나로 끝

B) **PostgreSQL (Docker Compose)**
   - 장점: "프로덕션급" 인상, docker-compose up으로 자동 실행, 실제 서비스처럼 보임
   - 단점: Docker 필요, 초기 설정 10~15분 소요
   - 근거: Docker 있으면 설정 자동화 가능. 데모 시 "PostgreSQL 씁니다"가 더 있어보임

C) **PostgreSQL (로컬 설치)**
   - 장점: B와 동일한 "있어보임" 효과
   - 단점: 로컬 설치/설정 필요, 환경마다 다를 수 있음
   - 근거: Docker 없으면 이 방법이지만 설정 시간 더 소요

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
매장 지원 범위는 어떻게 하시겠습니까?

A) **단일 매장 전용** ⭐ 권장
   - 장점: 데이터 모델 단순, 인증 로직 간소화, 개발 속도 빠름
   - 단점: 확장성 없음 (유지보수 안 할 거니 무관)
   - 근거: 하루 개발에서 멀티테넌시는 시간 낭비. 데모에서 "이 매장의 시스템입니다"로 충분

B) **다중 매장 (멀티테넌시)**
   - 장점: SaaS처럼 있어보임
   - 단점: store_id 필터링 로직 전체에 추가, 인증 복잡도 증가, 개발 시간 50% 이상 증가 예상
   - 근거: 있어보이긴 하지만 하루 안에 완성 못할 리스크 높음

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
메뉴 이미지는 어떻게 처리하시겠습니까?

A) **외부 이미지 URL 직접 입력** ⭐ 권장
   - 장점: 구현 제로, 샘플 데이터에 Unsplash/Pexels 이미지 URL 넣으면 끝
   - 단점: 관리자가 URL을 직접 입력해야 함
   - 근거: 데모용 샘플 데이터를 미리 넣어두면 됨. 개발 시간 0분

B) **로컬 파일 업로드**
   - 장점: 데모 시 "이미지 업로드" 시연 가능, 실제 서비스 느낌
   - 단점: 파일 업로드 로직 구현 30분~1시간 추가
   - 근거: 시간 여유 있으면 추가하면 좋지만 필수는 아님

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6: Security Extensions
이 프로젝트에 보안 확장 규칙을 적용하시겠습니까?

A) **Yes — 보안 규칙 적용**
   - 근거: 프로덕션 수준 보안 패턴 (입력 검증, SQL injection 방지, 인증 강화 등)
   - 단점: 구현 시간 증가, 워크샵 데모에는 과도할 수 있음

B) **No — 보안 규칙 건너뛰기** ⭐ 권장
   - 근거: 워크샵 데모용. 기본적인 인증만 있으면 충분. 복잡한 보안 패턴은 시간 낭비
   - 장점: 개발 속도 극대화

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 7: Property-Based Testing Extension
이 프로젝트에 Property-Based Testing (PBT) 규칙을 적용하시겠습니까?

A) **Yes — PBT 규칙 적용**
   - 근거: 비즈니스 로직의 견고한 테스트
   - 단점: 테스트 작성 시간 대폭 증가, 하루 개발에 비현실적

B) **No — PBT 규칙 건너뛰기** ⭐ 권장
   - 근거: 유지보수 안 할 프로젝트에 테스트 투자는 ROI 없음. 동작 확인만 하면 충분
   - 장점: 시간을 전부 기능 구현에 투입 가능

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---
