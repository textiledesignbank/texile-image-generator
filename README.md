# TDB Image Generator

디자이너를 위한 이미지 생성 테스트 및 최적 파라미터 탐색 도구

## 개요

ComfyUI 워크플로우 기반 이미지 생성 시스템입니다. 프로젝트 단위로 다양한 파라미터를 테스트하고, 결과를 비교하여 최적의 설정을 찾을 수 있습니다.

## 주요 기능

### 프로젝트 관리

- 프로젝트별 SDXL / SD1.5 워크플로우 설정
- 프로젝트 생성 시 기본 워크플로우 자동 적용 (SDXL: Animal, SD1.5: Floral)

### 이미지 생성

- 입력 이미지 업로드
- 파라미터 실시간 조정 (Sampling, IPAdapter, ControlNet, CLIP 등)
- SDXL / SD1.5 모델 탭 전환

### 히스토리 관리

- 테스트 히스토리 자동 저장
- 모델별 필터링 (전체 / SDXL / SD1.5)
- 히스토리 카드 클릭으로 파라미터 상세 보기
- 이전 파라미터 현재 설정에 적용
- 최종 선택 기능 (프로젝트별 베스트 결과 마킹)

### 비교 기능

- 최신 결과와 이전 히스토리 이미지 비교
- 파라미터 차이 하이라이트 (노란색 표시)
- 같은 모델 타입끼리만 비교 가능

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Database**: MySQL (AWS RDS), Prisma ORM
- **Cloud**: AWS S3 (이미지 저장), AWS SQS FIFO (작업 큐)
- **Auth**: JWT (jose)

## 시작하기

### 환경 변수 설정

환경 변수는 **Tips 프로젝트**를 참고하세요.

### 설치 및 실행

```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```

### 빌드 및 배포

```bash
npm run build
npm run start
```

Vercel 배포 시 `postinstall` 스크립트가 자동으로 Prisma 클라이언트를 생성합니다.

## 프로젝트 구조

```
├── prisma/
│   └── schema.prisma        # 데이터베이스 스키마
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # 인증 API
│   │   │   ├── generate/    # 이미지 생성 API
│   │   │   ├── history/     # 히스토리 API
│   │   │   ├── projects/    # 프로젝트 API
│   │   │   └── legacy/      # 레거시 워크플로우 API
│   │   ├── login/           # 로그인 페이지
│   │   └── projects/
│   │       ├── page.tsx     # 프로젝트 목록
│   │       ├── new/         # 새 프로젝트 생성
│   │       └── [id]/
│   │           ├── page.tsx     # 이미지 생성 페이지
│   │           └── settings/    # 프로젝트 설정
│   ├── components/
│   │   ├── ui/              # shadcn/ui 컴포넌트
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   └── workflow/        # 워크플로우 관련 컴포넌트
│   │       ├── ParamEditor.tsx   # 파라미터 편집기
│   │       └── ParamDisplay.tsx  # 파라미터 표시 (비교 지원)
│   ├── lib/
│   │   ├── db.ts            # Prisma 클라이언트
│   │   ├── s3.ts            # S3 클라이언트
│   │   ├── sqs.ts           # SQS 클라이언트
│   │   └── workflow-parser.ts   # 워크플로우 파서
│   └── types/               # TypeScript 타입 정의
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
- `isSelected`: 최종 선택 여부

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

## 라이선스

Private
