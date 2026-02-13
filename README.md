# TDB Image Generator

디자이너를 위한 이미지 생성 테스트 및 최적 파라미터 탐색 도구
Vercel 에 배포되어있습니다.

## 개요

ComfyUI 워크플로우 기반 이미지 생성 시스템입니다. 프로젝트 단위로 다양한 파라미터를 테스트하고, 이미지를 생성할 수 있습니다.

## 주요 기능

### 프로젝트 관리

- 프로젝트별 SDXL / SD1.5 워크플로우 설정
- 프로젝트 생성 시 기본 워크플로우 자동 적용

### 이미지 생성

- 입력 이미지 업로드
- 파라미터 실시간 조정 (Sampling, IPAdapter, ControlNet, CLIP 등)
- SDXL / SD1.5 모델 탭 전환

### 히스토리 관리

- 테스트 히스토리 자동 저장
- 모델별 필터링 (전체 / SDXL / SD1.5)
- 히스토리 카드 클릭으로 파라미터 상세 보기
- 이전 파라미터 현재 설정에 적용

### 비교 기능

- 최신 결과와 이전 히스토리 이미지 비교
- 파라미터 차이 하이라이트 (노란색 표시)
- 같은 모델 타입끼리만 비교 가능

## 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **상태관리**: Zustand (클라이언트 상태), TanStack React Query (서버 상태)
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Database**: MySQL (AWS RDS), Prisma ORM
- **Cloud**: AWS S3 (이미지 저장), AWS SQS FIFO (작업 큐)
- **Auth**: JWT (jose)

## 시작하기

### 환경 변수 설정

환경 변수는 **Tips 프로젝트/김우혁/환경변수**를 참고하세요.

### 설치 및 실행

```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```

### DB 관리

```bash
# Prisma 클라이언트 생성
npm run db:generate

# DB 스키마 푸시
npm run db:push

# DB 마이그레이션
npm run db:migrate
```

### 빌드 및 배포

```bash
npm run build
npm run start
```

## 아키텍처

### 상태관리 전략

- **서버 상태 (React Query)**: 프로젝트, 히스토리, 템플릿 등 API 데이터. 자동 캐싱, 무효화, 폴링 지원
- **클라이언트 상태 (Zustand)**: 모델 선택, 파라미터 값, 비교 모드 등 UI 상태. 복잡한 페이지에만 사용
- **로컬 상태 (useState)**: 폼 입력 등 단순한 컴포넌트 로컬 상태

### 주요 패턴

- `src/lib/api.ts` - 모든 fetch 호출 중앙화
- `src/hooks/queries/` - React Query 쿼리 훅 + 키 팩토리
- `src/hooks/mutations/` - React Query 뮤테이션 훅 + 캐시 무효화
- `src/stores/` - Zustand 스토어 (복잡한 페이지 전용)
- `src/components/generation/` - ProjectPage에서 추출된 컴포넌트

## 프로젝트 구조

