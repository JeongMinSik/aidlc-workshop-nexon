# 요구사항 확인 질문

제공해주신 요구사항 문서를 분석했습니다. 몇 가지 명확화가 필요한 부분에 대해 질문드립니다.
각 질문의 `[Answer]:` 태그 뒤에 선택한 옵션의 알파벳을 입력해주세요.

---

## Question 1
백엔드 기술 스택으로 어떤 것을 사용하시겠습니까?

A) Node.js + Express (JavaScript/TypeScript)
B) Node.js + NestJS (TypeScript)
C) Python + FastAPI
D) Java + Spring Boot
E) Go + Gin/Echo
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
프론트엔드 기술 스택으로 어떤 것을 사용하시겠습니까?

A) React (JavaScript/TypeScript)
B) Vue.js
C) Next.js (React 기반 풀스택 프레임워크)
D) Svelte/SvelteKit
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
데이터베이스로 어떤 것을 사용하시겠습니까?

A) PostgreSQL (관계형 DB)
B) MySQL/MariaDB (관계형 DB)
C) MongoDB (NoSQL Document DB)
D) DynamoDB (AWS NoSQL)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
배포 환경은 어떻게 계획하고 계십니까?

A) AWS (EC2, ECS, Lambda 등)
B) 로컬/온프레미스 서버
C) Docker 컨테이너 기반 (배포 환경 미정)
D) Vercel/Netlify (프론트) + AWS/GCP (백엔드)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
매장(Store)은 단일 매장만 지원하면 되나요, 아니면 멀티 매장(SaaS 형태)을 지원해야 하나요?

A) 단일 매장 전용 (하나의 매장만 운영)
B) 멀티 매장 지원 (여러 매장이 각각 독립적으로 운영)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 6
메뉴 이미지 관리는 어떻게 처리하시겠습니까?

A) 외부 이미지 URL 직접 입력 (별도 업로드 없음)
B) 서버에 이미지 파일 업로드 (로컬 스토리지)
C) 클라우드 스토리지 업로드 (S3, CloudFront 등)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
관리자 계정 관리는 어떻게 하시겠습니까?

A) 사전 설정된 단일 관리자 계정 (DB에 직접 등록)
B) 관리자 회원가입 기능 포함
C) 슈퍼 관리자가 하위 관리자 계정 생성
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 8
테이블 수는 매장당 최대 몇 개 정도를 예상하시나요? (성능 설계 참고용)

A) 소규모 (1~10개 테이블)
B) 중규모 (11~30개 테이블)
C) 대규모 (31~100개 테이블)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 9: Security Extensions
이 프로젝트에 보안 확장 규칙을 적용하시겠습니까?

A) Yes — 모든 SECURITY 규칙을 blocking constraint로 적용 (프로덕션 수준 애플리케이션에 권장)
B) No — 모든 SECURITY 규칙 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 10: Property-Based Testing Extension
이 프로젝트에 Property-Based Testing (PBT) 규칙을 적용하시겠습니까?

A) Yes — 모든 PBT 규칙을 blocking constraint로 적용 (비즈니스 로직, 데이터 변환, 직렬화, 상태 관리 컴포넌트가 있는 프로젝트에 권장)
B) Partial — 순수 함수와 직렬화 round-trip에만 PBT 규칙 적용 (알고리즘 복잡도가 제한적인 프로젝트에 적합)
C) No — 모든 PBT 규칙 건너뛰기 (단순 CRUD 애플리케이션, UI 전용 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: C