```
├── prisma/
│   └── schema.prisma            # 데이터베이스 스키마
├── workflows/                   # ComfyUI 워크플로우 JSON 파일
├── src/
│   ├── middleware.ts             # JWT 인증 미들웨어
│   ├── app/
│   │   ├── page.tsx             # 루트 (→ /projects 리다이렉트)
│   │   ├── layout.tsx           # 루트 레이아웃 (QueryProvider 포함)
│   │   ├── api/                 # API 라우트 (auth, generate, history, projects, templates)
│   │   ├── login/               # 로그인 페이지
│   │   └── projects/
│   │       ├── page.tsx         # 프로젝트 목록 (React Query + Zustand)
│   │       ├── new/             # 새 프로젝트 생성 (mutation 사용)
│   │       └── [id]/
│   │           ├── page.tsx     # 이미지 생성 페이지 (오케스트레이터)
│   │           └── settings/    # 프로젝트 설정 (query + mutations)
│   ├── components/
│   │   ├── generation/          # ProjectPage에서 추출된 컴포넌트
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── ParamSettingsPanel.tsx
│   │   │   ├── GenerateActions.tsx
│   │   │   ├── ResultViewer.tsx
│   │   │   ├── ComparePanel.tsx
│   │   │   ├── GenerationResult.tsx
│   │   │   └── HistoryList.tsx
│   │   ├── ui/                  # shadcn/ui 컴포넌트
│   │   ├── layout/Header.tsx    # 헤더 (로그아웃 포함)
│   │   └── workflow/
│   │       ├── ParamEditor.tsx  # 파라미터 편집기
│   │       └── ParamDisplay.tsx # 파라미터 표시 (비교 지원)
│   ├── hooks/
│   │   ├── queries/             # React Query 쿼리 훅
│   │   │   ├── useProjects.ts, useProject.ts, useHistories.ts, useTemplates.ts
│   │   │   └── index.ts
│   │   └── mutations/           # React Query 뮤테이션 훅
│   │       ├── useCreateProject.ts, useUpdateProject.ts, useDeleteProject.ts
│   │       ├── useGenerate.ts, useApplyTemplate.ts
│   │       └── index.ts
│   ├── stores/
│   │   ├── useProjectPageStore.ts   # ProjectPage UI 상태 (Zustand)
│   │   └── useProjectsListStore.ts  # ProjectsPage 페이지네이션/정렬 (Zustand)
│   ├── providers/
│   │   └── QueryProvider.tsx    # React Query Provider
│   ├── lib/
│   │   ├── api.ts               # 중앙 API 서비스 레이어
│   │   ├── auth.ts              # JWT 인증
│   │   ├── db.ts                # Prisma 클라이언트
│   │   ├── s3.ts                # S3 클라이언트
│   │   ├── sqs.ts               # SQS 클라이언트
│   │   ├── utils.ts             # Tailwind 유틸리티 (cn)
│   │   └── workflow-parser.ts   # 워크플로우 파서
│   └── types/
│       └── index.ts             # TypeScript 타입 정의
```

## 데이터 모델

### Project

- `id`: UUID
- `name`: 프로젝트명
- `sdxlWorkflow`: SDXL 워크플로우 JSON
- `sdxlParams`: SDXL 파라미터 설정
- `sd15Workflow`: SD1.5 워크플로우 JSON
- `sd15Params`: SD1.5 파라미터 설정

### TestHistory

- `id`: UUID
- `projectId`: 프로젝트 ID
- `modelType`: 모델 타입 (sdxl / sd15)
- `params`: 사용된 파라미터
- `inputImageUrl`: 입력 이미지 S3 키
- `outputImageUrls`: 출력 이미지 S3 키 배열
- `status`: 상태 (pending / processing / completed / failed / cancelled)
- `jobId`: SQS 작업 ID
- `errorMessage`: 에러 메시지
- `isSelected`: 최종 선택 여부
- `executedAt`: 실행 시각
- `completedAt`: 완료 시각

## API 엔드포인트

| 메서드 | 경로                 | 설명                      |
| ------ | -------------------- | ------------------------- |
| POST   | `/api/auth/login`    | 로그인                    |
| POST   | `/api/auth/logout`   | 로그아웃                  |
| GET    | `/api/projects`      | 프로젝트 목록             |
| POST   | `/api/projects`      | 프로젝트 생성             |
| GET    | `/api/projects/[id]` | 프로젝트 상세             |
| PUT    | `/api/projects/[id]` | 프로젝트 수정             |
| DELETE | `/api/projects/[id]` | 프로젝트 삭제             |
| POST   | `/api/generate`      | 이미지 생성 요청          |
| GET    | `/api/history`       | 히스토리 목록             |
| GET    | `/api/history/[id]`  | 히스토리 상세             |
| PATCH  | `/api/history/[id]`  | 히스토리 수정 (최종 선택) |
| DELETE | `/api/history/[id]`  | 히스토리 삭제             |
